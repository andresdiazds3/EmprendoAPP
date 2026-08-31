import { Response } from "express";
import { AuthenticatedRequest } from "../../core/types";
import { reportsService } from "./reports.service";
import { reportQuerySchema } from "./dtos/report-query.dto";
import { periodQuerySchema } from "./dtos/period-query.dto";
import { topProductsQuerySchema } from "./dtos/top-products-query.dto";
import { ok } from "../../shared/utils/http-response";

export class ReportsController {
  // Obtiene ingresos, costo de venta, gastos y utilidad
  async utilidad(req: AuthenticatedRequest, res: Response) {
    const query = reportQuerySchema.parse(req.query);
    const result = await reportsService.getUtilidad(req.user!.id, query);
    return ok(res, result, "Reporte de utilidad obtenido exitosamente");
  }

  // Obtiene ventas por periodo (agrupado)
  async ventasPorPeriodo(req: AuthenticatedRequest, res: Response) {
    const query = periodQuerySchema.parse(req.query);
    const result = await reportsService.getVentasPorPeriodo(req.user!.id, query);
    return ok(res, result, "Reporte de ventas por periodo obtenido exitosamente");
  }

  // Obtiene gastos por periodo (agrupado)
  async gastosPorPeriodo(req: AuthenticatedRequest, res: Response) {
    const query = periodQuerySchema.parse(req.query);
    const result = await reportsService.getGastosPorPeriodo(req.user!.id, query);
    return ok(res, result, "Reporte de gastos por periodo obtenido exitosamente");
  }

  // Obtiene productos top más vendidos
  async topProductos(req: AuthenticatedRequest, res: Response) {
    const query = topProductsQuerySchema.parse(req.query);
    const result = await reportsService.getTopProductos(req.user!.id, query);
    return ok(res, result, "Reporte de productos más vendidos obtenido exitosamente");
  }

  // Obtiene comparativo consolidado de ventas vs gastos
  async comparativo(req: AuthenticatedRequest, res: Response) {
    const query = periodQuerySchema.parse(req.query);
    const result = await reportsService.getComparativo(req.user!.id, query);
    return ok(res, result, "Reporte comparativo obtenido exitosamente");
  }

  // Exporta reporte a archivo Excel (.xlsx)
  async exportExcel(req: AuthenticatedRequest, res: Response) {
    const query = reportQuerySchema.parse(req.query);
    const buffer = await reportsService.exportToExcel(req.user!.id, query);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte-emprendo-${query.from}-a-${query.to}.xlsx"`
    );
    return res.send(buffer);
  }
}

export const reportsController = new ReportsController();
