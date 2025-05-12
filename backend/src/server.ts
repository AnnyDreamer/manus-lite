import { chromium } from 'playwright'
import { v4 as uuidv4 } from 'uuid'
import { WebSocketServer } from 'ws'
import { config } from './config'
import { AIServiceFactory } from './services/ai/factory'
import { DefaultTaskExecutor } from './services/tasks/executor'
import { DefaultTaskParser } from './services/tasks/parser'

const wss = new WebSocketServer({ port: config.port })
const aiService = AIServiceFactory.createService('moonshot', config.moonshotApiKey)
const taskParser = new DefaultTaskParser()
const taskExecutor = new DefaultTaskExecutor()

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
          if (taskParser.canParse(response.content)) {
            const tasks = taskParser.parse(response.content)
            // 1. 先推送任务计划
            ws.send(
              JSON.stringify({
                type: 'task_plan',
                content: tasks.map(t => ({
                  taskId: t.id,
                  type: t.type,
                  action: t.action,
                  content: t.content
                }))
              })
            )
            // 2. 再逐个执行任务
            for (const task of tasks) {
              task.id = uuidv4()
              if (task.type === 'shell' || task.type === 'npm') {
                const { spawn } = await import('child_process')
                const proc = spawn(
                  task.type === 'shell' ? 'sh' : 'npm',
                  task.type === 'shell'
                    ? ['-c', task.content]
                    : [task.action, ...task.content.split(' ')]
                )
                let output = ''
                proc.stdout.on('data', data => {
                  output += data.toString()
                  ws.send(
                    JSON.stringify({
                      type: 'task_results',
                      content: [
                        {
                          taskId: task.id,
                          status: 'running',
                          output
                        }
                      ]
                    })
                  )
                })
                proc.stderr.on('data', data => {
                  output += data.toString()
                  ws.send(
                    JSON.stringify({
                      type: 'task_results',
                      content: [
                        {
                          taskId: task.id,
                          status: 'running',
                          output
                        }
                      ]
                    })
                  )
                })
                proc.on('close', code => {
                  ws.send(
                    JSON.stringify({
                      type: 'task_results',
                      content: [
                        {
                          taskId: task.id,
                          status: code === 0 ? 'success' : 'failed',
                          output
                        }
                      ]
                    })
                  )
                })
              } else if (task.type === 'file') {
                const result = await taskExecutor.execute(task)
                ws.send(
                  JSON.stringify({
                    type: 'task_results',
                    content: [result]
                  })
                )
              } else if (task.type === 'browser') {
                const browser = await chromium.launch()
                const page = await browser.newPage()
                await page.goto(task.content)
                for (let i = 0; i < 3; i++) {
                  await page.waitForTimeout(1000)
                  const buffer = await page.screenshot({ type: 'png' })
                  const image = buffer.toString('base64')
                  ws.send(
                    JSON.stringify({
                      type: 'task_results',
                      content: [
                        {
                          taskId: task.id,
                          status: 'running',
                          image
                        }
                      ]
                    })
                  )
                }
                await browser.close()
                ws.send(
                  JSON.stringify({
                    type: 'task_results',
                    content: [
                      {
                        taskId: task.id,
                        status: 'success',
                        output: '浏览器任务完成'
                      }
                    ]
                  })
                )
              }
            }
          }
          ws.send(
            JSON.stringify({
              type: 'message',
              content: response.content
            })
          )
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
