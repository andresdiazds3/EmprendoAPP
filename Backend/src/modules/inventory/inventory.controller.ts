import { Response } from "express";
import { inventoryService } from "./inventory.service";
import { createMovementSchema } from "./dtos/create-movement.dto";
import { listMovementsSchema } from "./dtos/list-movements.dto";
import { created, ok } from "../../shared/utils/http-response";
import { AuthenticatedRequest } from "../../core/types";

export class InventoryController {
  // Registra un movimiento de inventario
  async registerMovement(req: AuthenticatedRequest, res: Response) {
    const validatedData = createMovementSchema.parse(req.body);
    const userId = req.user!.id;
    const result = await inventoryService.registerMovement(userId, validatedData);
    return created(res, result, "Movimiento de inventario registrado exitosamente");
  }

  // Lista los movimientos de un producto paginados
  async listByProduct(req: AuthenticatedRequest, res: Response) {
    const productId = req.params.productId;
    const validatedQuery = listMovementsSchema.parse(req.query);
    const userId = req.user!.id;
    const result = await inventoryService.listByProduct(userId, productId, validatedQuery);
    return ok(res, result, "Movimientos del producto obtenidos exitosamente");
  }

  // Obtiene los productos con stock bajo o igual al mínimo
  async lowStockAlerts(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id;
    const result = await inventoryService.lowStockAlerts(userId);
    return ok(res, result, "Alertas de stock bajo obtenidas exitosamente");
  }
}

export const inventoryController = new InventoryController();
