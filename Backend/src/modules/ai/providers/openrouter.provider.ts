import OpenAI from "openai";
import { env } from "../../../config/env";
import { AppError } from "../../../core/errors";
import { AIProvider, AIProviderResponse, ChatMessage, ToolDefinition } from "./ai.provider.interface";

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: env.OPENROUTER_API_KEY,
    });
  }

  async chat(messages: ChatMessage[], tools: ToolDefinition[]): Promise<AIProviderResponse> {
    const modelsList = env.OPENROUTER_MODELS.split(",").map((m) => m.trim());
    const primaryModel = modelsList[0] || "openai/gpt-oss-20b:free";
    const fallbackModels = modelsList.slice(1);

    try {
      // OpenRouter soporta el campo 'models' para fallback automático en su API.
      // Se utiliza casting 'as any' en la request dado que 'models' es una propiedad extendida de OpenRouter fuera del esquema de OpenAI.
      const requestPayload: any = {
        model: primaryModel,
        messages: messages.map((m) => {
          const msg: any = {
            role: m.role,
            content: m.content,
          };
          if (m.tool_calls) {
            msg.tool_calls = m.tool_calls;
          }
          if (m.tool_call_id) {
            msg.tool_call_id = m.tool_call_id;
          }
          return msg;
        }),
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? "auto" : undefined,
      };

      if (fallbackModels.length > 0) {
        requestPayload.models = fallbackModels;
      }

      const completion = await this.client.chat.completions.create(requestPayload);
      const choice = completion.choices[0];

      if (!choice || !choice.message) {
        throw new Error("Respuesta vacía recibida del servidor OpenRouter");
      }

      const content = choice.message.content || null;
      const rawToolCalls = choice.message.tool_calls;

      let toolCalls = null;
      if (rawToolCalls && rawToolCalls.length > 0) {
        toolCalls = rawToolCalls.map((tc: any) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        }));
      }

      return { content, toolCalls };
    } catch (error: any) {
      console.error("OpenRouterProvider Error:", error);
      throw new AppError(
        "El asistente de IA no está disponible en este momento, intenta de nuevo en unos minutos.",
        500
      );
    }
  }
}
