import { salesRepository } from "./sales.repository";
import { productsRepository } from "../products/products.repository";
import { CreateSaleDto } from "./dtos/create-sale.dto";
import { ListSalesDto } from "./dtos/list-sales.dto";
import { NotFoundError, ConflictError } from "../../core/errors";
import { buildPaginatedResult } from "../../shared/utils/pagination";

export class SalesService {
  // Registra una nueva venta
  async create(userId: string, dto: CreateSaleDto) {
    const productsMap = new Map();
    
    // 1. Validar la existencia de todos los productos y que pertenezcan al usuario
    for (const item of dto.items) {
      const product = await productsRepository.findById(userId, item.productId);
      if (!product) {
        throw new NotFoundError(`Producto con ID ${item.productId} no encontrado`);
      }
      productsMap.set(item.productId, product);
    }

    // 2. REGLA CLAVE: Validar que todos los productos tengan suficiente stock
    const insufficientStockErrors: string[] = [];
    for (const item of dto.items) {
      const product = productsMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        insufficientStockErrors.push(
          `${product.name} (disponible: ${product.stock}, solicitado: ${item.quantity})`
        );
      }
    }

    if (insufficientStockErrors.length > 0) {
      throw new ConflictError(
        `Stock insuficiente para: ${insufficientStockErrors.join(", ")}`
      );
    }

    // 3. Congelar precios y costos unitarios actuales en la línea de venta
    const validatedItems = dto.items.map((item) => {
      const product = productsMap.get(item.productId)!;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        unitCost: product.cost,
      };
    });

    // 4. Ejecutar la transacción en la base de datos
    return salesRepository.createSaleTransaction(userId, validatedItems);
  }

  // Lista el historial de ventas paginado
  async list(userId: string, query: ListSalesDto) {
    const { items, total, page, pageSize } = await salesRepository.findMany(userId, query);
    return buildPaginatedResult(items, total, page, pageSize);
  }

  // Obtiene los detalles de una venta
  async getById(userId: string, saleId: string) {
    const sale = await salesRepository.findById(userId, saleId);
    if (!sale) {
      throw new NotFoundError("Venta");
    }
    return sale;
  }
}

export const salesService = new SalesService();
