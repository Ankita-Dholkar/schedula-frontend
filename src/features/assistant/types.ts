import type { Role } from "@/types/user";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export interface AssistantRequest {
  role: Role;
  pathname: string;
  question: string;
  history: Array<{ role: MessageRole; content: string }>;
}

export interface AssistantResponse {
  answer: string;
  suggestions?: string[];
}
