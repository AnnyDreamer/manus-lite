<template>
  <n-layout-content class="h-full p-4">
    <div class="browser-preview">
      <!-- <browser-toolbar @navigate="handleNavigate" /> -->
      <div class="browser-content" ref="contentRef" style="overflow: auto; max-height: 80vh">
        <div v-if="currentTask" class="task-status mb-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-medium">当前任务:</span>
            <span class="text-sm">{{ currentTask.title }}</span>
            <span :class="['status-badge', currentTask.status]">{{
              getStatusText(currentTask.status)
            }}</span>
          </div>
          <div class="text-sm text-gray-600">{{ currentTask.description }}</div>
        </div>
        <div
          v-for="(log, i) in logs"
          :key="'log-' + i"
          class="log-item"
          :class="{ 'is-typing': log.isTyping }"
        >
          <pre class="log-content">{{ log.content }}</pre>
          <span v-if="log.isTyping" class="blinking-cursor">|</span>
        </div>
        <div v-for="(img, i) in images" :key="'img-' + i" class="image-item">
          <img :src="'data:image/png;base64,' + img" class="preview-image" />
        </div>
      </div>
    </div>
  </n-layout-content>
</template>

<script setup lang="ts" name="BrowserPanel">
import { NLayoutContent } from 'naive-ui'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

interface LogItem {
  content: string
  isTyping: boolean
  timer?: number
}

const contentRef = ref<HTMLElement | null>(null)
const logs = ref<LogItem[]>([])
const images = ref<string[]>([])
const currentTask = ref<{
  title: string
  description: string
  status: string
} | null>(null)

const emit = defineEmits<{
  (e: 'navigate', url: string): void
}>()

// 获取状态文本
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

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (contentRef.value) {
    contentRef.value.scrollTop = contentRef.value.scrollHeight
  }
}

// 添加日志
const addLog = (log: string) => {
  // 检查是否需要追加到上一条日志
  if (logs.value.length > 0) {
    const lastLog = logs.value[logs.value.length - 1]
    if (!lastLog.isTyping) {
      // 如果上一条日志已经完成，创建新日志
      const newLog: LogItem = {
        content: '',
        isTyping: true
      }
      logs.value.push(newLog)
      startTyping(newLog, log)
    } else {
      // 如果上一条日志还在打字，追加内容
      lastLog.content += log
    }
  } else {
    // 第一条日志
    const newLog: LogItem = {
      content: '',
      isTyping: true
    }
    logs.value.push(newLog)
    startTyping(newLog, log)
  }
  scrollToBottom()
}

// 打字机效果
const startTyping = (logItem: LogItem, text: string) => {
  let i = 0
  const type = () => {
    if (i <= text.length) {
      logItem.content = text.slice(0, i)
      i++
      logItem.timer = window.setTimeout(type, 10)
    } else {
      logItem.isTyping = false
      delete logItem.timer
    }
  }
  type()
}

// 新增：追加图片
const addImage = (image: string) => {
  images.value.push(image)
  scrollToBottom()
}

// 兼容旧接口
const updateContent = (image: string) => {
  images.value = [image]
  scrollToBottom()
}

// 更新当前任务状态
const updateCurrentTask = (task: { title: string; description: string; status: string }) => {
  currentTask.value = task
  scrollToBottom()
}

// 清理日志
const clearLogs = () => {
  logs.value.forEach(log => {
    if (log.timer) {
      window.clearTimeout(log.timer)
    }
  })
  logs.value = []
  images.value = []
}

onMounted(() => {
  scrollToBottom()
})

onUnmounted(() => {
  clearLogs()
})

defineExpose({
  addLog,
  addImage,
  updateContent,
  updateCurrentTask,
  clearLogs
})
</script>

<style scoped>
.browser-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 8px 12px;
  font-family: 'Fira Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-content {
  margin: 0;
  padding: 0;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.status-badge.success {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.failed {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.running {
  background-color: #e2e3e5;
  color: #383d41;
}

.status-badge.retry {
  background-color: #fff3cd;
  color: #856404;
}

.preview-image {
  max-width: 100%;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.blinking-cursor {
  display: inline-block;
  width: 1ch;
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>
