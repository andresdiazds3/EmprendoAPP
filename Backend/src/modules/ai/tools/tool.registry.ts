import { ToolDefinition } from "../providers/ai.provider.interface";
import { consultarVentasToolDefinition, executeConsultarVentas } from "./implementations/consultar-ventas.tool";
import { consultarUtilidadToolDefinition, executeConsultarUtilidad } from "./implementations/consultar-utilidad.tool";
import { consultarStockProductoToolDefinition, executeConsultarStockProducto } from "./implementations/consultar-stock-producto.tool";
import { consultarProductosBajoStockToolDefinition, executeConsultarProductosBajoStock } from "./implementations/consultar-productos-bajo-stock.tool";
import { consultarTopProductosToolDefinition, executeConsultarTopProductos } from "./implementations/consultar-top-productos.tool";
import { consultarInfoClienteToolDefinition, executeConsultarInfoCliente } from "./implementations/consultar-info-cliente.tool";
import { listarCatalogoProductosToolDefinition, executeListarCatalogoProductos } from "./implementations/listar-catalogo-productos.tool";
import { consultarGastosToolDefinition, executeConsultarGastos } from "./implementations/consultar-gastos.tool";
import { consultarResumenGeneralToolDefinition, executeConsultarResumenGeneral } from "./implementations/consultar-resumen-general.tool";
import { consultarDetalleVentasToolDefinition, executeConsultarDetalleVentas } from "./implementations/consultar-detalle-ventas.tool";
import { buscarWebOMercadoToolDefinition, executeBuscarWebOMercado } from "./implementations/buscar-web-o-mercado.tool";
import { generarImagenPublicidadToolDefinition, executeGenerarImagenPublicidad } from "./implementations/generar-imagen-publicidad.tool";

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
    consultar_info_cliente: {
      definition: consultarInfoClienteToolDefinition,
      execute: (userId: string) => executeConsultarInfoCliente(userId),
    },
    listar_catalogo_productos: {
      definition: listarCatalogoProductosToolDefinition,
      execute: executeListarCatalogoProductos,
    },
    consultar_gastos: {
      definition: consultarGastosToolDefinition,
      execute: executeConsultarGastos,
    },
    consultar_resumen_general: {
      definition: consultarResumenGeneralToolDefinition,
      execute: executeConsultarResumenGeneral,
    },
    consultar_detalle_ventas: {
      definition: consultarDetalleVentasToolDefinition,
      execute: executeConsultarDetalleVentas,
    },
    buscar_web_o_mercado: {
      definition: buscarWebOMercadoToolDefinition,
      execute: executeBuscarWebOMercado,
    },
    generar_imagen_publicidad_o_redes: {
      definition: generarImagenPublicidadToolDefinition,
      execute: executeGenerarImagenPublicidad,
    },
  };
}

export function getToolDefinitions(): ToolDefinition[] {
  return Object.values(getToolRegistry()).map((t) => t.definition);
}
