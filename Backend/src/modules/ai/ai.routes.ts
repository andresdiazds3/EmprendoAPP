import { Router } from "express";
import { authMiddleware } from "../../core/middlewares/auth.middleware";
import { aiController } from "./ai.controller";

const router = Router();

router.use(authMiddleware);

router.post("/chat", (req, res, next) => aiController.sendMessage(req, res).catch(next));
router.get("/sessions", (req, res, next) => aiController.listSessions(req, res).catch(next));
router.get("/sessions/:id/messages", (req, res, next) => aiController.getSessionMessages(req, res).catch(next));

export const aiRoutes = router;
