import { verifyJwt, nowUtcStr } from './helpers.js';
import { handleUserRoutes } from './userRoutes.js';
import { handleAdminRoutes } from './adminRoutes.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};

function rewriteMediaValue(val, functionBase, frontendBase) {
  if (typeof val === 'string') {
    if (val.startsWith('/api/live-image')) return `${functionBase}${val}`;
    if (frontendBase && (val.startsWith('/destinations/') || val.startsWith('/corporate/'))) {
      return `${frontendBase}${val}`;
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => rewriteMediaValue(item, functionBase, frontendBase));
  }
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = rewriteMediaValue(v, functionBase, frontendBase);
    }
    return out;
  }
  return val;
}

function jsonResponse(status, data, req, envFnBase) {
  const origin = String(req.headers.get('origin') || req.headers.get('referer') || '');
  const frontendBase = origin.includes('semoheva123.github.io')
    ? 'https://semoheva123.github.io/arona-boost'
    : '';
  const rewritten = rewriteMediaValue(data, envFnBase, frontendBase);
  return new Response(JSON.stringify(rewritten), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function parseDeviceLabel(uaRaw = '') {
  const ua = String(uaRaw || '');
  let os = 'جهاز معتمد';
  if (/iPhone/i.test(ua)) os = 'iPhone (iOS)';
  else if (/iPad/i.test(ua)) os = 'iPad (iPadOS)';
  else if (/Android/i.test(ua)) os = 'هاتف Android';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'حاسوب Mac';
  else if (/Windows/i.test(ua)) os = 'حاسوب Windows';
  else if (/Linux/i.test(ua)) os = 'نظام Linux';

  let browser = 'متصفح آمن';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';

  return `${os} • ${browser}`;
}

function maskClientIp(req) {
  const fwd = String(req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const clean = fwd.replace(/^::ffff:/, '');
  if (!clean || clean === '127.0.0.1' || clean === '::1') return 'اتصال مشفّر مباشر';
  const parts = clean.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.${parts[3]}`;
  return clean.slice(0, 12) + '***';
}

function isPublicRoute(method, path) {
  if (
    method === 'GET' &&
    (path === '/api/health' ||
      path === '/api/public-config' ||
      path === '/api/live-activity' ||
      path === '/api/live-image' ||
      path === '/api/transparency-metrics')
  ) {
    return true;
  }
  if (method === 'GET' && path.startsWith('/api/public/referrer/')) return true;
  if (method === 'POST' && (path === '/api/validate-phone' || path === '/api/auth/register' || path === '/api/auth/login')) {
    return true;
  }
  return false;
}

export function createEdgeHandler(deps, envGet) {
  globalThis.__ARONA_DEPS = deps;
  const sql = deps.postgres(envGet('SUPABASE_DB_URL'), {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15
  });

  const supaUrl = String(envGet('SUPABASE_URL') || 'https://pqzvkhwxarwwcsquhrea.supabase.co').replace(/\/$/, '');
  const fnBase = `${supaUrl}/functions/v1/arona-api`;
  const jwtSecret =
    envGet('ARONA_JWT_SECRET') ||
    `arona-boost-supabase-${String(envGet('SUPABASE_SERVICE_ROLE_KEY') || 'default-2026').slice(-28)}`;

  return async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      const url = new URL(req.url);
      let path = url.pathname.replace(/^\/(?:functions\/v1\/)?arona-api/, '') || '/';
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      const method = req.method.toUpperCase();

      if (method === 'GET' && (path === '/' || path === '/api/health')) {
        return jsonResponse(200, { ok: true, service: 'arona-boost-supabase-api', schema: 'arona_boost' }, req, fnBase);
      }

      let body = {};
      if (method !== 'GET' && method !== 'HEAD') {
        const text = await req.text();
        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            body = {};
          }
        }
      }

      let user = null;
      let tokenSig = null;

      if (!isPublicRoute(method, path)) {
        const authHeader = req.headers.get('authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
        if (!token) {
          return jsonResponse(401, { error: 'يرجى تسجيل الدخول للمتابعة' }, req, fnBase);
        }
        let decoded;
        try {
          decoded = await verifyJwt(token, jwtSecret);
        } catch {
          return jsonResponse(401, { error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول' }, req, fnBase);
        }
        const [foundUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${Number(decoded.userId)} LIMIT 1`;
        if (!foundUser) {
          return jsonResponse(401, { error: 'الجلسة غير صالحة، يرجى تسجيل الدخول مجدداً' }, req, fnBase);
        }
        if (foundUser.is_banned && !foundUser.is_admin) {
          return jsonResponse(403, { error: 'هذا الحساب مجمّد مؤقتاً من الإدارة، يرجى التواصل مع الدعم عبر واتساب' }, req, fnBase);
        }

        tokenSig = token.slice(-20);
        const [sessRow] = await sql`
          SELECT id, is_revoked FROM arona_boost.user_sessions
          WHERE user_id = ${foundUser.id} AND token_sig = ${tokenSig} LIMIT 1
        `;
        if (sessRow && sessRow.is_revoked) {
          return jsonResponse(401, { error: 'تم إنهاء هذه الجلسة من مركز الحماية المصرفية، يرجى تسجيل الدخول مجدداً' }, req, fnBase);
        }
        if (!sessRow) {
          await sql`
            INSERT INTO arona_boost.user_sessions (user_id, token_sig, device_label, ip_hint)
            VALUES (${foundUser.id}, ${tokenSig}, ${parseDeviceLabel(req.headers.get('user-agent'))}, ${maskClientIp(req)})
            ON CONFLICT (user_id, token_sig) DO NOTHING
          `;
        } else {
          await sql`UPDATE arona_boost.user_sessions SET last_seen_at = ${nowUtcStr()} WHERE id = ${sessRow.id}`;
        }
        user = foundUser;
      }

      const ctx = { sql, method, path, url, body, user, tokenSig, jwtSecret };

      if (path.startsWith('/api/admin/')) {
        const adminRes = await handleAdminRoutes(ctx);
        if (adminRes instanceof Response) return adminRes;
        if (adminRes) return jsonResponse(adminRes.status || 200, adminRes.json, req, fnBase);
      }

      const userRes = await handleUserRoutes(ctx);
      if (userRes instanceof Response) return userRes;
      if (userRes) return jsonResponse(userRes.status || 200, userRes.json, req, fnBase);

      return jsonResponse(404, { error: 'المسار المطلوب غير موجود' }, req, fnBase);
    } catch (err) {
      console.error('Arona Edge API Error:', err);
      return jsonResponse(500, { error: 'حدث خطأ داخلي في الخادم، يرجى المحاولة مجدداً' }, req, fnBase);
    }
  };
}
