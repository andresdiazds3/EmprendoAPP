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
import { useRouter, Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Email inválido"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      const response = await api.post("/api/auth/forgot-password", {
        email: data.email,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      setServerError(null);
      setInfoMessage("Si el correo existe, te llegará un código en unos minutos.");
      
      // Esperar 2 segundos para que el usuario pueda leer el mensaje, luego navegar
      setTimeout(() => {
        setInfoMessage(null);
        router.push({
          pathname: "/(auth)/reset-password" as any,
          params: { email: variables.email },
        });
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Error en forgot-password:", error);
      const msg =
        error.response?.data?.message ||
        "Ocurrió un error al procesar tu solicitud. Intenta de nuevo.";
      setServerError(msg);
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
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
            <Text style={styles.titleText}>Recuperar contraseña</Text>
            <Text style={styles.subtitleText}>
              Ingresa tu correo para recibir un código de recuperación
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {serverError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            )}

            {infoMessage && (
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>{infoMessage}</Text>
              </View>
            )}

            {/* Campo: Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "email" && styles.inputFocused,
                    ]}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor="#6B7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting && !infoMessage}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.fieldErrorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Botón Enviar Código */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isValid || isSubmitting || !!infoMessage) && styles.submitButtonDisabled,
              ]}
              disabled={!isValid || isSubmitting || !!infoMessage}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar código</Text>
              )}
            </TouchableOpacity>

            {/* Enlace para volver a Login */}
            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>¿Recordaste tu contraseña? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={styles.linkButton}>
                  <Text style={styles.linkText}>Inicia sesión</Text>
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
    marginBottom: 32,
    marginTop: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D28D9",
    marginBottom: 16,
  },
  titleText: {
    fontSize: 28,
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
  infoBanner: {
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  infoText: {
    color: "#065F46",
    fontSize: 14,
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 20,
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
