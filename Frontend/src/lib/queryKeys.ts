export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (params?: object) => ["products", "list", params || {}] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    lowStock: ["products", "low-stock"] as const,
  },
  sales: {
    all: ["sales"] as const,
    list: (params?: object) => ["sales", "list", params || {}] as const,
    detail: (id: string) => ["sales", "detail", id] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (params?: object) => ["expenses", "list", params || {}] as const,
    detail: (id: string) => ["expenses", "detail", id] as const,
  },
  reports: {
    all: ["reports"] as const,
    utilidad: (params?: object) => ["reports", "utilidad", params || {}] as const,
    comparativo: (params?: object) => ["reports", "comparativo", params || {}] as const,
    topProductos: (params?: object) => ["reports", "top-productos", params || {}] as const,
    ventasPorPeriodo: (params?: object) => ["reports", "ventas-por-periodo", params || {}] as const,
    gastosPorPeriodo: (params?: object) => ["reports", "gastos-por-periodo", params || {}] as const,
  },
  inventory: {
    all: ["inventory"] as const,
    movements: (productId: string, params?: object) => ["inventory", "movements", productId, params || {}] as const,
  },
};
