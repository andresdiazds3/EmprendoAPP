import { z } from "zod";
import { reportsService } from "../../../reports/reports.service";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  from: z.string(),
  to: z.string(),
});

export const consultarUtilidadToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_utilidad",
    description: "Consulta el resumen consolidado de utilidades (ingresos, gastos operativos y utilidad neta) en un rango de fechas. Úsala cuando el usuario pregunte cuánto ganó, su ganancia neta o rentabilidad.",
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

export async function executeConsultarUtilidad(userId: string, args: any) {
  const parsed = schema.parse(args);
  return reportsService.getUtilidad(userId, { from: parsed.from, to: parsed.to });
}
