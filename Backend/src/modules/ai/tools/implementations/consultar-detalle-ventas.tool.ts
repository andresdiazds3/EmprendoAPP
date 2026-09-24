import { z } from "zod";
import { prisma } from "../../../../config/prisma";
import { ToolDefinition } from "../../providers/ai.provider.interface";

const schema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().optional().default(15),
});

export const consultarDetalleVentasToolDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "consultar_detalle_ventas",
    description: "Consulta las ventas recientes del emprendedor con el desglose detallado de cada producto vendido (cantidades, precios cobrados, costos y subtotales por producto).",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Fecha inicial en formato ISO 8601 (opcional)" },
        to: { type: "string", description: "Fecha final en formato ISO 8601 (opcional)" },
        limit: { type: "number", description: "Número de ventas a consultar (por defecto 15)" },
      },
      required: [],
    },
  },
};

export async function executeConsultarDetalleVentas(userId: string, args: any) {
  const parsed = schema.parse(args || {});

  const now = new Date();
  const fromDate = parsed.from ? new Date(parsed.from) : undefined;
  const toDate = parsed.to ? new Date(parsed.to) : undefined;

  const sales = await prisma.sale.findMany({
    where: {
      userId,
      ...(fromDate || toDate
        ? {
            saleDate: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { saleDate: "desc" },
    take: parsed.limit,
  });

  return {
    totalVentasObtenidas: sales.length,
    ventas: sales.map((s) => ({
      id: s.id,
      totalVenta: Number(s.total),
      fecha: s.saleDate.toISOString(),
      productosVendidos: s.items.map((item) => ({
        producto: item.product?.name || "Producto sin nombre",
        cantidad: item.quantity,
        precioUnitario: Number(item.unitPrice),
        costoUnitario: Number(item.unitCost),
        subtotal: Number(item.unitPrice) * item.quantity,
        gananciaBrutaLinea: (Number(item.unitPrice) - Number(item.unitCost)) * item.quantity,
      })),
    })),
  };
}
