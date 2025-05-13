<template>
  <n-layout-content class="h-full p-4">
    <div class="browser-preview">
      <!-- <browser-toolbar @navigate="handleNavigate" /> -->
      <div class="browser-content" style="overflow: auto; max-height: 80vh">
        <div v-if="currentTask" class="task-status mb-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-medium">当前任务:</span>
            <span class="text-sm">{{ currentTask.title }}</span>
          </div>
          <div class="text-sm text-gray-600">{{ currentTask.description }}</div>
        </div>
        <div
          v-for="(log, i) in typingLogs"
          :key="'log-' + i"
          style="
            color: #333;
            font-size: 14px;
            margin-bottom: 8px;
            white-space: pre-wrap;
            font-family: 'Fira Mono', 'Consolas', monospace;
          "
        >
          {{ log.display
          }}<span v-if="log.display.length < log.text.length" class="blinking-cursor">|</span>
        </div>
        <div v-for="(img, i) in images" :key="'img-' + i" style="margin-bottom: 12px">
          <img
            :src="'data:image/png;base64,' + img"
            style="max-width: 100%; border-radius: 6px; box-shadow: 0 2px 8px #0001"
          />
        </div>
      </div>
    </div>
  </n-layout-content>
</template>

<script setup lang="ts" name="BrowserPanel">
import { NLayoutContent } from 'naive-ui'
import { onUnmounted, ref } from 'vue'

const logs = ref<string[]>([])
const images = ref<string[]>([])
const typingLogs = ref<Array<{ text: string; display: string; timer?: any }>>([])
const currentTask = ref<{
  title: string
  description: string
  status: string
} | null>(null)

const emit = defineEmits<{
  (e: 'navigate', url: string): void
}>()

// 打字机效果渲染日志
const addLog = (log: string) => {
  // 如果和上一条一样则合并
  if (
    typingLogs.value.length &&
    log.startsWith(typingLogs.value[typingLogs.value.length - 1].text)
  ) {
    typingLogs.value[typingLogs.value.length - 1].text = log
    return
  }
  const logObj: { text: string; display: string; timer?: any } = { text: log, display: '' }
  typingLogs.value.push(logObj)
  let i = 0
  const type = () => {
    if (i <= log.length) {
      logObj.display = log.slice(0, i)
      i++
      logObj.timer = setTimeout(type, 10)
    }
  }
  type()
}

// 新增：追加图片
const addImage = (image: string) => {
  images.value.push(image)
}

// 兼容旧接口
const updateContent = (image: string) => {
  images.value = [image]
}

// 更新当前任务状态
const updateCurrentTask = (task: { title: string; description: string; status: string }) => {
  currentTask.value = task
}

// 清理定时器
const clearLogs = () => {
  typingLogs.value.forEach(l => l.timer && clearTimeout(l.timer))
  typingLogs.value = []
}

onUnmounted(() => {
  typingLogs.value.forEach(l => l.timer && clearTimeout(l.timer))
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
