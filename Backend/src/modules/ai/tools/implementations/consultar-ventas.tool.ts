import { z } from "zod";
import { reportsService } from "../../../reports/reports.service";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  groupBy: z.enum(["day", "month", "year"]).optional().default("day"),
});

export const consultarVentasToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_ventas",
    description: "Consulta las ventas del negocio agrupadas por periodo y el total vendido en un rango de fechas (por defecto el mes actual). Úsala cuando el usuario pregunte cuánto vendió o el histórico de ventas.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Fecha inicial en formato ISO 8601 (opcional, por defecto inicio de mes actual)" },
        to: { type: "string", description: "Fecha final en formato ISO 8601 (opcional, por defecto ahora)" },
        groupBy: { type: "string", enum: ["day", "month", "year"], description: "Agrupación temporal (day, month, year)" },
      },
      required: [],
    },
  },
};

export async function executeConsultarVentas(userId: string, args: any) {
  const parsed = schema.parse(args || {});
  const now = new Date();
  const from = parsed.from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = parsed.to || now.toISOString();

  const ventasPeriodo = await reportsService.getVentasPorPeriodo(userId, {
    from,
    to,
    groupBy: parsed.groupBy,
  });

  const totalVentas = ventasPeriodo.reduce((acc, curr) => acc + curr.total, 0);

  return {
    periodo: { from, to },
    totalVendido: totalVentas,
    ventasPorPeriodo: ventasPeriodo.map((v) => ({
      periodo: v.period.toISOString().split("T")[0],
      total: v.total,
    })),
  };
}
