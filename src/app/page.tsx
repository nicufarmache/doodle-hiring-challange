"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { MessageItem } from "@/components/MessageItem";
import { Button, Input } from "@/components/ui";
import { ArrowRightIcon, ChatOutlineIcon, UserIcon } from "@/components/icons";
import { useChat } from "@/hooks/useChat";

function ChatApp() {
  const searchParams = useSearchParams();

  // If ?author=Name is provided in the URL query, start with it; otherwise require user entry
  const initialAuthor = searchParams.get("author")?.trim().slice(0, 30) || "";
  const [author, setAuthor] = useState<string | null>(initialAuthor || null);
  const [usernameInput, setUsernameInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [unreadBelow, setUnreadBelow] = useState(false);

  const messageInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isNearBottomRef = useRef(true);
  const prevLatestIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const {
    messages,
    isLoading,
    isSending,
    isLoadingOlder,
    hasMoreOlder,
    error,
    sendMessage,
    retryMessage,
    dismissMessage,
    loadOlderMessages,
    refresh,
  } = useChat(author);

  // Automatically focus message input when author is set, or username input when resetting
  useEffect(() => {
    if (author) {
      messageInputRef.current?.focus();
    } else {
      usernameInputRef.current?.focus();
    }
  }, [author]);

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    setAuthor(trimmed);
  };

  const handleResetUsername = () => {
    setUsernameInput(author || "");
    setAuthor(null);
  };

  const handleScroll = () => {
    if (!mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 120;
    isNearBottomRef.current = nearBottom;
    if (nearBottom && unreadBelow) {
      setUnreadBelow(false);
    }
  };

  // Auto-scroll on new messages or show unread indicator when scrolled up
  useEffect(() => {
    if (messages.length === 0) return;

    const latestMsg = messages[messages.length - 1];

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevLatestIdRef.current = latestMsg._id;
      if (mainRef.current) {
        mainRef.current.scrollTop = mainRef.current.scrollHeight;
      }
      return;
    }

    // Only react when a NEW message has been appended at the bottom
    // (ignores prepended older messages from historical pagination)
    if (latestMsg._id !== prevLatestIdRef.current) {
      prevLatestIdRef.current = latestMsg._id;
      if (isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        setUnreadBelow(true);
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    setUnreadBelow(false);
    isNearBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoadOlder = async () => {
    if (!mainRef.current || isLoadingOlder) return;
    const prevScrollHeight = mainRef.current.scrollHeight;
    const prevScrollTop = mainRef.current.scrollTop;

    await loadOlderMessages();

    requestAnimationFrame(() => {
      if (mainRef.current) {
        const newScrollHeight = mainRef.current.scrollHeight;
        mainRef.current.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
      }
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text || !author) return;

    setMessageInput("");
    isNearBottomRef.current = true;
    setUnreadBelow(false);
    await sendMessage(text);
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden relative">
      {/* Top Header */}
      <Header currentUser={author} onAuthorChange={handleResetUsername} />

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

      {/* Main Chat Stream Container (Messages always visible) */}
      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 w-full max-w-[640px] mx-auto px-6 flex flex-col justify-start overflow-y-auto py-4 space-y-4"
        aria-live="polite"
        role="log"
      >
        {/* Load Earlier Messages Button (Pagination) */}
        {hasMoreOlder && messages.length > 0 && (
          <div className="flex justify-center pt-1 pb-2">
            <button
              type="button"
              onClick={handleLoadOlder}
              disabled={isLoadingOlder}
              className="text-xs text-[#1c8fca] hover:text-[#136b99] bg-white/95 border border-zinc-200/90 rounded-[3px] px-3.5 py-1.5 shadow-2xs transition-all hover:shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2 font-medium"
            >
              {isLoadingOlder ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#1c8fca] border-t-transparent rounded-full animate-spin" />
                  <span>Loading earlier messages...</span>
                </>
              ) : (
                <span>↑ Load earlier messages</span>
              )}
            </button>
          </div>
        )}

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
              No messages yet. Choose a name below to start chatting.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isSelf =
                !!author &&
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

      {/* Floating Pill: New messages below */}
      {unreadBelow && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
          <button
            type="button"
            onClick={scrollToBottom}
            className="bg-[#1c8fca] hover:bg-[#1572a1] text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 animate-bounce"
            aria-label="Scroll to new messages below"
          >
            <span>↓ New messages</span>
          </button>
        </div>
      )}

      {/* Bottom Dock: Distinct Login Form OR Standard Message Bar */}
      {author ? (
        <footer className="w-full bg-[#1c8fca] shrink-0 shadow-xs">
          <form
            onSubmit={handleSendMessage}
            className="w-full max-w-[640px] mx-auto px-2 sm:px-6 py-2 flex items-center gap-2"
          >
            <div className="flex-1 relative flex items-center">
              <Input
                ref={messageInputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Message"
                aria-label="Chat message"
                maxLength={1000}
                className="w-full rounded-[3px] border-none shadow-none focus:ring-2 focus:ring-white/80 pr-14"
              />
              {messageInput.length > 750 && (
                <span
                  className={`absolute right-2 text-[10px] tabular-nums font-mono px-1 py-0.5 rounded ${
                    messageInput.length >= 950
                      ? "text-red-700 bg-red-100 font-bold"
                      : "text-amber-800 bg-amber-100"
                  }`}
                >
                  {messageInput.length}/1000
                </span>
              )}
            </div>
            <Button
              type="submit"
              size="md"
              disabled={!messageInput.trim()}
              className="rounded-[3px] px-6 active:scale-98 shrink-0"
            >
              {isSending ? "Sending..." : "Send"}
            </Button>
          </form>
        </footer>
      ) : (
        <footer className="w-full bg-white/95 backdrop-blur-xs border-t border-zinc-200/90 py-3 shadow-lg shrink-0">
          <form
            onSubmit={handleSetUsername}
            className="w-full max-w-[640px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-sky-50 text-[#1c8fca] flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#3d4146] leading-tight">
                  Join the conversation
                </p>
                <p className="text-[11px] text-[#8c9ba5] leading-tight mt-0.5">
                  Enter your display name to send messages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
              <Input
                ref={usernameInputRef}
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. John Doe"
                aria-label="Your display name"
                maxLength={30}
                className="flex-1 rounded-[3px] h-[38px] text-xs sm:text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!usernameInput.trim()}
                className="rounded-[3px] h-[38px] px-4 font-medium whitespace-nowrap active:scale-98"
              >
                <span>Join</span>
                <ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </form>
        </footer>
      )}
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
