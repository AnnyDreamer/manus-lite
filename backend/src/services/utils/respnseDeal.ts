import { chromium } from 'playwright'
import { v4 as uuidv4 } from 'uuid'
import { DefaultTaskExecutor } from '../tasks/executor'
import { DefaultTaskParser } from '../tasks/parser'

const taskParser = new DefaultTaskParser()
const taskExecutor = new DefaultTaskExecutor()
// 处理模型返回的方法
export async function handleModelResponse(response: any, ws: any) {
  if (taskParser.canParse(response.content)) {
    const obj = JSON.parse(response.content)
    ws.send(JSON.stringify(obj))
    // 逐个执行任务
    const tasks = obj.plan
    for (const task of tasks) {
      task.id = uuidv4()
      // 发送步骤开始执行的消息
      ws.send(
        JSON.stringify({
          event: 'task_start',
          content: {
            taskId: task.id,
            title: task.title,
            type: task.type,
            command: task.command,
            description: task.description,
            status: 'running'
          }
        })
      )
      if (task.type === 'shell' || task.type === 'npm') {
        const { spawn } = await import('child_process')
        const proc = spawn(
          task.type === 'shell' ? 'sh' : 'npm',
          task.type === 'shell' ? ['-c', task.command] : [task.action, ...task.command.split(' ')]
        )
        let output = ''
        proc.stdout.on('data', data => {
          output += data.toString()
          ws.send(
            JSON.stringify({
              event: 'task_results',
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
              event: 'task_results',
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
              event: 'task_results',
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
            event: 'task_results',
            content: [result]
          })
        )
      } else if (task.type === 'browser') {
        const browser = await chromium.launch()
        const page = await browser.newPage()
        await page.goto(task.command)
        for (let i = 0; i < 3; i++) {
          await page.waitForTimeout(1000)
          const buffer = await page.screenshot({ type: 'png' })
          const image = buffer.toString('base64')
          ws.send(
            JSON.stringify({
              event: 'task_results',
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
            event: 'task_results',
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
}
