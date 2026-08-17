import { api } from "./api";
import { Product } from "./products.api";

export interface StockMovement {
  id: string;
  type: "RESTOCK" | "SALE" | "ADJUSTMENT";
  quantity: number;
  reason: string | null;
  createdAt: string;
  userId: string;
  productId: string;
  saleItemId: string | null;
}

export interface ListMovementsParams {
  page?: number;
  pageSize?: number;
}

export const inventoryApi = {
  // Registrar un movimiento de inventario (Entrada / Ajuste)
  registerMovement: async (data: {
    productId: string;
    type: "RESTOCK" | "ADJUSTMENT";
    quantity: number;
    reason?: string;
  }) => {
    const response = await api.post<{ success: boolean; data: StockMovement }>("/api/inventory/movements", data);
    return response.data.data;
  },

  // Obtener la lista paginada de movimientos de un producto
  listMovements: async (productId: string, params?: ListMovementsParams) => {
    const response = await api.get<{
      success: boolean;
      data: {
        items: StockMovement[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/inventory/products/${productId}/movements`, { params });
    return response.data.data;
  },

  // Obtener la lista de productos con bajo stock
  getLowStockAlerts: async () => {
    const response = await api.get<{ success: boolean; data: Product[] }>("/api/inventory/low-stock");
    return response.data.data;
  },
};
