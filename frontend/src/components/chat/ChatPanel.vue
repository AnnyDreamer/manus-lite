<script setup lang="ts">
import { ref } from 'vue'
import { NLayoutSider } from 'naive-ui'
import ChatHeader from './ChatHeader.vue'
import ChatMessages from './ChatMessages.vue'
import ChatInput from './ChatInput.vue'

interface Message {
  type: 'user' | 'system'
  content: string
}

const props = defineProps<{
  isCollapsed: boolean
  sidebarWidth: string | number
}>()

const emit = defineEmits<{
  (e: 'update:isCollapsed', value: boolean): void
  (e: 'send', message: string): void
}>()

const messages = ref<Message[]>([])

const handleSend = (message: string) => {
  messages.value.push({
    type: 'user',
    content: message,
  })
  emit('send', message)
}

const addSystemMessage = (content: string) => {
  messages.value.push({
    type: 'system',
    content,
  })
}

defineExpose({
  addSystemMessage,
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
      <chat-messages :messages="messages" />
      <chat-input @send="handleSend" />
    </div>
  </n-layout-sider>
</template>
