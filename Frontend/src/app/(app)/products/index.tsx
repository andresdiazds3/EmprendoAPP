import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../../../lib/products.api";
import { inventoryApi } from "../../../lib/inventory.api";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Feather } from "@expo/vector-icons";
import { queryKeys } from "../../../lib/queryKeys";
import { useRefetchOnFocus } from "../../../hooks/useRefetchOnFocus";

// Hook simple para debouncear búsquedas
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function ProductsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lowStock?: string }>();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(params.lowStock === "true");
  const [viewTrash, setViewTrash] = useState(false);

  useEffect(() => {
    if (params.lowStock === "true") {
      setFilterLowStock(true);
      setViewTrash(false);
    }
  }, [params.lowStock]);

  const debouncedSearch = useDebounce(searchQuery, 400);

  // Consulta para el conteo de bajo stock (banner superior)
  const { data: lowStockAlerts } = useQuery({
    queryKey: queryKeys.products.lowStock,
    queryFn: () => inventoryApi.getLowStockAlerts(),
    enabled: !debouncedSearch && !viewTrash,
  });

  // Query infinita para listar productos paginados
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.products.list({ search: debouncedSearch, lowStock: filterLowStock, trash: viewTrash }),
    queryFn: ({ pageParam = 1 }) =>
      productsApi.list({
        page: pageParam,
        pageSize: 20,
        search: debouncedSearch || undefined,
        lowStock: filterLowStock || undefined,
        trash: viewTrash || undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  useRefetchOnFocus(refetch);

  // Mutación para restaurar producto de la papelera
  const restoreMutation = useMutation({
    mutationFn: (productId: string) => productsApi.restore(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      Alert.alert("Éxito", "El producto ha sido restaurado.");
    },
    onError: (error: any) => {
      console.error("Error al restaurar producto:", error);
      const msg = error.response?.data?.message || "No se pudo restaurar el producto.";
      Alert.alert("Error", msg);
    },
  });

  const handleRestoreProduct = (productId: string, productName: string) => {
    Alert.alert(
      "Restaurar Producto",
      `¿Deseas restaurar "${productName}" a tu inventario activo?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          onPress: () => restoreMutation.mutate(productId),
        },
      ]
    );
  };

  // Efecto para recargar los datos de conteo al volver a enfocar la pantalla
  useEffect(() => {
    refetch();
  }, []);

  const products = data?.pages.flatMap((page) => page.items) || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()} activeOpacity={0.7}>
          <Feather name="menu" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{viewTrash ? "Papelera de Productos" : "Mis Productos"}</Text>
        {!viewTrash ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/(app)/products/new" as any)}
          >
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      {/* Buscador (Solo si no estamos en Papelera) */}
      {!viewTrash && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto por nombre..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Chips de Filtros Rápidos (Bajo Stock / Papelera) */}
      <View style={styles.filterChipsRow}>
        <TouchableOpacity
          style={[styles.chipButton, filterLowStock && styles.chipActive]}
          onPress={() => {
            setFilterLowStock(!filterLowStock);
            setViewTrash(false);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, filterLowStock && styles.chipTextActive]}>
            Bajo stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chipButton, viewTrash && styles.chipActive]}
          onPress={() => {
            setViewTrash(!viewTrash);
            setFilterLowStock(false);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, viewTrash && styles.chipTextActive]}>
            Papelera
          </Text>
        </TouchableOpacity>
      </View>

      {/* Banners Informativos / Filtros activos */}
      {!viewTrash && !debouncedSearch && lowStockAlerts && lowStockAlerts.length > 0 && !filterLowStock && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerText}>
            Tienes <Text style={styles.boldText}>{lowStockAlerts.length}</Text> producto(s) con stock bajo.
          </Text>
          <TouchableOpacity onPress={() => setFilterLowStock(true)}>
            <Text style={styles.alertLinkText}>Ver</Text>
          </TouchableOpacity>
        </View>
      )}

      {!viewTrash && filterLowStock && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>Filtrando por stock bajo</Text>
          <TouchableOpacity onPress={() => setFilterLowStock(false)}>
            <Text style={styles.filterClearText}>Quitar filtro x</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Listado de Productos */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isLowStock = item.stock <= item.minStock;
            return (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => {
                  if (viewTrash) {
                    handleRestoreProduct(item.id, item.name);
                  } else {
                    router.push(`/(app)/products/${item.id}` as any);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2)}</Text>
                </View>

                <View style={styles.productStockContainer}>
                  <Text style={styles.productStock}>
                    Stock: <Text style={styles.stockValue}>{item.stock}</Text>
                  </Text>
                  {!viewTrash && isLowStock && (
                    <View style={styles.lowStockBadge}>
                      <Text style={styles.lowStockBadgeText}>Bajo stock</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {viewTrash
                  ? "La papelera está vacía."
                  : "No se encontraron productos. Crea tu primer producto pulsando el botón \"+ Nuevo\" arriba."}
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
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 15,
    color: "#6D28D9",
    fontWeight: "600",
  },
  headerPlaceholder: {
    width: 50,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: "#F7F5FB",
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A1A",
  },
  alertBanner: {
    flexDirection: "row",
    backgroundColor: "#FEE2E2",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertBannerText: {
    color: "#DC2626",
    fontSize: 13,
  },
  boldText: {
    fontWeight: "bold",
  },
  alertLinkText: {
    color: "#DC2626",
    fontWeight: "700",
    textDecorationLine: "underline",
    paddingHorizontal: 6,
  },
  filterBanner: {
    flexDirection: "row",
    backgroundColor: "#F7F5FB",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  filterBannerText: {
    color: "#1A1A1A",
    fontSize: 13,
    fontWeight: "500",
  },
  filterClearText: {
    color: "#6D28D9",
    fontWeight: "700",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F5FB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#6B7280",
  },
  productStockContainer: {
    alignItems: "flex-end",
  },
  productStock: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  stockValue: {
    color: "#1A1A1A",
    fontWeight: "bold",
  },
  lowStockBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lowStockBadgeText: {
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
    justifyContent: "center",
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
  filterChipsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  chipButton: {
    backgroundColor: "#F7F5FB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#EAE5F5",
  },
  chipActive: {
    backgroundColor: "#6D28D9",
    borderColor: "#6D28D9",
  },
  chipText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
