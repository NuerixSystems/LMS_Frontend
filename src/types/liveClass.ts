
// src/types/liveClass.ts

export type LiveClassStatus =
  | "scheduled"
  | "completed"
  | "cancelled";

// ============================================================
// EXISTING LMS LIVE CLASS
// ============================================================

export interface LiveClass {
  id: number;

  course_id: number;
  course_title?: string | null;

  topic: string;
  description?: string | null;

  /** ISO-8601 (UTC) from backend */
  start_time: string;

  duration_minutes: number;

  /** Default: Asia/Kolkata */
  timezone: string;

  status: LiveClassStatus;

  /** Server-computed: true only inside the join window. */
  can_join: boolean;

  /** Present only when can_join is true (students) or always (admins). */
  join_url?: string | null;

  /** Admin-only fields */
  zoom_meeting_id?: string | null;
  start_url?: string | null;
  passcode?: string | null;

  created_at?: string;
  updated_at?: string;
}

// ============================================================
// CREATE / UPDATE LIVE CLASS PAYLOAD
// ============================================================

export interface LiveClassPayload {
  course_id: number;

  topic: string;
  description?: string;

  /** yyyy-mm-dd, interpreted in `timezone` */
  start_date: string;

  /** HH:mm (24h), interpreted in `timezone` */
  start_time: string;

  duration_minutes: number;

  timezone: string;
}

// ============================================================
// ZOOM IMPORTED MEETING
// These meetings are received from Zoom webhooks.
// They are not yet LMS live classes.
// ============================================================

export type ZoomMeetingStatus =
  | "scheduled"
  | "started"
  | "ended"
  | "deleted"
  | string;

export type ZoomImportStatus =
  | "pending"
  | "imported";

export interface ZoomImportedMeeting {
  /** Primary key of zoom_imported_meetings */
  id: number;

  /** Original Zoom meeting ID */
  zoom_meeting_id: string;

  /** Zoom account associated with this tenant */
  zoom_account_id: string;

  /** Zoom host user ID */
  zoom_host_id?: string | null;

  /** Zoom meeting topic */
  topic: string;

  description?: string | null;

  /** Original Zoom participant join URL */
  join_url?: string | null;

  /** ISO-8601 timestamp from Zoom */
  start_time?: string | null;

  duration_minutes: number;

  /** Usually Asia/Kolkata */
  timezone: string;

  /** Current Zoom meeting lifecycle status */
  meeting_status: ZoomMeetingStatus;

  /** Whether the meeting has been imported into an LMS course */
  import_status: ZoomImportStatus;

  /** Linked LMS live_classes.live_class_id after import */
  live_class_id?: number | null;

  created_at?: string;
  updated_at?: string;
}

// ============================================================
// IMPORT ZOOM MEETING INTO AN LMS COURSE
// ============================================================

export interface ImportZoomMeetingPayload {
  course_id: number;
}

// ============================================================
// IMPORT API RESPONSE
// ============================================================

export interface ImportZoomMeetingResponse {
  success: boolean;
  message: string;
  imported_id: number;
  live_class_id: number;
  course_id: number;
}

// ============================================================
// LIST IMPORTED MEETINGS API RESPONSE
// ============================================================

export interface ZoomImportedMeetingsResponse {
  meetings: ZoomImportedMeeting[];
  total: number;
}

// ============================================================
// DEFAULT TIMEZONE
// ============================================================

export const DEFAULT_TIMEZONE = "Asia/Kolkata";
