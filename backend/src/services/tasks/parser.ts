import { Task, TaskParser } from "../ai/types";

export class DefaultTaskParser implements TaskParser {
  canParse(content: string): boolean {
    // 检查是否包含任务标记
    return content.includes("```") || content.includes("TASK:");
  }

  parse(content: string): Task[] {
    const tasks: Task[] = [];
    const lines = content.split("\n");
    let currentTask: Partial<Task> | null = null;
    let inCodeBlock = false;
    let codeContent = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检查任务标记
      if (line.startsWith("TASK:")) {
        if (currentTask) {
          tasks.push(currentTask as Task);
        }
        const taskType = line.substring(5).trim().toLowerCase();
        currentTask = {
          type: taskType as Task["type"],
          action: "",
          content: "",
          status: "pending",
        };
        continue;
      }

      // 检查代码块
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          if (currentTask) {
            currentTask.content = codeContent.trim();
            tasks.push(currentTask as Task);
            currentTask = null;
          }
          codeContent = "";
        }
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        codeContent += line + "\n";
      } else if (currentTask) {
        // 解析任务属性
        if (line.startsWith("ACTION:")) {
          currentTask.action = line.substring(7).trim();
        } else if (line.startsWith("DEPENDENCIES:")) {
          currentTask.dependencies = line
            .substring(13)
            .trim()
            .split(",")
            .map((dep) => dep.trim());
        }
      }
    }

    // 添加最后一个任务
    if (currentTask) {
      tasks.push(currentTask as Task);
    }

    return tasks;
  }
}
