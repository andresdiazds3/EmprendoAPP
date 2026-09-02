import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Drawer } from "expo-router/drawer";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

function CustomDrawerContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { label: "Inicio", route: "/", icon: "home" as const },
    { label: "Productos", route: "/products", icon: "box" as const },
    { label: "Ventas", route: "/sales", icon: "shopping-cart" as const },
    { label: "Gastos", route: "/expenses", icon: "dollar-sign" as const },
    { label: "Reportes", route: "/reports", icon: "bar-chart-2" as const },
    { label: "Asistente IA", route: "/chat", icon: "message-circle" as const },
  ];

  const isActive = (itemRoute: string) => {
    if (itemRoute === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname.startsWith(itemRoute);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Cabecera del Perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
        <Text style={styles.profileName} numberOfLines={1}>
          {user?.name || "Usuario"}
        </Text>
        <Text style={styles.profileEmail} numberOfLines={1}>
          {user?.email || ""}
        </Text>
      </View>

      <View style={styles.menuDivider} />

      {/* Listado de Opciones */}
      <View style={styles.menuItemsList}>
        {menuItems.map((item) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, active && styles.menuItemActive]}
              onPress={() => {
                // Navegar a la pantalla
                router.push(item.route as any);
              }}
              activeOpacity={0.7}
            >
              <Feather
                name={item.icon}
                size={20}
                color={active ? "#6D28D9" : "#6B7280"}
                style={styles.menuItemIcon}
              />
              <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer de Cerrar Sesión */}
      <View style={styles.footerContainer}>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
          <Feather name="log-out" size={20} color="#DC2626" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
      }}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="products" />
      <Drawer.Screen name="sales" />
      <Drawer.Screen name="expenses" />
      <Drawer.Screen name="reports" />
      <Drawer.Screen name="chat" />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F7F5FB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#EAE5F5",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D28D9",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: "#6B7280",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F7F5FB",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  menuItemsList: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
  menuItemActive: {
    backgroundColor: "#F7F5FB",
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
  },
  menuItemTextActive: {
    color: "#6D28D9",
    fontWeight: "600",
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },
});
