export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIService {
  chat(message: string): Promise<AIResponse>;
  getAvailableModels(): Promise<AIModel[]>;
  setModel(modelId: string): void;
}

export interface Task {
  id: string;
  type: "shell" | "file" | "npm";
  action: string;
  content: string;
  dependencies?: string[];
  status: "pending" | "running" | "success" | "failed";
  error?: string;
}

export interface TaskResult {
  taskId: string;
  status: "success" | "failed";
  output?: string;
  error?: string;
}

export interface TaskExecutor {
  canExecute(task: Task): Promise<boolean>;
  execute(task: Task): Promise<TaskResult>;
}

export interface TaskParser {
  canParse(content: string): boolean;
  parse(content: string): Task[];
}
