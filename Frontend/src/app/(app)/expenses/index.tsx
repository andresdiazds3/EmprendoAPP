import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DateTimePicker from "@react-native-community/datetimepicker";
import { expensesApi } from "../../../lib/expenses.api";
import { Feather } from "@expo/vector-icons";
import { queryKeys } from "../../../lib/queryKeys";
import { useRefetchOnFocus } from "../../../hooks/useRefetchOnFocus";

export default function ExpensesListScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Formatear fechas para ISO string
  const fromParam = fromDate ? new Date(fromDate.setHours(0, 0, 0, 0)).toISOString() : undefined;
  const toParam = toDate ? new Date(toDate.setHours(23, 59, 59, 999)).toISOString() : undefined;

  // Query infinita para listar gastos
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.expenses.list({ from: fromParam, to: toParam }),
    queryFn: ({ pageParam = 1 }) =>
      expensesApi.list({
        page: pageParam,
        pageSize: 20,
        from: fromParam,
        to: toParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  useRefetchOnFocus(refetch);

  // Mutación para borrar gasto directamente de la lista
  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      Alert.alert("Éxito", "El gasto ha sido eliminado.");
    },
    onError: (error: any) => {
      console.error("Error al borrar gasto:", error);
      const msg = error.response?.data?.message || "No se pudo eliminar el gasto.";
      Alert.alert("Error", msg);
    },
  });

  // Forzar recarga al volver a enfocar la pantalla
  useEffect(() => {
    refetch();
  }, []);

  const handleDelete = (expenseId: string, concept: string) => {
    Alert.alert(
      "Eliminar Gasto",
      `¿Deseas eliminar permanentemente el gasto "${concept}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteMutation.mutate(expenseId),
        },
      ]
    );
  };

  const expenses = data?.pages.flatMap((page) => page.items) || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()} activeOpacity={0.7}>
          <Feather name="menu" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Gastos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(app)/expenses/new" as any)}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
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
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const formattedDate = new Date(item.expenseDate).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            return (
              <TouchableOpacity
                style={styles.expenseCard}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/expenses/[id]" as any,
                    params: { id: item.id },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseConcept} numberOfLines={1}>
                    {item.concept}
                  </Text>
                  <Text style={styles.expenseDate}>{formattedDate}</Text>
                </View>

                <View style={styles.expenseRightContainer}>
                  <Text style={styles.expenseAmountText}>-${parseFloat(item.amount).toFixed(2)}</Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.concept)}
                  >
                    <Text style={styles.deleteBtnText}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No hay gastos registrados en este período. Registra un nuevo gasto con el botón "+ Nuevo" arriba.
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
  menuButton: {
    paddingVertical: 8,
    paddingRight: 8,
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
  expenseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F5FB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1.2,
    marginRight: 16,
  },
  expenseConcept: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  expenseDate: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  expenseRightContainer: {
    flex: 0.8,
    alignItems: "flex-end",
  },
  expenseAmountText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#DC2626",
  },
  deleteBtn: {
    marginTop: 6,
    paddingVertical: 2,
  },
  deleteBtnText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "600",
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
