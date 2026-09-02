import { ChatRole } from "@prisma/client";
import { NotFoundError } from "../../core/errors";
import { aiRepository } from "./ai.repository";
import { SendMessageDto } from "./dtos/send-message.dto";
import { AIFactory } from "./factory/ai.factory";
import { AIOrchestrator } from "./orchestrator/ai.orchestrator";
import { ChatMessage } from "./providers/ai.provider.interface";

export class AIService {
  // Procesa el envío de un mensaje de chat, persiguiendo el historial y orquestando las herramientas de IA
  async sendMessage(userId: string, dto: SendMessageDto) {
    let sessionId = dto.sessionId;

    // a) Si no viene sessionId, crear una sesión nueva con título automático
    if (!sessionId) {
      const autoTitle = dto.message.slice(0, 40) + (dto.message.length > 40 ? "..." : "");
      const session = await aiRepository.createSession(userId, autoTitle);
      sessionId = session.id;
    } else {
      // b) Si viene sessionId, verificar existencia y pertenencia
      const existingSession = await aiRepository.findSessionById(userId, sessionId);
      if (!existingSession) {
        throw new NotFoundError("Sesión de chat");
      }
    }

    // c) Obtener el historial completo persistido de la sesión
    const sessionData = await aiRepository.findSessionById(userId, sessionId!);
    if (!sessionData) {
      throw new NotFoundError("Sesión de chat");
    }

    // Mapear el historial persistido al formato de mensajes de IA
    const history: ChatMessage[] = sessionData.messages.map((m) => ({
      role: m.role.toLowerCase() as "system" | "user" | "assistant" | "tool",
      content: m.content,
      tool_calls: m.toolCalls ? (m.toolCalls as any) : undefined,
      tool_call_id: m.toolCallId || undefined,
    }));

    // d) Agregar el nuevo mensaje del usuario al historial en memoria y persisitirlo
    history.push({ role: "user", content: dto.message });
    await aiRepository.appendMessage(sessionId!, ChatRole.USER, dto.message);

    // e) Instanciar el orquestador y ejecutar el ciclo completo
    const provider = AIFactory.create();
    const orchestrator = new AIOrchestrator(provider);
    const { finalContent, toolExecutions } = await orchestrator.run(userId, history);

    // f) Persistir los mensajes generados durante el ciclo de herramientas
    for (const exec of toolExecutions) {
      await aiRepository.appendMessage(
        sessionId!,
        ChatRole.ASSISTANT,
        "",
        [{ id: exec.toolCallId, type: "function", function: { name: exec.name, arguments: JSON.stringify(exec.args) } }],
        undefined
      );
      await aiRepository.appendMessage(
        sessionId!,
        ChatRole.TOOL,
        JSON.stringify(exec.result),
        undefined,
        exec.toolCallId
      );
    }

    // Persistir el mensaje final del asistente
    await aiRepository.appendMessage(sessionId!, ChatRole.ASSISTANT, finalContent);

    // g) Actualizar updatedAt de la sesión
    await aiRepository.touchSession(sessionId!);

    // h) Retornar respuesta simple para el cliente
    return {
      sessionId: sessionId!,
      message: {
        role: "assistant",
        content: finalContent,
      },
    };
  }

  // Lista todas las sesiones del usuario
  async listSessions(userId: string) {
    return aiRepository.listSessions(userId);
  }

  // Obtiene los mensajes de una sesión filtrando únicamente los de role USER y ASSISTANT no vacíos para el frontend
  async getSessionMessages(userId: string, sessionId: string) {
    const session = await aiRepository.findSessionById(userId, sessionId);
    if (!session) {
      throw new NotFoundError("Sesión de chat");
    }

    const filteredMessages = session.messages
      .filter((m) => {
        if (m.role === ChatRole.USER) return true;
        if (m.role === ChatRole.ASSISTANT && m.content && m.content.trim().length > 0) return true;
        return false;
      })
      .map((m) => ({
        id: m.id,
        role: m.role.toLowerCase(),
        content: m.content,
        createdAt: m.createdAt,
      }));

    return {
      sessionId: session.id,
      title: session.title,
      messages: filteredMessages,
    };
  }
}

export const aiService = new AIService();
