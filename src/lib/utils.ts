import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatYouTubeEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("youtube.com/embed/")) return url;
  // Match youtu.be/<id>
  const matchShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (matchShort) return `https://www.youtube.com/embed/${matchShort[1]}`;
  // Match youtube.com/watch?v=<id>
  const matchWatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (matchWatch) return `https://www.youtube.com/embed/${matchWatch[1]}`;
  return url;
}

