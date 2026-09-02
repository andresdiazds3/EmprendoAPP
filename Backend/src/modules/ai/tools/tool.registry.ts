import { ToolDefinition } from "../providers/ai.provider.interface";
import { consultarVentasToolDefinition, executeConsultarVentas } from "./implementations/consultar-ventas.tool";
import { consultarUtilidadToolDefinition, executeConsultarUtilidad } from "./implementations/consultar-utilidad.tool";
import { consultarStockProductoToolDefinition, executeConsultarStockProducto } from "./implementations/consultar-stock-producto.tool";
import { consultarProductosBajoStockToolDefinition, executeConsultarProductosBajoStock } from "./implementations/consultar-productos-bajo-stock.tool";
import { consultarTopProductosToolDefinition, executeConsultarTopProductos } from "./implementations/consultar-top-productos.tool";

export interface RegisteredTool {
  definition: ToolDefinition;
  execute: (userId: string, args: any) => Promise<unknown>;
}

export function getToolRegistry(): Record<string, RegisteredTool> {
  return {
    consultar_ventas: {
      definition: consultarVentasToolDefinition,
      execute: executeConsultarVentas,
    },
    consultar_utilidad: {
      definition: consultarUtilidadToolDefinition,
      execute: executeConsultarUtilidad,
    },
    consultar_stock_producto: {
      definition: consultarStockProductoToolDefinition,
      execute: executeConsultarStockProducto,
    },
    consultar_productos_bajo_stock: {
      definition: consultarProductosBajoStockToolDefinition,
      execute: (userId: string) => executeConsultarProductosBajoStock(userId),
    },
    consultar_top_productos: {
      definition: consultarTopProductosToolDefinition,
      execute: executeConsultarTopProductos,
    },
  };
}

export function getToolDefinitions(): ToolDefinition[] {
  return Object.values(getToolRegistry()).map((t) => t.definition);
}
