"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { MessageItem } from "@/components/MessageItem";
import { Button, Input } from "@/components/ui";
import { ChatOutlineIcon } from "@/components/icons";
import { useChat } from "@/hooks/useChat";

function ChatApp() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Author defaults to "You", customizable via ?author=YourName
  const author = searchParams.get("author")?.trim() || "You";

  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isNearBottomRef = useRef(true);

  const {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    retryMessage,
    dismissMessage,
    refresh,
  } = useChat(author);

  const handleAuthorChange = (newAuthor: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("author", newAuthor);
    router.push(`/?${params.toString()}`);
  };

  // Track if user is scrolled near bottom
  const handleScroll = () => {
    if (!mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;
  };

  // Auto-scroll to latest message if near bottom
  useEffect(() => {
    if (isNearBottomRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text) return;

    setMessageInput("");
    isNearBottomRef.current = true;
    await sendMessage(text);
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* Top Header */}
      <Header currentUser={author} onAuthorChange={handleAuthorChange} />

      {/* Error notification banner if fetch failed */}
      {error && (
        <div className="w-full max-w-[640px] mx-auto px-6 pt-3">
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-[3px] flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={refresh}
              className="underline font-medium hover:text-red-900 cursor-pointer ml-2"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Stream Container (Mobile-first, max 640px, 24px gutters) */}
      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 w-full max-w-[640px] mx-auto px-6 flex flex-col justify-start overflow-y-auto py-4 space-y-4"
        aria-live="polite"
        role="log"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center my-auto text-[#8c9ba5] text-sm">
            <div className="w-5 h-5 border-2 border-[#1c8fca] border-t-transparent rounded-full animate-spin mb-2" />
            <span>Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center my-auto text-center p-6 bg-white/95 backdrop-blur-2xs rounded-[3px] border border-zinc-200 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1c8fca] flex items-center justify-center mb-3">
              <ChatOutlineIcon className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-[#3d4146]">
              Welcome to Doodle Chat!
            </h2>
            <p className="text-xs text-[#8c9ba5] mt-1 max-w-xs">
              No messages yet. Send a message below to start chatting.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isSelf =
                msg.author.trim().toLowerCase() === author.trim().toLowerCase();
              return (
                <MessageItem
                  key={msg._id}
                  message={msg}
                  isSelf={isSelf}
                  onRetry={retryMessage}
                  onDismiss={dismissMessage}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Bottom Message Input Bar (Exact 8px mobile padding, #1c8fca blue, 640px max width) */}
      <footer className="w-full bg-[#1c8fca] shrink-0 shadow-xs">
        <form
          onSubmit={handleSendMessage}
          className="w-full max-w-[640px] mx-auto px-2 sm:px-6 py-2 flex items-center gap-2"
        >
          <Input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Message"
            aria-label="Chat message"
            className="flex-1 rounded-[3px] border-none shadow-none focus:ring-2 focus:ring-white/80"
          />
          <Button
            type="submit"
            size="md"
            disabled={!messageInput.trim()}
            className="rounded-[3px] px-6 active:scale-98"
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
        </form>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-dvh overflow-hidden">
          <Header />
          <main className="flex-1 w-full max-w-[640px] mx-auto px-6 flex items-center justify-center">
            <div className="text-[#8c9ba5] text-sm animate-pulse">Loading chat...</div>
          </main>
        </div>
      }
    >
      <ChatApp />
    </Suspense>
  );
}
