import { Task, TaskResult, TaskExecutor } from "../ai/types";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

export class DefaultTaskExecutor implements TaskExecutor {
  private taskResults: Map<string, TaskResult> = new Map();

  async canExecute(task: Task): Promise<boolean> {
    // 检查依赖是否满足
    if (task.dependencies) {
      for (const dep of task.dependencies) {
        const result = this.taskResults.get(dep);
        if (!result || result.status === "failed") {
          return false;
        }
      }
    }
    return true;
  }

  async execute(task: Task): Promise<TaskResult> {
    try {
      if (!(await this.canExecute(task))) {
        return {
          taskId: task.id,
          status: "failed",
          error: "Dependencies not satisfied",
        };
      }

      let result: TaskResult = {
        taskId: task.id,
        status: "success",
        output: "",
      };

      switch (task.type) {
        case "shell":
          result = await this.executeShellTask(task);
          break;
        case "file":
          result = await this.executeFileTask(task);
          break;
        case "npm":
          result = await this.executeNpmTask(task);
          break;
        default:
          result = {
            taskId: task.id,
            status: "failed",
            error: `Unknown task type: ${task.type}`,
          };
      }

      this.taskResults.set(task.id, result);
      return result;
    } catch (error) {
      const result: TaskResult = {
        taskId: task.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
      this.taskResults.set(task.id, result);
      return result;
    }
  }

  private async executeShellTask(task: Task): Promise<TaskResult> {
    try {
      const { stdout, stderr } = await execAsync(task.content);
      return {
        taskId: task.id,
        status: "success",
        output: stdout || stderr,
      };
    } catch (error) {
      return {
        taskId: task.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeFileTask(task: Task): Promise<TaskResult> {
    try {
      const filePath = path.resolve(process.cwd(), task.action);
      await fs.writeFile(filePath, task.content);
      return {
        taskId: task.id,
        status: "success",
        output: `File written to ${filePath}`,
      };
    } catch (error) {
      return {
        taskId: task.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeNpmTask(task: Task): Promise<TaskResult> {
    try {
      const { stdout, stderr } = await execAsync(
        `npm ${task.action} ${task.content}`
      );
      return {
        taskId: task.id,
        status: "success",
        output: stdout || stderr,
      };
    } catch (error) {
      return {
        taskId: task.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
