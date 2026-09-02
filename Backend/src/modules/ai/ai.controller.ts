import { Response } from "express";
import { AuthenticatedRequest } from "../../core/types";
import { ok } from "../../shared/utils/http-response";
import { aiService } from "./ai.service";
import { sendMessageSchema } from "./dtos/send-message.dto";

export class AIController {
  // POST /api/ai/chat
  async sendMessage(req: AuthenticatedRequest, res: Response) {
    const dto = sendMessageSchema.parse(req.body);
    const userId = req.user!.id;
    const result = await aiService.sendMessage(userId, dto);
    return ok(res, result, "Mensaje procesado correctamente");
  }

  // GET /api/ai/sessions
  async listSessions(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id;
    const sessions = await aiService.listSessions(userId);
    return ok(res, sessions, "Sesiones obtenidas correctamente");
  }

  // GET /api/ai/sessions/:id/messages
  async getSessionMessages(req: AuthenticatedRequest, res: Response) {
    const sessionId = req.params.id;
    const userId = req.user!.id;
    const result = await aiService.getSessionMessages(userId, sessionId);
    return ok(res, result, "Mensajes de la sesión obtenidos correctamente");
  }
}

export const aiController = new AIController();
