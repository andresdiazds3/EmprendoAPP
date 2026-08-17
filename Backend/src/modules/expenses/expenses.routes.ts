import { Router } from "express";
import { expensesController } from "./expenses.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { catchAsync } from "../../shared/utils/async-handler";

const router = Router();

// Todas las rutas de gastos requieren autenticación
router.use(authMiddleware as any);

router.post("/", catchAsync(expensesController.create));
router.get("/", catchAsync(expensesController.list));
router.get("/:id", catchAsync(expensesController.getById));
router.patch("/:id", catchAsync(expensesController.update));
router.delete("/:id", catchAsync(expensesController.delete));

export const expensesRoutes = router;
