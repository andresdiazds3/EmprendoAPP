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
import { Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";

const registerFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre es requerido"),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Email inválido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Debes confirmar la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterScreen() {
  const { register } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para pintar el borde violeta de focus en cada input
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await register(data.name, data.email, data.password);
    } catch (error: any) {
      console.error("Error en registro:", error);
      const msg =
        error.response?.data?.message ||
        "El email ya está registrado o error de conexión con el servidor.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Text style={styles.titleText}>Crear cuenta</Text>
            <Text style={styles.subtitleText}>
              Únete hoy y empieza a gestionar tu negocio
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {serverError && (
              <View style={styles.serverErrorBanner}>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            {/* Campo: Nombre */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nombre completo</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "name" && styles.inputFocused,
                    ]}
                    placeholder="Tu nombre"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="words"
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

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
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Campo: Contraseña */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "password" && styles.inputFocused,
                    ]}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* Campo: Confirmar Contraseña */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "confirmPassword" && styles.inputFocused,
                    ]}
                    placeholder="Repite la contraseña"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            {/* Botón Registrarse */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isValid || isSubmitting) && styles.submitButtonDisabled,
              ]}
              disabled={!isValid || isSubmitting}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            {/* Enlace a Login */}
            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
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
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D28D9",
    marginBottom: 8,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  serverErrorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  serverErrorText: {
    color: "#991B1B",
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
