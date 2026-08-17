import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { CreateProductDto } from "./dtos/create-product.dto";
import { UpdateProductDto } from "./dtos/update-product.dto";
import { ListProductsDto } from "./dtos/list-products.dto";
import { getPaginationArgs } from "../../shared/utils/pagination";

export class ProductsRepository {
  // Crea un nuevo producto con stock inicial de 0
  async create(userId: string, data: CreateProductDto) {
    return prisma.product.create({
      data: {
        name: data.name,
        price: new Prisma.Decimal(data.price),
        cost: new Prisma.Decimal(data.cost),
        minStock: data.minStock,
        userId,
      },
    });
  }

  // Lista y filtra los productos de un usuario con paginación
  async findMany(userId: string, filters: ListProductsDto) {
    const { skip, take, page, pageSize } = getPaginationArgs({
      page: filters.page,
      pageSize: filters.pageSize,
    });

    let idFilter: string[] | undefined = undefined;

    // Filtro de alerta de stock bajo
    if (filters.lowStock) {
      // Usamos queryRaw seguro ya que Prisma no permite comparar columnas directamente en el where
      const lowStockIds = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM products 
        WHERE "userId" = ${userId} 
          AND "deletedAt" IS NULL 
          AND "stock" <= "minStock"
      `;
      idFilter = lowStockIds.map((p) => p.id);
    }

    const where: Prisma.ProductWhereInput = {
      userId,
      deletedAt: filters.trash ? { not: null } : null,
    };

    if (idFilter !== undefined) {
      where.id = { in: idFilter };
    }

    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // Obtiene un producto activo perteneciente al usuario
  async findById(userId: string, productId: string) {
    return prisma.product.findFirst({
      where: {
        id: productId,
        userId,
        deletedAt: null,
      },
    });
  }

  // Actualiza las propiedades editables del producto
  async update(productId: string, data: UpdateProductDto) {
    const updateData: Prisma.ProductUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
    if (data.cost !== undefined) updateData.cost = new Prisma.Decimal(data.cost);
    if (data.minStock !== undefined) updateData.minStock = data.minStock;

    return prisma.product.update({
      where: { id: productId },
      data: updateData,
    });
  }

  // Borrado lógico del producto
  async softDelete(productId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });
  }

  // Obtiene un producto perteneciente al usuario, incluso si está eliminado
  async findByIdIncludingDeleted(userId: string, productId: string) {
    return prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
    });
  }

  // Restaura un producto borrado lógicamente
  async restore(productId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: { deletedAt: null },
    });
  }
}

export const productsRepository = new ProductsRepository();
