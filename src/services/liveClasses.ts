
import { LMS_API, readJson } from "../config";
import type { LiveClass, LiveClassPayload } from "../types/liveClass";

const getStudentToken = (): string | null =>
  localStorage.getItem("lms_auth_token");

const getAdminToken = (): string | null =>
  localStorage.getItem("crm_admin_token");

const headers = (token: string, json = false): HeadersInit => {
  const h: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  if (json) h["Content-Type"] = "application/json";

  return h;
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

    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}

const toList = (data: any): LiveClass[] =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.live_classes)
    ? data.live_classes
    : [];

const requireStudentToken = (): string => {
  const token = getStudentToken();
  if (!token) throw new Error("Please log in again as a student.");
  return token;
};

const requireAdminToken = (): string => {
  const token = getAdminToken();
  if (!token) {
    throw new Error("CRM admin session not found. Please log in again.");
  }
  return token;
};

export interface LiveClassFilters {
  course_id?: string | number;
  date_from?: string;
  date_to?: string;
  status?: string;
}

const qs = (filters: LiveClassFilters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const liveClassService = {
  // Student APIs use LMS student token
  async listMine(filters: LiveClassFilters = {}): Promise<LiveClass[]> {
    const token = requireStudentToken();

    return toList(
      await request(`/live-classes${qs(filters)}`, {
        headers: headers(token),
      })
    );
  },

  async listForCourse(
    courseId: string | number
  ): Promise<LiveClass[]> {
    const token = requireStudentToken();

    return toList(
      await request(`/courses/${courseId}/live-classes`, {
        headers: headers(token),
      })
    );
  },

  // Admin APIs use CRM admin token
  async adminList(filters: LiveClassFilters = {}): Promise<LiveClass[]> {
    const token = requireAdminToken();

    return toList(
      await request(`/admin/live-classes${qs(filters)}`, {
        headers: headers(token),
      })
    );
  },

  async create(payload: LiveClassPayload): Promise<LiveClass> {
    const token = requireAdminToken();

    return request(`/admin/live-classes`, {
      method: "POST",
      headers: headers(token, true),
      body: JSON.stringify(payload),
    });
  },

  async update(
    id: number,
    payload: Partial<LiveClassPayload>
  ): Promise<LiveClass> {
    const token = requireAdminToken();

    return request(`/admin/live-classes/${id}`, {
      method: "PUT",
      headers: headers(token, true),
      body: JSON.stringify(payload),
    });
  },

  async cancel(id: number): Promise<LiveClass> {
    const token = requireAdminToken();

    return request(`/admin/live-classes/${id}/cancel`, {
      method: "POST",
      headers: headers(token),
    });
  },
};
