<template>
  <n-config-provider>
    <div style="display: flex; height: 100vh; width: 100vw">
      <chat-panel
        ref="chatPanelRef"
        v-model:is-collapsed="isCollapsed"
        :sidebar-width="hasInteraction ? sidebarWidth + 'px' : '100%'"
        :messages="messageList.plan.length ? [messageList] : []"
        @send="handleSend"
        @stop="handleStop"
        @show-detail="handleShowDetail"
      />
      <!-- 分割条 -->
      <template v-if="hasInteraction">
        <div
          style="width: 2px; cursor: col-resize; background: #eee; user-select: none"
          @mousedown="startDrag"
        ></div>
        <browser-panel ref="browserPanelRef" style="flex: 1; height: 100vh" />
      </template>
    </div>
    <!-- 传递 taskLogs 给 ChatMessages -->
    <chat-messages
      v-if="false"
      :messages="messageList.plan.length ? [messageList] : []"
      :is-waiting="false"
      :task-logs="taskLogs"
    />
  </n-config-provider>
</template>
<script setup lang="ts" name="mainView">
import { WebSocketService } from '@/services/websocket'
import type { TaskResult } from '@/types'
import { NConfigProvider } from 'naive-ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BrowserPanel from './components/browser/BrowserPanel.vue'
import ChatPanel from './components/chat/ChatPanel.vue'

const isCollapsed = ref(false)
const hasInteraction = ref(false)
const chatPanelRef = ref<InstanceType<typeof ChatPanel> | null>(null)
const browserPanelRef = ref<InstanceType<typeof BrowserPanel> | null>(null)

// 拖拽相关
const sidebarWidth = ref(350) // 初始宽度
const dragging = ref(false)

const startDrag = (e: MouseEvent) => {
  dragging.value = true
  document.body.style.cursor = 'col-resize'
}
const onDrag = (e: MouseEvent) => {
  if (dragging.value) {
    sidebarWidth.value = Math.max(200, Math.min(e.clientX, window.innerWidth - 200))
  }
}
const stopDrag = () => {
  dragging.value = false
  document.body.style.cursor = ''
}
onMounted(() => {
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
})

const messageList = ref<{
  task: string
  type: string
  plan: Array<{
    id: string
    title: string
    type: string
    command: string
    description: string
    status: string
    liveContent: {
      filepath: string
      content: string
    }
  }>
}>({
  task: '',
  type: '',
  plan: []
})

const planList = ref<
  Array<{
    id: string
    title: string
    type: string
    command: string
    description: string
    status: string
    liveContent: {
      filepath: string
      content: string
    }
  }>
>([])

const showMessage = computed(() => {
  return messageList.value.plan.map(item => ({
    ...item,
    status: item.status
  }))
})

const wsService = new WebSocketService('ws://localhost:3000')

const stepLogs = ref(new Map<string, { command: string; output: string }>())
const taskLogs = ref(new Map<string, string[]>())

const statusMap = ref()
const historyStatusMap = ref()

const handleMessage = (event: MessageEvent) => {
  const data = JSON.parse(event.data)
  console.log(data)
  switch (data.type) {
    case 'message':
      chatPanelRef.value?.addSystemMessage(data || '')
      break
    case 'task_plan': {
      messageList.value = data
      planList.value = data.plan
      chatPanelRef.value?.addSystemMessage(data)
      break
    }
    case 'task_start': {
      const task = data.content
      // 记录命令
      stepLogs.value.set(task.taskId, { command: task.command, output: '' })
      // 初始化日志
      if (!taskLogs.value.has(task.taskId)) taskLogs.value.set(task.taskId, [])
      updateBrowserPanelLogs()
      if (task.status === 'running') {
        browserPanelRef.value?.updateCurrentTask({
          title: task.title,
          description: task.description,
          status: task.status
        })
      }
      break
    }
    case 'task_retry': {
      const { taskId, retryCount, maxRetries } = data.content
      // 更新 planList 和 messageList
      const task = planList.value.find(t => t.id === taskId)
      if (task) {
        task.status = 'retry'
        if (!task.liveContent) task.liveContent = { filepath: '', content: '' }
        task.liveContent.content += `\n[重试 ${retryCount}/${maxRetries}] 正在重试...\n`
      }
      messageList.value = { ...messageList.value, plan: [...planList.value] }
      // 追加日志
      if (!taskLogs.value.has(taskId)) taskLogs.value.set(taskId, [])
      taskLogs.value.get(taskId)!.push(`🔄 第${retryCount}/${maxRetries}次重试...`)
      chatPanelRef.value?.addTaskMessage({
        content: `🔄 任务重试中 (${retryCount}/${maxRetries})...`,
        status: 'retry',
        taskId
      })
      break
    }
    case 'task_failed': {
      const { taskId, message: failMsg } = data.content
      const task = planList.value.find(t => t.id === taskId)
      if (task) {
        task.status = 'failed'
        if (!task.liveContent) task.liveContent = { filepath: '', content: '' }
        task.liveContent.content += `\n[失败] ${failMsg}\n`
      }
      messageList.value = { ...messageList.value, plan: [...planList.value] }
      // 追加日志
      if (!taskLogs.value.has(taskId)) taskLogs.value.set(taskId, [])
      taskLogs.value.get(taskId)!.push(`❌ 失败：${failMsg}`)
      chatPanelRef.value?.addTaskMessage({
        content: `❌ ${failMsg}`,
        status: 'failed',
        taskId
      })
      break
    }
    case 'task_results': {
      const results = data.content as TaskResult[]
      results.forEach(result => {
        if (stepLogs.value.has(result.taskId)) {
          const prev = stepLogs.value.get(result.taskId)!
          stepLogs.value.set(result.taskId, {
            ...prev,
            output: (prev.output || '') + (result.output || result.error || '')
          })
        }
        // 更新消息列表中的任务状态
        const taskIndex = planList.value.findIndex(task => task.id === result.taskId)
        if (taskIndex !== -1) {
          planList.value[taskIndex].status = result.status
          // 更新消息列表
          messageList.value = {
            ...messageList.value,
            plan: [...planList.value]
          }
        }
        // 追加日志
        if (!taskLogs.value.has(result.taskId)) taskLogs.value.set(result.taskId, [])
        if (result.output) taskLogs.value.get(result.taskId)!.push(result.output)
        // 添加任务消息
        chatPanelRef.value?.addTaskMessage({
          content: result.output || result.error || '',
          status: result.status,
          taskId: result.taskId,
          filePath: result.filePath
        })
      })
      updateBrowserPanelLogs()
      break
    }
    case 'browser_screenshot':
      hasInteraction.value = true
      browserPanelRef.value?.updateContent(data.image || '')
      break
    case 'pong':
      break
    case 'error':
      chatPanelRef.value?.addSystemMessage(`Error: ${data.content}`)
      break
    default:
      console.warn('Unknown message type:', data.type)
  }
}

function updateBrowserPanelLogs() {
  if (browserPanelRef.value) {
    browserPanelRef.value.clearLogs && browserPanelRef.value.clearLogs()
    for (const [taskId, { command, output }] of stepLogs.value.entries()) {
      browserPanelRef.value.addLog(`命令: ${command}\n结果:\n${output}\n----------------------\n`)
    }
  }
}

const handleSend = (message: string) => {
  wsService.send({
    type: 'message',
    content: message
  })
  hasInteraction.value = true
}
const handleStop = () => {
  wsService.send({
    type: 'stop'
  })
}
function handleShowDetail({ input, output }) {
  if (browserPanelRef.value) {
    browserPanelRef.value.addLog('输入命令：' + input + '\n输出内容：' + output)
  }
}

onMounted(() => {
  wsService.connect(handleMessage)
})
onUnmounted(() => {
  wsService.disconnect()
})
</script>

<style scoped>
/* 移除所有自定义样式，因为已经使用Tailwind类名 */
</style>
