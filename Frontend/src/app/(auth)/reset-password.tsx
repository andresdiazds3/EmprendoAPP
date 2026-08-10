import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";

const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .length(6, "El código debe tener exactamente 6 dígitos")
      .regex(/^\d{6}$/, "El código debe ser numérico"),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmNewPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmNewPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const displayEmail = email || "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: async (data: ResetPasswordFormValues) => {
      const response = await api.post("/api/auth/reset-password", {
        email: displayEmail,
        code: data.code,
        newPassword: data.newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      setServerError(null);
      setSuccessMessage("¡Tu contraseña ha sido restablecida con éxito!");
      
      // Esperar 2 segundos para dar feedback visual, luego limpiar stack y navegar al login
      setTimeout(() => {
        setSuccessMessage(null);
        router.replace("/(auth)/login");
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Error en reset-password:", error);
      const msg =
        error.response?.data?.message ||
        "El código es inválido o ha expirado. Intenta de nuevo.";
      setServerError(msg);
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!displayEmail) {
      setServerError("Falta el correo de recuperación. Solicita un código nuevo.");
      return;
    }
    if (mutation.isPending) return;
    mutation.mutate(data);
  };

  const isSubmitting = mutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabecera */}
          <View style={styles.header}>
            <Text style={styles.logoText}>Emprendo</Text>
            <Text style={styles.titleText}>Crear nueva contraseña</Text>
            <Text style={styles.subtitleText}>
              Código enviado a: <Text style={styles.emailHighlight}>{displayEmail || "correo no especificado"}</Text>
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {serverError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            )}

            {successMessage && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Campo: Código de 6 dígitos */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Código de verificación (6 dígitos)</Text>
              <Controller
                control={control}
                name="code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "code" && styles.inputFocused,
                    ]}
                    placeholder="123456"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting && !successMessage}
                    onFocus={() => setFocusedField("code")}
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.code && (
                <Text style={styles.fieldErrorText}>{errors.code.message}</Text>
              )}
            </View>

            {/* Campo: Nueva Contraseña */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "newPassword" && styles.inputFocused,
                    ]}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting && !successMessage}
                    onFocus={() => setFocusedField("newPassword")}
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.newPassword && (
                <Text style={styles.fieldErrorText}>{errors.newPassword.message}</Text>
              )}
            </View>

            {/* Campo: Confirmar Contraseña */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirmar nueva contraseña</Text>
              <Controller
                control={control}
                name="confirmNewPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "confirmNewPassword" && styles.inputFocused,
                    ]}
                    placeholder="Repite tu nueva contraseña"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting && !successMessage}
                    onFocus={() => setFocusedField("confirmNewPassword")}
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.confirmNewPassword && (
                <Text style={styles.fieldErrorText}>{errors.confirmNewPassword.message}</Text>
              )}
            </View>

            {/* Botón Restablecer */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isValid || isSubmitting || !!successMessage) && styles.submitButtonDisabled,
              ]}
              disabled={!isValid || isSubmitting || !!successMessage}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Restablecer contraseña</Text>
              )}
            </TouchableOpacity>

            {/* Enlace para solicitar nuevo código */}
            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>¿No te llegó el código? </Text>
              <Link href={"/(auth)/forgot-password" as any} asChild>
                <TouchableOpacity style={styles.linkButton}>
                  <Text style={styles.linkText}>Solicitar uno nuevo</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D28D9",
    marginBottom: 16,
  },
  titleText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  emailHighlight: {
    color: "#6D28D9",
    fontWeight: "600",
  },
  form: {
    width: "100%",
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
    color: "#991B1B",
    fontSize: 14,
    textAlign: "center",
  },
  successBanner: {
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  successText: {
    color: "#065F46",
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
    height: 52,
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
  footerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  linkButton: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  linkText: {
    color: "#6D28D9",
    fontSize: 14,
    fontWeight: "600",
  },
});
