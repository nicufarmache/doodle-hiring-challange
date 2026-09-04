"use client";

import { useSyncExternalStore } from "react";

const USER_STORAGE_KEY = "doodle_chat_author";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("doodle_user_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("doodle_user_change", callback);
  };
}

export function getStoredUser(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(USER_STORAGE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function setStoredUser(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(USER_STORAGE_KEY, trimmed);
      window.dispatchEvent(new Event("doodle_user_change"));
    }
  } catch {
    // ignore
  }
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.dispatchEvent(new Event("doodle_user_change"));
  } catch {
    // ignore
  }
}

export function useCurrentUser(): string | null {
  return useSyncExternalStore(
    subscribe,
    getStoredUser,
    () => null
  );
}
