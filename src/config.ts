/**
 * Central API configuration (single source of truth).
 *
 * Vite injects VITE_* variables at BUILD time.
 *  - Production build  -> https://crm-dkc2.onrender.com
 *  - `npm run dev`     -> http://127.0.0.1:8000 (unless overridden)
 *
 * A production build can NEVER point to localhost, even if a wrong
 * value is supplied by mistake.
 */
const PRODUCTION_API_URL = "https://crm-dkc2.onrender.com";
const DEVELOPMENT_API_URL = "http://127.0.0.1:8000";

const isLocalUrl = (value: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(value);

const configured = String(
  import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    ""
)
  .replace(/^\uFEFF/, "")
  .trim()
  .replace(/\/+$/, "");

export const API_URL: string = import.meta.env.PROD
  ? configured && !isLocalUrl(configured)
    ? configured
    : PRODUCTION_API_URL
  : configured || DEVELOPMENT_API_URL;

export const LMS_API = `${API_URL}/api/lms`;

/**
 * Safe JSON reader. Render cold-starts / proxies can return an HTML
 * error page, which makes response.json() throw
 * "Unexpected token <". This never throws.
 */
export const readJson = async (response: Response): Promise<any> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text.slice(0, 200) };
  }
};
