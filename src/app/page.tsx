"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button, Input } from "@/components/ui";
import { ArrowRightIcon, ChatBubbleIcon } from "@/components/icons";
import { useCurrentUser, setStoredUser } from "@/lib/user";

export default function LandingPage() {
  const router = useRouter();
  const existingUser = useCurrentUser();
  const [inputName, setInputName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentName = inputName !== null ? inputName : (existingUser ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = currentName.trim();

    if (!trimmed) {
      setError("Please enter a display name to continue.");
      return;
    }

    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (trimmed.length > 30) {
      setError("Name cannot exceed 30 characters.");
      return;
    }

    setError(null);
    setStoredUser(trimmed);
    router.push("/chat");
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xs rounded-[3px] shadow-2xs border border-zinc-200 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-50 text-[#1c8fca] mb-3">
              <ChatBubbleIcon className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#3d4146] tracking-tight">
              Join the Chat
            </h1>
            <p className="text-sm text-[#8c9ba5] mt-1.5">
              Enter your name below to start messaging with the team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="display-name"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Your Display Name
              </label>
              <Input
                id="display-name"
                type="text"
                autoFocus
                value={currentName}
                onChange={(e) => {
                  setInputName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. John Doe"
                maxLength={30}
                error={!!error}
              />
              {error && (
                <p className="text-xs text-red-500 mt-1.5" role="alert">
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" fullWidth size="lg">
              <span>{existingUser ? "Continue to Chat" : "Enter Chat"}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Button>
          </form>

          {existingUser && (
            <p className="text-center text-xs text-zinc-500 mt-4">
              Currently saved as <strong className="text-zinc-700">{existingUser}</strong>.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
