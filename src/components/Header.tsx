"use client";

import { UserIcon } from "@/components/icons";

interface HeaderProps {
  currentUser?: string;
  onAuthorChange?: (newAuthor: string) => void;
}

export function Header({ currentUser = "You", onAuthorChange }: HeaderProps) {
  const handleEdit = () => {
    const next = window.prompt("Enter your display name:", currentUser);
    if (next && next.trim() && next.trim() !== currentUser) {
      onAuthorChange?.(next.trim());
    }
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-xs border-b border-zinc-200/90 sticky top-0 z-10 shadow-2xs">
      <div className="w-full max-w-[640px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-[#3d4146] tracking-tight">
          <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#1c8fca]" />
          <span>Doodle Chat</span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#8c9ba5]">
          <span className="inline-flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-[#8c9ba5]" />
            <span>
              Chatting as <strong className="font-semibold text-[#3d4146]">{currentUser}</strong>
            </span>
          </span>
          {onAuthorChange && (
            <>
              <span className="text-zinc-300">|</span>
              <button
                type="button"
                onClick={handleEdit}
                className="text-[#1c8fca] hover:underline font-medium cursor-pointer"
              >
                Change
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
