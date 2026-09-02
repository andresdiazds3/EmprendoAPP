import { ChatRole, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export class AIRepository {
  // Crea una nueva sesión de chat
  async createSession(userId: string, title?: string) {
    return prisma.chatSession.create({
      data: {
        userId,
        title: title || "Nueva conversación",
      },
    });
  }

  // Busca una sesión por ID perteneciendo al usuario, incluyendo sus mensajes en orden ascendente
  async findSessionById(userId: string, sessionId: string) {
    return prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  // Lista las sesiones de chat del usuario ordenadas por updatedAt desc
  async listSessions(userId: string) {
    return prisma.chatSession.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  // Agrega un mensaje a la sesión
  async appendMessage(
    sessionId: string,
    role: ChatRole,
    content: string,
    toolCalls?: any,
    toolCallId?: string
  ) {
    return prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        toolCalls: toolCalls ? (toolCalls as Prisma.InputJsonValue) : Prisma.JsonNull,
        toolCallId: toolCallId || null,
      },
    });
  }

  // Actualiza la fecha updatedAt de la sesión
  async touchSession(sessionId: string) {
    return prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
  }
}

export const aiRepository = new AIRepository();
