<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton } from 'naive-ui'

const inputMessage = ref('')

const emit = defineEmits<{
  (e: 'send', message: string): void
}>()

const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  emit('send', inputMessage.value)
  inputMessage.value = ''
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
    />
    <n-button type="primary" @click="sendMessage">发送</n-button>
  </div>
</template>
