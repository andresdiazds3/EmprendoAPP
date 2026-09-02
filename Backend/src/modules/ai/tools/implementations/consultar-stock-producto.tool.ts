import { z } from "zod";
import { productsService } from "../../../products/products.service";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  nombreProducto: z.string().min(1, "El nombre del producto es requerido"),
});

export const consultarStockProductoToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_stock_producto",
    description: "Consulta el stock actual, precio y costo base de un producto específico buscando por su nombre. Úsala cuando el usuario pregunte por la disponibilidad o precio de un producto.",
    parameters: {
      type: "object",
      properties: {
        nombreProducto: { type: "string", description: "Nombre o palabra clave del producto a buscar" },
      },
      required: ["nombreProducto"],
    },
  },
};

export async function executeConsultarStockProducto(userId: string, args: any) {
  const parsed = schema.parse(args);
  const product = await productsService.findByName(userId, parsed.nombreProducto);
  if (!product) {
    return { encontrado: false };
  }
  return { encontrado: true, producto: product };
}
