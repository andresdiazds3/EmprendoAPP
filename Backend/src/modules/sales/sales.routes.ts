import { Router } from "express";
import { salesController } from "./sales.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { catchAsync } from "../../shared/utils/async-handler";

const router = Router();

// Todas las rutas de ventas requieren autenticación
router.use(authMiddleware as any);

router.post("/", catchAsync(salesController.create));
router.get("/", catchAsync(salesController.list));
router.get("/:id", catchAsync(salesController.getById));

export const salesRoutes = router;
