import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ListSalesDto } from "./dtos/list-sales.dto";
import { getPaginationArgs } from "../../shared/utils/pagination";

export interface ValidatedSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  unitCost: Prisma.Decimal;
}

export class SalesRepository {
  // Lista las ventas filtradas por rango de fecha y paginadas
  async findMany(userId: string, filters: ListSalesDto) {
    const { skip, take, page, pageSize } = getPaginationArgs({
      page: filters.page,
      pageSize: filters.pageSize,
    });

    const where: Prisma.SaleWhereInput = {
      userId,
    };

    if (filters.from || filters.to) {
      where.saleDate = {};
      if (filters.from) {
        where.saleDate.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.saleDate.lte = new Date(filters.to);
      }
    }

    const [items, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take,
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
        orderBy: {
          saleDate: "desc",
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // Obtiene los detalles de una venta por ID
  async findById(userId: string, saleId: string) {
    return prisma.sale.findFirst({
      where: {
        id: saleId,
        userId,
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
    });
  }

  // Registra la venta, los items, los movimientos de stock y actualiza existencias en una sola transacción
  async createSaleTransaction(userId: string, validatedItems: ValidatedSaleItemInput[]) {
    // Calcular el total usando aritmética precisa de Decimal
    const total = validatedItems.reduce((sum, item) => {
      const itemTotal = new Prisma.Decimal(item.unitPrice).mul(item.quantity);
      return sum.add(itemTotal);
    }, new Prisma.Decimal(0));

    return prisma.$transaction(async (tx) => {
      // 1. Crear el registro principal de la venta y sus líneas asociadas
      const sale = await tx.sale.create({
        data: {
          userId,
          total,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Registrar movimientos de stock y decrementar existencias por cada producto vendido
      for (const saleItem of sale.items) {
        // Registrar movimiento de stock de tipo SALE
        await tx.stockMovement.create({
          data: {
            userId,
            productId: saleItem.productId,
            type: "SALE",
            quantity: -saleItem.quantity, // Cantidad negativa para salidas
            saleItemId: saleItem.id,
          },
        });

        // Decrementar el stock acumulado en la tabla de productos
        await tx.product.update({
          where: { id: saleItem.productId },
          data: {
            stock: {
              decrement: saleItem.quantity,
            },
          },
        });
      }

      // 3. Devolver la venta completa incluyendo sus productos relacionados
      return tx.sale.findUnique({
        where: { id: sale.id },
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
      });
    });
  }
}

export const salesRepository = new SalesRepository();
