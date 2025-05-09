<script setup lang="ts">
import { ref } from 'vue'

const browserContent = ref<HTMLElement | null>(null)

defineExpose({
  updateContent: (image: string) => {
    if (browserContent.value) {
      browserContent.value.innerHTML = `<img src="data:image/png;base64,${image}" />`
    }
  },
})
</script>

<template>
  <div class="browser-content" ref="browserContent">
    <!-- 这里将通过WebSocket接收浏览器截图并显示 -->
  </div>
</template>
