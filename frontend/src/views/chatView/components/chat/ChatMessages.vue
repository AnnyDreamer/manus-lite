<template>
  <div class="chat-messages" ref="messagesContainer">
    <div v-for="(message, index) in props.messages" :key="index">
      <div class="message-content mb-4" :class="{ 'with-status': true }">
        {{ message.task }}
      </div>
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
                    </n-collapse-item>
                  </n-collapse>
                </template>
              </n-step>
            </template>
          </n-steps>
        </div>
      </template>
      <div v-else-if="message.type === 'message'">
        <div v-html="typingStates[index]?.display.replace(/\n/g, '<br/>')"></div>
      </div>
      <div v-else-if="message.type === 'system'">
        <span v-html="typingStates[index]?.display.replace(/\n/g, '<br/>')"></span>
      </div>
      <div v-else-if="message.type === 'task'">
        <span v-html="typingStates[index]?.display.replace(/\n/g, '<br/>')"></span>
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
import { nextTick, onMounted, ref, watch } from 'vue'

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
    default:
      return '⟳'
  }
}

const typingStates = ref<{ display: string; timer?: any }[]>([])

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 打字机效果
watch(
  () => props.messages.length,
  async (newLen, oldLen) => {
    if (newLen > oldLen) {
      const msg = props.messages[newLen - 1]
      const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      const state = { display: '' }
      typingStates.value.push(state)
      let i = 0
      const type = () => {
        if (i <= text.length) {
          state.display = text.slice(0, i)
          i++
          state.timer = setTimeout(type, 12)
        }
      }
      type()
      await nextTick()
      scrollToBottom()
    }
  },
  { immediate: true }
)

onMounted(scrollToBottom)

function handleShowDetail(item: any) {
  emit('show-detail', {
    input: item.command,
    output: item.liveContent?.content || ''
  })
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
</style>
