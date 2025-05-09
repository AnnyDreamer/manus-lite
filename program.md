# 流程

    1.	意图解析： LLM 理解用户目标（自然语言理解 + 任务类型分类）；
    2.	任务拆解： 规划模块分解为多个子任务 终端命令？浏览器行为？文件操作？API 请求；
    3.	脚本生成： 自动生成脚本（如 Python node shell 脚本）；
    4.	工具调度（多工具协作）： 启动浏览器自动化模块（Puppeteer、Playwright），执行任务；
    5.	状态监测： 检查任务成功与否，如失败则尝试修复；
    6.	结果反馈： 数据文件 / 网页链接 / 日志等结果。

# 功能实现

1️⃣ Manus 后端运行一个“受控沙盒环境”

通常是基于 Docker 容器 或 VM 虚拟机，预装开发工具，环境可重置。
• 每个用户任务分配一个沙盒；
• 沙盒中运行 Linux shell；
• 允许执行 mkdir、cd、cp 等命令；
• 对文件系统和命令行做权限隔离（避免危害宿主机）。

2️⃣ LLM（大语言模型）生成任务步骤与 Shell 命令
• 模型根据任务目标自动生成 shell 命令；
• 后端接收命令并发送到沙盒；
• 这些命令如 cd && cp 会被直接发送给 Linux Shell 执行。

3️⃣ 后端将“终端标准输出 stdout”实时捕获
• 后端用 WebSocket 或 Server-Sent Events 技术与前端通信；
• 命令在沙盒中执行时，stdout 和 stderr（标准错误）都会被实时收集；
• 输出以“逐行”或“字符流”的形式推送到前端；
• 所以前端用户看到的 Shell 命令输出是动态实时更新的。

4️⃣ 前端渲染交互式终端 UI
• 类似 xterm.js 或自研的终端 UI 组件；
• 模拟 Linux Bash 风格；
• 动态渲染文本流，还可能支持滚动、播放控制等交互按钮。

# 交互

playwright: https://playwright.nodejs.cn/

Puppeteer: https://puppeteer.bootcss.com Puppeteer 是一个 Node 库，它提供了一个高级 API 来通过 DevTools 协议控制 Chromium 或 Chrome。Puppeteer 默认以 headless（无头）

