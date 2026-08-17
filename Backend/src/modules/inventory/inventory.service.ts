import { inventoryRepository } from "./inventory.repository";
import { productsRepository } from "../products/products.repository";
import { CreateMovementDto } from "./dtos/create-movement.dto";
import { ListMovementsDto } from "./dtos/list-movements.dto";
import { NotFoundError, ConflictError } from "../../core/errors";
import { buildPaginatedResult } from "../../shared/utils/pagination";

export class InventoryService {
  // Registra un movimiento de stock y actualiza el balance de inventario
  async registerMovement(userId: string, dto: CreateMovementDto) {
    // 1. Validar que el producto exista, pertenezca al usuario y no esté eliminado
    const product = await productsRepository.findById(userId, dto.productId);
    if (!product) {
      throw new NotFoundError("Producto");
    }

    // 2. Si es un ajuste de salida (negativo), validar que no deje el stock en negativo
    if (dto.type === "ADJUSTMENT" && dto.quantity < 0) {
      const prospectiveStock = product.stock + dto.quantity;
      if (prospectiveStock < 0) {
        throw new ConflictError("El ajuste dejaría el stock en negativo");
      }
    }

    // 3. Registrar el movimiento en la transacción
    return inventoryRepository.createMovementAndUpdateStock(
      userId,
      dto.productId,
      dto.type,
      dto.quantity,
      dto.reason
    );
  }

  // Lista el historial de movimientos de un producto con paginación
  async listByProduct(userId: string, productId: string, query: ListMovementsDto) {
    // Validar que el producto pertenezca al usuario
    const product = await productsRepository.findById(userId, productId);
    if (!product) {
      throw new NotFoundError("Producto");
    }

    const { items, total, page, pageSize } = await inventoryRepository.findByProduct(
      userId,
      productId,
      query
    );

    return buildPaginatedResult(items, total, page, pageSize);
  }

  // Obtiene los productos con alertas de stock bajo
  async lowStockAlerts(userId: string) {
    return inventoryRepository.findLowStockProducts(userId);
  }
}

export const inventoryService = new InventoryService();
