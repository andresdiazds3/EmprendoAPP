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

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para pintar el borde violeta de focus en cada input
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (error: any) {
      console.error("Error en login:", error);
      const msg =
        error.response?.data?.message ||
        "Credenciales inválidas o error de conexión con el servidor.";
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
            <Text style={styles.titleText}>Iniciar sesión</Text>
            <Text style={styles.subtitleText}>
              Gestiona tu negocio de forma inteligente
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {serverError && (
              <View style={styles.serverErrorBanner}>
                <Text style={styles.serverErrorText}>{serverError}</Text>
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
                    placeholder="••••••••"
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

            {/* Botón Iniciar Sesión */}
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
                <Text style={styles.submitButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            {/* Enlace a Registro */}
            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity style={styles.linkButton}>
                  <Text style={styles.linkText}>Regístrate</Text>
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
