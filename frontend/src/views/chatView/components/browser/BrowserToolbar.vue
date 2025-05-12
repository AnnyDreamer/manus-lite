<script setup lang="ts">
import { ref } from 'vue'
import { NInput, NButton, NInputGroup } from 'naive-ui'

const currentUrl = ref('')

const emit = defineEmits<{
  (e: 'navigate', url: string): void
}>()

const navigate = () => {
  if (currentUrl.value) {
    emit('navigate', currentUrl.value)
  }
}
</script>

<template>
  <div class="browser-toolbar">
    <n-input-group>
      <n-input v-model:value="currentUrl" placeholder="输入URL" />
      <n-button type="primary" @click="navigate">访问</n-button>
    </n-input-group>
  </div>
</template>
