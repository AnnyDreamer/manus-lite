import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  moonshotApiKey: process.env.MOONSHOT_API_KEY || "",
  port: parseInt(process.env.PORT || "3000", 10),
};
