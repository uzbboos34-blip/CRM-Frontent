import axios from 'axios';

// ─── Config ────────────────────────────────────────────────────────────────
const BASE_URL =
  import.meta.env.VITE_API_URL || 'https://crm-backend-l7jq.onrender.com';

const IS_DEV = import.meta.env.DEV;

// Max times to retry a failed request (network errors / 5xx only)
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

// ─── Create instance ───────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000, // 15 s – fail fast on slow network
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Helpers ───────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('token');
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/** Translate common HTTP status codes to Uzbek user-friendly messages */
function translateError(error) {
  const status = error?.response?.status;
  const serverMsg = error?.response?.data?.message;

  if (!status) {
    // Network / timeout
    if (error?.code === 'ECONNABORTED') {
      return "So'rov muddati tugadi. Internet aloqangizni tekshiring.";
    }
    return "Server bilan ulanib bo'lmadi. Internet aloqangizni tekshiring.";
  }

  switch (status) {
    case 400:
      return serverMsg || "Noto'g'ri so'rov. Ma'lumotlarni tekshiring.";
    case 401:
      return "Sessiya muddati tugadi. Qayta kiring.";
    case 403:
      return "Bu amalni bajarishga ruxsatingiz yo'q.";
    case 404:
      return serverMsg || "So'ralgan ma'lumot topilmadi.";
    case 409:
      return serverMsg || "Bunday ma'lumot allaqachon mavjud.";
    case 422:
      return serverMsg || "Kiritilgan ma'lumotlar noto'g'ri.";
    case 429:
      return "Juda ko'p so'rov yuborildi. Biroz kuting.";
    case 500:
      return "Server xatosi yuz berdi. Keyinroq urinib ko'ring.";
    case 502:
    case 503:
    case 504:
      return "Server vaqtincha ishlamayapti. Keyinroq urinib ko'ring.";
    default:
      return serverMsg || `Xatolik yuz berdi (${status}).`;
  }
}

/** Exponential-ish back-off before retry */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Request interceptor ───────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Retry meta (attached to config so response interceptor can read it)
    config._retryCount = config._retryCount ?? 0;

    if (IS_DEV) {
      const { method, url, params, data } = config;
      console.groupCollapsed(
        `%c⬆ ${method?.toUpperCase()} ${url}`,
        'color:#3b82f6;font-weight:700;'
      );
      if (params) console.log('params', params);
      if (data) console.log('body', data);
      console.groupEnd();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (IS_DEV) {
      console.log(
        `%c⬇ ${response.status} ${response.config.url}`,
        'color:#10b981;font-weight:700;',
        response.data
      );
    }
    return response;
  },

  async (error) => {
    const config = error.config;
    const status = error?.response?.status;

    // ── Dev logging ──────────────────────────────────────────────────────
    if (IS_DEV) {
      console.groupCollapsed(
        `%c✖ ${status ?? 'NET'} ${config?.url ?? ''}`,
        'color:#ef4444;font-weight:700;'
      );
      console.error(error?.response?.data ?? error.message);
      console.groupEnd();
    }

    // ── Auto-retry on network errors and 5xx (not on 4xx) ───────────────
    const isNetworkError = !error.response;
    const isServerError = status >= 500 && status < 600;
    const canRetry =
      config &&
      (isNetworkError || isServerError) &&
      config._retryCount < MAX_RETRIES;

    if (canRetry) {
      config._retryCount += 1;
      const wait = RETRY_DELAY_MS * config._retryCount;
      if (IS_DEV) {
        console.warn(`↩ Retrying (${config._retryCount}/${MAX_RETRIES}) in ${wait}ms…`);
      }
      await delay(wait);
      return api(config);
    }

    // ── 401 → clear session & redirect ──────────────────────────────────
    if (status === 401) {
      clearSession();
      // Avoid infinite redirect loop if already on /login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // ── Attach translated message for easy consumption in components ──────
    error.userMessage = translateError(error);

    return Promise.reject(error);
  }
);

// ─── Convenience wrappers ──────────────────────────────────────────────────
// These propagate error.userMessage so callers can do:
//   } catch (e) { setError(e.userMessage); }

export const get = (url, config) => api.get(url, config);
export const post = (url, data, config) => api.post(url, data, config);
export const put = (url, data, config) => api.put(url, data, config);
export const patch = (url, data, config) => api.patch(url, data, config);
export const del = (url, config) => api.delete(url, config);

export default api;
