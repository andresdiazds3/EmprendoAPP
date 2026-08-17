import { Router } from "express";
import { inventoryController } from "./inventory.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { catchAsync } from "../../shared/utils/async-handler";

const router = Router();

// Todas las rutas de inventario requieren autenticación
router.use(authMiddleware as any);

router.post("/movements", catchAsync(inventoryController.registerMovement));
router.get("/products/:productId/movements", catchAsync(inventoryController.listByProduct));
router.get("/low-stock", catchAsync(inventoryController.lowStockAlerts));

export const inventoryRoutes = router;
