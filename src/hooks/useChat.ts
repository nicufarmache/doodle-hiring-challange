"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage, OptimisticChatMessage } from "@/types/message";

export interface UseChatReturn {
  messages: OptimisticChatMessage[];
  isLoading: boolean;
  error: string | null;
  isSending: boolean;
  isLoadingOlder: boolean;
  hasMoreOlder: boolean;
  sendMessage: (messageText: string) => Promise<boolean>;
  retryMessage: (tempId: string) => Promise<boolean>;
  dismissMessage: (tempId: string) => void;
  loadOlderMessages: () => Promise<void>;
  refresh: () => Promise<void>;
}

const BASE_POLL_INTERVAL_MS = 3000;
const MAX_POLL_INTERVAL_MS = 30000;
const INITIAL_LIMIT = 25;
const PAGINATION_LIMIT = 15;

function sortByCreatedAt(a: ChatMessage, b: ChatMessage): number {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function useChat(currentUser: string | null): UseChatReturn {
  const [messages, setMessages] = useState<OptimisticChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const latestTimestampRef = useRef<string | null>(null);
  const oldestTimestampRef = useRef<string | null>(null);
  const currentIntervalRef = useRef<number>(BASE_POLL_INTERVAL_MS);
  const isSyncingRef = useRef<boolean>(false);

  // Sync new messages from the server using the ?after timestamp
  const syncNewMessages = useCallback(async () => {
    if (isSyncingRef.current || !latestTimestampRef.current) return;
    isSyncingRef.current = true;

    try {
      const url = `/api/messages?after=${encodeURIComponent(latestTimestampRef.current)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const incoming: ChatMessage[] = await res.json();

      if (Array.isArray(incoming) && incoming.length > 0) {
        setMessages((prev) => {
          const map = new Map<string, OptimisticChatMessage>();
          for (const msg of prev) {
            map.set(msg._id, msg);
          }

          for (const serverMsg of incoming) {
            map.set(serverMsg._id, serverMsg);

            // Reconcile: If a temporary optimistic message matches the author and text, remove it
            for (const [id, m] of map.entries()) {
              if (
                id.startsWith("temp-") &&
                m.author === serverMsg.author &&
                m.message === serverMsg.message
              ) {
                map.delete(id);
              }
            }
          }

          const sorted = Array.from(map.values()).sort(sortByCreatedAt);

          // Update latest and oldest timestamps
          for (let i = sorted.length - 1; i >= 0; i--) {
            if (!sorted[i]._id.startsWith("temp-")) {
              latestTimestampRef.current = sorted[i].createdAt;
              break;
            }
          }
          if (sorted.length > 0 && !oldestTimestampRef.current) {
            oldestTimestampRef.current = sorted[0].createdAt;
          }

          return sorted;
        });
      }

      // Reset polling interval on successful response
      currentIntervalRef.current = BASE_POLL_INTERVAL_MS;
      setError(null);
    } catch (err) {
      console.error("Sync error:", err);
      // Exponential backoff up to max
      currentIntervalRef.current = Math.min(
        currentIntervalRef.current * 2,
        MAX_POLL_INTERVAL_MS
      );
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Fetch older history (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (isLoadingOlder || !hasMoreOlder || !oldestTimestampRef.current) return;
    setIsLoadingOlder(true);

    try {
      const url = `/api/messages?before=${encodeURIComponent(
        oldestTimestampRef.current
      )}&limit=${PAGINATION_LIMIT}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const olderData: ChatMessage[] = await res.json();

      if (!Array.isArray(olderData) || olderData.length === 0) {
        setHasMoreOlder(false);
      } else {
        if (olderData.length < PAGINATION_LIMIT) {
          setHasMoreOlder(false);
        }

        const sortedOlder = olderData.sort(sortByCreatedAt);
        oldestTimestampRef.current = sortedOlder[0].createdAt;

        setMessages((prev) => {
          const map = new Map<string, OptimisticChatMessage>();
          for (const m of sortedOlder) {
            map.set(m._id, m);
          }
          for (const m of prev) {
            map.set(m._id, m);
          }
          return Array.from(map.values()).sort(sortByCreatedAt);
        });
      }
    } catch (err) {
      console.error("Failed to load older messages:", err);
      setError("Unable to load earlier messages.");
    } finally {
      setIsLoadingOlder(false);
    }
  }, [hasMoreOlder, isLoadingOlder]);

  // Full manual refresh
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?limit=${INITIAL_LIMIT}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ChatMessage[] = await res.json();
      const sorted = (Array.isArray(data) ? data : []).sort(sortByCreatedAt);
      setMessages(sorted);
      if (sorted.length > 0) {
        latestTimestampRef.current = sorted[sorted.length - 1].createdAt;
        oldestTimestampRef.current = sorted[0].createdAt;
      }
      currentIntervalRef.current = BASE_POLL_INTERVAL_MS;
      setError(null);
    } catch (err) {
      console.error("Refresh failed:", err);
      setError("Unable to reload messages.");
    }
  }, []);

  // Send a message optimistically
  const sendMessage = useCallback(
    async (messageText: string): Promise<boolean> => {
      const trimmed = messageText.trim();
      if (!trimmed || !currentUser) return false;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticMsg: OptimisticChatMessage = {
        _id: tempId,
        author: currentUser,
        message: trimmed,
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      setMessages((prev) => [...prev, optimisticMsg]);
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

        const savedMsg: ChatMessage = await res.json();

        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempId ? { ...savedMsg, status: "sent" as const } : msg
          )
        );

        if (
          !latestTimestampRef.current ||
          new Date(savedMsg.createdAt).getTime() >
            new Date(latestTimestampRef.current).getTime()
        ) {
          latestTimestampRef.current = savedMsg.createdAt;
        }

        return true;
      } catch (err) {
        console.error("Failed to send message:", err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempId ? { ...msg, status: "failed" as const } : msg
          )
        );
        setError("Failed to send message. Click retry to try again.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [currentUser]
  );

  // Retry sending a previously failed message
  const retryMessage = useCallback(
    async (tempId: string): Promise<boolean> => {
      const target = messages.find((m) => m._id === tempId);
      if (!target || !currentUser) return false;

      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: "sending" as const } : m))
      );
      setIsSending(true);

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author: currentUser,
            message: target.message,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const savedMsg: ChatMessage = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId ? { ...savedMsg, status: "sent" as const } : m
          )
        );

        if (
          !latestTimestampRef.current ||
          new Date(savedMsg.createdAt).getTime() >
            new Date(latestTimestampRef.current).getTime()
        ) {
          latestTimestampRef.current = savedMsg.createdAt;
        }

        return true;
      } catch (err) {
        console.error("Retry failed:", err);
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, status: "failed" as const } : m))
        );
        setError("Retry failed. Please check your connection.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [currentUser, messages]
  );

  // Dismiss a failed message
  const dismissMessage = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== tempId));
  }, []);

  // Lifecycle: single initial fetch, with polling scheduled ONLY after initialization
  useEffect(() => {
    let isSubscribed = true;
    let timerId: NodeJS.Timeout | null = null;

    const schedulePoll = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(async () => {
        if (!isSubscribed) return;
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
          return;
        }
        await syncNewMessages();
        if (
          isSubscribed &&
          typeof document !== "undefined" &&
          document.visibilityState === "visible"
        ) {
          schedulePoll();
        }
      }, currentIntervalRef.current);
    };

    const abortController = new AbortController();

    async function init() {
      try {
        const res = await fetch(`/api/messages?limit=${INITIAL_LIMIT}`, {
          cache: "no-store",
          signal: abortController.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ChatMessage[] = await res.json();
        if (isSubscribed) {
          const sorted = (Array.isArray(data) ? data : []).sort(sortByCreatedAt);
          setMessages(sorted);
          if (sorted.length > 0) {
            latestTimestampRef.current = sorted[sorted.length - 1].createdAt;
            oldestTimestampRef.current = sorted[0].createdAt;
          }
          if (sorted.length < INITIAL_LIMIT) {
            setHasMoreOlder(false);
          }
          setError(null);
          // Start polling interval only after initial messages are loaded
          schedulePoll();
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
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

    const handleVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        currentIntervalRef.current = BASE_POLL_INTERVAL_MS;
        if (latestTimestampRef.current) {
          syncNewMessages().then(() => {
            if (isSubscribed) schedulePoll();
          });
        }
      } else {
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      isSubscribed = false;
      abortController.abort();
      if (timerId) clearTimeout(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [syncNewMessages]);

  return {
    messages,
    isLoading,
    error,
    isSending,
    isLoadingOlder,
    hasMoreOlder,
    sendMessage,
    retryMessage,
    dismissMessage,
    loadOlderMessages,
    refresh,
  };
}
