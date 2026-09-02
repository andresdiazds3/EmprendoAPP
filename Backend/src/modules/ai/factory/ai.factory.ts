import { AIProvider } from "../providers/ai.provider.interface";
import { OpenRouterProvider } from "../providers/openrouter.provider";

export class AIFactory {
  static create(): AIProvider {
    return new OpenRouterProvider();
  }
}
