"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button, Input } from "@/components/ui";
import { ChatOutlineIcon } from "@/components/icons";
import { getStoredUser, useCurrentUser } from "@/lib/user";

export default function ChatPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    // If no user exists in localStorage on the client, redirect to landing page
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/");
    }
  }, [router]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setMessageInput("");
  };

  const displayName = currentUser || (typeof window !== "undefined" ? getStoredUser() : null);

  if (!displayName) {
    return (
      <div className="flex flex-col h-dvh overflow-hidden">
        <Header />
        <main className="flex-1 w-full max-w-[640px] mx-auto px-6 flex items-center justify-center">
          <div className="text-[#8c9ba5] text-sm animate-pulse">Loading chat...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* Top Header */}
      <Header currentUser={displayName} />

      {/* Main Chat Stream Container (Mobile-first, max 640px, 24px gutters) */}
      <main
        className="flex-1 w-full max-w-[640px] mx-auto px-6 flex flex-col justify-end overflow-y-auto py-4"
        aria-live="polite"
        role="log"
      >
        {/* Empty State Placeholder */}
        <div className="flex flex-col items-center justify-center my-auto text-center p-6 bg-white/95 backdrop-blur-2xs rounded-[3px] border border-zinc-200 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1c8fca] flex items-center justify-center mb-3">
            <ChatOutlineIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-[#3d4146]">
            Welcome to the chat, {displayName}!
          </h2>
          <p className="text-xs text-[#8c9ba5] mt-1 max-w-xs">
            No messages to display right now. Use the input below to start the conversation.
          </p>
        </div>
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
            className="rounded-[3px] px-6 active:scale-98"
          >
            Send
          </Button>
        </form>
      </footer>
    </div>
  );
}
