"use client";

import Link from "next/link";
import { UserIcon } from "@/components/icons";
import { useCurrentUser } from "@/lib/user";
import { useHydrated } from "@/hooks/useHydrated";

interface HeaderProps {
  currentUser?: string | null;
}

export function Header({ currentUser: explicitUser }: HeaderProps) {
  const storeUser = useCurrentUser();
  const isHydrated = useHydrated();

  // Avoid SSR hydration mismatch by only rendering client-persisted user after hydration
  const user = isHydrated ? (explicitUser !== undefined ? explicitUser : storeUser) : null;

  return (
    <header className="w-full bg-white/95 backdrop-blur-xs border-b border-zinc-200/90 sticky top-0 z-10 shadow-2xs">
      <div className="w-full max-w-[640px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-[#3d4146] tracking-tight hover:opacity-85 transition-opacity"
        >
          <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#1c8fca]" />
          <span>Doodle Chat</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#8c9ba5]">
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#8c9ba5]" />
              <span>
                Chatting as <strong className="font-semibold text-[#3d4146]">{user}</strong>
              </span>
            </span>
            <span className="text-zinc-300">|</span>
            <Link
              href="/"
              className="text-[#1c8fca] hover:underline font-medium cursor-pointer"
            >
              Change
            </Link>
          </div>
        ) : (
          <span className="text-xs text-[#8c9ba5]">Pick a name to chat</span>
        )}
      </div>
    </header>
  );
}
