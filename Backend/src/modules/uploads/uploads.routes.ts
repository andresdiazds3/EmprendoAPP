import { Router } from "express";
import { uploadsController } from "./uploads.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { catchAsync } from "../../shared/utils/async-handler";

const router = Router();

// Protegida con authMiddleware: solo usuarios autenticados pueden pedir firma de subida
router.use(authMiddleware as any);

router.get("/signature", catchAsync(uploadsController.getSignature));

export const uploadsRoutes = router;
