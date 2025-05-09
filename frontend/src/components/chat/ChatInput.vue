<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton } from 'naive-ui'

defineProps<{
  disabled?: boolean
  isWaiting?: boolean  // 新增：等待状态
}>()

const emit = defineEmits<{
  (e: 'send', message: string): void
  (e: 'stop'): void  // 新增：停止事件
}>()

const inputMessage = ref('')

const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  emit('send', inputMessage.value)
  inputMessage.value = ''
}

const handleStop = () => {  // 新增：停止处理函数
  emit('stop')
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="chat-input">
    <n-input
      v-model:value="inputMessage"
      type="textarea"
      :autosize="{ minRows: 1, maxRows: 4 }"
      placeholder="输入消息..."
      @keydown="handleKeyDown"
      class="flex-1"
      :disabled="isWaiting"  
    />
    <n-button 
      :type="isWaiting ? 'error' : 'primary'" 
      @click="isWaiting ? handleStop() : sendMessage()"  
      :disabled="disabled"
    >
      {{ isWaiting ? '停止' : '发送' }}  
    </n-button>
  </div>
</template>