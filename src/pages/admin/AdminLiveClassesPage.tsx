
// src/pages/admin/AdminLiveClassesPage.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Ban,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Video,
  Download,
  RefreshCw,
  CalendarClock,
} from "lucide-react";

import { useLMS } from "../../context/LMSContext";
import { liveClassService } from "../../services/liveClasses";
import { zoomImportedMeetingsService } from "../../services/zoomImportedMeetings";

import type {
  LiveClass,
  LiveClassPayload,
  ZoomImportedMeeting,
} from "../../types/liveClass";

import { DEFAULT_TIMEZONE } from "../../types/liveClass";
import {
  formatDateTime,
  toDateInTz,
  toTimeInTz,
} from "../../lib/liveClassFormat";

import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";

// ============================================================
// FORM TYPES
// ============================================================

interface FormState {
  course_id: string;
  topic: string;
  description: string;
  start_date: string;
  start_time: string;
  duration_minutes: string;
  timezone: string;
}

type ClassTab = "upcoming" | "completed" | "all";
type PageTab = "live" | "imported";
type ImportedFilter = "all" | "pending" | "imported";

const emptyForm = (courseId = ""): FormState => ({
  course_id: courseId,
  topic: "",
  description: "",
  start_date: "",
  start_time: "",
  duration_minutes: "60",
  timezone: DEFAULT_TIMEZONE,
});

// ============================================================
// COMPONENT
// ============================================================

export const AdminLiveClassesPage: React.FC = () => {
  const { courses } = useLMS();

  // ----------------------------------------------------------
  // LIVE CLASS STATE
  // ----------------------------------------------------------

  const [items, setItems] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCourse, setFilterCourse] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [tab, setTab] = useState<ClassTab>("upcoming");

  // ----------------------------------------------------------
  // IMPORTED MEETING STATE
  // ----------------------------------------------------------

  const [importedMeetings, setImportedMeetings] = useState<
    ZoomImportedMeeting[]
  >([]);

  const [importedLoading, setImportedLoading] = useState(false);

  const [importedFilter, setImportedFilter] =
    useState<ImportedFilter>("all");

  const [selectedCourses, setSelectedCourses] = useState<
    Record<number, string>
  >({});

  const [importingId, setImportingId] = useState<number | null>(
    null
  );

  // ----------------------------------------------------------
  // GENERAL STATE
  // ----------------------------------------------------------

  const [pageTab, setPageTab] = useState<PageTab>("live");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ----------------------------------------------------------
  // CREATE / EDIT FORM STATE
  // ----------------------------------------------------------

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LiveClass | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ==========================================================
  // LOAD LIVE CLASSES
  // ==========================================================

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await liveClassService.adminList({
        course_id: filterCourse || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      setItems(data);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Unable to load live classes.");
    } finally {
      setLoading(false);
    }
  }, [filterCourse, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  // ==========================================================
  // LOAD ZOOM IMPORTED MEETINGS
  // ==========================================================

  const loadImportedMeetings = useCallback(async () => {
    setImportedLoading(true);

    try {
      const data = await zoomImportedMeetingsService.list(
        importedFilter
      );

      setImportedMeetings(data);

      setError("");
    } catch (e: any) {
      setError(
        e?.message || "Unable to load imported Zoom meetings."
      );
    } finally {
      setImportedLoading(false);
    }
  }, [importedFilter]);

  useEffect(() => {
    void loadImportedMeetings();
  }, [loadImportedMeetings]);

  // ==========================================================
  // REFRESH BOTH LISTS
  // ==========================================================

  const refreshAll = async () => {
    await Promise.all([
      load(),
      loadImportedMeetings(),
    ]);
  };

  // ==========================================================
  // LIVE CLASS FILTERING
  // ==========================================================

  const visible = useMemo(() => {
    const now = Date.now();

    const ended = (c: LiveClass) =>
      new Date(c.start_time).getTime() +
        c.duration_minutes * 60_000 <
      now;

    const sorted = [...items].sort(
      (a, b) =>
        new Date(a.start_time).getTime() -
        new Date(b.start_time).getTime()
    );

    if (tab === "upcoming") {
      return sorted.filter(
        (c) => c.status === "scheduled" && !ended(c)
      );
    }

    if (tab === "completed") {
      return sorted
        .filter(
          (c) => c.status !== "scheduled" || ended(c)
        )
        .reverse();
    }

    return sorted;
  }, [items, tab]);

  // ==========================================================
  // OPEN CREATE FORM
  // ==========================================================

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(filterCourse));
    setFormError("");
    setShowForm(true);
  };

  // ==========================================================
  // OPEN EDIT FORM
  // ==========================================================

  const openEdit = (c: LiveClass) => {
    setEditing(c);

    setForm({
      course_id: String(c.course_id),
      topic: c.topic,
      description: c.description || "",
      start_date: toDateInTz(c.start_time, c.timezone),
      start_time: toTimeInTz(c.start_time, c.timezone),
      duration_minutes: String(c.duration_minutes),
      timezone: c.timezone || DEFAULT_TIMEZONE,
    });

    setFormError("");
    setShowForm(true);
  };

  // ==========================================================
  // FORM INPUT HANDLER
  // ==========================================================

  const set =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<any>) => {
      setForm((f) => ({
        ...f,
        [k]: e.target.value,
      }));
    };

  // ==========================================================
  // CREATE / UPDATE LIVE CLASS
  // ==========================================================

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError("");

    const duration = Number(form.duration_minutes);

    if (!form.course_id) {
      return setFormError("Select a course.");
    }

    if (!form.topic.trim()) {
      return setFormError("Meeting title is required.");
    }

    if (!form.start_date || !form.start_time) {
      return setFormError(
        "Date and start time are required."
      );
    }

    if (
      !Number.isFinite(duration) ||
      duration < 5 ||
      duration > 600
    ) {
      return setFormError(
        "Duration must be between 5 and 600 minutes."
      );
    }

    const payload: LiveClassPayload = {
      course_id: Number(form.course_id),
      topic: form.topic.trim(),
      description: form.description.trim(),
      start_date: form.start_date,
      start_time: form.start_time,
      duration_minutes: duration,
      timezone: form.timezone || DEFAULT_TIMEZONE,
    };

    setSaving(true);

    try {
      if (editing) {
        await liveClassService.update(editing.id, payload);

        setNotice(
          "Class updated and Zoom meeting rescheduled."
        );
      } else {
        await liveClassService.create(payload);

        setNotice(
          "Class scheduled and Zoom meeting created."
        );
      }

      setShowForm(false);

      await load();
    } catch (err: any) {
      setFormError(
        err?.message || "Failed to save class."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL LIVE CLASS
  // ==========================================================

  const cancel = async (c: LiveClass) => {
    if (
      !window.confirm(
        `Cancel "${c.topic}"? The Zoom meeting will be deleted.`
      )
    ) {
      return;
    }

    try {
      await liveClassService.cancel(c.id);

      setNotice("Class cancelled.");

      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to cancel class.");
    }
  };

  // ==========================================================
  // SELECT COURSE FOR IMPORT
  // ==========================================================

  const selectImportCourse = (
    importedId: number,
    courseId: string
  ) => {
    setSelectedCourses((previous) => ({
      ...previous,
      [importedId]: courseId,
    }));
  };

  // ==========================================================
  // IMPORT ZOOM MEETING INTO LMS COURSE
  // ==========================================================

  const importMeeting = async (
    meeting: ZoomImportedMeeting
  ) => {
    const courseId = selectedCourses[meeting.id];

    if (!courseId) {
      setError(
        "Please select a course before importing the meeting."
      );
      return;
    }

    if (meeting.import_status === "imported") {
      setError("This meeting has already been imported.");
      return;
    }

    if (meeting.meeting_status === "deleted") {
      setError("Deleted Zoom meetings cannot be imported.");
      return;
    }

    if (!meeting.start_time) {
      setError("This Zoom meeting does not have a start time.");
      return;
    }

    if (!meeting.join_url) {
      setError("This Zoom meeting does not have a join URL.");
      return;
    }

    setImportingId(meeting.id);
    setError("");
    setNotice("");

    try {
      const result =
        await zoomImportedMeetingsService.importMeeting(
          meeting.id,
          {
            course_id: Number(courseId),
          }
        );

      setNotice(
        `${meeting.topic} imported successfully into the selected course.`
      );

      // Refresh both imported meetings and live classes.
      await refreshAll();

      // Switch to Live Classes after successful import.
      setPageTab("live");

      setTab("all");

      // Clear selected course for this meeting.
      setSelectedCourses((previous) => {
        const updated = { ...previous };
        delete updated[meeting.id];
        return updated;
      });

      console.log("Zoom meeting import result:", result);
    } catch (err: any) {
      setError(
        err?.message || "Unable to import Zoom meeting."
      );
    } finally {
      setImportingId(null);
    }
  };

  // ==========================================================
  // COPY JOIN URL
  // ==========================================================

  const copy = (text?: string | null) => {
    if (text) {
      void navigator.clipboard?.writeText(text);
      setNotice("Join link copied.");
    }
  };

  // ==========================================================
  // SELECT STYLE
  // ==========================================================

  const selectCls =
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  // ==========================================================
  // IMPORTED MEETING COUNTS
  // ==========================================================

  const pendingCount = importedMeetings.filter(
    (m) => m.import_status === "pending"
  ).length;

  const importedCount = importedMeetings.filter(
    (m) => m.import_status === "imported"
  ).length;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Video className="h-6 w-6 text-indigo-600" />
            Live Sessions
          </h1>

          <p className="text-sm text-slate-500">
            Manage Zoom classes and import meetings from your Zoom account.
          </p>
        </div>

        {pageTab === "live" && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Schedule Class
          </Button>
        )}

      </div>

      {/* ================================================== */}
      {/* NOTICE */}
      {/* ================================================== */}

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            className="font-semibold"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="font-semibold"
          >
            ×
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* MAIN TABS */}
      {/* ================================================== */}

      <div className="flex flex-wrap gap-2 border-b border-slate-200">

        <button
          type="button"
          onClick={() => setPageTab("live")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${
            pageTab === "live"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Video className="h-4 w-4" />
          Live Classes
        </button>

        <button
          type="button"
          onClick={() => setPageTab("imported")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${
            pageTab === "imported"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Download className="h-4 w-4" />
          Imported Meetings
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {pendingCount}
            </span>
          )}
        </button>

      </div>

      {/* ================================================== */}
      {/* LIVE CLASSES TAB */}
      {/* ================================================== */}

      {pageTab === "live" && (
        <div className="space-y-6">

          {/* FILTERS */}

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">

            <select
              className={selectCls}
              value={filterCourse}
              onChange={(e) =>
                setFilterCourse(e.target.value)
              }
            >
              <option value="">All courses</option>

              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
            />

            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">

              {(
                ["upcoming", "completed", "all"] as const
              ).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md px-2 py-1.5 capitalize ${
                    tab === t
                      ? "bg-white font-semibold text-indigo-700 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}

            </div>
          </div>

          {/* CREATE / EDIT FORM */}

          {showForm && (
            <form
              onSubmit={submit}
              className="space-y-4 rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm"
            >

              <h2 className="font-bold text-slate-900">
                {editing
                  ? "Edit / Reschedule Class"
                  : "Schedule New Class"}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">

                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    Course
                  </span>

                  <select
                    className={selectCls}
                    value={form.course_id}
                    onChange={set("course_id")}
                    disabled={!!editing}
                  >
                    <option value="">Select course</option>

                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    Meeting title
                  </span>

                  <Input
                    value={form.topic}
                    onChange={set("topic")}
                    maxLength={200}
                    placeholder="e.g. Week 1 – Introduction"
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    Date
                  </span>

                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={set("start_date")}
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    Start time
                  </span>

                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={set("start_time")}
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    Duration (minutes)
                  </span>

                  <Input
                    type="number"
                    min={5}
                    max={600}
                    value={form.duration_minutes}
                    onChange={set("duration_minutes")}
                  />
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    Time zone
                  </span>

                  <select
                    className={selectCls}
                    value={form.timezone}
                    onChange={set("timezone")}
                  >
                    <option value="Asia/Kolkata">
                      Asia/Kolkata (IST)
                    </option>
                  </select>
                </label>

              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Description
                </span>

                <textarea
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={form.description}
                  onChange={set("description")}
                  maxLength={2000}
                />
              </label>

              {formError && (
                <p className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex gap-2">

                <Button type="submit" isLoading={saving}>
                  {editing
                    ? "Save & Reschedule"
                    : "Create Zoom Meeting"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Close
                </Button>

              </div>

            </form>
          )}

          {/* LIVE CLASS LIST */}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading live classes...
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No classes found.
            </p>
          ) : (
            <ul className="space-y-3">

              {visible.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >

                  <div className="flex flex-wrap items-start justify-between gap-3">

                    <div className="min-w-0">

                      <p className="font-semibold text-slate-900">
                        {c.topic}
                      </p>

                      <p className="text-xs text-slate-500">
                        {c.course_title ||
                          `Course #${c.course_id}`}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {formatDateTime(
                          c.start_time,
                          c.timezone
                        )}
                        {" · "}
                        {c.duration_minutes} min
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Zoom ID: {c.zoom_meeting_id || "—"}
                        {c.passcode
                          ? ` · Passcode: ${c.passcode}`
                          : ""}
                      </p>

                    </div>

                    <div className="flex items-center gap-2">

                      <Badge
                        variant={
                          c.status === "scheduled"
                            ? "success"
                            : c.status === "cancelled"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {c.status}
                      </Badge>

                      {c.status === "scheduled" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Reschedule
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancel(c)}
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </>
                      )}

                    </div>
                  </div>

                  {c.status === "scheduled" && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">

                      {c.join_url && (
                        <button
                          type="button"
                          onClick={() => copy(c.join_url)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
                        >
                          <Copy className="h-3 w-3" />
                          Copy join link
                        </button>
                      )}

                      {c.start_url && (
                        <a
                          href={c.start_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-indigo-700 hover:bg-indigo-100"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Start as host
                        </a>
                      )}

                    </div>
                  )}

                </li>
              ))}

            </ul>
          )}

        </div>
      )}

      {/* ================================================== */}
      {/* IMPORTED MEETINGS TAB */}
      {/* ================================================== */}

      {pageTab === "imported" && (
        <div className="space-y-5">

          {/* IMPORTED HEADER */}

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Zoom Imported Meetings
              </h2>

              <p className="text-sm text-slate-500">
                Meetings created directly in your company's Zoom account.
                Select an LMS course to import them.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => void loadImportedMeetings()}
              disabled={importedLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  importedLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>

          </div>

          {/* SUMMARY CARDS */}

          <div className="grid gap-3 sm:grid-cols-2">

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">
                Pending Meetings
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-800">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">
                Imported Meetings
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {importedCount}
              </p>
            </div>

          </div>

          {/* IMPORT STATUS FILTER */}

          <div className="flex flex-wrap gap-2">

            {(
              ["all", "pending", "imported"] as const
            ).map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setImportedFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                  importedFilter === status
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {status}
              </button>
            ))}

          </div>

          {/* IMPORTED MEETING LIST */}

          {importedLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading imported meetings...
            </div>
          ) : importedMeetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">

              <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-400" />

              <p className="font-semibold text-slate-700">
                No Zoom meetings found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Meetings created in your connected Zoom account will appear here after Zoom sends a webhook.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {importedMeetings.map((meeting) => {
                const isImported =
                  meeting.import_status === "imported";

                const isDeleted =
                  meeting.meeting_status === "deleted";

                const isImporting =
                  importingId === meeting.id;

                return (
                  <div
                    key={meeting.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >

                    {/* MEETING DETAILS */}

                    <div className="flex flex-wrap items-start justify-between gap-3">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-semibold text-slate-900">
                            {meeting.topic}
                          </h3>

                          <Badge
                            variant={
                              isImported
                                ? "success"
                                : "warning"
                            }
                          >
                            {meeting.import_status}
                          </Badge>

                          {isDeleted && (
                            <Badge variant="warning">
                              deleted
                            </Badge>
                          )}

                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          Zoom Meeting ID: {meeting.zoom_meeting_id}
                        </p>

                        <p className="text-xs text-slate-500">
                          Host ID: {meeting.zoom_host_id || "—"}
                        </p>

                      </div>

                      <Badge
                        variant={
                          meeting.meeting_status === "scheduled"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {meeting.meeting_status}
                      </Badge>

                    </div>

                    {/* DATE / DURATION */}

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">

                      <div>
                        <p className="text-xs text-slate-500">
                          Start time
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {meeting.start_time
                            ? formatDateTime(
                                meeting.start_time,
                                meeting.timezone || DEFAULT_TIMEZONE
                              )
                            : "Not available"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Duration
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {meeting.duration_minutes} minutes
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Time zone
                        </p>

                        <p className="mt-1 font-medium text-slate-800">
                          {meeting.timezone || DEFAULT_TIMEZONE}
                        </p>
                      </div>

                    </div>

                    {/* DESCRIPTION */}

                    {meeting.description && (
                      <p className="mt-3 text-sm text-slate-600">
                        {meeting.description}
                      </p>
                    )}

                    {/* COURSE SELECT */}

                    {!isImported && (
                      <div className="mt-5 border-t border-slate-100 pt-4">

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Select LMS Course
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row">

                          <select
                            className={selectCls}
                            value={
                              selectedCourses[meeting.id] || ""
                            }
                            onChange={(e) =>
                              selectImportCourse(
                                meeting.id,
                                e.target.value
                              )
                            }
                            disabled={
                              isImporting || isDeleted
                            }
                          >
                            <option value="">
                              Select course
                            </option>

                            {courses.map((course) => (
                              <option
                                key={course.id}
                                value={course.id}
                              >
                                {course.title}
                              </option>
                            ))}

                          </select>

                          <Button
                            onClick={() =>
                              void importMeeting(meeting)
                            }
                            disabled={
                              isImporting ||
                              isDeleted ||
                              !selectedCourses[meeting.id] ||
                              !meeting.start_time ||
                              !meeting.join_url
                            }
                            isLoading={isImporting}
                          >
                            <Download className="h-4 w-4" />
                            Import to LMS
                          </Button>

                        </div>

                        {isDeleted && (
                          <p className="mt-2 text-xs text-red-600">
                            This Zoom meeting has been deleted and cannot be imported.
                          </p>
                        )}

                        {!meeting.start_time && (
                          <p className="mt-2 text-xs text-red-600">
                            This meeting has no start time.
                          </p>
                        )}

                        {!meeting.join_url && (
                          <p className="mt-2 text-xs text-red-600">
                            This meeting has no join URL.
                          </p>
                        )}

                      </div>
                    )}

                    {/* ALREADY IMPORTED */}

                    {isImported && (
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3">

                        <div>
                          <p className="text-sm font-semibold text-emerald-800">
                            Successfully imported
                          </p>

                          <p className="text-xs text-emerald-700">
                            LMS Live Class ID:{" "}
                            {meeting.live_class_id ?? "—"}
                          </p>
                        </div>

                        <Badge variant="success">
                          Imported
                        </Badge>

                      </div>
                    )}

                    {/* ZOOM JOIN LINK */}

                    {meeting.join_url && (
                      <div className="mt-4 flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() => copy(meeting.join_url)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700 hover:bg-slate-200"
                        >
                          <Copy className="h-3 w-3" />
                          Copy Zoom join link
                        </button>

                        <a
                          href={meeting.join_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-100"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open Zoom meeting
                        </a>

                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default AdminLiveClassesPage;
