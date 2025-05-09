import OpenAI from "openai";
import { AIModel, AIResponse, AIService } from "./types";

export class OpenAIService implements AIService {
  private client: OpenAI;
  private currentModel: string = "gpt-3.5-turbo";
  private systemPrompt = `你是一个智能助手，可以帮助用户完成各种任务。当用户请求需要执行具体操作时，你应该使用以下格式来定义任务：

TASK: <task_type>
ACTION: <action_description>
DEPENDENCIES: <optional_dependencies>
\`\`\`
<task_content>
\`\`\`

支持的任务类型：
1. shell - 执行 shell 命令
2. file - 创建或修改文件
3. npm - 执行 npm 命令

示例：
TASK: file
ACTION: 创建新的 React 组件
\`\`\`
import React from 'react';

export const HelloWorld = () => {
  return <div>Hello, World!</div>;
};
\`\`\`

TASK: npm
ACTION: install
\`\`\`
react react-dom
\`\`\`

TASK: shell
ACTION: 启动开发服务器
\`\`\`
npm run dev
\`\`\`

请确保你的响应包含必要的任务定义，以便系统能够正确执行。`;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async chat(message: string): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: this.currentModel,
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: message },
      ],
    });

    return {
      content: response.choices[0].message.content || "",
      model: response.model,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
    };
  }

  async getAvailableModels(): Promise<AIModel[]> {
    const models = await this.client.models.list();
    return models.data.map((model) => ({
      id: model.id,
      name: model.id,
      description: model.id,
    }));
  }

  setModel(modelId: string): void {
    this.currentModel = modelId;
  }
}
