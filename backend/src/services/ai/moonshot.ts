import { AIModel, AIResponse, AIService } from './types'

interface MoonshotResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class MoonshotService implements AIService {
  private apiKey: string
  private currentModel: string = 'moonshot-v1-8k'
  private baseUrl: string = 'https://api.moonshot.cn/v1'
  private systemPrompt = `你是一个智能任务规划助手。用户会给你一个自然语言任务描述。
  请你将它拆解为多个执行步骤，并输出一个可供自动化系统执行和实时展示的 JSON 数据结构。
  每一步应包括：
    •	步骤编号 id
    •	步骤标题 title
    •	执行类型 type（仅支持 "shell"、"file"、"web" 三种）
    •	具体命令或文件操作 command
    •	步骤描述 description
    •	执行状态 status（默认为 "pending"）
    •	可选：预设 liveContent 结构字段，用于后续展示执行中内容
  输出格式如下所示 JSON 格式返回（严格按照格式并严格遵守结构和字段名）：
  {
    "task": "任务名称",
    "type":"",
    "plan": [
      {
        "id": "step1",
        "title": "步骤名称",
        "type": "shell | file | web",
        "command": "终端命令或行为描述",
        "description": "该步骤的用途说明",
        "status": "pending",
        "liveContent": {
          "stdout": "",        // 若 type=shell
          "filepath": "",      // 若 type=file
          "content": "",       // 若 type=file
          "url": ""            // 若 type=web
        }
      }
    ]
  }
  要求：
	•	按照逻辑顺序组织步骤
	•	使用简洁而安全的命令（避免 rm 等高风险命令）
	•	类型字段只允许是 shell、web、或 file
	•	返回结果只包含 JSON，不要多余文字说明
	•	字段必须完整，哪怕 liveContent 为空也要包含，以供系统后续动态填充
  • type字段根据当前信息返回 若是计划内容 就返回task_plan 开始执行返回task_start 其他消息返回messsge
	•	输出结果必须为 JSON，不要加入自然语言说明
  `

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(message: string): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.currentModel,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: message }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Moonshot API error: ${response.statusText}`)
    }

    const data = (await response.json()) as MoonshotResponse
    return {
      content: data.choices[0].message.content || '',
      model: data.model,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0
      }
    }
  }

  async getAvailableModels(): Promise<AIModel[]> {
    return [
      {
        id: 'moonshot-v1-8k',
        name: 'Moonshot v1 8K',
        description: 'Moonshot AI 8K context model'
      },
      {
        id: 'moonshot-v1-32k',
        name: 'Moonshot v1 32K',
        description: 'Moonshot AI 32K context model'
      }
    ]
  }

  setModel(modelId: string): void {
    this.currentModel = modelId
  }
}
