export interface TaskResult {
  taskId: string
  status: 'success' | 'failed'
  output?: string
  error?: string
}

export interface WebSocketMessage {
  type: string
  content?: string
  image?: string
}
