"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatMessage } from "@/types/message";

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isSending: boolean;
  sendMessage: (messageText: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

function sortByCreatedAt(a: ChatMessage, b: ChatMessage): number {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function useChat(currentUser: string | null): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ChatMessage[] = await res.json();
      const sorted = (Array.isArray(data) ? data : []).sort(sortByCreatedAt);
      setMessages(sorted);
      setError(null);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Unable to load chat messages. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (messageText: string): Promise<boolean> => {
      const trimmed = messageText.trim();
      if (!trimmed || !currentUser) return false;

      setIsSending(true);
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author: currentUser,
            message: trimmed,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const newMessage: ChatMessage = await res.json();
        setMessages((prev) => [...prev, newMessage].sort(sortByCreatedAt));
        return true;
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Failed to send message. Please try again.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [currentUser]
  );

  // Initial load on mount
  useEffect(() => {
    let isSubscribed = true;

    async function init() {
      try {
        const res = await fetch("/api/messages", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ChatMessage[] = await res.json();
        if (isSubscribed) {
          const sorted = (Array.isArray(data) ? data : []).sort(sortByCreatedAt);
          setMessages(sorted);
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          console.error("Initial load failed:", err);
          setError("Unable to load chat messages.");
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    isSending,
    sendMessage,
    refresh: fetchMessages,
  };
}
