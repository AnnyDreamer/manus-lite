import { Task, TaskParser } from '../ai/types'

export class DefaultTaskParser implements TaskParser {
  canParse(content: string): boolean {
    // 检查是否为 JSON 格式
    try {
      const obj = JSON.parse(content)
      return obj && Array.isArray(obj.plan)
    } catch {
      return false
    }
  }

  parse(content: string): Task[] {
    try {
      const obj = JSON.parse(content)
      if (obj && Array.isArray(obj.plan)) {
        // 直接返回 plan 数组
        return obj.plan
      }
      return []
    } catch {
      return []
    }
  }
}
