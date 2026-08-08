import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../context/AuthContext";

const queryClient = new QueryClient();

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Detectamos si el usuario se encuentra dentro del grupo (auth)
    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // No está autenticado y no está en login/registro -> Mandar a Login
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Sí está autenticado y está en login/registro -> Mandar a la pantalla protegida
      router.replace("/(app)");
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
