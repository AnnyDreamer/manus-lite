<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'

interface Message {
  type: 'user' | 'system' | 'task'
  content: string
  status?: 'success' | 'error' | 'running'
  taskId?: string
  filePath?: string
}

const props = defineProps<{
  messages: Message[]
  isWaiting?: boolean
}>()

const messagesContainer = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(
  () => props.messages,
  () => {
    nextTick(scrollToBottom)
  },
  { deep: true },
)

onMounted(scrollToBottom)
</script>

<template>
  <div class="chat-messages" ref="messagesContainer">
    <div v-for="(message, index) in messages" :key="index" class="message" :class="message.type">
      <div class="message-content" :class="{ 'with-status': message.type === 'task' }">
        <template v-if="message.type === 'task'">
          <div class="task-status" :class="message.status">
            <span class="status-dot"></span>
            <span class="status-text">
              {{ message.status === 'success' ? '执行成功' : 
                message.status === 'error' ? '执行失败' : '执行中' }}
            </span>
          </div>
          <div class="task-content">
            {{ message.content }}
            <div v-if="message.filePath" class="file-path">
              文件路径: {{ message.filePath }}
            </div>
          </div>
        </template>
        <template v-else>
          {{ message.content }}
        </template>
      </div>
    </div>
    <div v-if="isWaiting" class="message system">
      <div class="message-content waiting">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.system {
  align-items: flex-start;
}

.message.task {
  align-items: flex-start;
  /* background-color: #f8f9fa; */
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
}

.message-content {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 8px;
  word-break: break-word;
}

.message-content.with-status {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background-color: #fff;
  border: 1px solid #e9ecef;
}

.task-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.task-status.success {
  background-color: #d4edda;
  color: #155724;
}

.task-status.error {
  background-color: #f8d7da;
  color: #721c24;
}

.task-status.running {
  background-color: #e2e3e5;
  color: #383d41;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.task-status.success .status-dot {
  background-color: #28a745;
}

.task-status.error .status-dot {
  background-color: #dc3545;
}

.task-status.running .status-dot {
  background-color: #6c757d;
  animation: pulse 1.5s infinite;
}

.task-content {
  flex: 1;
}

.file-path {
  margin-top: 8px;
  font-size: 0.9em;
  color: #6c757d;
  font-family: monospace;
}

.message.user .message-content {
  background-color: #007AFF;
  color: white;
}

.message.system .message-content {
  background-color: #f0f0f0;
  color: #333;
}

.message.system .message-content.waiting {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 16px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #666;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
</style>