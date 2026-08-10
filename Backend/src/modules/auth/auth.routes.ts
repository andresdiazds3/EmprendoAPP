import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { passwordResetRateLimiter } from "../../core/middlewares/rate-limiter.middleware";
import { catchAsync } from "../../shared/utils/async-handler";

const router = Router();

router.post("/register", catchAsync(authController.register));
router.post("/login", catchAsync(authController.login));

// Rutas de recuperación de contraseña (con rate limiting específico)
router.post("/forgot-password", passwordResetRateLimiter, catchAsync(authController.forgotPassword));
router.post("/reset-password", passwordResetRateLimiter, catchAsync(authController.resetPassword));

// Rutas protegidas
router.post("/logout", authMiddleware as any, catchAsync(authController.logout));
router.get("/me", authMiddleware as any, catchAsync(authController.me));

export const authRoutes = router;
