import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../../../lib/products.api";
import { ProductForm, ProductFormValues } from "../../../components/ProductForm";
import { queryKeys } from "../../../lib/queryKeys";
import { useRefetchOnFocus } from "../../../hooks/useRefetchOnFocus";

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  // Consulta los detalles del producto actual
  const { data: product, isLoading: isLoadingProduct, refetch } = useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });

  useRefetchOnFocus(refetch);

  // Mutación para actualizar
  const updateMutation = useMutation({
    mutationFn: (values: ProductFormValues) => productsApi.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      router.back();
    },
    onError: (error: any) => {
      console.error("Error al actualizar producto:", error);
      const msg =
        error.response?.data?.message ||
        "No se pudo actualizar el producto. Intenta de nuevo.";
      setServerError(msg);
    },
  });

  // Mutación para borrar
  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      // Regresa a la lista principal
      router.replace("/(app)/products" as any);
    },
    onError: (error: any) => {
      console.error("Error al borrar producto:", error);
      const msg =
        error.response?.data?.message ||
        "No se pudo eliminar el producto. Intenta de nuevo.";
      setServerError(msg);
    },
  });

  const onSubmit = (values: ProductFormValues) => {
    setServerError(null);
    updateMutation.mutate(values);
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Producto",
      "¿Estás seguro de que deseas eliminar este producto? Esta acción lo removerá de tu lista.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setServerError(null);
            deleteMutation.mutate();
          },
        },
      ]
    );
  };

  const handleViewMovements = () => {
    router.push({
      pathname: "/(app)/products/[id]/movements" as any,
      params: { id },
    });
  };

  const isSubmitting = updateMutation.isPending || deleteMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Producto</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {isLoadingProduct || !product ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            {serverError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            )}

            <ProductForm
              initialValues={{
                name: product.name,
                price: parseFloat(product.price),
                cost: parseFloat(product.cost),
                minStock: product.minStock,
              }}
              stock={product.stock}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              onDelete={handleDelete}
              onViewMovements={handleViewMovements}
            />
          </View>
        </KeyboardAvoidingView>
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerPlaceholder: {
    width: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
});
