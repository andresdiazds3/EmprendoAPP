import { inventoryService } from "../../../inventory/inventory.service";
import { ToolDefinition } from "../../providers/ai.provider.interface";

export const consultarProductosBajoStockToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_productos_bajo_stock",
    description: "Consulta los productos cuyo stock actual es menor o igual a su stock mínimo configurado. Úsala cuando el usuario pregunte qué productos se están agotando o necesitan reabastecimiento.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
};

export async function executeConsultarProductosBajoStock(userId: string) {
  return inventoryService.lowStockAlerts(userId);
}
