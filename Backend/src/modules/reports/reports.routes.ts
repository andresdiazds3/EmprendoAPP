import { Router } from "express";
import { reportsController } from "./reports.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { catchAsync } from "../../shared/utils/async-handler";

const router = Router();

// Todas las rutas de reportes requieren autenticación
router.use(authMiddleware as any);

router.get("/utilidad", catchAsync(reportsController.utilidad));
router.get("/ventas-por-periodo", catchAsync(reportsController.ventasPorPeriodo));
router.get("/gastos-por-periodo", catchAsync(reportsController.gastosPorPeriodo));
router.get("/top-productos", catchAsync(reportsController.topProductos));
router.get("/comparativo", catchAsync(reportsController.comparativo));
router.get("/export", catchAsync(reportsController.exportExcel));

export const reportsRoutes = router;
