import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatYouTubeEmbedUrl(url: string): string {
  if (!url) return "";

  let source = url.trim();
  const iframeSource = source.match(
    /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i
  );

  if (iframeSource?.[1]) {
    source = iframeSource[1].replace(/&amp;/g, "&");
  }

  if (source.startsWith("//")) {
    source = `https:${source}`;
  }

  if (
    source.includes("youtube.com/embed/") ||
    source.includes("youtube-nocookie.com/embed/")
  ) {
    return source;
  }

  // Match youtu.be/<id>
  const matchShort = source.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (matchShort) return `https://www.youtube.com/embed/${matchShort[1]}`;
  // Match youtube.com/watch?v=<id>
  const matchWatch = source.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (matchWatch) return `https://www.youtube.com/embed/${matchWatch[1]}`;
  return source;
}
