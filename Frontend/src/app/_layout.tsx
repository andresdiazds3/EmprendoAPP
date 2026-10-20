import React, { useEffect, useRef, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { View, StyleSheet, AppState, Platform, Animated, Easing } from "react-native";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AnimatedSplash } from "../components/AnimatedSplash";

// Mantiene el splash nativo hasta que el splash animado esté listo y montado
SplashScreen.preventAutoHideAsync().catch(() => {});

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

  // Control de sincronización del Splash
  const [animationFinished, setAnimationFinished] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [isSplashMounted, setIsSplashMounted] = useState(true);

  // Animación de salida (fade-out ~300ms)
  const splashFadeAnim = useRef(new Animated.Value(1)).current;

  useReactQueryFocusManager();

  // Ocultar el splash nativo inmediatamente tras montar el splash animado
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Temporizador de seguridad de 10s para modo avión / caídas del servidor
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimedOut(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Se avanza solo cuando la animación terminó Y (terminó isLoading o venció el timeout de 10s)
  const isReadyToProceed = animationFinished && (!isLoading || authTimedOut);

  // Ejecuta la transición de salida suave (fade-out de 300ms)
  useEffect(() => {
    if (isReadyToProceed && isSplashMounted) {
      Animated.timing(splashFadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setIsSplashMounted(false);
      });
    }
  }, [isReadyToProceed, isSplashMounted, splashFadeAnim]);

  // Redirección de rutas según el estado de autenticación una vez completada la espera
  useEffect(() => {
    if (!isReadyToProceed) return;

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
  }, [user, isReadyToProceed, segments]);

  return (
    <View style={styles.rootContainer}>
      <Slot />
      {isSplashMounted && (
        <Animated.View
          style={[styles.splashWrapper, { opacity: splashFadeAnim }]}
          pointerEvents={isReadyToProceed ? "none" : "auto"}
        >
          <AnimatedSplash onFinish={() => setAnimationFinished(true)} />
        </Animated.View>
      )}
    </View>
  );
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
  rootContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  splashWrapper: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#FFFFFF",
    zIndex: 9999,
  },
});
