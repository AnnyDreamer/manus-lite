import type { Message } from '../types'

export class ConversationService {
  private static readonly SAVE_INTERVAL = 10 // 每10条消息保存一次
  private static messageCount = 0
  private static currentConversationId: string | null = null

  // 保存对话
  static async saveConversation(messages: Message[]): Promise<string> {
    try {
      const response = await fetch('http://localhost:3000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
      })

      if (!response.ok) {
        throw new Error('保存对话失败')
      }

      const data = await response.json()
      this.currentConversationId = data.id
      this.messageCount = 0
      return data.id
    } catch (error) {
      console.error('保存对话失败:', error)
      throw error
    }
  }

  // 更新对话
  static async updateConversation(id: string, messages: Message[]): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/api/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
      })

      if (!response.ok) {
        throw new Error('更新对话失败')
      }
    } catch (error) {
      console.error('更新对话失败:', error)
      throw error
    }
  }

  // 获取对话
  static async getConversation(id: string): Promise<Message[]> {
    try {
      const response = await fetch(`http://localhost:3000/api/conversations/${id}`)
      if (!response.ok) {
        throw new Error('获取对话失败')
      }
      const data = await response.json()
      return JSON.parse(data.messages)
    } catch (error) {
      console.error('获取对话失败:', error)
      throw error
    }
  }

  // 检查是否需要保存对话
  static shouldSave(): boolean {
    this.messageCount++
    return this.messageCount >= this.SAVE_INTERVAL
  }

  // 获取当前对话ID
  static getCurrentConversationId(): string | null {
    return this.currentConversationId
  }
}
