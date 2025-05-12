<script setup lang="ts">
import { NLayoutSider } from 'naive-ui'
import { onUnmounted, ref } from 'vue'
import { ConversationService } from '../../services/conversationService'
import type { Message } from '../../types'
import ChatHeader from './ChatHeader.vue'
import ChatInput from './ChatInput.vue'
import ChatMessages from './ChatMessages.vue'

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

// 保存对话
const saveConversation = async () => {
  try {
    const conversationId = ConversationService.getCurrentConversationId()
    if (conversationId) {
      await ConversationService.updateConversation(conversationId, messages.value)
    } else {
      await ConversationService.saveConversation(messages.value)
    }
  } catch (error) {
    console.error('保存对话失败:', error)
  }
}

const handleSend = async (message: string) => {
  messages.value.push({
    type: 'user',
    content: message
  })
  isWaiting.value = true
  emit('send', message)

  // 检查是否需要保存对话
  if (ConversationService.shouldSave()) {
    await saveConversation()
  }
}

const handleStop = () => {
  isWaiting.value = false
  emit('stop')
}

const addSystemMessage = async (content: string) => {
  messages.value.push({
    type: 'system',
    content
  })
  isWaiting.value = false

  // 检查是否需要保存对话
  if (ConversationService.shouldSave()) {
    await saveConversation()
  }
}

const addTaskMessage = async (task: {
  content: string
  status: 'success' | 'error' | 'running'
  taskId: string
  filePath?: string
}) => {
  messages.value.push({
    type: 'task',
    content: task.content,
    status: task.status,
    taskId: task.taskId,
    filePath: task.filePath
  })
  isWaiting.value = false

  // 检查是否需要保存对话
  if (ConversationService.shouldSave()) {
    await saveConversation()
  }
}

// 组件卸载时保存对话
onUnmounted(async () => {
  if (messages.value.length > 0) {
    await saveConversation()
  }
})

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
      <div class="chat-messages empty" v-if="!messages.length">输入任务以执行……</div>
      <chat-messages :messages="messages" :is-waiting="isWaiting" v-else />
      <chat-input @send="handleSend" @stop="handleStop" :is-waiting="isWaiting" />
    </div>
  </n-layout-sider>
</template>
<style scoped>
.empty {
  color: rgb(170, 173, 177);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
