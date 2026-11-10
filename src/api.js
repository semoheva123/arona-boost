const TOKEN_KEY = 'arona_boost_token';
export const SUPABASE_CLOUD_API_BASE = 'https://pqzvkhwxarwwcsquhrea.supabase.co/functions/v1/arona-api';

function resolveBasePath() {
  const envBase =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? String(import.meta.env.BASE_URL)
      : '';
  if (envBase && envBase !== '/') {
    return envBase.endsWith('/') ? envBase : `${envBase}/`;
  }
  if (typeof window !== 'undefined') {
    const host = String(window.location.hostname || '').toLowerCase();
    const pathname = String(window.location.pathname || '/');
    if (host.endsWith('.github.io')) {
      const seg = pathname.split('/').filter(Boolean)[0];
      if (seg) return `/${seg}/`;
    }
  }
  return '/';
}

export const APP_BASE_PATH = resolveBasePath();

export function assetUrl(rawPath = '') {
  if (!rawPath || typeof rawPath !== 'string') return rawPath;
  if (/^(https?:|data:|blob:)/i.test(rawPath)) return rawPath;
  if (rawPath.startsWith('/api/live-image')) {
    return API_BASE ? `${API_BASE}${rawPath}` : rawPath;
  }
  const clean = rawPath.replace(/^\.?\//, '');
  if (APP_BASE_PATH !== '/' && rawPath.startsWith(APP_BASE_PATH)) {
    return rawPath;
  }
  return `${APP_BASE_PATH}${clean}`;
}

export function buildAppUrl(searchOrSuffix = '') {
  if (typeof window === 'undefined') {
    return `${APP_BASE_PATH}${String(searchOrSuffix || '').replace(/^\//, '')}`;
  }
  const suffix = String(searchOrSuffix || '');
  const cleanSuffix = suffix.startsWith('?')
    ? suffix
    : suffix.replace(/^\//, '');
  return `${window.location.origin}${APP_BASE_PATH}${cleanSuffix}`;
}

function resolveApiBase() {
  const envBase =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
      ? String(import.meta.env.VITE_API_BASE_URL).trim().replace(/\/$/, '')
      : '';
  if (envBase) return envBase;

  if (typeof window !== 'undefined') {
    const host = String(window.location.hostname || '').toLowerCase();
    if (host.endsWith('.github.io') || host.endsWith('.pages.dev') || host.endsWith('.netlify.app')) {
      return SUPABASE_CLOUD_API_BASE;
    }
  }
  return '';
}

const API_BASE = resolveApiBase();

function normalizeMediaInPayload(val) {
  if (typeof val === 'string') {
    if (val.startsWith('/destinations/') || val.startsWith('/corporate/')) {
      return assetUrl(val);
    }
    if (val.startsWith('/api/live-image')) {
      return API_BASE ? `${API_BASE}${val}` : val;
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(normalizeMediaInPayload);
  }
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = normalizeMediaInPayload(v);
    }
    return out;
  }
  return val;
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export async function apiRequest(endpoint, { method = 'GET', body, token, timeoutMs = 22000 } = {}) {
  const activeToken = token !== undefined ? token : getStoredToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined
    });
  } catch (netErr) {
    if (netErr?.name === 'AbortError') {
      throw new Error('انتهت مهلة الاتصال بالخادم، يرجى التحقق من الإنترنت والمحاولة مجدداً');
    }
    throw new Error('تعذر الاتصال بالخادم حالياً، يرجى التحقق من اتصال الإنترنت');
  } finally {
    if (timer) clearTimeout(timer);
  }

  const rawData = await res.json().catch(() => ({}));
  const data = normalizeMediaInPayload(rawData);
  if (!res.ok) {
    const err = new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function formatUsdt(value) {
  const num = Number(value || 0);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatDateTimeAr(isoStr) {
  if (!isoStr) return '';
  const normalized = isoStr.includes('T') ? isoStr : `${isoStr.replace(' ', 'T')}Z`;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatShortDateAr(isoStr) {
  if (!isoStr) return '';
  const normalized = isoStr.includes('T') ? isoStr : `${isoStr.replace(' ', 'T')}Z`;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
