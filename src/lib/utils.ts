import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts the actual source URL when the value contains an iframe.
 */
const getVideoSourceUrl = (value: string): string => {
  const trimmed = value.trim();

  const iframeSource = trimmed.match(
    /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i
  );

  const source = iframeSource?.[1]
    ? iframeSource[1].replace(/&amp;/g, "&")
    : trimmed;

  return source.startsWith("//")
    ? `https:${source}`
    : source;
};

/**
 * Checks whether a video source belongs to YouTube.
 *
 * YouTube URLs are NOT supported by the native <video> player.
 */
export function isYouTubeVideoUrl(
  value: string
): boolean {
  if (!value) return false;

  const source = getVideoSourceUrl(value);

  try {
    const hostname = new URL(source)
      .hostname
      .toLowerCase();

    return (
      hostname === "youtu.be" ||
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}

export function formatYouTubeEmbedUrl(
  value: string
): string {
  if (!value) return "";

  const source = getVideoSourceUrl(value);

  try {
    const parsed = new URL(source);
    const hostname = parsed.hostname.toLowerCase();
    let videoId = "";
    let embedUrl: URL;

    if (hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1).split("/")[0];
    } else if (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    ) {
      const pathMatch = parsed.pathname.match(
        /^\/(?:embed|shorts|live)\/([^/]+)/
      );

      if (pathMatch) {
        videoId = pathMatch[1];
      } else {
        videoId = parsed.searchParams.get("v") || "";
      }

      if (
        videoId &&
        parsed.pathname.startsWith("/embed/")
      ) {
        embedUrl = parsed;
      }
    } else {
      return "";
    }

    if (!videoId) return "";

    embedUrl ??= new URL(
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
    );
    embedUrl.hostname = "www.youtube-nocookie.com";
    embedUrl.searchParams.set("controls", "0");
    embedUrl.searchParams.set("disablekb", "1");
    embedUrl.searchParams.set("iv_load_policy", "3");
    embedUrl.searchParams.set("playsinline", "1");
    embedUrl.searchParams.set("rel", "0");

    return embedUrl.toString();
  } catch {
    return "";
  }
}