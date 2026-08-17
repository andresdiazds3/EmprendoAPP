import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { inventoryApi } from "../../../../lib/inventory.api";
import { productsApi } from "../../../../lib/products.api";

// Esquema Zod dinámico para el movimiento de inventario
const movementSchema = z
  .object({
    type: z.enum(["RESTOCK", "ADJUSTMENT"]),
    quantity: z.coerce
      .number()
      .int("La cantidad debe ser un número entero")
      .refine((val) => val !== 0, "La cantidad no puede ser cero"),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "RESTOCK" && data.quantity <= 0) {
        return false;
      }
      return true;
    },
    {
      message: "La cantidad de un RESTOCK debe ser mayor a cero",
      path: ["quantity"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "ADJUSTMENT" && (!data.reason || data.reason.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Un ajuste (ADJUSTMENT) requiere indicar un motivo",
      path: ["reason"],
    }
  );

type MovementFormValues = z.infer<typeof movementSchema>;

export default function ProductMovementsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  // Consulta el producto para mostrar el nombre e invalidar tras cambios
  const { data: product } = useQuery({
    queryKey: ["products", id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });

  // Query infinita para listar los movimientos del kardex
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingKardex,
  } = useInfiniteQuery({
    queryKey: ["movements", id],
    queryFn: ({ pageParam = 1 }) =>
      inventoryApi.listMovements(id, { page: pageParam, pageSize: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!id,
  });

  const movements = data?.pages.flatMap((page) => page.items) || [];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema) as any,
    defaultValues: {
      type: "RESTOCK",
      quantity: "" as any,
      reason: "",
    },
    mode: "onChange",
  });

  const currentType = watch("type");

  const registerMutation = useMutation({
    mutationFn: (values: MovementFormValues) =>
      inventoryApi.registerMovement({
        productId: id,
        type: values.type,
        quantity: values.quantity,
        reason: values.reason || undefined,
      }),
    onSuccess: () => {
      setServerError(null);
      reset({
        type: "RESTOCK",
        quantity: "" as any,
        reason: "",
      });
      // Invalida las queries del producto y del kardex para refrescar el stock en la interfaz
      queryClient.invalidateQueries({ queryKey: ["products", id] });
      queryClient.invalidateQueries({ queryKey: ["movements", id] });
    },
    onError: (error: any) => {
      console.error("Error al registrar movimiento:", error);
      const msg =
        error.response?.data?.message ||
        "No se pudo registrar el movimiento. Intenta de nuevo.";
      setServerError(msg);
    },
  });

  const onSubmit = (values: MovementFormValues) => {
    setServerError(null);
    registerMutation.mutate(values);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Movimientos de Stock
          </Text>
          {product && <Text style={styles.headerSubtitle}>{product.name}</Text>}
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <View style={styles.formContainer}>
              <Text style={styles.formSectionTitle}>Registrar Movimiento</Text>
              
              {serverError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{serverError}</Text>
                </View>
              )}

              {/* Selector de Tipo (Toggle) */}
              <Text style={styles.label}>Tipo de movimiento</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    currentType === "RESTOCK" && styles.toggleButtonActive,
                  ]}
                  onPress={() => {
                    setValue("type", "RESTOCK", { shouldValidate: true });
                    setServerError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      currentType === "RESTOCK" && styles.toggleTextActive,
                    ]}
                  >
                    Entrada (Restock)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    currentType === "ADJUSTMENT" && styles.toggleButtonActive,
                  ]}
                  onPress={() => {
                    setValue("type", "ADJUSTMENT", { shouldValidate: true });
                    setServerError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      currentType === "ADJUSTMENT" && styles.toggleTextActive,
                    ]}
                  >
                    Ajuste
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Campo: Cantidad */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Cantidad {currentType === "ADJUSTMENT" && <Text style={styles.helperText}>(positivo o negativo, ej: -5 o 10)</Text>}
                </Text>
                <Controller
                  control={control}
                  name="quantity"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder={currentType === "RESTOCK" ? "Ej. 10" : "Ej. -3"}
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value?.toString()}
                      editable={!registerMutation.isPending}
                    />
                  )}
                />
                {errors.quantity && (
                  <Text style={styles.fieldErrorText}>{errors.quantity.message}</Text>
                )}
              </View>

              {/* Campo: Motivo (Solo si es Ajuste) */}
              {currentType === "ADJUSTMENT" && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Motivo del ajuste</Text>
                  <Controller
                    control={control}
                    name="reason"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Ej. Pérdida por humedad"
                        placeholderTextColor="#6B7280"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        editable={!registerMutation.isPending}
                      />
                    )}
                  />
                  {errors.reason && (
                    <Text style={styles.fieldErrorText}>{errors.reason.message}</Text>
                  )}
                </View>
              )}

              {/* Botón de Submit */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  registerMutation.isPending && styles.submitButtonDisabled,
                ]}
                disabled={registerMutation.isPending}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
              >
                {registerMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Registrar movimiento</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider} />
              <Text style={styles.formSectionTitle}>Historial de Movimientos (Kardex)</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPositive = item.quantity > 0;
            const sign = isPositive ? "+" : "";
            const typeText = item.type === "RESTOCK" ? "Entrada" : "Ajuste";
            const dateStr = new Date(item.createdAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <View style={styles.kardexCard}>
                <View style={styles.kardexInfo}>
                  <Text style={styles.kardexTypeText}>{typeText}</Text>
                  <Text style={styles.kardexDateText}>{dateStr}</Text>
                  {item.reason && <Text style={styles.kardexReasonText}>"{item.reason}"</Text>}
                </View>
                <Text style={[styles.kardexQtyText, isPositive ? styles.qtyPositive : styles.qtyNegative]}>
                  {sign}{item.quantity}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            isLoadingKardex ? (
              <ActivityIndicator size="small" color="#6D28D9" style={{ marginVertical: 24 }} />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No hay movimientos registrados para este producto.</Text>
              </View>
            )
          }
          ListFooterComponent={
            hasNextPage ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color="#6D28D9" />
                ) : (
                  <Text style={styles.loadMoreText}>Cargar más</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5FB",
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: "#6D28D9",
    fontWeight: "500",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 50,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  formContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "normal",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F7F5FB",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    height: 50,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  toggleText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  toggleTextActive: {
    color: "#6D28D9",
    fontWeight: "600",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#F7F5FB",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A1A",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  fieldErrorText: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#6D28D9",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F7F5FB",
    marginVertical: 24,
  },
  kardexCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F5FB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  kardexInfo: {
    flex: 1,
    marginRight: 16,
  },
  kardexTypeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  kardexDateText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  kardexReasonText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 6,
  },
  kardexQtyText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  qtyPositive: {
    color: "#10B981",
  },
  qtyNegative: {
    color: "#DC2626",
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  loadMoreButton: {
    backgroundColor: "#FFFFFF",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    marginTop: 8,
  },
  loadMoreText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "600",
  },
});
