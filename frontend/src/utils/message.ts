import { ref } from 'vue'

// 存储所有步骤的状态
const steps = ref<Map<string, any>>(new Map())

// 处理 WebSocket 消息
export function handleWebSocketMessage(event: MessageEvent) {
  const data = JSON.parse(event.data)
  switch (data.event) {
    case 'task_start':
      // 直接使用后端返回的状态
      steps.value.set(data.content.taskId, data.content)
      break
    case 'task_results':
      // 直接使用后端返回的状态
      data.content.forEach((result: any) => {
        if (steps.value.has(result.taskId)) {
          steps.value.set(result.taskId, {
            ...steps.value.get(result.taskId),
            ...result
          })
        }
      })
      break
    default:
      console.warn('Unknown message type:', data.type)
  }
  return data
}

// 获取所有步骤
export function getSteps() {
  return steps.value
}
