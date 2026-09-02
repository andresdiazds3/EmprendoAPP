import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DateTimePicker from "@react-native-community/datetimepicker";
import { expensesApi } from "../../../lib/expenses.api";
import { queryKeys } from "../../../lib/queryKeys";
import { useRefetchOnFocus } from "../../../hooks/useRefetchOnFocus";

const expenseSchema = z.object({
  concept: z
    .string()
    .min(2, "El concepto debe tener al menos 2 caracteres")
    .max(150, "El concepto no puede superar los 150 caracteres"),
  amount: z.coerce
    .number()
    .positive("El monto debe ser un número positivo"),
  expenseDate: z.date({ message: "La fecha es requerida" }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function EditExpenseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Consultar el gasto existente
  const { data: expense, isLoading: isLoadingExpense, refetch } = useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: () => expensesApi.getById(id),
    enabled: !!id,
  });

  useRefetchOnFocus(refetch);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    mode: "onChange",
  });

  const expenseDateValue = watch("expenseDate");

  // Rellenar el formulario cuando los datos estén disponibles
  useEffect(() => {
    if (expense) {
      reset({
        concept: expense.concept,
        amount: parseFloat(expense.amount),
        expenseDate: new Date(expense.expenseDate),
      });
    }
  }, [expense, reset]);

  // Mutación para actualizar
  const updateMutation = useMutation({
    mutationFn: (values: ExpenseFormValues) =>
      expensesApi.update(id, {
        concept: values.concept,
        amount: values.amount,
        expenseDate: values.expenseDate.toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      router.back();
    },
    onError: (error: any) => {
      console.error("Error al actualizar gasto:", error);
      const msg =
        error.response?.data?.message ||
        "No se pudo actualizar el gasto. Intenta de nuevo.";
      setServerError(msg);
    },
  });

  // Mutación para eliminar físicamente
  const deleteMutation = useMutation({
    mutationFn: () => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      router.back();
    },
    onError: (error: any) => {
      console.error("Error al eliminar gasto:", error);
      const msg =
        error.response?.data?.message ||
        "No se pudo eliminar el gasto. Intenta de nuevo.";
      setServerError(msg);
    },
  });

  const onSubmit = (values: ExpenseFormValues) => {
    setServerError(null);
    updateMutation.mutate(values);
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Gasto",
      "¿Estás seguro de que deseas eliminar permanentemente este gasto? Esta acción no se puede deshacer.",
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Gasto</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {isLoadingExpense || !expense ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            {serverError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            )}

            {/* Concepto */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Concepto del gasto</Text>
              <Controller
                control={control}
                name="concept"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Compra de empaques o papelería"
                    placeholderTextColor="#6B7280"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!updateMutation.isPending && !deleteMutation.isPending}
                  />
                )}
              />
              {errors.concept && <Text style={styles.fieldErrorText}>{errors.concept.message}</Text>}
            </View>

            {/* Monto */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Monto del gasto ($)</Text>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value?.toString()}
                    editable={!updateMutation.isPending && !deleteMutation.isPending}
                  />
                )}
              />
              {errors.amount && <Text style={styles.fieldErrorText}>{errors.amount.message}</Text>}
            </View>

            {/* Fecha */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Fecha del gasto</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowPicker(true)}
                disabled={updateMutation.isPending || deleteMutation.isPending}
                activeOpacity={0.7}
              >
                <Text style={styles.dateSelectorText}>
                  {expenseDateValue ? expenseDateValue.toLocaleDateString("es-ES") : "Seleccionar fecha"}
                </Text>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={expenseDateValue || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowPicker(false);
                    if (selectedDate) {
                      setValue("expenseDate", selectedDate, { shouldValidate: true });
                    }
                  }}
                />
              )}
              {errors.expenseDate && (
                <Text style={styles.fieldErrorText}>{errors.expenseDate.message as string}</Text>
              )}
            </View>

            {/* Botón Guardar */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isValid || updateMutation.isPending || deleteMutation.isPending) &&
                  styles.submitButtonDisabled,
              ]}
              disabled={!isValid || updateMutation.isPending || deleteMutation.isPending}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.8}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>

            {/* Botón Eliminar */}
            <TouchableOpacity
              style={[
                styles.deleteButton,
                (updateMutation.isPending || deleteMutation.isPending) && styles.deleteButtonDisabled,
              ]}
              disabled={updateMutation.isPending || deleteMutation.isPending}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.deleteButtonText}>Eliminar gasto</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 6,
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
  dateSelector: {
    backgroundColor: "#F7F5FB",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  dateSelectorText: {
    fontSize: 15,
    color: "#1A1A1A",
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
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: "#DC2626",
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },
});
