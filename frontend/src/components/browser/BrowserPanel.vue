<script setup lang="ts">
import { ref } from 'vue'
import { NLayoutContent } from 'naive-ui'
import BrowserToolbar from './BrowserToolbar.vue'
import BrowserContent from './BrowserContent.vue'

const emit = defineEmits<{
  (e: 'navigate', url: string): void
}>()

const browserContentRef = ref<InstanceType<typeof BrowserContent> | null>(null)

const handleNavigate = (url: string) => {
  emit('navigate', url)
}

const updateContent = (image: string) => {
  browserContentRef.value?.updateContent(image)
}

defineExpose({
  updateContent,
})
</script>

<template>
  <n-layout-content class="h-full p-4">
    <div class="browser-preview">
      <browser-toolbar @navigate="handleNavigate" />
      <browser-content ref="browserContentRef" />
    </div>
  </n-layout-content>
</template>
