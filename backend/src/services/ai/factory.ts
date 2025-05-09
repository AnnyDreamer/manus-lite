import { AIService } from "./types";
import { OpenAIService } from "./openai";
import { MoonshotService } from "./moonshot";

export class AIServiceFactory {
  private static instance: AIServiceFactory;
  private services: Map<string, AIService>;

  private constructor() {
    this.services = new Map();
  }

  static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  static createService(type: "openai" | "moonshot", apiKey: string): AIService {
    switch (type) {
      case "openai":
        return new OpenAIService(apiKey);
      case "moonshot":
        return new MoonshotService(apiKey);
      default:
        throw new Error(`Unsupported AI service type: ${type}`);
    }
  }

  createService(provider: string, config: any): AIService {
    if (this.services.has(provider)) {
      return this.services.get(provider)!;
    }

    let service: AIService;
    switch (provider) {
      case "openai":
        service = new OpenAIService(config.apiKey);
        break;
      case "moonshot":
        service = new MoonshotService(config.apiKey);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    this.services.set(provider, service);
    return service;
  }

  getService(provider: string): AIService {
    const service = this.services.get(provider);
    if (!service) {
      throw new Error(`Service not found for provider: ${provider}`);
    }
    return service;
  }
}
