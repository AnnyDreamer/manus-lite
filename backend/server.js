const express = require("express");
const { spawn } = require("child_process");
const { chromium } = require("playwright");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { WebSocketServer } = require("ws");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// 存储活动的浏览器会话
const sessions = new Map();

// WebSocket连接处理
wss.on("connection", (ws) => {
  const sessionId = uuidv4();
  console.log(`New client connected: ${sessionId}`);

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "start_browser") {
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();

        sessions.set(sessionId, { browser, context, page });

        ws.send(
          JSON.stringify({
            type: "browser_started",
            sessionId,
          })
        );
      }

      if (data.type === "navigate") {
        const session = sessions.get(sessionId);
        console.log(session);
        if (session) {
          await session.page.goto(data.url);
          ws.send(
            JSON.stringify({
              type: "navigation_complete",
              url: data.url,
            })
          );
        }
      }
    } catch (error) {
      console.error("Error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: error.message,
        })
      );
    }
  });

  ws.on("close", async () => {
    const session = sessions.get(sessionId);
    if (session) {
      await session.browser.close();
      sessions.delete(sessionId);
    }
    console.log(`Client disconnected: ${sessionId}`);
  });
});

// API路由
app.post("/api/execute", async (req, res) => {
  try {
    const { command } = req.body;
    // 这里可以添加命令执行逻辑
    res.json({ success: true, output: "Command executed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
