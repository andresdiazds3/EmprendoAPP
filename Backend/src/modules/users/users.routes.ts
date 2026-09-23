import { Router } from "express";
import { usersController } from "./users.controller";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { catchAsync } from "../../shared/utils/async-handler";

const router = Router();

router.use(authMiddleware as any);

router.patch("/me", catchAsync(usersController.updateProfile));

export const usersRoutes = router;
