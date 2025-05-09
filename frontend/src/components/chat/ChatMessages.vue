<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'

interface Message {
  type: 'user' | 'system'
  content: string
}

const props = defineProps<{
  messages: Message[]
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
      <div class="message-content">
        {{ message.content }}
      </div>
    </div>
  </div>
</template>
