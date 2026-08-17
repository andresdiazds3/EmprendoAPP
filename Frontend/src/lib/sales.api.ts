import { api } from "./api";

export interface SaleItemProduct {
  name: string;
}

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: string; // Serializado como string decimal
  unitCost: string;  // Serializado como string decimal
  saleId: string;
  productId: string;
  product: SaleItemProduct;
}

export interface Sale {
  id: string;
  total: string; // Serializado como string decimal
  saleDate: string;
  createdAt: string;
  userId: string;
  items: SaleItem[];
}

export interface ListSalesParams {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const salesApi = {
  // Registrar una nueva venta
  create: async (data: { items: { productId: string; quantity: number }[] }) => {
    const response = await api.post<{ success: boolean; data: Sale }>("/api/sales", data);
    return response.data.data;
  },

  // Obtener el historial de ventas paginado
  list: async (params?: ListSalesParams) => {
    const response = await api.get<{ success: boolean; data: PaginatedResult<Sale> }>("/api/sales", { params });
    return response.data.data;
  },

  // Obtener los detalles de una venta
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Sale }>(`/api/sales/${id}`);
    return response.data.data;
  },
};
