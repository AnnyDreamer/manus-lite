import type { WebSocketMessage } from '../types'

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private heartbeatInterval: number | null = null
  private messageHandler: ((event: MessageEvent) => void) | null = null

  constructor(private url: string) {}

  connect(handler: (event: MessageEvent) => void) {
    this.messageHandler = handler
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      this.messageHandler?.(event)
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.stopHeartbeat()
      this.reconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      )
      setTimeout(() => {
        if (this.messageHandler) {
          this.connect(this.messageHandler)
        }
      }, this.reconnectInterval)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}
