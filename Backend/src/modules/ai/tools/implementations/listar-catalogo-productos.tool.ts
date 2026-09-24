import { z } from "zod";
import { prisma } from "../../../../config/prisma";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  search: z.string().optional(),
  soloBajoStock: z.boolean().optional().default(false),
  limit: z.coerce.number().optional().default(50),
});

export const listarCatalogoProductosToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "listar_catalogo_productos",
    description: "Consulta el catálogo completo de productos del negocio del cliente, incluyendo precios, costos de producción/compra, márgenes de ganancia, stock actual, stock mínimo y alertas. Permite filtrar por nombre o mostrar solo productos agotándose.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: "Texto para buscar productos por nombre (opcional)" },
        soloBajoStock: { type: "boolean", description: "Si es true, lista únicamente productos cuyo stock actual sea menor o igual al mínimo (opcional)" },
        limit: { type: "number", description: "Límite de productos a retornar (por defecto 50)" },
      },
      required: [],
    },
  },
};

export async function executeListarCatalogoProductos(userId: string, args: any) {
  const parsed = schema.parse(args || {});

  const products = await prisma.product.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(parsed.search
        ? {
            name: {
              contains: parsed.search,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: parsed.limit,
  });

  const formattedProducts = products
    .map((p) => {
      const price = Number(p.price);
      const cost = Number(p.cost);
      const margin = price - cost;
      const marginPercentage = price > 0 ? ((margin / price) * 100).toFixed(1) + "%" : "0%";
      const isLowStock = p.stock <= p.minStock;

      return {
        id: p.id,
        nombre: p.name,
        precioVenta: price,
        costoBase: cost,
        gananciaPorUnidad: margin,
        margenPorcentaje: marginPercentage,
        stockActual: p.stock,
        stockMinimo: p.minStock,
        bajoStockAlerta: isLowStock,
        tieneImagen: !!p.imageUrl,
      };
    })
    .filter((p) => (parsed.soloBajoStock ? p.bajoStockAlerta : true));

  return {
    totalEncontrados: formattedProducts.length,
    productos: formattedProducts,
  };
}
