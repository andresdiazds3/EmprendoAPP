import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { TermsContent } from "../../components/TermsContent";
import { Feather } from "@expo/vector-icons";

export default function AcceptTermsScreen() {
  const router = useRouter();
  const { acceptTerms, logout } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => acceptTerms(),
    onSuccess: () => {
      // Reemplaza el stack de navegación para que no se pueda volver atrás
      router.replace("/(app)" as any);
    },
    onError: (error: any) => {
      console.error("Error aceptando términos:", error);
      const msg =
        error.response?.data?.message ||
        "No se pudo registrar la aceptación. Por favor, intenta de nuevo.";
      setServerError(msg);
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera sin botón de volver */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Términos del Servicio</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
          <Feather name="log-out" size={18} color="#6B7280" />
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Banner informativo de actualización obligatoria */}
      <View style={styles.noticeBanner}>
        <Feather name="shield" size={20} color="#6D28D9" style={{ marginRight: 10 }} />
        <Text style={styles.noticeText}>
          Para continuar usando Emprendo, debes leer y aceptar nuestros Términos y Condiciones actualizados.
        </Text>
      </View>

      {serverError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{serverError}</Text>
        </View>
      )}

      {/* Contenido de términos */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TermsContent />
      </ScrollView>

      {/* Botón Fijo Inferior */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.acceptButton, mutation.isPending && styles.acceptButtonDisabled]}
          disabled={mutation.isPending}
          onPress={() => {
            setServerError(null);
            mutation.mutate();
          }}
          activeOpacity={0.8}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptButtonText}>Aceptar y continuar</Text>
          )}
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
  },
  logoutText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5FB",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAE5F5",
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: "#6D28D9",
    fontWeight: "500",
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F7F5FB",
    backgroundColor: "#FFFFFF",
  },
  acceptButton: {
    backgroundColor: "#6D28D9",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
