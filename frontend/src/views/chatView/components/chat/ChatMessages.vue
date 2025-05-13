<template>
  <div class="chat-messages" ref="messagesContainer">
    <div v-for="(message, index) in props.messages" :key="index">
      <div class="message-content mb-4" :class="{ 'with-status': true }">
        {{ message.task }}
      </div>
      {{ message }}
      <template v-if="message.type === 'task_plan'">
        <div class="pl-4">
          <n-steps size="small" :current="current" :status="currentStatus" vertical>
            <template v-for="(item, idx) in message.plan" :key="item.id">
              <n-step :title="item.title">
                <template #icon>
                  <n-icon>
                    <span>{{ getStepIcon(item.status) }}</span>
                  </n-icon>
                </template>
                <template #title>
                  <n-collapse arrow-placement="right" :default-expanded-names="['1']">
                    <n-collapse-item :title="item.title" name="1">
                      <div>{{ item.description }}</div>
                      <div class="flex my-4">
                        <span class="red-box" @click="handleShowDetail(item)">
                          {{ `正在${item.title[0]}${item.title[1]}文件` }}
                        </span>
                        <span class="flex-1 overflow-hidden ml-2">
                          {{ item.command }}
                        </span>
                      </div>
                      <div v-if="taskResults[item.id]" class="task-result mt-2">
                        <div class="task-result-header">
                          <span class="task-result-title">执行结果</span>
                          <span :class="['task-result-status', taskResults[item.id].status]">
                            {{ getStatusText(taskResults[item.id].status) }}
                          </span>
                        </div>
                        <div class="task-result-content">
                          <pre>{{ taskResults[item.id].output }}</pre>
                        </div>
                      </div>
                    </n-collapse-item>
                  </n-collapse>
                </template>
              </n-step>
            </template>
          </n-steps>
        </div>
      </template>
      <div v-else-if="message.type === 'message'" class="message system">
        <div class="message-content">
          <span v-html="getTypingContent(index)"></span>
        </div>
      </div>
      <div v-else-if="message.type === 'system'" class="message system">
        <div class="message-content">
          <span v-html="getTypingContent(index)"></span>
        </div>
      </div>
      <div v-else-if="message.type === 'task'" class="message task">
        <div class="message-content" :class="message.status">
          <span v-html="getTypingContent(index)"></span>
        </div>
      </div>
    </div>
    <div v-if="props.isWaiting" class="message system">
      <div class="message-content waiting">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
        <span style="margin-left: 8px">正在执行，请稍候...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NCollapse, NCollapseItem, NIcon, NStep, NSteps } from 'naive-ui'
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  messages: any[]
  isWaiting?: boolean
}>()

const emit = defineEmits(['show-detail'])

const current = ref(0)
const currentStatus = ref<'process' | 'finish' | 'error' | 'wait'>('process')

const messagesContainer = ref<HTMLElement | null>(null)

const getStepIcon = (status: string) => {
  switch (status) {
    case 'success':
      return '✓'
    case 'failed':
      return '✗'
    case 'running':
      return '⟳'
    case 'retry':
      return '↻'
    default:
      return '⟳'
  }
}

interface TypingState {
  display: string
  timer?: number
  isComplete: boolean
}

const typingStates = ref<TypingState[]>([])

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 获取打字机效果的内容
const getTypingContent = (index: number) => {
  const state = typingStates.value[index]
  if (!state) return ''
  return state.display.replace(/\n/g, '<br/>')
}

// 更新打字机效果
const updateTypingEffect = (index: number, content: string) => {
  if (!typingStates.value[index]) {
    typingStates.value[index] = {
      display: '',
      isComplete: false
    }
  }

  const state = typingStates.value[index]
  if (state.isComplete) return

  let i = 0
  const text = typeof content === 'string' ? content : JSON.stringify(content)

  const type = () => {
    if (i <= text.length) {
      state.display = text.slice(0, i)
      i++
      state.timer = window.setTimeout(type, 12)
    } else {
      state.isComplete = true
      delete state.timer
    }
  }

  // 清除之前的定时器
  if (state.timer) {
    window.clearTimeout(state.timer)
  }

  type()
}

// 监听消息更新
watch(
  () => props.messages,
  messages => {
    // 确保 typingStates 数组长度与消息数组一致
    while (typingStates.value.length < messages.length) {
      typingStates.value.push({
        display: '',
        isComplete: false
      })
    }

    // 更新每个消息的打字机效果
    messages.forEach((message, index) => {
      let content = ''
      if (message.type === 'task') {
        content = message.content
      } else if (message.type === 'system' || message.type === 'message') {
        content =
          typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content, null, 2)
      }

      if (content) {
        updateTypingEffect(index, content)
      }

      // 处理任务结果
      if (message.type === 'task' && message.taskId) {
        updateTaskResult({
          taskId: message.taskId,
          status: message.status,
          output: message.content
        })
      }
    })

    // 清理多余的状态
    if (typingStates.value.length > messages.length) {
      typingStates.value = typingStates.value.slice(0, messages.length)
    }

    nextTick(scrollToBottom)
  },
  { deep: true, immediate: true }
)

// 组件卸载时清理定时器
onUnmounted(() => {
  typingStates.value.forEach(state => {
    if (state.timer) {
      window.clearTimeout(state.timer)
    }
  })
})

function handleShowDetail(item: { command: string; liveContent?: { content: string } }) {
  emit('show-detail', {
    input: item.command,
    output: item.liveContent?.content || ''
  })
}

interface TaskResult {
  taskId: string
  status: 'running' | 'success' | 'failed' | 'retry'
  output: string
}

const taskResults = ref<Record<string, TaskResult>>({})

const getStatusText = (status: string) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'failed':
      return '失败'
    case 'running':
      return '执行中'
    case 'retry':
      return '重试中'
    default:
      return '等待中'
  }
}

const updateTaskResult = (result: TaskResult) => {
  taskResults.value[result.taskId] = {
    ...taskResults.value[result.taskId],
    ...result,
    output: (taskResults.value[result.taskId]?.output || '') + (result.output || '')
  }
}
</script>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.red-box {
  color: #fff;
  background: #f00;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
  margin-right: 8px;
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
  display: flex;
  align-items: center;
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

/* .task-status.success {
  background-color: #d4edda;
  color: #155724;
}

.task-status.failed {
  background-color: #f8d7da;
  color: #721c24;
}

.task-status.running {
  background-color: #e2e3e5;
  color: #383d41;
} */

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.task-status.success .status-dot {
  background-color: #28a745;
}

.task-status.failed .status-dot {
  background-color: #dc3545;
}

.task-status.running .status-dot {
  background-color: #6c757d;
  animation: pulse 1.5s infinite;
}

.task-status.retry {
  background-color: #fff3cd;
  color: #856404;
}

.task-status.retry .status-dot {
  background-color: #ffc107;
  animation: spin 1s linear infinite;
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
  background-color: #007aff;
  color: white;
}

/* .message.system .message-content {
  background-color: #f0f0f0;
  color: #333;
} */

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

.dot:nth-child(1) {
  animation-delay: -0.32s;
}
.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:deep(.n-step-indicator) {
  width: 16px;
  height: 16px;
}
:deep(.n-step-splitor) {
  left: 7px !important;
  bottom: 0px !important;
}
:deep(.n-steps .n-step-content .n-step-content-header) {
  margin-top: 0px;
  width: 100% !important;
}
/* :deep(.n-step-content-header__title) {
  width: 100% !important;
  flex: auto !important;
} */
/* :deep(.n-collapse .n-collapse-item .n-collapse-item__header .n-collapse-item__header-main) {
  justify-content: space-between;
} */

.task-result {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  border: 1px solid #e9ecef;
}

.task-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.task-result-title {
  font-weight: 500;
  color: #495057;
}

.task-result-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.task-result-status.success {
  background-color: #d4edda;
  color: #155724;
}

.task-result-status.failed {
  background-color: #f8d7da;
  color: #721c24;
}

.task-result-status.running {
  background-color: #e2e3e5;
  color: #383d41;
}

.task-result-status.retry {
  background-color: #fff3cd;
  color: #856404;
}

.task-result-content {
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.9em;
  color: #212529;
  max-height: 200px;
  overflow-y: auto;
}

.task-result-content pre {
  margin: 0;
  padding: 0;
}

.message.task .message-content {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
}

.message.task .message-content.success {
  background-color: #d4edda;
  color: #155724;
}

.message.task .message-content.failed {
  background-color: #f8d7da;
  color: #721c24;
}

.message.task .message-content.running {
  background-color: #e2e3e5;
  color: #383d41;
}

.message.task .message-content.retry {
  background-color: #fff3cd;
  color: #856404;
}
</style>
