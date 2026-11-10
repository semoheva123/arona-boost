import { handleStaticPagesApi } from './staticPagesFallback';

const TOKEN_KEY = 'arona_boost_token';
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL)
  : ''
).replace(/\/$/, '');

const IS_STANDALONE_GITHUB_PAGES =
  typeof window !== 'undefined' &&
  /\.github\.io$/i.test(window.location.hostname || '') &&
  !API_BASE;

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

export async function apiRequest(endpoint, { method = 'GET', body, token, timeoutMs = 6000 } = {}) {
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
  } finally {
    if (timer) clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));
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
