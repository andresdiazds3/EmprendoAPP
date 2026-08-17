import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import DateTimePicker from "@react-native-community/datetimepicker";
import { salesApi } from "../../../lib/sales.api";

export default function SalesHistoryScreen() {
  const router = useRouter();
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Formatear fechas para enviarlas como ISO string
  const fromParam = fromDate ? new Date(fromDate.setHours(0, 0, 0, 0)).toISOString() : undefined;
  const toParam = toDate ? new Date(toDate.setHours(23, 59, 59, 999)).toISOString() : undefined;

  // Query infinita para el historial de ventas paginado
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["sales", fromParam, toParam],
    queryFn: ({ pageParam = 1 }) =>
      salesApi.list({
        page: pageParam,
        pageSize: 20,
        from: fromParam,
        to: toParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  // Forzar recarga al volver a enfocar la pantalla
  useEffect(() => {
    refetch();
  }, []);

  const sales = data?.pages.flatMap((page) => page.items) || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Inicio</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Ventas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(app)/sales/new" as any)}
        >
          <Text style={styles.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Rango de Fechas */}
      <View style={styles.filterSection}>
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowFromPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateButtonText}>
              {fromDate ? `Desde: ${fromDate.toLocaleDateString("es-ES")}` : "Desde: --/--/----"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowToPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateButtonText}>
              {toDate ? `Hasta: ${toDate.toLocaleDateString("es-ES")}` : "Hasta: --/--/----"}
            </Text>
          </TouchableOpacity>
        </View>

        {(fromDate || toDate) && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setFromDate(null);
              setToDate(null);
            }}
          >
            <Text style={styles.clearButtonText}>Limpiar rango x</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pickers Nativos */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) setFromDate(selectedDate);
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) {
              // Asegura que no sea menor a la fecha desde
              if (fromDate && selectedDate < fromDate) {
                setFromDate(selectedDate);
              }
              setToDate(selectedDate);
            }
          }}
        />
      )}

      {/* Listado */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const formattedDate = new Date(item.saleDate).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            const productsCount = item.items.length;

            return (
              <TouchableOpacity
                style={styles.saleCard}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/sales/[id]" as any,
                    params: { id: item.id },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.saleInfo}>
                  <Text style={styles.saleDateText}>{formattedDate}</Text>
                  <Text style={styles.saleProductsCount}>
                    {productsCount} {productsCount === 1 ? "producto distinto" : "productos distintos"}
                  </Text>
                </View>
                <Text style={styles.saleTotalText}>${parseFloat(item.total).toFixed(2)}</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No hay ventas registradas en este período. Registra una nueva venta con el botón "+ Nueva" arriba.
              </Text>
            </View>
          }
          ListFooterComponent={
            hasNextPage ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color="#6D28D9" />
                ) : (
                  <Text style={styles.loadMoreText}>Cargar más</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
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
    color: "#6B7280",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  addButton: {
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 15,
    color: "#6D28D9",
    fontWeight: "600",
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  datePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: "#F7F5FB",
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  dateButtonText: {
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "500",
    textAlign: "center",
  },
  clearButton: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: "#6D28D9",
    fontSize: 13,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  saleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F5FB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  saleInfo: {
    flex: 1,
    marginRight: 16,
  },
  saleDateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  saleProductsCount: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  saleTotalText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#6D28D9",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  loadMoreButton: {
    backgroundColor: "#FFFFFF",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    marginTop: 8,
  },
  loadMoreText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "600",
  },
});
