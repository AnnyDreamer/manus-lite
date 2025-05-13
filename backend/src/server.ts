import { WebSocketServer } from 'ws'
import { handleModelResponse } from '../src/services/utils/respnseDeal'
import { config } from './config'
import { AIServiceFactory } from './services/ai/factory'

const wss = new WebSocketServer({ port: config.port })
const aiService = AIServiceFactory.createService('moonshot', config.moonshotApiKey)

console.log(`WebSocket server is running on port ${config.port}`)

wss.on('connection', ws => {
  console.log('Client connected')
  ws.on('message', async message => {
    try {
      const data = JSON.parse(message.toString())
      console.log('Received message:', data)
      switch (data.type) {
        case 'message': {
          const response = await aiService.chat(data.content)
          console.log(response, 'response')
          await handleModelResponse(response, ws)
          break
        }
        case 'navigate': {
          // 处理浏览器导航请求
          // 这里可以集成截图推送
          break
        }
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break
        default:
          console.warn('Unknown message type:', data.type)
      }
    } catch (error) {
      console.error('Error processing message:', error)
      ws.send(
        JSON.stringify({
          type: 'error',
          content: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      )
    }
  })

  ws.on('close', () => {
    console.log('Client disconnected')
  })
})
