import { chromium } from 'playwright'
import { v4 as uuidv4 } from 'uuid'
import { DefaultTaskExecutor } from '../tasks/executor'
import { DefaultTaskParser } from '../tasks/parser'

const taskParser = new DefaultTaskParser()
const taskExecutor = new DefaultTaskExecutor()

// 最大重试次数
const MAX_RETRIES = 3
// 重试间隔（毫秒）
const RETRY_DELAY = 1000

// 等待函数
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 执行 shell 命令的函数
async function executeShellCommand(task: any, ws: any): Promise<boolean> {
  const { spawn } = await import('child_process')
  return new Promise(resolve => {
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
      const success = code === 0
      ws.send(
        JSON.stringify({
          event: 'task_results',
          content: [
            {
              taskId: task.id,
              status: success ? 'success' : 'failed',
              output
            }
          ]
        })
      )
      resolve(success)
    })
  })
}

// 执行浏览器任务的函数
async function executeBrowserTask(task: any, ws: any): Promise<boolean> {
  try {
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
    return true
  } catch (error) {
    ws.send(
      JSON.stringify({
        event: 'task_results',
        content: [
          {
            taskId: task.id,
            status: 'failed',
            output: `浏览器任务失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        ]
      })
    )
    return false
  }
}

// 执行单个任务并处理重试逻辑
async function executeTaskWithRetry(task: any, ws: any): Promise<boolean> {
  let retries = 0
  let success = false

  while (retries < MAX_RETRIES && !success) {
    if (retries > 0) {
      ws.send(
        JSON.stringify({
          event: 'task_retry',
          content: {
            taskId: task.id,
            retryCount: retries,
            maxRetries: MAX_RETRIES
          }
        })
      )
      await wait(RETRY_DELAY)
    }

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

    try {
      switch (task.type) {
        case 'shell':
        case 'npm':
          success = await executeShellCommand(task, ws)
          break
        case 'file':
          const result = await taskExecutor.execute(task)
          ws.send(
            JSON.stringify({
              event: 'task_results',
              content: [result]
            })
          )
          success = result.status === 'success'
          break
        case 'browser':
          success = await executeBrowserTask(task, ws)
          break
        default:
          ws.send(
            JSON.stringify({
              event: 'task_results',
              content: [
                {
                  taskId: task.id,
                  status: 'failed',
                  output: `不支持的任务类型: ${task.type}`
                }
              ]
            })
          )
          return false
      }
    } catch (error) {
      ws.send(
        JSON.stringify({
          event: 'task_results',
          content: [
            {
              taskId: task.id,
              status: 'failed',
              output: `执行出错: ${error instanceof Error ? error.message : '未知错误'}`
            }
          ]
        })
      )
      success = false
    }

    if (!success) {
      retries++
    }
  }

  return success
}

// 处理模型返回的方法
export async function handleModelResponse(response: any, ws: any) {
  if (taskParser.canParse(response.content)) {
    const obj = JSON.parse(response.content)
    ws.send(JSON.stringify(obj))

    // 逐个执行任务
    const tasks = obj.plan
    for (const task of tasks) {
      task.id = uuidv4()

      // 执行任务并等待结果
      const success = await executeTaskWithRetry(task, ws)

      // 如果任务最终失败，中断后续任务执行
      if (!success) {
        ws.send(
          JSON.stringify({
            event: 'task_failed',
            content: {
              taskId: task.id,
              message: `任务 "${task.title}" 在 ${MAX_RETRIES} 次尝试后仍然失败，停止执行后续任务`
            }
          })
        )
        break
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
