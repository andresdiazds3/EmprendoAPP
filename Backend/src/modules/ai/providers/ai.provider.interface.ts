export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: object; // JSON Schema
  };
}

export interface AIProviderResponse {
  content: string | null;
  toolCalls: ToolCall[] | null;
}

export interface AIProvider {
  chat(messages: ChatMessage[], tools: ToolDefinition[]): Promise<AIProviderResponse>;
}
