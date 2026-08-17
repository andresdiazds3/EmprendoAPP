import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const productSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres"),
  price: z.coerce
    .number()
    .positive("El precio debe ser un número positivo"),
  cost: z.coerce
    .number()
    .nonnegative("El costo debe ser mayor o igual a 0"),
  minStock: z.coerce
    .number()
    .int("El stock mínimo debe ser un número entero")
    .nonnegative("El stock mínimo debe ser mayor o igual a 0"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  stock?: number;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  isSubmitting: boolean;
  onDelete?: () => void;
  onViewMovements?: () => void;
}

export function ProductForm({
  initialValues,
  stock,
  onSubmit,
  isSubmitting,
  onDelete,
  onViewMovements,
}: ProductFormProps) {
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: initialValues?.name || "",
      price: initialValues?.price !== undefined ? initialValues.price : ("" as any),
      cost: initialValues?.cost !== undefined ? initialValues.cost : ("" as any),
      minStock: initialValues?.minStock !== undefined ? initialValues.minStock : 0,
    },
    mode: "onChange",
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {stock !== undefined && (
        <View style={styles.stockBox}>
          <Text style={styles.stockBoxText}>
            Stock actual: <Text style={styles.stockBoxValue}>{stock} unidades</Text> — se administra desde Movimientos de stock
          </Text>
        </View>
      )}

      {/* Campo: Nombre */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Nombre del producto</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, focusedField === "name" && styles.inputFocused]}
              placeholder="Ej. Camiseta Deportiva"
              placeholderTextColor="#6B7280"
              onFocus={() => setFocusedField("name")}
              onBlur={() => {
                setFocusedField(null);
                onBlur();
              }}
              onChangeText={onChange}
              value={value}
              editable={!isSubmitting}
            />
          )}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
      </View>

      {/* Campo: Precio */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Precio de venta ($)</Text>
        <Controller
          control={control}
          name="price"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, focusedField === "price" && styles.inputFocused]}
              placeholder="0.00"
              placeholderTextColor="#6B7280"
              keyboardType="decimal-pad"
              onFocus={() => setFocusedField("price")}
              onBlur={() => {
                setFocusedField(null);
                onBlur();
              }}
              onChangeText={onChange}
              value={value?.toString()}
              editable={!isSubmitting}
            />
          )}
        />
        {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
      </View>

      {/* Campo: Costo */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Costo unitario ($)</Text>
        <Controller
          control={control}
          name="cost"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, focusedField === "cost" && styles.inputFocused]}
              placeholder="0.00"
              placeholderTextColor="#6B7280"
              keyboardType="decimal-pad"
              onFocus={() => setFocusedField("cost")}
              onBlur={() => {
                setFocusedField(null);
                onBlur();
              }}
              onChangeText={onChange}
              value={value?.toString()}
              editable={!isSubmitting}
            />
          )}
        />
        {errors.cost && <Text style={styles.errorText}>{errors.cost.message}</Text>}
      </View>

      {/* Campo: Stock Mínimo */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Stock mínimo para alertas</Text>
        <Controller
          control={control}
          name="minStock"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, focusedField === "minStock" && styles.inputFocused]}
              placeholder="0"
              placeholderTextColor="#6B7280"
              keyboardType="number-pad"
              onFocus={() => setFocusedField("minStock")}
              onBlur={() => {
                setFocusedField(null);
                onBlur();
              }}
              onChangeText={onChange}
              value={value?.toString()}
              editable={!isSubmitting}
            />
          )}
        />
        {errors.minStock && <Text style={styles.errorText}>{errors.minStock.message}</Text>}
      </View>

      {/* Botón de Submit Principal */}
      <TouchableOpacity
        style={[styles.submitButton, (!isValid || isSubmitting) && styles.submitButtonDisabled]}
        disabled={!isValid || isSubmitting}
        onPress={handleSubmit(onSubmit)}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Guardar producto</Text>
        )}
      </TouchableOpacity>

      {/* Enlace opcional a Movimientos */}
      {onViewMovements && (
        <TouchableOpacity
          style={styles.movementsButton}
          onPress={onViewMovements}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={styles.movementsButtonText}>Ver movimientos de stock →</Text>
        </TouchableOpacity>
      )}

      {/* Botón opcional de Eliminación */}
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Eliminar producto</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 16,
  },
  stockBox: {
    backgroundColor: "#F7F5FB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  stockBoxText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  stockBoxValue: {
    color: "#6D28D9",
    fontWeight: "bold",
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
  inputFocused: {
    borderColor: "#6D28D9",
    backgroundColor: "#FFFFFF",
  },
  errorText: {
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
  movementsButton: {
    marginTop: 20,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  movementsButtonText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteButton: {
    marginTop: 10,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },
});
