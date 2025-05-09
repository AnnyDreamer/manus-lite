import { WebSocketServer } from "ws";
import { AIServiceFactory } from "./services/ai/factory";
import { config } from "./config";
import { DefaultTaskParser } from "./services/tasks/parser";
import { DefaultTaskExecutor } from "./services/tasks/executor";
import { v4 as uuidv4 } from "uuid";

const wss = new WebSocketServer({ port: config.port });
const aiService = AIServiceFactory.createService(
  "moonshot",
  config.moonshotApiKey
);
const taskParser = new DefaultTaskParser();
const taskExecutor = new DefaultTaskExecutor();

console.log(`WebSocket server is running on port ${config.port}`);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Received message:", data);

      switch (data.type) {
        case "message":
          const response = await aiService.chat(data.content);
          if (taskParser.canParse(response.content)) {
            const tasks = taskParser.parse(response.content);
            const results = [];

            for (const task of tasks) {
              task.id = uuidv4();
              const result = await taskExecutor.execute(task);
              results.push(result);
            }

            ws.send(
              JSON.stringify({
                type: "task_results",
                content: results,
              })
            );
          }

          ws.send(
            JSON.stringify({
              type: "message",
              content: response.content,
            })
          );
          break;

        case "navigate":
          // 处理浏览器导航请求
          ws.send(
            JSON.stringify({
              type: "browser_screenshot",
              content: "data:image/png;base64,...", // 这里应该是实际的截图数据
            })
          );
          break;

        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;

        default:
          console.warn("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          content:
            error instanceof Error ? error.message : "Unknown error occurred",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
