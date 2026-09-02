import { env } from "../../../config/env";
import { AIProvider, ChatMessage } from "../providers/ai.provider.interface";
import { getToolDefinitions, getToolRegistry } from "../tools/tool.registry";

const SYSTEM_PROMPT_CONTENT = `Eres el asistente financiero y operativo inteligente de "Emprendo", un sistema de gestión para negocios.
Tu función principal es ayudar al usuario a entender sus finanzas, inventarios, productos, ventas, gastos y utilidades.

Instrucciones estrictas:
1. Responde siempre en español de forma breve, concisa y directa. No divagues ni des explicaciones innecesariamente largas.
2. Utiliza las herramientas (tools) disponibles para consultar datos reales del negocio antes de responder sobre cifras, productos, ventas o inventarios. NUNCA inventes números ni datos.
3. Si la consulta del usuario NO tiene relación con la gestión de su negocio (ejemplo: preguntas de cultura general, chistes, programación fuera del contexto de Emprendo, etc.), indícalo amablemente de forma breve y redirige la conversación a la administración de su emprendimiento.`;

export class AIOrchestrator {
  constructor(private provider: AIProvider) {}

  async run(
    userId: string,
    conversationHistory: ChatMessage[]
  ): Promise<{
    finalContent: string;
    toolExecutions: Array<{ toolCallId: string; name: string; args: any; result: unknown }>;
  }> {
    const tools = getToolDefinitions();
    const registry = getToolRegistry();

    const systemMessage: ChatMessage = {
      role: "system",
      content: SYSTEM_PROMPT_CONTENT,
    };

    let messages: ChatMessage[] = [systemMessage, ...conversationHistory];
    const toolExecutions: Array<{ toolCallId: string; name: string; args: any; result: unknown }> = [];

    for (let i = 0; i < env.AI_MAX_TOOL_ITERATIONS; i++) {
      const response = await this.provider.chat(messages, tools);

      if (!response.toolCalls || response.toolCalls.length === 0) {
        return { finalContent: response.content ?? "", toolExecutions };
      }

      // El modelo solicitó ejecutar herramientas
      messages.push({
        role: "assistant",
        content: response.content ?? "",
        tool_calls: response.toolCalls,
      });

      for (const call of response.toolCalls) {
        const tool = registry[call.function.name];
        let result: unknown;
        let parsedArgs: any = {};

        if (!tool) {
          result = { error: `Tool desconocida: ${call.function.name}` };
        } else {
          try {
            parsedArgs = JSON.parse(call.function.arguments);
            result = await tool.execute(userId, parsedArgs);
          } catch (err) {
            console.error(`Error al ejecutar tool ${call.function.name}:`, err);
            result = { error: "No se pudo ejecutar la consulta, intenta reformular la pregunta." };
          }
        }

        toolExecutions.push({
          toolCallId: call.id,
          name: call.function.name,
          args: parsedArgs,
          result,
        });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    return {
      finalContent: "No pude completar tu consulta, intenta preguntar algo más específico.",
      toolExecutions,
    };
  }
}
