<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { MenuUnfoldOutlined } from '@vicons/antd'

defineProps<{
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isCollapsed', value: boolean): void
}>()
</script>

<template>
  <div class="chat-header">
    <n-button v-if="isCollapsed" quaternary circle @click="emit('update:isCollapsed', false)">
      <template #icon>
        <n-icon><menu-unfold-outlined /></n-icon>
      </template>
    </n-button>
    <span v-else>聊天</span>
  </div>
</template>
