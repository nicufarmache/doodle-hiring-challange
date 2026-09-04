export interface ChatMessage {
  _id: string;
  message: string;
  author: string;
  createdAt: string;
}

export interface CreateMessagePayload {
  message: string;
  author: string;
}

export type MessageStatus = "sending" | "sent" | "failed";

export interface OptimisticChatMessage extends ChatMessage {
  status?: MessageStatus;
}
