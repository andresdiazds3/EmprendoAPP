import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../lib/sales.api";
import { queryKeys } from "../../../lib/queryKeys";
import { useRefetchOnFocus } from "../../../hooks/useRefetchOnFocus";

export default function SaleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Consultar detalles de la venta
  const { data: sale, isLoading, refetch } = useQuery({
    queryKey: queryKeys.sales.detail(id),
    queryFn: () => salesApi.getById(id),
    enabled: !!id,
  });

  useRefetchOnFocus(refetch);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Venta</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {isLoading || !sale ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
        </View>
      ) : (
        <View style={styles.container}>
          {/* Tarjeta de Resumen */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Fecha de la venta</Text>
            <Text style={styles.summaryValue}>
              {new Date(sale.saleDate).toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.summaryLabel}>Total registrado</Text>
            <Text style={styles.totalValue}>${parseFloat(sale.total).toFixed(2)}</Text>
          </View>

          {/* Listado de Líneas de Venta */}
          <Text style={styles.sectionTitle}>Productos Vendidos</Text>
          <FlatList
            data={sale.items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const subtotal = parseFloat(item.unitPrice) * item.quantity;
              return (
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.itemSubtext}>
                      {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"} x ${parseFloat(item.unitPrice).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtotal}>${subtotal.toFixed(2)}</Text>
                </View>
              );
            }}
          />
        </View>
      )}
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
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: "#6D28D9",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerPlaceholder: {
    width: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryCard: {
    backgroundColor: "#F7F5FB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  divider: {
    height: 1,
    backgroundColor: "#EAE5F5",
    marginVertical: 12,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D28D9",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 24,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F5FB",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  itemSubtext: {
    fontSize: 12,
    color: "#6B7280",
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
});
