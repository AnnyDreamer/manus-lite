export interface TaskResult {
  taskId: string
  status: 'success' | 'failed' | 'running'
  output?: string
  error?: string
  filePath?: string
  image?: string
}

export interface WebSocketMessage {
  type: string
  content?: string
  image?: string
}

export interface Message {
  type: 'user' | 'system' | 'task'
  content: string
  status?: 'success' | 'error' | 'running'
  taskId?: string
  filePath?: string
}
