import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, Product } from "../../../lib/products.api";
import { salesApi } from "../../../lib/sales.api";
import { queryKeys } from "../../../lib/queryKeys";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  availableStock: number;
  ventaBajoCosto?: boolean;
}

// Hook simple para debounce
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

export default function NewSaleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  // Consulta de productos para la búsqueda
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: queryKeys.products.list({ search: debouncedSearch, pageSize: 5 }),
    queryFn: () => productsApi.list({ search: debouncedSearch, pageSize: 5 }),
    enabled: debouncedSearch.trim().length >= 2,
  });

  // Mutación para confirmar la venta
  const createSaleMutation = useMutation({
    mutationFn: (items: { productId: string; quantity: number }[]) =>
      salesApi.create({ items }),
    onSuccess: () => {
      setCart([]);
      setServerError(null);
      // Invalida cache de ventas, productos, alertas de bajo stock y reportes
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      router.replace("/(app)/sales" as any);
    },
    onError: (error: any) => {
      console.error("Error al registrar venta:", error);
      const msg =
        error.response?.data?.message ||
        "No se pudo registrar la venta. Revisa los datos e intenta de nuevo.";
      setServerError(msg);
    },
  });

  // Agregar producto al carrito
  const handleAddProduct = (item: Product) => {
    setServerError(null);
    const numPrice = parseFloat(item.price);
    const numCost = parseFloat(item.cost);
    const isBelowCost = item.ventaBajoCosto ?? (numPrice < numCost);

    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.productId === item.id);
      if (existing) {
        return prevCart.map((i) =>
          i.productId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prevCart,
          {
            productId: item.id,
            name: item.name,
            price: numPrice,
            cost: numCost,
            quantity: 1,
            availableStock: item.stock,
            ventaBajoCosto: isBelowCost,
          },
        ];
      }
    });
    setSearchQuery("");
  };

  // Modificar cantidad del producto en el carrito
  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) return;
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  // Eliminar producto del carrito
  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  // Confirmar venta
  const handleConfirmSale = () => {
    if (cart.length === 0) return;
    setServerError(null);
    const payload = cart.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));
    createSaleMutation.mutate(payload);
  };

  // Calcular el total
  const saleTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Venta</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {serverError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          )}

          {/* Buscador */}
          <View style={styles.searchSection}>
            <Text style={styles.label}>Buscar Producto</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Escribe el nombre del producto..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {isLoadingSearch && (
              <ActivityIndicator size="small" color="#6D28D9" style={styles.searchSpinner} />
            )}
          </View>

          {/* Resultados de Búsqueda */}
          {searchQuery.trim().length >= 2 && searchResults && (
            <View style={styles.resultsOverlay}>
              <FlatList
                data={searchResults.items}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleAddProduct(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultStock}>Stock disponible: {item.stock}</Text>
                    </View>
                    <Text style={styles.resultPrice}>${parseFloat(item.price).toFixed(2)}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyResults}>
                    <Text style={styles.emptyResultsText}>No se encontraron productos.</Text>
                  </View>
                }
              />
            </View>
          )}

          {/* Listado del Carrito */}
          <View style={styles.cartSection}>
            <Text style={styles.sectionTitle}>Productos en la venta</Text>
            <FlatList
              data={cart}
              keyExtractor={(item) => item.productId}
              contentContainerStyle={styles.cartList}
              renderItem={({ item }) => {
                const subtotal = item.price * item.quantity;
                const isOutOfStock = item.quantity > item.availableStock;

                return (
                  <View style={styles.cartItem}>
                    <View style={styles.cartItemRow}>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.cartItemPrice}>${item.price.toFixed(2)} c/u</Text>
                      </View>

                      {/* Controles de Cantidad */}
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityBtn}
                          onPress={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Text style={styles.quantityBtnText}>-</Text>
                        </TouchableOpacity>

                        <Text style={styles.quantityText}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={styles.quantityBtn}
                          onPress={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Text style={styles.quantityBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.cartSubtotalContainer}>
                        <Text style={styles.cartSubtotalText}>${subtotal.toFixed(2)}</Text>
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => handleRemoveItem(item.productId)}
                        >
                          <Text style={styles.removeBtnText}>Quitar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {item.ventaBajoCosto && (
                      <View style={styles.amberBadge}>
                        <Text style={styles.amberBadgeText}>⚠️ Venta por debajo del precio base</Text>
                      </View>
                    )}

                    {/* Advertencia de stock */}
                    {isOutOfStock && (
                      <Text style={styles.stockWarningText}>
                        Stock insuficiente (Disponible: {item.availableStock} unidades)
                      </Text>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyCart}>
                  <Text style={styles.emptyCartText}>El carrito está vacío.</Text>
                </View>
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Panel Inferior Fijo de Total */}
      <View style={styles.footerPanel}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total a pagar:</Text>
          <Text style={styles.totalValue}>${saleTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, (cart.length === 0 || createSaleMutation.isPending) && styles.confirmButtonDisabled]}
          disabled={cart.length === 0 || createSaleMutation.isPending}
          onPress={handleConfirmSale}
          activeOpacity={0.8}
        >
          {createSaleMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar venta</Text>
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
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  searchSection: {
    marginTop: 16,
    position: "relative",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  searchInput: {
    backgroundColor: "#F7F5FB",
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A1A",
  },
  searchSpinner: {
    position: "absolute",
    right: 12,
    bottom: 12,
  },
  resultsOverlay: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE5F5",
    marginTop: 4,
    maxHeight: 200,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5FB",
  },
  resultTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  resultStock: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6D28D9",
  },
  emptyResults: {
    padding: 16,
    alignItems: "center",
  },
  emptyResultsText: {
    fontSize: 13,
    color: "#6B7280",
  },
  cartSection: {
    flex: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  cartList: {
    paddingBottom: 20,
  },
  cartItem: {
    backgroundColor: "#F7F5FB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  cartItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartItemInfo: {
    flex: 1.2,
    marginRight: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 12,
    color: "#6B7280",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAE5F5",
    paddingHorizontal: 4,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6D28D9",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    paddingHorizontal: 8,
  },
  cartSubtotalContainer: {
    flex: 0.8,
    alignItems: "flex-end",
  },
  cartSubtotalText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  removeBtn: {
    marginTop: 4,
    paddingVertical: 2,
  },
  removeBtnText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "600",
  },
  stockWarningText: {
    color: "#DC2626",
    fontSize: 11,
    marginTop: 6,
    fontWeight: "500",
  },
  amberBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  amberBadgeText: {
    color: "#D97706",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyCart: {
    paddingVertical: 64,
    alignItems: "center",
  },
  emptyCartText: {
    fontSize: 14,
    color: "#6B7280",
  },
  footerPanel: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F7F5FB",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6D28D9",
  },
  confirmButton: {
    backgroundColor: "#6D28D9",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
