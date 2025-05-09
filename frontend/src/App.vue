<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { NConfigProvider, NLayout } from 'naive-ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BrowserPanel from './components/browser/BrowserPanel.vue'
import ChatPanel from './components/chat/ChatPanel.vue'
import { WebSocketService } from './services/websocket'
import type { TaskResult } from './types'

const { width: windowWidth } = useWindowSize()
const isCollapsed = ref(false)
const browserPanelRef = ref<InstanceType<typeof BrowserPanel> | null>(null)
const hasInteraction = ref(false)
const chatPanelRef = ref<InstanceType<typeof ChatPanel> | null>(null)

// 计算侧边栏宽度
const sidebarWidth = computed(() => {
  return hasInteraction.value ? Math.min(400, windowWidth.value * 0.3) : '100%'
})

const wsService = new WebSocketService('ws://localhost:3000')

const handleMessage = (event: MessageEvent) => {
  const data = JSON.parse(event.data)
  console.log('Received message:', data)

  switch (data.type) {
    case 'message':
      chatPanelRef.value?.addSystemMessage(data.content || '')
      break
    // case 'task_results':
    //   const results = data.content as TaskResult[]
    //   results.forEach((result) => {
    //     chatPanelRef.value?.addSystemMessage(
    //       `Task ${result.taskId}: ${result.status === 'success' ? '✅' : '❌'} ${
    //         result.output || result.error
    //       }`,
    //     )
    //   })
    //   break
    case 'task_results':
      const results = data.content as TaskResult[]
      results.forEach(result => {
        chatPanelRef.value?.addTaskMessage({
          content: result.output || result.error || '',
          status: result.status,
          taskId: result.taskId,
          filePath: result.filePath
        })
      })
      break
    case 'browser_screenshot':
      hasInteraction.value = true
      browserPanelRef.value?.updateContent(data.image || '')
      break
    case 'pong':
      console.log('Received pong from server')
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
    <n-layout class="w-screen h-screen overflow-hidden flex flex-col">
      <n-layout has-sider class="h-full">
        <chat-panel
          ref="chatPanelRef"
          v-model:is-collapsed="isCollapsed"
          :sidebar-width="hasInteraction ? sidebarWidth : '100%'"
          @send="handleSend"
          @stop="handleStop"
        />
        <browser-panel v-if="hasInteraction" ref="browserPanelRef" @navigate="handleNavigate" />
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<style scoped>
/* 移除所有自定义样式，因为已经使用Tailwind类名 */
</style>
