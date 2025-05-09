import { AIService, AIResponse, AIModel } from "./types";

interface MoonshotResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MoonshotService implements AIService {
  private apiKey: string;
  private currentModel: string = "moonshot-v1-8k";
  private baseUrl: string = "https://api.moonshot.cn/v1";
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
    this.apiKey = apiKey;
  }

  async chat(message: string): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.currentModel,
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Moonshot API error: ${response.statusText}`);
    }

    const data = (await response.json()) as MoonshotResponse;
    return {
      content: data.choices[0].message.content || "",
      model: data.model,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
      },
    };
  }

  async getAvailableModels(): Promise<AIModel[]> {
    return [
      {
        id: "moonshot-v1-8k",
        name: "Moonshot v1 8K",
        description: "Moonshot AI 8K context model",
      },
      {
        id: "moonshot-v1-32k",
        name: "Moonshot v1 32K",
        description: "Moonshot AI 32K context model",
      },
    ];
  }

  setModel(modelId: string): void {
    this.currentModel = modelId;
  }
}
