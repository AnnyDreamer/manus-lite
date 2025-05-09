<script setup lang="ts">
import { ref } from 'vue'
import { NLayoutSider } from 'naive-ui'
import ChatHeader from './ChatHeader.vue'
import ChatMessages from './ChatMessages.vue'
import ChatInput from './ChatInput.vue'

interface Message {
  type: 'user' | 'system' | 'task'
  content: string
  status?: 'success' | 'error' | 'running'
  taskId?: string
  filePath?: string
}

const props = defineProps<{
  isCollapsed: boolean
  sidebarWidth: string | number
}>()

const emit = defineEmits<{
  (e: 'update:isCollapsed', value: boolean): void
  (e: 'send', message: string): void
  (e: 'stop'): void 
}>()

const messages = ref<Message[]>([])
const isWaiting = ref(false)

const handleSend = (message: string) => {
  messages.value.push({
    type: 'user',
    content: message,
  })
  isWaiting.value = true 
  emit('send', message)
}
const handleStop = () => {  
  isWaiting.value = false
  emit('stop')
}

const addSystemMessage = (content: string) => {
  messages.value.push({
    type: 'system',
    content,
  })
  isWaiting.value = false 
}
// 添加新的方法
const addTaskMessage = (task: { content: string; status: string; taskId: string; filePath?: string }) => {
  messages.value.push({
    type: 'task',
    content: task.content,
    status: task.status,
    taskId: task.taskId,
    filePath: task.filePath
  })
  isWaiting.value = false
}

defineExpose({
  addSystemMessage,
  addTaskMessage
})
</script>

<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed-width="64"
    :width="sidebarWidth"
    :native-scrollbar="false"
    :collapsed="isCollapsed"
    show-trigger
    @collapse="emit('update:isCollapsed', true)"
    @expand="emit('update:isCollapsed', false)"
    content-class="h-full"
  >
    <div class="chat-container">
      <chat-header
        :is-collapsed="isCollapsed"
        @update:is-collapsed="emit('update:isCollapsed', $event)"
      />
      <chat-messages :messages="messages" :is-waiting="isWaiting"/>
      <chat-input @send="handleSend"  @stop="handleStop" :is-waiting="isWaiting"/>
    </div>
  </n-layout-sider>
</template>
