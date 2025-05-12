<script setup lang="ts">
import { NConfigProvider } from 'naive-ui'
import { onMounted, onUnmounted, ref } from 'vue'
import BrowserPanel from './components/browser/BrowserPanel.vue'
import ChatPanel from './components/chat/ChatPanel.vue'
import { WebSocketService } from './services/websocket'
import type { TaskResult } from './types'

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

const wsService = new WebSocketService('ws://localhost:3000')

const handleMessage = (event: MessageEvent) => {
  const data = JSON.parse(event.data)
  switch (data.type) {
    case 'message':
      chatPanelRef.value?.addSystemMessage(data.content || '')
      break
    case 'task_plan': {
      // 展示即将执行的任务
      const planMsg = data.content
        .map(
          (t: any, idx: number) =>
            `【任务${idx + 1}】类型: ${t.type}，操作: ${t.action}，内容: ${t.content}`
        )
        .join('\n')
      chatPanelRef.value?.addSystemMessage('即将执行以下任务：\n' + planMsg)
      break
    }
    case 'task_results': {
      const results = data.content as TaskResult[]
      results.forEach(result => {
        // 追加日志
        if (result.output && result.status === 'running') {
          browserPanelRef.value?.addLog(result.output)
        }
        // 追加图片
        if (result.image) {
          browserPanelRef.value?.addImage(result.image)
        }
        // 任务最终状态
        if (result.status === 'success' || result.status === 'failed') {
          chatPanelRef.value?.addTaskMessage({
            content:
              (result.status === 'success' ? '✅' : '❌') + (result.output || result.error || ''),
            status: result.status === 'failed' ? 'error' : result.status,
            taskId: result.taskId,
            filePath: result.filePath
          })
        }
      })
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
const handleNavigate = (url: string) => {
  wsService.send({
    type: 'navigate',
    content: url
  })
}
onMounted(() => {
  wsService.connect(handleMessage)
})
onUnmounted(() => {
  wsService.disconnect()
})
</script>

<template>
  <n-config-provider>
    <div style="display: flex; height: 100vh; width: 100vw">
      <chat-panel
        ref="chatPanelRef"
        v-model:is-collapsed="isCollapsed"
        :sidebar-width="hasInteraction ? sidebarWidth + 'px' : '100%'"
        @send="handleSend"
        @stop="handleStop"
      />
      <!-- 分割条 -->
      <template v-if="hasInteraction">
        <div
          style="width: 2px; cursor: col-resize; background: #eee; user-select: none"
          @mousedown="startDrag"
        ></div>
        <browser-panel
          ref="browserPanelRef"
          style="flex: 1; height: 100vh"
          @navigate="handleNavigate"
        />
      </template>
    </div>
  </n-config-provider>
</template>

<style scoped>
/* 移除所有自定义样式，因为已经使用Tailwind类名 */
</style>
