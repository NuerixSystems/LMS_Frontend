// src/components/live/LiveClassList.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, ExternalLink, Loader2, Video } from "lucide-react";
import { liveClassService } from "../../services/liveClasses";
import type { LiveClass } from "../../types/liveClass";
import { formatDateTime, endsAt } from "../../lib/liveClassFormat";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface Props {
  /** When set, shows only that course's classes; otherwise all allocated courses. */
  courseId?: string | number;
  title?: string;
  /** Hide the whole section when there is nothing to show (used on course page). */
  hideWhenEmpty?: boolean;
}

const REFRESH_MS = 60_000;

export const LiveClassList: React.FC<Props> = ({
  courseId,
  title = "Live Classes",
  hideWhenEmpty = false,
}) => {
  const [items, setItems] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = courseId
        ? await liveClassService.listForCourse(courseId)
        : await liveClassService.listMine();
      setItems(data);
      setError("");
    } catch (e: any) {
      // 403/404: course not allocated to this student -> show nothing, never leak.
      if (e?.status === 403 || e?.status === 404) {
        setItems([]);
        setError("");
      } else {
        setError(e?.message || "Unable to load live classes.");
      }
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    void load();
    // Re-fetch so "Join Class" appears/disappears without a page reload.
    const t = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [load]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const isPast = (c: LiveClass) =>
      c.status !== "scheduled" || endsAt(c.start_time, c.duration_minutes).getTime() < now;
    const sortAsc = (a: LiveClass, b: LiveClass) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    return {
      upcoming: items.filter((c) => !isPast(c)).sort(sortAsc),
      past: items.filter(isPast).sort((a, b) => sortAsc(b, a)),
    };
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading live classes...
      </div>
    );
  }
  if (hideWhenEmpty && !error && items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Video className="h-5 w-5 text-indigo-600" /> {title}
      </h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!error && items.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No live classes scheduled yet.</p>
      )}

      {upcoming.length > 0 && (
        <ul className="mt-4 space-y-3">
          {upcoming.map((c) => (
            <ClassRow key={c.id} c={c} showCourse={!courseId} />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Completed / Cancelled
          </h3>
          <ul className="mt-3 space-y-3 opacity-80">
            {past.map((c) => (
              <ClassRow key={c.id} c={c} showCourse={!courseId} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

const ClassRow: React.FC<{ c: LiveClass; showCourse: boolean }> = ({ c, showCourse }) => {
  const ended = endsAt(c.start_time, c.duration_minutes).getTime() < Date.now();
  const label =
    c.status === "cancelled" ? "Cancelled" : ended || c.status === "completed" ? "Completed" : c.can_join ? "Live / Open" : "Scheduled";
  const variant: "default" | "secondary" | "success" | "warning" =
    label === "Cancelled" ? "warning" : label === "Live / Open" ? "success" : label === "Completed" ? "secondary" : "default";

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{c.topic}</p>
        {showCourse && c.course_title && (
          <p className="text-xs text-slate-500">{c.course_title}</p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
          <CalendarClock className="h-4 w-4 text-slate-400" />
          {formatDateTime(c.start_time, c.timezone)} · {c.duration_minutes} min
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={variant}>{label}</Badge>
        {c.status === "scheduled" && c.can_join && c.join_url && (
          <a href={c.join_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm">
              Join Class <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        )}
      </div>
    </li>
  );
};
