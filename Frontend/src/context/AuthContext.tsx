import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { api } from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (token) {
          // Validar el token obteniendo info del usuario
          const response = await api.get("/api/auth/me");
          if (response.data?.success) {
            setUser(response.data.data);
          } else {
            await SecureStore.deleteItemAsync("token");
          }
        }
      } catch (e) {
        console.warn("Error cargando sesión inicial:", e);
        // Si falla la validación, eliminamos el token
        await SecureStore.deleteItemAsync("token").catch(() => {});
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post("/api/auth/login", { email, password });
    if (response.data?.success) {
      const { user: userData, token } = response.data.data;
      await SecureStore.setItemAsync("token", token);
      setUser(userData);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post("/api/auth/register", { name, email, password });
    if (response.data?.success) {
      const { user: userData, token } = response.data.data;
      await SecureStore.setItemAsync("token", token);
      setUser(userData);
    }
  };

  const logout = async () => {
    try {
      // Intentamos llamar al endpoint del backend, ignorando fallos (ej. sin conexión)
      await api.post("/api/auth/logout").catch(() => {});
    } finally {
      await SecureStore.deleteItemAsync("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
