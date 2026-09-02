import { z } from "zod";
import { reportsService } from "../../../reports/reports.service";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  from: z.string(),
  to: z.string(),
});

export const consultarVentasToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_ventas",
    description: "Consulta el total de ventas del negocio en un rango de fechas. Úsala cuando el usuario pregunte cuánto vendió, en qué periodo o quiera un resumen de ventas.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Fecha inicial en formato ISO 8601 (ej. 2026-09-01T00:00:00.000Z)" },
        to: { type: "string", description: "Fecha final en formato ISO 8601 (ej. 2026-09-30T23:59:59.999Z)" },
      },
      required: ["from", "to"],
    },
  },
};

export async function executeConsultarVentas(userId: string, args: any) {
  const parsed = schema.parse(args);
  return reportsService.getVentasPorPeriodo(userId, { from: parsed.from, to: parsed.to, groupBy: "day" });
}
