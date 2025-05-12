import { Conversation } from '../models/Conversation'

export class ConversationService {
  // 创建新的对话
  static async createConversation(messages: any[]): Promise<Conversation> {
    return await Conversation.create({
      messages: JSON.stringify(messages)
    })
  }

  // 通过 ID 获取对话
  static async getConversationById(id: string): Promise<Conversation | null> {
    return await Conversation.findByPk(id)
  }

  // 更新对话内容
  static async updateConversation(id: string, messages: any[]): Promise<[number, Conversation[]]> {
    return await Conversation.update(
      { messages: JSON.stringify(messages) },
      { where: { id }, returning: true }
    )
  }

  // 删除对话
  static async deleteConversation(id: string): Promise<number> {
    return await Conversation.destroy({ where: { id } })
  }
}
