import { api } from "./api";

export interface Expense {
  id: string;
  concept: string;
  amount: string; // Serializado como string decimal
  expenseDate: string;
  createdAt: string;
  userId: string;
}

export interface ListExpensesParams {
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

export const expensesApi = {
  // Registrar un nuevo gasto
  create: async (data: { concept: string; amount: number; expenseDate?: string }) => {
    const response = await api.post<{ success: boolean; data: Expense }>("/api/expenses", data);
    return response.data.data;
  },

  // Obtener el listado paginado de gastos
  list: async (params?: ListExpensesParams) => {
    const response = await api.get<{ success: boolean; data: PaginatedResult<Expense> }>("/api/expenses", { params });
    return response.data.data;
  },

  // Obtener un gasto por ID
  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Expense }>(`/api/expenses/${id}`);
    return response.data.data;
  },

  // Actualizar un gasto por ID
  update: async (id: string, data: { concept?: string; amount?: number; expenseDate?: string }) => {
    const response = await api.patch<{ success: boolean; data: Expense }>(`/api/expenses/${id}`, data);
    return response.data.data;
  },

  // Eliminar físicamente un gasto
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/api/expenses/${id}`);
    return response.data;
  },
};
