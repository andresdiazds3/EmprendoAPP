import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Nombre / Marca superior */}
        <Text style={styles.logoText}>Emprendo</Text>

        {/* Mensaje de Bienvenida */}
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeTitle}>Bienvenido,</Text>
          <Text style={styles.userName}>{user?.name || "Emprendedor"}</Text>
          <Text style={styles.welcomeSubtitle}>
            Esta es tu pantalla de inicio protegida.
          </Text>
        </View>

        {/* Botón de Logout como link secundario abajo */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.7}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#6D28D9" />
          ) : (
            <Text style={styles.logoutText}>Cerrar sesión</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D28D9",
    position: "absolute",
    top: 40,
  },
  welcomeBox: {
    alignItems: "center",
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "400",
    color: "#6B7280",
  },
  userName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 4,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 16,
    maxWidth: 260,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#6D28D9",
    fontSize: 16,
    fontWeight: "600",
  },
});
