// src/lib/liveClassFormat.ts
import { DEFAULT_TIMEZONE } from "../types/liveClass";

export const formatDateTime = (iso: string, tz = DEFAULT_TIMEZONE): string =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));

/** yyyy-mm-dd of an instant in the given timezone (for filters / form defaults). */
export const toDateInTz = (iso: string, tz = DEFAULT_TIMEZONE): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));

export const toTimeInTz = (iso: string, tz = DEFAULT_TIMEZONE): string =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));

export const endsAt = (startIso: string, minutes: number): Date =>
  new Date(new Date(startIso).getTime() + minutes * 60_000);
