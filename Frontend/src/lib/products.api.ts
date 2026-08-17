import { api } from "./api";

export interface Product {
  id: string;
  name: string;
  price: string; // El backend devuelve Decimal serializado como string
  cost: string;  // El backend devuelve Decimal serializado como string
  stock: number;
  minStock: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ListProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  lowStock?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const productsApi = {
  // Crear un producto
  create: async (data: { name: string; price: number; cost: number; minStock: number }) => {
    const response = await api.post<{ success: boolean; data: Product }>("/api/products", data);
    return response.data.data;
  },

  // Obtener la lista paginada de productos
  list: async (params?: ListProductsParams) => {
    const response = await api.get<{ success: boolean; data: PaginatedResult<Product> }>("/api/products", { params });
    return response.data.data;
  },

  // Obtener un producto por ID
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Product }>(`/api/products/${id}`);
    return response.data.data;
  },

  // Actualizar un producto por ID
  update: async (id: string, data: { name?: string; price?: number; cost?: number; minStock?: number }) => {
    const response = await api.patch<{ success: boolean; data: Product }>(`/api/products/${id}`, data);
    return response.data.data;
  },

  // Borrado lógico de un producto
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/api/products/${id}`);
    return response.data;
  },
};
