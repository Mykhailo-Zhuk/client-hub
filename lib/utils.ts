import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(iso: string, locale: string = "en"): string {
  const now = new Date();
  const then = new Date(iso);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  const isUk = locale === "uk";

  if (seconds < 60) return isUk ? "щойно" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return isUk ? `${minutes} хв тому` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isUk ? `${hours} год тому` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return isUk ? `${days} дн тому` : `${days}d ago`;
  const months = Math.floor(days / 30);
  return isUk ? `${months} міс тому` : `${months}mo ago`;
}

export function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}