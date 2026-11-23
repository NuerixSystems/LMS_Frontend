
import { LMS_API, readJson } from "../config";
import type {
  ZoomImportedMeeting,
  ImportZoomMeetingPayload,
} from "../types/liveClass";

const getAdminToken = (): string | null =>
  localStorage.getItem("crm_admin_token");

const requireAdminToken = (): string => {
  const token = getAdminToken();

  if (!token) {
    throw new Error("CRM admin session not found. Please log in again.");
  }

  return token;
};

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${LMS_API}${path}`, init);
  const data = await readJson(res);

  if (!res.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : Array.isArray(data?.detail)
        ? data.detail.map((d: any) => d.msg).join(", ")
        : `Request failed (${res.status})`;

    const error = new Error(detail) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
}

const adminHeaders = (json = false): HeadersInit => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${requireAdminToken()}`,
  };

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

export const zoomImportedMeetingsService = {
  async list(
    importStatus: "pending" | "imported" | "all" = "pending"
  ): Promise<ZoomImportedMeeting[]> {
    const data = await request<{
      meetings: ZoomImportedMeeting[];
      total: number;
    }>(
      `/admin/zoom-imported-meetings?import_status=${importStatus}`,
      {
        headers: adminHeaders(),
      }
    );

    return Array.isArray(data.meetings) ? data.meetings : [];
  },

  async importMeeting(
    importedId: number,
    payload: ImportZoomMeetingPayload
  ): Promise<{
    success: boolean;
    message: string;
    imported_id: number;
    live_class_id: number;
    course_id: number;
  }> {
    return request(
      `/admin/zoom-imported-meetings/${importedId}/import`,
      {
        method: "POST",
        headers: adminHeaders(true),
        body: JSON.stringify(payload),
      }
    );
  },
};
