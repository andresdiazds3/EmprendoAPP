import { z } from "zod";
import { reportsService } from "../../../reports/reports.service";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const consultarUtilidadToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_utilidad",
    description: "Consulta el resumen consolidado de utilidades (ingresos por ventas, gastos operativos, costo referencial y utilidad neta final) en un rango de fechas (por defecto el mes actual). Úsala cuando el usuario pregunte cuánto ganó o su rentabilidad.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Fecha inicial en formato ISO 8601 (opcional, por defecto inicio de mes actual)" },
        to: { type: "string", description: "Fecha final en formato ISO 8601 (opcional, por defecto ahora)" },
      },
      required: [],
    },
  },
};

export async function executeConsultarUtilidad(userId: string, args: any) {
  const parsed = schema.parse(args || {});
  const now = new Date();
  const from = parsed.from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = parsed.to || now.toISOString();

  return reportsService.getUtilidad(userId, { from, to });
}
