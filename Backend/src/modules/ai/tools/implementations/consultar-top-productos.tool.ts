import { z } from "zod";
import { reportsService } from "../../../reports/reports.service";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  from: z.string(),
  to: z.string(),
  limit: z.coerce.number().optional().default(5),
});

export const consultarTopProductosToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_top_productos",
    description: "Consulta los productos más vendidos en ingresos durante un periodo de tiempo. Úsala cuando el usuario pregunte por sus productos estrella, más vendidos o de mayor facturación.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Fecha inicial en formato ISO 8601 (ej. 2026-09-01T00:00:00.000Z)" },
        to: { type: "string", description: "Fecha final en formato ISO 8601 (ej. 2026-09-30T23:59:59.999Z)" },
        limit: { type: "number", description: "Límite máximo de productos a incluir (por defecto 5)" },
      },
      required: ["from", "to"],
    },
  },
};

export async function executeConsultarTopProductos(userId: string, args: any) {
  const parsed = schema.parse(args);
  return reportsService.getTopProductos(userId, {
    from: parsed.from,
    to: parsed.to,
    limit: parsed.limit,
    orderBy: "revenue",
  });
}
