import { Response } from "express";
import { salesService } from "./sales.service";
import { createSaleSchema } from "./dtos/create-sale.dto";
import { listSalesSchema } from "./dtos/list-sales.dto";
import { created, ok } from "../../shared/utils/http-response";
import { AuthenticatedRequest } from "../../core/types";

export class SalesController {
  // Registra una nueva venta
  async create(req: AuthenticatedRequest, res: Response) {
    const validatedData = createSaleSchema.parse(req.body);
    const userId = req.user!.id;
    const result = await salesService.create(userId, validatedData);
    return created(res, result, "Venta registrada exitosamente");
  }

  // Lista el historial de ventas
  async list(req: AuthenticatedRequest, res: Response) {
    const validatedQuery = listSalesSchema.parse(req.query);
    const userId = req.user!.id;
    const result = await salesService.list(userId, validatedQuery);
    return ok(res, result, "Historial de ventas obtenido exitosamente");
  }

  // Obtiene los detalles de una venta
  async getById(req: AuthenticatedRequest, res: Response) {
    const saleId = req.params.id;
    const userId = req.user!.id;
    const result = await salesService.getById(userId, saleId);
    return ok(res, result, "Venta obtenida exitosamente");
  }
}

export const salesController = new SalesController();
