import { api } from "./api";

export interface ChatMessageItem {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendChatMessageResponse {
  sessionId: string;
  message: {
    role: "assistant";
    content: string;
  };
}

export interface SessionMessagesResponse {
  sessionId: string;
  title: string;
  messages: ChatMessageItem[];
}

export const aiApi = {
  // Enviar mensaje al asistente de IA
  sendChatMessage: async (sessionId: string | undefined, message: string) => {
    const response = await api.post<{ success: boolean; data: SendChatMessageResponse }>(
      "/api/ai/chat",
      { sessionId: sessionId || undefined, message },
      { timeout: 45000 } // Timeout extendido de 45 segundos para ciclo de herramientas de IA
    );
    return response.data.data;
  },

  // Listar sesiones de chat anteriores
  listChatSessions: async () => {
    const response = await api.get<{ success: boolean; data: ChatSessionItem[] }>("/api/ai/sessions");
    return response.data.data;
  },

  // Obtener mensajes de una sesión específica
  getSessionMessages: async (sessionId: string) => {
    const response = await api.get<{ success: boolean; data: SessionMessagesResponse }>(
      `/api/ai/sessions/${sessionId}/messages`
    );
    return response.data.data;
  },
};
