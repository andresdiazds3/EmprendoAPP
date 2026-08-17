import { prisma } from "../../config/prisma";
import { StockMovementType, Product } from "@prisma/client";
import { getPaginationArgs } from "../../shared/utils/pagination";

export class InventoryRepository {
  // Crea el movimiento de inventario e incrementa/decrementa el stock en una sola transacción
  async createMovementAndUpdateStock(
    userId: string,
    productId: string,
    type: StockMovementType,
    quantity: number,
    reason?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Crear el movimiento de stock
      const movement = await tx.stockMovement.create({
        data: {
          userId,
          productId,
          type,
          quantity,
          reason,
        },
      });

      // 2. Incrementar el stock del producto
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            increment: quantity,
          },
        },
      });

      return movement;
    });
  }

  // Lista los movimientos de inventario de un producto específico, paginados
  async findByProduct(
    userId: string,
    productId: string,
    pagination: { page?: number; pageSize?: number }
  ) {
    const { skip, take, page, pageSize } = getPaginationArgs({
      page: pagination.page,
      pageSize: pagination.pageSize,
    });

    const where = {
      productId,
      userId,
    };

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // Busca los productos del usuario con stock menor o igual al mínimo
  async findLowStockProducts(userId: string): Promise<Product[]> {
    // Usamos queryRaw para comparar la columna stock contra la columna minStock
    return prisma.$queryRaw<Product[]>`
      SELECT * FROM products 
      WHERE "userId" = ${userId} 
        AND "deletedAt" IS NULL 
        AND "stock" <= "minStock"
      ORDER BY "name" ASC
    `;
  }
}

export const inventoryRepository = new InventoryRepository();
