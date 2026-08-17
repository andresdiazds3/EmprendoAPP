import { Router } from "express";
import { productsController } from "./products.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { catchAsync } from "../../shared/utils/async-handler";

const router = Router();

// Todas las rutas de productos requieren autenticación
router.use(authMiddleware as any);

router.post("/", catchAsync(productsController.create));
router.get("/", catchAsync(productsController.list));
router.get("/:id", catchAsync(productsController.getById));
router.patch("/:id", catchAsync(productsController.update));
router.delete("/:id", catchAsync(productsController.delete));

export const productsRoutes = router;
