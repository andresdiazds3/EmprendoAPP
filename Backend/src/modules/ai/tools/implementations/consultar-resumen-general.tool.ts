import { z } from "zod";
import { prisma } from "../../../../config/prisma";
import { reportsService } from "../../../reports/reports.service";
import { inventoryService } from "../../../inventory/inventory.service";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const consultarResumenGeneralToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_resumen_general",
    description: "Consulta el resumen general y tablero de control del negocio del cliente (ventas totales, gastos operativos, utilidad neta, productos activos, alertas de stock bajo y totales de transacciones) en un rango de fechas o el mes actual.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Fecha inicial en formato ISO 8601 (opcional, por defecto inicio del mes actual)" },
        to: { type: "string", description: "Fecha final en formato ISO 8601 (opcional, por defecto fecha y hora actual)" },
      },
      required: [],
    },
  },
};

export async function executeConsultarResumenGeneral(userId: string, args: any) {
  const parsed = schema.parse(args || {});

  const now = new Date();
  const from = parsed.from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = parsed.to || now.toISOString();

  const [utilidadData, lowStockItems, totalProducts, salesCount, expensesCount] = await Promise.all([
    reportsService.getUtilidad(userId, { from, to }),
    inventoryService.lowStockAlerts(userId),
    prisma.product.count({ where: { userId, deletedAt: null } }),
    prisma.sale.count({
      where: {
        userId,
        saleDate: { gte: new Date(from), lte: new Date(to) },
      },
    }),
    prisma.expense.count({
      where: {
        userId,
        expenseDate: { gte: new Date(from), lte: new Date(to) },
      },
    }),
  ]);

  return {
    periodo: { from, to },
    financiero: {
      ingresosTotales: utilidadData.ingresos,
      gastosOperativos: utilidadData.gastos,
      costoVentasReferencial: utilidadData.costoVenta,
      utilidadNeta: utilidadData.utilidad,
    },
    operativo: {
      totalProductosActivos: totalProducts,
      productosConBajoStock: lowStockItems.length,
      alertasBajoStock: lowStockItems.map((p) => ({
        nombre: p.name,
        stock: p.stock,
        minStock: p.minStock,
      })),
      totalVentasEnPeriodo: salesCount,
      totalGastosEnPeriodo: expensesCount,
    },
  };
}
