import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

// Carga la URL base de las variables de entorno de Expo, con fallback a localhost
const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para inyectar el token en cada petición
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error leyendo el token de SecureStore:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para capturar respuestas con error 401 (No autorizado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await SecureStore.deleteItemAsync("token");
        // Redirige al login de inmediato
        router.replace("/(auth)/login");
      } catch (storeError) {
        console.error("Error al borrar el token tras error 401:", storeError);
      }
    }
    return Promise.reject(error);
  }
);
