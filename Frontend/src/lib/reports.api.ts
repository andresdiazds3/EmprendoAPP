import { api } from "./api";
import { Buffer } from "buffer";

const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface UtilidadReport {
  ingresos: number;
  margenBrutoReferencial?: number;
  costoVenta: number;
  gastos: number;
  utilidad: number;
  from: string;
  to: string;
}

export interface PeriodReportItem {
  period: string;
  total: number;
}

export interface TopProductItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface ComparativoItem {
  period: string;
  ventas: number;
  gastos: number;
  utilidad: number;
}

export const reportsApi = {
  // Obtiene ingresos, costos, gastos y utilidad
  getUtilidad: async (params: { from: string; to: string }) => {
    const response = await api.get<{ success: boolean; data: UtilidadReport }>("/api/reports/utilidad", { params });
    return response.data.data;
  },

  // Obtiene ventas por periodo
  getVentasPorPeriodo: async (params: { from: string; to: string; groupBy?: "day" | "month" | "year" }) => {
    const response = await api.get<{ success: boolean; data: PeriodReportItem[] }>("/api/reports/ventas-por-periodo", { params });
    return response.data.data;
  },

  // Obtiene gastos por periodo
  getGastosPorPeriodo: async (params: { from: string; to: string; groupBy?: "day" | "month" | "year" }) => {
    const response = await api.get<{ success: boolean; data: PeriodReportItem[] }>("/api/reports/gastos-por-periodo", { params });
    return response.data.data;
  },

  // Obtiene el top de productos más vendidos
  getTopProductos: async (params: { from: string; to: string; limit?: number; orderBy?: "quantity" | "revenue" }) => {
    const response = await api.get<{ success: boolean; data: TopProductItem[] }>("/api/reports/top-productos", { params });
    return response.data.data;
  },

  // Obtiene la serie unificada de ventas vs gastos
  getComparativo: async (params: { from: string; to: string; groupBy?: "day" | "month" | "year" }) => {
    const response = await api.get<{ success: boolean; data: ComparativoItem[] }>("/api/reports/comparativo", { params });
    return response.data.data;
  },

  // Descarga nativa del reporte de Excel convirtiendo arraybuffer a base64
  exportReport: async (from: string, to: string): Promise<string> => {
    const response = await api.get("/api/reports/export", {
      params: { from, to },
      responseType: "arraybuffer",
      transformResponse: [(data) => data],
    });

    const base64 = Buffer.from(response.data, "binary").toString("base64");
    return base64;
  },
};
