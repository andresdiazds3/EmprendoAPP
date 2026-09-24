import { z } from "zod";
import { reportsService } from "../../../reports/reports.service";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().optional().default(5),
  orderBy: z.enum(["revenue", "quantity"]).optional().default("revenue"),
});

export const consultarTopProductosToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_top_productos",
    description: "Consulta los productos más vendidos en ingresos o cantidad durante un periodo de tiempo (por defecto el mes actual). Úsala cuando el usuario pregunte por sus productos estrella o más vendidos.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Fecha inicial en formato ISO 8601 (opcional, por defecto inicio de mes actual)" },
        to: { type: "string", description: "Fecha final en formato ISO 8601 (opcional, por defecto ahora)" },
        limit: { type: "number", description: "Límite máximo de productos a incluir (por defecto 5)" },
        orderBy: { type: "string", enum: ["revenue", "quantity"], description: "Ordenar por facturación (revenue) o unidades (quantity)" },
      },
      required: [],
    },
  },
};

export async function executeConsultarTopProductos(userId: string, args: any) {
  const parsed = schema.parse(args || {});
  const now = new Date();
  const from = parsed.from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = parsed.to || now.toISOString();

  return reportsService.getTopProductos(userId, {
    from,
    to,
    limit: parsed.limit,
    orderBy: parsed.orderBy,
  });
}
