import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View, StyleSheet, AppState, Platform } from "react-native";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos
      refetchOnMount: true,
      retry: 1,
    },
  },
});

function useReactQueryFocusManager() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (Platform.OS !== "web") {
        focusManager.setFocused(status === "active");
      }
    });
    return () => subscription.remove();
  }, []);
}

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useReactQueryFocusManager();

  useEffect(() => {
    if (isLoading) return;

    const seg0 = segments[0] as string;
    const seg1 = segments[1] as string;
    const inAuthGroup = seg0 === "(auth)";
    const inLegalGroup = seg0 === "(legal)";
    const isAcceptTermsScreen = inAuthGroup && seg1 === "accept-terms";

    if (!user) {
      if (!inAuthGroup && !inLegalGroup) {
        router.replace("/(auth)/login" as any);
      }
    } else {
      // Usuario autenticado
      if (!user.termsAcceptedAt) {
        // No ha aceptado los términos y condiciones: pantalla de aceptación forzosa
        if (!isAcceptTermsScreen && !inLegalGroup) {
          router.replace("/(auth)/accept-terms" as any);
        }
      } else {
        // Ya ha aceptado los términos: si está en pantalla de auth, redirigir a app
        if (inAuthGroup) {
          router.replace("/(app)" as any);
        }
      }
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
