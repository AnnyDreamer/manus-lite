<script setup lang="ts">
import type { Message } from '@/types'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

interface Message {
  type: 'user' | 'system' | 'task'
  content: string
  status?: 'success' | 'failed' | 'running'
  taskId?: string
  filePath?: string
}



// {
//     "type": "message",
//     "content": "TASK: file\nACTION: 创建基于xtrem.js的组件\nDEPENDENCIES: xtrem.js\n\n```\n// 文件名: MyComponent.js\nimport xtrem from 'xtrem';\n\nexport default class MyComponent extends xtrem.Component {\n  constructor(props) {\n    super(props);\n    this.state = {\n      // 初始状态\n    };\n  }\n\n  render() {\n    return (\n      <div>\n        <h1>Hello from MyComponent</h1>\n        {/* 组件内容 */}\n      </div>\n    );\n  }\n}\n```\n\n请确保你已经安装了xtrem.js库，如果没有安装，可以使用以下命令安装：\n\nTASK: npm\nACTION: install xtrem.js\n```\nxtrem\n```"
// }

// {
//     "type": "task_results",
//     "content": [
//         {
//             "taskId": "d82ebe5f-97c9-4dcb-bd34-1d14017e11e8",
//             "status": "failed",
//             "error": "Dependencies not satisfied"
//         }
//     ]
// }

// {
//     "type": "task_results",
//     "content": [
//         {
//             "taskId": "a3908af4-b992-4429-8a87-1c83ef66a5dd",
//             "status": "running",
//             "output": "\n> manus-lite-backend@1.0.0 dev\n> ts-node-dev --respawn --transpile-only src/server.ts\n\n[INFO] 18:23:51 ts-node-dev ver. 2.0.0 (using ts-node ver. 10.9.2, typescript ver. 5.8.3)\n"
//         }
//     ]
// }

// {
//   "type": "task_plan",
//   "content": [
//     {
//       "type": "file",
//       "action": "创建一个Markdown文件并写入文件架构",
//       "content": "# 文件架构\n\n## 目录\n\n1. 引言\n2. 任务定义\n3. 支持的任务类型\n4. 示例\n\n## 引言\n\n本文档旨在描述如何使用智能助手来创建和执行任务。\n\n## 任务定义\n\n任务定义包括任务类型、动作描述和可选的依赖项。\n\n## 支持的任务类型\n\n1. shell - 执行shell命令\n2. file - 创建或修改文件\n3. npm - 执行npm命令\n\n## 示例\n\n以下是如何定义一个任务的示例："
//     },
//     {
//       "type": "file",
//       "action": "创建新的React组件",
//       "content": "import React from 'react';\n\nexport const HelloWorld = () => {\nreturn <div>Hello, World!</div>;\n};"
//     },
//     {
//       "type": "npm",
//       "action": "",
//       "content": "ACTION: install"
//     },
//     {
//       "type": "shell",
//       "action": "启动开发服务器",
//       "content": "npm run dev"
//     }
//   ]
// }

// [
//     {
//         "type": "file",
//         "action": "创建 xterm.js 组件",
//         "content": "import React, { useEffect, useRef } from 'react';\nimport { Terminal } from 'xterm';\n\nconst XtermComponent = ({ onInit }) => {\nconst termRef = useRef();\n\nuseEffect(() => {\nconst term = new Terminal({\ncursorBlink: true,\ntheme: {\nbackground: '#000',\nforeground: '#fff',\n},\n});\n\ntermRef.current.appendChild(term.element);\n\nif (onInit) {\nonInit(term);\n}\n\nterm.onData((data) => {\nconsole.log('Data from terminal', data);\n});\n\nterm.open(termRef.current);\n\nreturn () => {\nterm.destroy();\n};\n}, [onInit]);\n\nreturn <div ref={termRef} />;\n};\n\nexport default XtermComponent;"
//     }
// ]
//
const props = defineProps<{
  messages: Message[]
  isWaiting?: boolean
}>()

const messagesContainer = ref<HTMLElement | null>(null)

//

//
const typingStates = ref<{ display: string; timer?: any }[]>([])

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 监听消息变化，逐字渲染新消息
watch(
  () => props.messages.length,
  async (newLen, oldLen) => {
    if (newLen > oldLen) {
      const msg = props.messages[newLen - 1]
      if (msg.type === 'system' || msg.type === 'task') {
        const text = msg.content || ''
        const state = { display: '' }
        typingStates.value.push(state)
        let i = 0
        const type = () => {
          if (i <= text.length) {
            state.display = text.slice(0, i)
            i++
            state.timer = setTimeout(type, 12)
          }
        }
        type()
      } else {
        typingStates.value.push({ display: msg.content })
      }
      await nextTick()
      scrollToBottom()
    }
  },
  { immediate: true }
)

onMounted(scrollToBottom)

onUnmounted(() => {
  typingStates.value.forEach(s => s.timer && clearTimeout(s.timer))
})
</script>

<template>
  <div class="chat-messages" ref="messagesContainer">
    <div
      v-for="(message, index) in props.messages"
      :key="index"
      class="message"
      :class="message.type"
    >
      <div class="message-content" :class="{ 'with-status': message.type === 'task' }">
        <template v-if="message.type === 'task'">
          <div class="task-status flex items-center" :class="message.status">
            <span class="status-dot"></span>
            <!-- <span class="status-text">
              {{
                message.status === 'success'
                  ? '执行成功'
                  : message.status === 'error'
                    ? '执行失败'
                    : '执行中'
              }}
            </span> -->
          </div>
          <div class="task-content">
            <span v-html="typingStates[index]?.display.replace(/\n/g, '<br/>')"></span>
            <div v-if="message.filePath" class="file-path">文件路径: {{ message.filePath }}</div>
          </div>
        </template>
        <template v-else-if="message.type === 'system'">
          <span v-html="typingStates[index]?.display.replace(/\n/g, '<br/>')"></span>
        </template>
        <template v-else>
          {{ message.content }}
        </template>
      </div>
    </div>
    <div v-if="props.isWaiting" class="message system">
      <div class="message-content waiting">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.system {
  align-items: flex-start;
}

.message.task {
  align-items: flex-start;
  /* background-color: #f8f9fa; */
  border-radius: 8px;
  padding: 12px;
  margin: 8px 0;
}

.message-content {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 8px;
  word-break: break-word;
  display: flex;
  align-items: center;
}

.message-content.with-status {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background-color: #fff;
  border: 1px solid #e9ecef;
}

.task-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

/* .task-status.success {
  background-color: #d4edda;
  color: #155724;
}

.task-status.failed {
  background-color: #f8d7da;
  color: #721c24;
}

.task-status.running {
  background-color: #e2e3e5;
  color: #383d41;
} */

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.task-status.success .status-dot {
  background-color: #28a745;
}

.task-status.failed .status-dot {
  background-color: #dc3545;
}

.task-status.running .status-dot {
  background-color: #6c757d;
  animation: pulse 1.5s infinite;
}

.task-content {
  flex: 1;
}

.file-path {
  margin-top: 8px;
  font-size: 0.9em;
  color: #6c757d;
  font-family: monospace;
}

.message.user .message-content {
  background-color: #007aff;
  color: white;
}

.message.system .message-content {
  background-color: #f0f0f0;
  color: #333;
}

.message.system .message-content.waiting {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 16px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #666;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}
.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}
</style>
