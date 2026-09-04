import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { productsApi } from "../../lib/products.api";
import { inventoryApi } from "../../lib/inventory.api";
import { reportsApi } from "../../lib/reports.api";
import { queryKeys } from "../../lib/queryKeys";
import { useRefetchOnFocus } from "../../hooks/useRefetchOnFocus";

// Obtener rango del mes actual (primer día a hoy)
const getCurrentMonthParams = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { from, to } = getCurrentMonthParams();

  // 1. Productos activos
  const { data: productsData, isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: queryKeys.products.list({ page: 1, pageSize: 1 }),
    queryFn: () => productsApi.list({ page: 1, pageSize: 1 }),
  });

  // 2. Alertas de bajo stock
  const { data: lowStockData, isLoading: isLoadingLowStock, refetch: refetchLowStock } = useQuery({
    queryKey: queryKeys.products.lowStock,
    queryFn: () => inventoryApi.getLowStockAlerts(),
  });

  // 3. Ventas y Utilidades del mes
  const { data: utilidadData, isLoading: isLoadingUtilidad, refetch: refetchUtilidad } = useQuery({
    queryKey: queryKeys.reports.utilidad({ from, to }),
    queryFn: () => reportsApi.getUtilidad({ from, to }),
  });

  useRefetchOnFocus(refetchProducts);
  useRefetchOnFocus(refetchLowStock);
  useRefetchOnFocus(refetchUtilidad);

  const activeProductsCount = productsData?.total ?? 0;
  const lowStockCount = lowStockData?.length ?? 0;
  const ventasMes = utilidadData?.ingresos ?? 0;
  const utilidadMes = utilidadData?.utilidad ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
        >
          <Feather name="menu" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Hola, {user?.name ? user.name.split(" ")[0] : "Emprendedor"}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Sección Bienvenida */}
        <View style={styles.welcomeSection}>
          <Text style={styles.logoText}>Emprendo</Text>
          <Text style={styles.subtitle}>Tu negocio bajo control</Text>
        </View>

        {/* Grilla 2x2 de Tarjetas */}
        <View style={styles.gridContainer}>
          {/* Fila 1 */}
          <View style={styles.gridRow}>
            {/* Card 1: Productos activos */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/(app)/products" as any)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Feather name="box" size={18} color="#6B7280" />
              </View>
              {isLoadingProducts ? (
                <ActivityIndicator size="small" color="#6D28D9" style={styles.cardSpinner} />
              ) : (
                <Text style={styles.cardValue}>{activeProductsCount}</Text>
              )}
              <Text style={styles.cardLabel}>Productos activos</Text>
            </TouchableOpacity>

            {/* Card 2: Alertas de bajo stock */}
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(app)/products",
                  params: { lowStock: "true" },
                } as any)
              }
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Feather
                  name="alert-triangle"
                  size={18}
                  color={lowStockCount > 0 ? "#DC2626" : "#6B7280"}
                />
              </View>
              {isLoadingLowStock ? (
                <ActivityIndicator size="small" color="#6D28D9" style={styles.cardSpinner} />
              ) : (
                <Text
                  style={[
                    styles.cardValue,
                    lowStockCount > 0 ? styles.redText : styles.grayValueText,
                  ]}
                >
                  {lowStockCount}
                </Text>
              )}
              <Text style={styles.cardLabel}>Con bajo stock</Text>
            </TouchableOpacity>
          </View>

          {/* Fila 2 */}
          <View style={styles.gridRow}>
            {/* Card 3: Ventas del mes */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/(app)/sales" as any)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Feather name="shopping-cart" size={18} color="#6B7280" />
              </View>
              {isLoadingUtilidad ? (
                <ActivityIndicator size="small" color="#6D28D9" style={styles.cardSpinner} />
              ) : (
                <Text style={styles.cardValue} numberOfLines={1}>
                  ${ventasMes.toFixed(2)}
                </Text>
              )}
              <Text style={styles.cardLabel}>Ventas del mes</Text>
            </TouchableOpacity>

            {/* Card 4: Utilidad del mes */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/(app)/reports" as any)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Feather name="trending-up" size={18} color="#6B7280" />
              </View>
              {isLoadingUtilidad ? (
                <ActivityIndicator size="small" color="#6D28D9" style={styles.cardSpinner} />
              ) : (
                <Text
                  style={[
                    styles.cardValue,
                    utilidadMes >= 0 ? styles.greenText : styles.redText,
                  ]}
                  numberOfLines={1}
                >
                  {utilidadMes >= 0 ? "" : "-"}${Math.abs(utilidadMes).toFixed(2)}
                </Text>
              )}
              <Text style={styles.cardLabel}>Utilidad del mes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Link inferior a Reportes Completos */}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/(app)/reports" as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.linkButtonText}>Ver reportes completos →</Text>
        </TouchableOpacity>
      </ScrollView>
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
  menuButton: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    maxWidth: "70%",
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  welcomeSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6D28D9",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  gridContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#F7F5FB",
    borderRadius: 12,
    padding: 16,
    minHeight: 110,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginVertical: 4,
  },
  grayValueText: {
    color: "#6B7280",
  },
  redText: {
    color: "#DC2626",
  },
  greenText: {
    color: "#10B981",
  },
  cardLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  cardSpinner: {
    marginVertical: 4,
    alignSelf: "flex-start",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 32,
    paddingVertical: 12,
  },
  linkButtonText: {
    fontSize: 15,
    color: "#6D28D9",
    fontWeight: "600",
  },
});
