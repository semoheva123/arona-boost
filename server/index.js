const path = require('path');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const {
  db,
  round2,
  CHECKIN_REWARDS,
  TEAM_MILESTONES,
  TASK_CATALOG,
  getActiveVipLevels,
  getAnnouncementsList,
  getVaultPlans,
  getWheelSegments,
  getSalaryRanks,
  getWithdrawPresets,
  grantDepositWheelSpins,
  computeQualifiedVip,
  createNotification,
  generateInviteCode,
  generateRefCode,
  getTodayDateStr,
  getSettingsMap,
  distributeReferralCommissions
} = require('./db');

const { verifyTransactionOnChain } = require('./blockchainVerifier');
const { validatePhoneNumber } = require('./phoneValidator');

const {
  TOURISM_POOL,
  getDynamicDestinationsForSlots,
  getFeaturedDestinationsShowcase,
  proxyWikimediaImage,
  warmUpLiveGalleries
} = require('./livePhotos');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'arona-boost-secure-jwt-key-2026';

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

function normalizeDigitsAndStrip(raw = '') {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let out = String(raw).trim();
  out = out.replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  out = out.replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)));
  out = out.replace(/[\s\-()]/g, '');
  return out;
}

function buildNormalizedPhone(rawPhone = '', countryCode = '') {
  const cleanPhone = normalizeDigitsAndStrip(rawPhone);
  const cleanCode = normalizeDigitsAndStrip(countryCode);
  if (!cleanPhone) return '';
  if (cleanPhone.startsWith('+')) return cleanPhone;
  if (cleanCode && cleanCode !== 'LOCAL') {
    const prefix = cleanCode.startsWith('+') ? cleanCode : `+${cleanCode}`;
    const withoutLeadingZero = cleanPhone.replace(/^0+/, '');
    return `${prefix}${withoutLeadingZero}`;
  }
  return cleanPhone;
}

function findUserByPhoneFlexible(rawPhone = '', countryCode = '') {
  const cleanRaw = normalizeDigitsAndStrip(rawPhone);
  const combined = buildNormalizedPhone(rawPhone, countryCode);
  const candidates = new Set([combined, cleanRaw]);
  const vCheck = validatePhoneNumber(rawPhone, countryCode);
  if (vCheck && vCheck.e164) candidates.add(vCheck.e164);
  if (vCheck && vCheck.nationalNumber) {
    candidates.add(`0${vCheck.nationalNumber}`);
    candidates.add(vCheck.nationalNumber);
  }
  if (cleanRaw && !cleanRaw.startsWith('0') && !cleanRaw.startsWith('+')) {
    candidates.add(`0${cleanRaw}`);
  }
  if (cleanRaw.startsWith('0')) {
    const stripped = cleanRaw.replace(/^0+/, '');
    if (countryCode && countryCode !== 'LOCAL') {
      const prefix = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
      candidates.add(`${prefix}${stripped}`);
    }
  }
  for (const cand of candidates) {
    if (!cand) continue;
    const found = db.prepare('SELECT * FROM users WHERE phone = ?').get(cand);
    if (found) return found;
  }
  return null;
}

function maskPhone(phone = '') {
  const s = String(phone);
  if (s.length <= 5) return s;
  return `${s.slice(0, 4)}***${s.slice(-3)}`;
}

function getYesterdayDateStr() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getUnreadNotificationsCount(userId) {
  const row = db
    .prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0')
    .get(userId);
  return row ? row.c : 0;
}

function serializeUser(u) {
  if (!u) return null;
  const qualifiedByDeposits = computeQualifiedVip(u.total_deposits);
  const effectiveVip = Math.max(u.vip_level || 0, qualifiedByDeposits);
  if (effectiveVip !== u.vip_level) {
    db.prepare('UPDATE users SET vip_level = ? WHERE id = ?').run(effectiveVip, u.id);
    u.vip_level = effectiveVip;
  }

  const vaultRow = db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as lockedTotal, COUNT(*) as activeCount FROM vault_positions WHERE user_id = ? AND status = 'active'"
    )
    .get(u.id);

  const extraEarningsRow = db
    .prepare(
      `SELECT
         (SELECT COALESCE(SUM(expected_profit), 0) FROM vault_positions WHERE user_id = ? AND status = 'claimed') +
         (SELECT COALESCE(SUM(reward_amount), 0) FROM wheel_spins_log WHERE user_id = ?) as extraTotal`
    )
    .get(u.id, u.id);

  const guarAmount = round2(u.work_guarantee_amount || 0);
  let guarRemainingDays = 0;
  let canRefundGuarantee = false;
  if (guarAmount > 0 && u.work_guarantee_expires) {
    const expMs = new Date(u.work_guarantee_expires.replace(' ', 'T') + 'Z').getTime();
    const diffMs = expMs - Date.now();
    guarRemainingDays = Math.max(0, Math.ceil(diffMs / 86400000));
    canRefundGuarantee = diffMs <= 0;
  }

  const effectiveJobTitle =
    u.job_title && u.job_title.trim()
      ? u.job_title.trim()
      : effectiveVip > 0
      ? 'موظف رسمي'
      : 'موظف متدرب';

  const totalCumulativeEarnings = round2(
    Number(u.total_task_earnings || 0) +
      Number(u.total_team_earnings || 0) +
      Number(extraEarningsRow?.extraTotal || 0)
  );

  const periodRow = db
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN completed_date = date('now', '-1 day') THEN reward ELSE 0 END), 0) as yTask,
        COALESCE(SUM(CASE WHEN completed_date >= date('now', '-7 days') THEN reward ELSE 0 END), 0) as wTask,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', completed_date) = strftime('%Y-%m', 'now') THEN reward ELSE 0 END), 0) as mTask
      FROM task_completions
      WHERE user_id = ?
    `
    )
    .get(u.id) || { yTask: 0, wTask: 0, mTask: 0 };

  const commPeriodRow = db
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN date(created_at) = date('now', '-1 day') THEN commission_amount ELSE 0 END), 0) as yComm,
        COALESCE(SUM(CASE WHEN date(created_at) >= date('now', '-7 days') THEN commission_amount ELSE 0 END), 0) as wComm,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN commission_amount ELSE 0 END), 0) as mComm
      FROM team_commissions
      WHERE beneficiary_id = ?
    `
    )
    .get(u.id) || { yComm: 0, wComm: 0, mComm: 0 };

  const redPeriodRow = db
    .prepare(
      `
      SELECT COALESCE(SUM(amount), 0) as redTotal
      FROM red_envelope_claims
      WHERE user_id = ?
    `
    )
    .get(u.id) || { redTotal: 0 };

  return {
    id: u.id,
    phone: u.phone,
    maskedPhone: maskPhone(u.phone),
    inviteCode: u.invite_code,
    balance: round2(u.balance),
    rechargeBalance: round2(u.recharge_balance || 0),
    pointsBalance: Number(u.points_balance || 0),
    jobTitle: effectiveJobTitle,
    workGuarantee: {
      amount: guarAmount,
      startDate: u.work_guarantee_start || '',
      expiresDate: u.work_guarantee_expires || '',
      remainingDays: guarRemainingDays,
      canRefund: canRefundGuarantee
    },
    totalCumulativeEarnings: round2(totalCumulativeEarnings + Number(redPeriodRow.redTotal || 0)),
    yesterdayEarnings: round2(Number(periodRow.yTask || 0) + Number(commPeriodRow.yComm || 0)),
    thisWeekEarnings: round2(Number(periodRow.wTask || 0) + Number(commPeriodRow.wComm || 0)),
    thisMonthEarnings: round2(Number(periodRow.mTask || 0) + Number(commPeriodRow.mComm || 0)),
    vaultLockedBalance: round2(vaultRow?.lockedTotal || 0),
    activeVaultCount: vaultRow?.activeCount || 0,
    spinCredits: Number(u.spin_credits || 0),
    totalDeposits: round2(u.total_deposits),
    totalWithdrawals: round2(u.total_withdrawals),
    totalTaskEarnings: round2(u.total_task_earnings),
    totalTeamEarnings: round2(u.total_team_earnings),
    vipLevel: u.vip_level,
    savedWalletAddress: u.saved_wallet_address || '',
    savedWalletNetwork: u.saved_wallet_network || 'TRC20',
    walletLocked: Boolean(u.wallet_locked),
    walletLockedAt: u.wallet_locked_at || '',
    hasWithdrawPin: Boolean(u.withdraw_pin_hash),
    unreadNotifications: getUnreadNotificationsCount(u.id),
    isBanned: Boolean(u.is_banned),
    isAdmin: Boolean(u.is_admin),
    createdAt: u.created_at
  };
}

function applyApprovedDepositToUser(userId, amount) {
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const settings = getSettingsMap();
  const guarDays = Math.max(1, Math.round(Number(settings.guarantee_duration_days || 365)));

  const newTotalDeposits = round2(current.total_deposits + amount);
  const qualifiedVip = computeQualifiedVip(newTotalDeposits);
  const newVip = Math.max(current.vip_level || 0, qualifiedVip);

  const levels = getActiveVipLevels();
  const targetVipObj = levels.find((v) => v.level === newVip) || levels[0];
  const targetGuarantee = round2(Number(targetVipObj?.minDeposit || 0));

  let nextGuarantee = round2(current.work_guarantee_amount || 0);
  let nextRecharge = round2((current.recharge_balance || 0) + amount);
  let guarStart = current.work_guarantee_start || '';
  let guarExpires = current.work_guarantee_expires || '';

  if (newVip > 0 && targetGuarantee > nextGuarantee) {
    const lockNeeded = round2(targetGuarantee - nextGuarantee);
    const lockedFromPool = Math.min(nextRecharge, lockNeeded);
    nextRecharge = round2(Math.max(0, nextRecharge - lockedFromPool));
    nextGuarantee = round2(nextGuarantee + lockedFromPool);

    const nowRow = db
      .prepare("SELECT datetime('now') as s, datetime('now', ?) as e")
      .get(`+${guarDays} days`);
    if (!guarStart) guarStart = nowRow.s;
    guarExpires = nowRow.e;
  }

  const nextJobTitle =
    current.job_title && current.job_title !== 'موظف متدرب'
      ? current.job_title
      : newVip > 0
      ? 'موظف رسمي'
      : 'موظف متدرب';

  db.prepare(`
    UPDATE users
    SET recharge_balance = ?,
        total_deposits = ?,
        vip_level = ?,
        work_guarantee_amount = ?,
        work_guarantee_start = ?,
        work_guarantee_expires = ?,
        job_title = ?
    WHERE id = ?
  `).run(
    nextRecharge,
    newTotalDeposits,
    newVip,
    nextGuarantee,
    guarStart,
    guarExpires,
    nextJobTitle,
    userId
  );
}

function getTodayStats(userId, vipLevel) {
  const today = getTodayDateStr();
  const row = db.prepare(`
    SELECT COUNT(*) as completedCount, COALESCE(SUM(reward), 0) as todayEarnings
    FROM task_completions
    WHERE user_id = ? AND completed_date = ?
  `).get(userId, today);

  const levels = getActiveVipLevels();
  const vipObj = levels.find((v) => v.level === vipLevel) || levels[0];
  return {
    todayCompletedCount: row.completedCount || 0,
    todayTaskEarnings: round2(row.todayEarnings || 0),
    dailyTasksLimit: vipObj.dailyTasks,
    dailyProfitPotential: vipObj.dailyProfit
  };
}

function getPublicPlatformPayload() {
  const settings = getSettingsMap();
  return {
    whatsappNumber: settings.whatsapp_number || '963990000000',
    liveTickerEnabled: settings.live_ticker_enabled !== 'false',
    announcements: getAnnouncementsList(),
    vipLevels: getActiveVipLevels(),
    vaultPlans: getVaultPlans(),
    salaryRanks: getSalaryRanks(),
    withdrawPresets: getWithdrawPresets(),
    guaranteeDurationDays: Number(settings.guarantee_duration_days || 365),
    wheelMinDeposit: Number(settings.wheel_min_deposit || 20),
    minDeposit: Number(settings.min_deposit || 10),
    minWithdraw: Number(settings.min_withdraw || 5),
    dailyWithdrawLimit: Number(settings.daily_withdraw_limit || 2),
    withdrawFeePercent: Number(settings.withdraw_fee_percent || 0),
    autoApproveDeposits: settings.auto_approve_deposits === 'true',
    autoApproveWithdrawals: settings.auto_approve_withdrawals === 'true',
    blockchainAutoApprove: settings.blockchain_auto_approve_verified === 'true',
    welcomePopup: {
      enabled: settings.welcome_popup_enabled !== '0' && settings.welcome_popup_enabled !== 'false',
      title: settings.welcome_popup_title || 'إشعار الموظفين الرسمي — Arona Boost',
      body:
        settings.welcome_popup_body ||
        'مرحباً بجميع موظفي التقييم المعتمدين في منظومة Arona Boost.'
    }
  };
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
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const raw = fwd || req.ip || '';
  const clean = raw.replace(/^::ffff:/, '');
  if (!clean || clean === '127.0.0.1' || clean === '::1') return 'اتصال مشفّر مباشر';
  const parts = clean.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.${parts[3]}`;
  return clean.slice(0, 12) + '***';
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول للمتابعة' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'الجلسة غير صالحة، يرجى تسجيل الدخول مجدداً' });
    }
    if (user.is_banned && !user.is_admin) {
      return res.status(403).json({
        error: 'هذا الحساب مجمّد مؤقتاً من الإدارة، يرجى التواصل مع الدعم عبر واتساب'
      });
    }

    const tokenSig = token.slice(-20);
    const sessRow = db
      .prepare('SELECT id, is_revoked FROM user_sessions WHERE user_id = ? AND token_sig = ?')
      .get(user.id, tokenSig);
    if (sessRow && sessRow.is_revoked) {
      return res.status(401).json({ error: 'تم إنهاء هذه الجلسة من مركز الحماية المصرفية، يرجى تسجيل الدخول مجدداً' });
    }
    if (!sessRow) {
      db.prepare(
        `INSERT OR IGNORE INTO user_sessions (user_id, token_sig, device_label, ip_hint)
         VALUES (?, ?, ?, ?)`
      ).run(user.id, tokenSig, parseDeviceLabel(req.headers['user-agent']), maskClientIp(req));
    } else {
      db.prepare("UPDATE user_sessions SET last_seen_at = datetime('now') WHERE id = ?").run(
        sessRow.id
      );
    }

    req.user = user;
    req.tokenSig = tokenSig;
    next();
  } catch {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'غير مصرح بالوصول إلى لوحة الإدارة' });
  }
  next();
}

// ==================== PUBLIC CONFIG & LIVE ACTIVITY ====================

app.get('/api/public-config', (req, res) => {
  res.json(getPublicPlatformPayload());
});

app.get('/api/live-activity', (req, res) => {
  try {
    const settings = getSettingsMap();
    if (settings.live_ticker_enabled === 'false') {
      return res.json({ enabled: false, items: [] });
    }

    const realItems = [];

    // 1. Recent completed withdrawals & deposits from DB
    const recentTx = db
      .prepare(
        `SELECT t.id, t.type, t.amount, t.network, u.phone
         FROM transactions t
         JOIN users u ON u.id = t.user_id
         WHERE t.status = 'completed'
         ORDER BY t.id DESC
         LIMIT 5`
      )
      .all();

    recentTx.forEach((tx, idx) => {
      const mPhone = maskPhone(tx.phone);
      if (tx.type === 'withdraw') {
        realItems.push({
          id: `tx-w-${tx.id}`,
          kind: 'withdraw',
          member: mPhone,
          text: `أتم سحب أرباح عبر ${tx.network}`,
          amountText: `$${round2(tx.amount).toFixed(2)} USDT`,
          timeLabel: idx === 0 ? 'الآن' : `منذ ${idx * 2 + 1} د`
        });
      } else {
        realItems.push({
          id: `tx-d-${tx.id}`,
          kind: 'deposit',
          member: mPhone,
          text: `فعّل رصيد محفظته عبر ${tx.network}`,
          amountText: `+$${round2(tx.amount).toFixed(2)} USDT`,
          timeLabel: `منذ ${idx * 3 + 2} د`
        });
      }
    });

    // 2. Recent tourism rating rewards & team commissions from DB
    const recentTasks = db
      .prepare(
        `SELECT tc.id, tc.reward, tc.vip_level, u.phone
         FROM task_completions tc
         JOIN users u ON u.id = tc.user_id
         ORDER BY tc.id DESC
         LIMIT 3`
      )
      .all();

    recentTasks.forEach((tk, idx) => {
      realItems.push({
        id: `tk-${tk.id}`,
        kind: 'task',
        member: maskPhone(tk.phone),
        text: `أكمل تقييم وجهة سياحية (الفئة A${tk.vip_level})`,
        amountText: `+$${round2(tk.reward).toFixed(2)} USDT`,
        timeLabel: `منذ ${idx * 2 + 1} د`
      });
    });

    // 3. Time-rotating regional masked activity pool so ticker stays fresh 24/7
    const minuteBucket = Math.floor(Date.now() / 45000);
    const SYNTHETIC_POOL = [
      { kind: 'withdraw', member: '+905***741', text: 'استلم سحب أرباح فوري عبر TRC20', amountText: '$38.50 USDT' },
      { kind: 'vip', member: '+963***618', text: 'وثّق عقد أخصائي تصنيف سياحي (الفئة A3)', amountText: 'الفئة A3' },
      { kind: 'withdraw', member: '+966***309', text: 'أتم سحب أرباح عبر شبكة BEP20', amountText: '$64.00 USDT' },
      { kind: 'commission', member: '+964***527', text: 'حصل على عمولة فريق مباشرة (مستوى A)', amountText: '+$15.00 USDT' },
      { kind: 'deposit', member: '+962***814', text: 'وثّق إيداع ضمان عمل جديد عبر TRC20', amountText: '+$150.00 USDT' },
      { kind: 'withdraw', member: '+905***293', text: 'استلم سحب أرباح يومية عبر TRC20', amountText: '$22.75 USDT' },
      { kind: 'vip', member: '+201***946', text: 'فعّل عقد مقيّم منشآت فندقية (الفئة A2)', amountText: 'الفئة A2' },
      { kind: 'task', member: '+963***155', text: 'أنهى تقييم جميع وجهاته السياحية لليوم', amountText: '+$6.38 USDT' },
      { kind: 'withdraw', member: '+971***662', text: 'أتم سحب أرباح عبر TRC20 بنجاح', amountText: '$112.00 USDT' },
      { kind: 'commission', member: '+961***408', text: 'استلم عائد محفظة استثمر مع أرونا', amountText: '+$16.80 USDT' },
      { kind: 'vip', member: '+966***775', text: 'رقّى عقده إلى مستشار تقييم ضيافة (الفئة A4)', amountText: 'الفئة A4' },
      { kind: 'withdraw', member: '+963***839', text: 'استلم سحب أرباح عبر TRC20', amountText: '$19.20 USDT' }
    ];

    const rotatedSynthetic = SYNTHETIC_POOL.map((_, i) => {
      const item = SYNTHETIC_POOL[(i + minuteBucket) % SYNTHETIC_POOL.length];
      const mins = (i % 6) + 1;
      return {
        ...item,
        id: `syn-${minuteBucket}-${i}`,
        timeLabel: i === 0 ? 'الآن' : mins === 1 ? 'منذ دقيقة' : `منذ ${mins} د`
      };
    });

    // Interleave real items and rotated items cleanly (up to 14 items)
    const combined = [];
    const maxLen = Math.max(realItems.length, rotatedSynthetic.length);
    for (let i = 0; i < maxLen && combined.length < 14; i++) {
      if (i < rotatedSynthetic.length) combined.push(rotatedSynthetic[i]);
      if (i < realItems.length && combined.length < 14) combined.push(realItems[i]);
    }

    res.json({ enabled: true, items: combined });
  } catch (err) {
    console.error('Live activity error:', err);
    res.json({ enabled: true, items: [] });
  }
});

// ==================== AUTH & SMART PHONE VALIDATOR ROUTES ====================

app.post('/api/validate-phone', (req, res) => {
  const result = validatePhoneNumber(req.body.phone, req.body.countryCode || '+963');
  return res.json(result);
});

app.post('/api/admin/validate-phone', authMiddleware, adminMiddleware, (req, res) => {
  const rawPhone = String(req.body.phone || '');
  const countryCode = String(req.body.countryCode || 'LOCAL');
  const result = validatePhoneNumber(rawPhone, countryCode);
  const matchedUser = findUserByPhoneFlexible(rawPhone, countryCode);
  return res.json({
    ...result,
    registeredAccount: matchedUser
      ? {
          id: matchedUser.id,
          phone: matchedUser.phone,
          vipLevel: matchedUser.vip_level || 0,
          balance: round2(matchedUser.balance || 0),
          isBanned: Boolean(matchedUser.is_banned)
        }
      : null
  });
});

app.post('/api/auth/register', (req, res) => {
  try {
    const phoneCheck = validatePhoneNumber(req.body.phone, req.body.countryCode || '+963');
    const password = String(req.body.password || '');
    const inviteCode = String(req.body.inviteCode || '').trim().toUpperCase();

    if (!phoneCheck.valid) {
      return res.status(400).json({
        error: phoneCheck.error || 'رقم الهاتف المدخل غير صحيح أو غير مطابق لشبكات الاتصالات المعتمدة',
        phoneValidation: phoneCheck
      });
    }
    const phone = phoneCheck.e164;

    if (password.length < 4) {
      return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور من 4 أحرف أو أرقام على الأقل' });
    }

    const existing = findUserByPhoneFlexible(req.body.phone, req.body.countryCode);
    if (existing) {
      return res.status(409).json({ error: 'رقم الهاتف مسجل مسبقاً، يرجى تسجيل الدخول' });
    }

    let referredById = null;
    if (inviteCode) {
      const inviter = db.prepare('SELECT id FROM users WHERE invite_code = ?').get(inviteCode);
      if (inviter) {
        referredById = inviter.id;
      }
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newInviteCode = generateInviteCode();

    const result = db.prepare(`
      INSERT INTO users (phone, password_hash, invite_code, referred_by, vip_level)
      VALUES (?, ?, ?, ?, 0)
    `).run(phone, passwordHash, newInviteCode, referredById);

    const newUserId = result.lastInsertRowid;
    createNotification(
      newUserId,
      'أهلاً بك في منصة Arona Boost!',
      'تم تفعيل حسابك بنجاح ضمن الفئة التمهيدية A0. يمكنك إعداد رمز السحب المالي PIN من تبويب حسابي.',
      'success'
    );

    if (referredById) {
      createNotification(
        referredById,
        'انضم عضو جديد إلى فريقك!',
        `انضم عضو جديد (${maskPhone(phone)}) عبر رمز دعوتك بنجاح.`,
        'info'
      );
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    const serialized = serializeUser(user);
    return res.status(201).json({
      token,
      user: serialized,
      todayStats: getTodayStats(user.id, serialized.vipLevel),
      ...getPublicPlatformPayload()
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const password = String(req.body.password || '');
    if (!req.body.phone || !password) {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف وكلمة المرور' });
    }

    const user = findUserByPhoneFlexible(req.body.phone, req.body.countryCode);
    if (!user) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    if (user.is_banned && !user.is_admin) {
      return res.status(403).json({
        error: 'هذا الحساب موقوف مؤقتاً من الإدارة، يرجى التواصل مع الدعم عبر واتساب'
      });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    const serialized = serializeUser(user);
    return res.json({
      token,
      user: serialized,
      todayStats: getTodayStats(user.id, serialized.vipLevel),
      ...getPublicPlatformPayload()
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

// ==================== USER, REWARDS & NOTIFICATIONS ====================

app.get('/api/me', authMiddleware, (req, res) => {
  const serialized = serializeUser(req.user);
  res.json({
    user: serialized,
    todayStats: getTodayStats(req.user.id, serialized.vipLevel),
    ...getPublicPlatformPayload()
  });
});

app.get('/api/notifications', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT id, title, body, type, is_read as isRead, created_at as createdAt
    FROM notifications
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 40
  `).all(req.user.id);

  res.json({
    notifications: rows.map((r) => ({ ...r, isRead: Boolean(r.isRead) })),
    unreadCount: getUnreadNotificationsCount(req.user.id)
  });
});

app.post('/api/notifications/read-all', authMiddleware, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({
    message: 'تم تحديد جميع الإشعارات كمقروءة',
    user: serializeUser(updated)
  });
});

// ==================== DEPOSIT & WITHDRAW ====================

app.get('/api/deposit-info', authMiddleware, async (req, res) => {
  try {
    const settings = getSettingsMap();
    const trc20Address = settings.trc20_address;
    const bep20Address = settings.bep20_address;

    const [trc20Qr, bep20Qr] = await Promise.all([
      QRCode.toDataURL(trc20Address, { margin: 1, width: 220, color: { dark: '#0F172A', light: '#FFFFFF' } }),
      QRCode.toDataURL(bep20Address, { margin: 1, width: 220, color: { dark: '#0F172A', light: '#FFFFFF' } })
    ]);

    res.json({
      trc20Address,
      bep20Address,
      trc20Qr,
      bep20Qr,
      minDeposit: Number(settings.min_deposit || 10),
      minWithdraw: Number(settings.min_withdraw || 5),
      dailyWithdrawLimit: Number(settings.daily_withdraw_limit || 2),
      withdrawFeePercent: Number(settings.withdraw_fee_percent || 0),
      autoApproveDeposits: settings.auto_approve_deposits === 'true',
      autoApproveWithdrawals: settings.auto_approve_withdrawals === 'true',
      whatsappNumber: settings.whatsapp_number || '963990000000'
    });
  } catch (err) {
    console.error('Deposit info error:', err);
    res.status(500).json({ error: 'تعذر تحميل معلومات المحفظة' });
  }
});

app.post('/api/transactions/deposit', authMiddleware, async (req, res) => {
  try {
    const amount = round2(Number(req.body.amount));
    const network = ['TRC20', 'BEP20'].includes(req.body.network) ? req.body.network : 'TRC20';
    const txid = String(req.body.txid || '').trim();

    const settings = getSettingsMap();
    const minDeposit = Number(settings.min_deposit || 10);

    if (!amount || isNaN(amount) || amount < minDeposit) {
      return res.status(400).json({ error: `الحد الأدنى للإيداع هو ${minDeposit} USDT` });
    }
    if (amount > 100000) {
      return res.status(400).json({ error: 'المبلغ المدخل يتجاوز الحد المسموح للعملية الواحدة' });
    }
    if (!txid || txid.length < 6) {
      return res.status(400).json({
        error: 'يرجى إدخال معرّف عملية التحويل (TXID) بشكل صحيح (6 محارف على الأقل) لتوثيق الإيداع'
      });
    }

    // Prevent duplicate TXID submission
    const duplicateTx = db
      .prepare(
        "SELECT id FROM transactions WHERE type = 'deposit' AND LOWER(wallet_or_txid) = LOWER(?) AND status != 'rejected'"
      )
      .get(txid);
    if (duplicateTx) {
      return res.status(409).json({
        error: 'معرّف المعاملة (TXID) هذا مسجل مسبقاً في النظام، يرجى التأكد من الرقم'
      });
    }

    // Run real automated on-chain blockchain verification (TRON TRC20 / BSC BEP20)
    const expectedWallet =
      network === 'BEP20' ? settings.bep20_address : settings.trc20_address;
    const chainReport = await verifyTransactionOnChain({
      txid,
      network,
      expectedAmount: amount,
      expectedWallet
    });

    const autoApproveAlways = settings.auto_approve_deposits === 'true';
    const autoApproveByBlockchain =
      settings.blockchain_auto_approve_verified === 'true' &&
      chainReport.fullyVerified === true;
    const shouldCompleteImmediately = autoApproveAlways || autoApproveByBlockchain;

    const refCode = generateRefCode('DEP');
    const status = shouldCompleteImmediately ? 'completed' : 'pending';
    const note = autoApproveByBlockchain
      ? `تم التحقق الآلي من البلوكتشين واعتماد الإيداع عبر ${network}`
      : autoApproveAlways
      ? `إيداع موثق عبر شبكة ${network}`
      : `طلب إيداع قيد مراجعة الإدارة (${chainReport.summaryAr})`;

    const runDeposit = db.transaction(() => {
      const insertRes = db.prepare(`
        INSERT INTO transactions (
          user_id, type, amount, fee_amount, net_amount, network,
          wallet_or_txid, reference_code, status, note, chain_status, chain_details_json
        )
        VALUES (?, 'deposit', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id,
        amount,
        amount,
        network,
        txid,
        refCode,
        status,
        note,
        chainReport.statusBadge || 'unverified',
        JSON.stringify(chainReport)
      );

      if (shouldCompleteImmediately) {
        applyApprovedDepositToUser(req.user.id, amount);
        distributeReferralCommissions(req.user.id, amount);
        grantDepositWheelSpins(req.user.id, amount);

        createNotification(
          req.user.id,
          `تم تأكيد إيداعك +$${amount.toFixed(2)} USDT`,
          autoApproveByBlockchain
            ? `تم التحقق الآلي من معاملتك على بلوكتشين ${network} وإضافة الرصيد فوراً!`
            : `تم توثيق المعاملة (${refCode}) وإضافة الرصيد إلى محفظتك بنجاح.`,
          'success'
        );
      } else {
        createNotification(
          req.user.id,
          `استلام طلب إيداع $${amount.toFixed(2)} USDT`,
          `تم تسجيل طلب الإيداع (${refCode}) وفحصه أولياً على الشبكة وهو قيد المراجعة لاعتماد الرصيد.`,
          'info'
        );
      }

      return db.prepare('SELECT * FROM transactions WHERE id = ?').get(insertRes.lastInsertRowid);
    });

    const createdTx = runDeposit();
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const serialized = serializeUser(updatedUser);

    return res.status(201).json({
      message: autoApproveByBlockchain
        ? `تم التحقق من المعاملة على بلوكتشين ${network} واعتماد +${amount.toFixed(2)} USDT تلقائياً!`
        : shouldCompleteImmediately
        ? `تم إيداع ${amount.toFixed(2)} USDT بنجاح وتحديث رصيدك!`
        : `تم إرسال طلب إيداع ${amount.toFixed(2)} USDT بمعرّف TXID بنجاح وهو قيد مراجعة الإدارة`,
      transaction: createdTx,
      chainVerification: chainReport,
      user: serialized,
      todayStats: getTodayStats(req.user.id, serialized.vipLevel)
    });
  } catch (err) {
    console.error('Deposit error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تنفيذ عملية الإيداع' });
  }
});

app.post('/api/transactions/withdraw', authMiddleware, (req, res) => {
  try {
    const amount = round2(Number(req.body.amount));
    const network = ['TRC20', 'BEP20'].includes(req.body.network) ? req.body.network : 'TRC20';
    const walletAddress = String(req.body.walletAddress || '').trim();
    const pin = normalizeDigitsAndStrip(req.body.pin || '');

    const settings = getSettingsMap();
    const minWithdraw = Number(settings.min_withdraw || 5);
    const dailyLimit = Number(settings.daily_withdraw_limit || 2);
    const feePct = Math.max(0, Number(settings.withdraw_fee_percent || 0));

    if (!walletAddress || walletAddress.length < 12) {
      return res.status(400).json({ error: 'يرجى إدخال عنوان محفظة USDT صحيح لاستلام السحب' });
    }
    if (!amount || isNaN(amount) || amount < minWithdraw) {
      return res.status(400).json({ error: `الحد الأدنى للسحب هو ${minWithdraw} USDT` });
    }

    const freshUserCheck = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!freshUserCheck.withdraw_pin_hash) {
      return res.status(400).json({
        error: 'يرجى تعيين رمز الحماية المالي للسحب (PIN) أولاً لحماية رصيدك',
        requirePinSetup: true
      });
    }
    if (!pin || !bcrypt.compareSync(pin, freshUserCheck.withdraw_pin_hash)) {
      return res.status(401).json({ error: 'رمز الحماية المالي (PIN) غير صحيح' });
    }

    if (
      freshUserCheck.wallet_locked &&
      freshUserCheck.saved_wallet_address &&
      (walletAddress !== freshUserCheck.saved_wallet_address ||
        network !== (freshUserCheck.saved_wallet_network || 'TRC20'))
    ) {
      return res.status(403).json({
        error:
          'قفل الحماية المصرفية مفعّل: يُسمح بالسحب حصراً إلى عنوان محفظتك المعتمدة والمقفلة في مركز الأمان'
      });
    }

    // Check 24-hour withdrawal count limit
    const recentCount = db
      .prepare(
        `SELECT COUNT(*) as cnt FROM transactions
         WHERE user_id = ? AND type = 'withdraw' AND status != 'rejected'
           AND created_at >= datetime('now', '-24 hours')`
      )
      .get(req.user.id).cnt;

    if (dailyLimit > 0 && recentCount >= dailyLimit) {
      return res.status(400).json({
        error: `لقد وصلت إلى الحد الأقصى لعمليات السحب المسموحة خلال 24 ساعة (${dailyLimit} عمليات)`
      });
    }

    const feeAmount = round2((amount * feePct) / 100);
    const netAmount = round2(Math.max(0, amount - feeAmount));
    const autoApprove = settings.auto_approve_withdrawals === 'true';
    const refCode = generateRefCode('WTH');

    const runWithdraw = db.transaction(() => {
      const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      if (freshUser.balance < amount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const status = autoApprove ? 'completed' : 'pending';
      const note = autoApprove
        ? `سحب أرباح مكتمل إلى محفظة ${network}`
        : `طلب سحب موثق برمز PIN قيد المعالجة عبر ${network}`;

      const newBalance = round2(freshUser.balance - amount);
      const newTotalWithdrawals = autoApprove
        ? round2(freshUser.total_withdrawals + amount)
        : round2(freshUser.total_withdrawals);

      db.prepare(`
        UPDATE users
        SET balance = ?,
            total_withdrawals = ?,
            saved_wallet_address = ?,
            saved_wallet_network = ?
        WHERE id = ?
      `).run(newBalance, newTotalWithdrawals, walletAddress, network, req.user.id);

      const insertRes = db.prepare(`
        INSERT INTO transactions (user_id, type, amount, fee_amount, net_amount, network, wallet_or_txid, reference_code, status, note)
        VALUES (?, 'withdraw', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, amount, feeAmount, netAmount, network, walletAddress, refCode, status, note);

      createNotification(
        req.user.id,
        autoApprove
          ? `تم تنفيذ سحب $${amount.toFixed(2)} USDT`
          : `طلب سحب قيد المراجعة ($${amount.toFixed(2)} USDT)`,
        autoApprove
          ? `تم تحويل صافي ${netAmount.toFixed(2)} USDT إلى محفظتك عبر شبكة ${network}.`
          : `تم تسجيل طلب السحب (${refCode}) بنجاح وسيتم تحويل ${netAmount.toFixed(2)} USDT بعد مراجعة الإدارة.`,
        autoApprove ? 'success' : 'info'
      );

      return db.prepare('SELECT * FROM transactions WHERE id = ?').get(insertRes.lastInsertRowid);
    });

    let createdTx;
    try {
      createdTx = runWithdraw();
    } catch (txErr) {
      if (txErr.message === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({ error: 'الرصيد الحالي غير كافٍ لإتمام عملية السحب' });
      }
      throw txErr;
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const serialized = serializeUser(updatedUser);

    return res.status(201).json({
      message: autoApprove
        ? `تم تنفيذ سحب ${amount.toFixed(2)} USDT بنجاح!`
        : `تم إرسال طلب سحب ${amount.toFixed(2)} USDT بنجاح وهو قيد مراجعة الإدارة`,
      transaction: createdTx,
      user: serialized,
      todayStats: getTodayStats(req.user.id, serialized.vipLevel)
    });
  } catch (err) {
    console.error('Withdraw error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تنفيذ عملية السحب' });
  }
});

app.get('/api/transactions', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT id, type, amount, fee_amount as feeAmount, net_amount as netAmount,
           network, wallet_or_txid as walletOrTxid,
           reference_code as referenceCode, status, note, created_at as createdAt
    FROM transactions
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 100
  `).all(req.user.id);

  res.json({ transactions: rows });
});

app.post('/api/vip/activate', authMiddleware, (req, res) => {
  const levels = getActiveVipLevels();
  const targetLevel = Number(req.body.level);
  const targetVip = levels.find((v) => v.level === targetLevel);
  if (!targetVip) {
    return res.status(400).json({ error: 'المستوى المطلوب غير موجود' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (user.vip_level >= targetLevel) {
    return res.json({
      message: `أنت بالفعل في ${targetVip.name} أو أعلى`,
      user: serializeUser(user)
    });
  }

  const currentGuarantee = round2(user.work_guarantee_amount || 0);
  const incrementalNeeded = Math.max(0, round2(targetVip.minDeposit - currentGuarantee));
  const spendablePool = round2((user.recharge_balance || 0) + (user.balance || 0));

  if (user.total_deposits < targetVip.minDeposit && spendablePool < incrementalNeeded) {
    const shortfall = round2(incrementalNeeded - spendablePool);
    return res.status(400).json({
      error: `يتطلب تفعيل ${targetVip.name} ضمان عمل بقيمة ${targetVip.minDeposit} USDT (ينقصك ${shortfall.toFixed(2)} USDT في رصيد الشحن)`,
      neededAmount: shortfall > 0 ? shortfall : targetVip.minDeposit
    });
  }

  const settings = getSettingsMap();
  const guarDays = Math.max(1, Math.round(Number(settings.guarantee_duration_days || 365)));

  const activateTx = db.transaction(() => {
    const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    let nextRecharge = round2(fresh.recharge_balance || 0);
    let nextBalance = round2(fresh.balance || 0);
    let nextGuarantee = round2(fresh.work_guarantee_amount || 0);

    const deltaGuar = Math.max(0, round2(targetVip.minDeposit - nextGuarantee));
    if (deltaGuar > 0 && nextRecharge + nextBalance >= deltaGuar) {
      const fromRecharge = Math.min(nextRecharge, deltaGuar);
      const fromBalance = round2(deltaGuar - fromRecharge);
      nextRecharge = round2(nextRecharge - fromRecharge);
      nextBalance = round2(nextBalance - fromBalance);
      nextGuarantee = round2(nextGuarantee + deltaGuar);
    } else if (fresh.total_deposits >= targetVip.minDeposit && nextGuarantee < targetVip.minDeposit) {
      nextGuarantee = round2(targetVip.minDeposit);
    }

    const dates = db
      .prepare("SELECT datetime('now') as s, datetime('now', ?) as e")
      .get(`+${guarDays} days`);
    const startStr = fresh.work_guarantee_start || dates.s;
    const nextJob =
      fresh.job_title && fresh.job_title !== 'موظف متدرب' ? fresh.job_title : 'موظف رسمي';

    db.prepare(`
      UPDATE users
      SET vip_level = ?,
          recharge_balance = ?,
          balance = ?,
          work_guarantee_amount = ?,
          work_guarantee_start = ?,
          work_guarantee_expires = ?,
          job_title = ?
      WHERE id = ?
    `).run(
      targetLevel,
      nextRecharge,
      nextBalance,
      nextGuarantee,
      startStr,
      dates.e,
      nextJob,
      user.id
    );
  });

  activateTx();

  createNotification(
    user.id,
    `ترقية العضوية إلى ${targetVip.name} وتوثيق ضمان العمل`,
    `مبارك! تم تفعيل ${targetVip.name} (${targetVip.title}) وتوثيق عقد ضمان العمل لمدة ${guarDays} يوماً بنجاح.`,
    'success'
  );
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  const serialized = serializeUser(updated);

  return res.json({
    message: `مبارك! تم تفعيل ${targetVip.name} (${targetVip.title}) وتوثيق ضمان العمل بنجاح`,
    user: serialized,
    todayStats: getTodayStats(user.id, serialized.vipLevel)
  });
});

app.post('/api/account/refund-guarantee', authMiddleware, (req, res) => {
  try {
    const refundTx = db.transaction(() => {
      const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      const guarAmt = round2(u.work_guarantee_amount || 0);
      if (guarAmt <= 0) throw new Error('NO_GUARANTEE');

      if (u.work_guarantee_expires) {
        const expMs = new Date(u.work_guarantee_expires.replace(' ', 'T') + 'Z').getTime();
        if (Date.now() < expMs) {
          throw new Error('NOT_EXPIRED');
        }
      }

      db.prepare(`
        UPDATE users
        SET balance = ROUND(balance + ?, 2),
            work_guarantee_amount = 0,
            work_guarantee_start = '',
            work_guarantee_expires = ''
        WHERE id = ?
      `).run(guarAmt, u.id);

      createNotification(
        u.id,
        `استرداد مبلغ ضمان العمل +$${guarAmt.toFixed(2)} USDT`,
        `انتهت مدة عقد ضمان العمل وتم استرداد كامل مبلغ الضمان ($${guarAmt.toFixed(2)} USDT) إلى محفظة الدخل القابلة للسحب.`,
        'reward'
      );

      return guarAmt;
    });

    let refundedAmount = 0;
    try {
      refundedAmount = refundTx();
    } catch (e) {
      if (e.message === 'NO_GUARANTEE') {
        return res.status(400).json({ error: 'لا يوجد مبلغ ضمان عمل مقيّد حالياً على حسابك' });
      }
      if (e.message === 'NOT_EXPIRED') {
        return res.status(400).json({ error: 'لم تنتهِ بعد فترة العد التنازلي لاسترداد ضمان العمل' });
      }
      throw e;
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      message: `تم استرداد مبلغ ضمان العمل (+$${refundedAmount.toFixed(2)} USDT) بنجاح إلى محفظة الدخل!`,
      user: serializeUser(updated)
    });
  } catch (err) {
    console.error('Refund guarantee error:', err);
    return res.status(500).json({ error: 'تعذر إتمام استرداد ضمان العمل' });
  }
});

app.get('/api/account/financial-records', authMiddleware, (req, res) => {
  try {
    const uid = req.user.id;

    // 1. Gather itemized ledger events across all subsystems
    const ledger = [];

    const txRows = db
      .prepare(
        `SELECT id, type, amount, fee_amount, net_amount, network, status, reference_code, created_at
         FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 40`
      )
      .all(uid);
    for (const t of txRows) {
      if (t.type === 'deposit') {
        ledger.push({
          id: `tx_${t.id}`,
          category: 'deposit',
          categoryAr: 'شحن رصيد / ضمان',
          title: `إيداع عبر شبكة ${t.network} (${t.reference_code})`,
          amount: round2(t.amount),
          direction: 'in',
          walletAr: 'رصيد الشحن / ضمان العمل',
          status: t.status,
          createdAt: t.created_at
        });
      } else {
        ledger.push({
          id: `tx_${t.id}`,
          category: 'withdraw',
          categoryAr: 'سحب أرباح',
          title: `سحب إلى ${t.network} (صافي $${round2(t.net_amount || t.amount).toFixed(2)})`,
          amount: round2(t.amount),
          direction: 'out',
          walletAr: 'محفظة الدخل',
          status: t.status,
          createdAt: t.created_at
        });
      }
    }

    const taskRows = db
      .prepare(
        `SELECT id, task_title, reward, completed_date, created_at
         FROM task_completions WHERE user_id = ? ORDER BY id DESC LIMIT 45`
      )
      .all(uid);
    for (const tc of taskRows) {
      ledger.push({
        id: `task_${tc.id}`,
        category: 'task',
        categoryAr: 'عائد مهمة سياحية',
        title: `تقييم وجهة: ${tc.task_title}`,
        amount: round2(tc.reward),
        direction: 'in',
        walletAr: 'محفظة الدخل',
        status: 'completed',
        dayKey: tc.completed_date,
        createdAt: tc.created_at
      });
    }

    const flashRows = db
      .prepare(
        `SELECT fc.id, fm.title, fc.reward, fc.created_at
         FROM flash_mission_claims fc
         JOIN flash_missions fm ON fm.id = fc.mission_id
         WHERE fc.user_id = ? ORDER BY fc.id DESC LIMIT 20`
      )
      .all(uid);
    for (const fl of flashRows) {
      ledger.push({
        id: `flash_${fl.id}`,
        category: 'flash',
        categoryAr: 'مهمة سياحية خاصة',
        title: fl.title,
        amount: round2(fl.reward),
        direction: 'in',
        walletAr: 'محفظة الدخل',
        status: 'completed',
        createdAt: fl.created_at
      });
    }

    const commRows = db
      .prepare(
        `SELECT id, tier, commission_amount, reason, created_at
         FROM team_commissions WHERE beneficiary_id = ? ORDER BY id DESC LIMIT 35`
      )
      .all(uid);
    for (const cm of commRows) {
      ledger.push({
        id: `comm_${cm.id}`,
        category: 'commission',
        categoryAr: `عمولة فريق (المستوى ${cm.tier === 1 ? 'A' : cm.tier === 2 ? 'B' : 'C'})`,
        title: cm.reason || 'عمولة إحالة فريق',
        amount: round2(cm.commission_amount),
        direction: 'in',
        walletAr: 'محفظة الدخل',
        status: 'completed',
        createdAt: cm.created_at
      });
    }

    const wheelRows = db
      .prepare(
        `SELECT id, segment_label, reward_amount, created_at
         FROM wheel_spins_log WHERE user_id = ? ORDER BY id DESC LIMIT 20`
      )
      .all(uid);
    for (const wh of wheelRows) {
      ledger.push({
        id: `wheel_${wh.id}`,
        category: 'wheel',
        categoryAr: 'مكافأة السحب المحظوظ',
        title: `جائزة عجلة الحظ (${wh.segment_label})`,
        amount: round2(wh.reward_amount),
        direction: 'in',
        walletAr: 'محفظة الدخل',
        status: 'completed',
        createdAt: wh.created_at
      });
    }

    const vaultRows = db
      .prepare(
        `SELECT id, plan_title, amount, expected_profit, status, started_at, claimed_at
         FROM vault_positions WHERE user_id = ? ORDER BY id DESC LIMIT 20`
      )
      .all(uid);
    for (const vp of vaultRows) {
      ledger.push({
        id: `vault_open_${vp.id}`,
        category: 'vault',
        categoryAr: 'استثمار مع أرونا',
        title: `تفعيل عقد في ${vp.plan_title}`,
        amount: round2(vp.amount),
        direction: 'out',
        walletAr: 'استثمر مع أرونا',
        status: 'completed',
        createdAt: vp.started_at
      });
      if (vp.status === 'claimed' && vp.claimed_at) {
        ledger.push({
          id: `vault_claim_${vp.id}`,
          category: 'vault_profit',
          categoryAr: 'عائد استثمار أرونا',
          title: `استحقاق عقد ${vp.plan_title} (+$${round2(vp.expected_profit).toFixed(2)} ربح)`,
          amount: round2(vp.amount + vp.expected_profit),
          direction: 'in',
          walletAr: 'محفظة الدخل',
          status: 'completed',
          createdAt: vp.claimed_at
        });
      }
    }

    const salRows = db
      .prepare(
        `SELECT id, rank_title, amount, period_month, status, created_at
         FROM salary_claims WHERE user_id = ? ORDER BY id DESC LIMIT 15`
      )
      .all(uid);
    for (const sl of salRows) {
      ledger.push({
        id: `sal_${sl.id}`,
        category: 'salary',
        categoryAr: 'راتب شهري ثابت',
        title: `راتب منصب "${sl.rank_title}" (${sl.period_month})`,
        amount: round2(sl.amount),
        direction: 'in',
        walletAr: 'محفظة الدخل',
        status: sl.status === 'approved' ? 'completed' : sl.status,
        createdAt: sl.created_at
      });
    }

    const promoRows = db
      .prepare(
        `SELECT id, rank_title, bonus_amount, physical_gift, status, created_at
         FROM claimed_position_bonuses WHERE user_id = ? ORDER BY id DESC LIMIT 15`
      )
      .all(uid);
    for (const pr of promoRows) {
      ledger.push({
        id: `promo_${pr.id}`,
        category: 'promotion',
        categoryAr: 'مكافأة ترقية منصب',
        title: `ترقية إلى "${pr.rank_title}"${pr.physical_gift ? ` + ${pr.physical_gift}` : ''}`,
        amount: round2(pr.bonus_amount),
        direction: 'in',
        walletAr: 'محفظة الدخل',
        status: pr.status === 'approved' ? 'completed' : pr.status,
        createdAt: pr.created_at
      });
    }

    ledger.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    // 2. Build 14-day Daily Statement (البيان اليومي)
    const dayMap = new Map();
    const todayDate = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(todayDate.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, {
        date: key,
        tasksIncome: 0,
        tasksCount: 0,
        teamIncome: 0,
        rewardsIncome: 0,
        totalIncome: 0,
        depositsTotal: 0,
        withdrawalsTotal: 0
      });
    }

    for (const item of ledger) {
      if (item.status === 'rejected') continue;
      const dKey = item.dayKey || String(item.createdAt || '').slice(0, 10);
      if (!dKey) continue;
      if (!dayMap.has(dKey)) {
        dayMap.set(dKey, {
          date: dKey,
          tasksIncome: 0,
          tasksCount: 0,
          teamIncome: 0,
          rewardsIncome: 0,
          totalIncome: 0,
          depositsTotal: 0,
          withdrawalsTotal: 0
        });
      }
      const bucket = dayMap.get(dKey);
      if (item.category === 'task' || item.category === 'flash') {
        bucket.tasksIncome = round2(bucket.tasksIncome + item.amount);
        bucket.tasksCount += 1;
        bucket.totalIncome = round2(bucket.totalIncome + item.amount);
      } else if (
        (item.category === 'commission' ||
          item.category === 'salary' ||
          item.category === 'promotion') &&
        item.status === 'completed'
      ) {
        bucket.teamIncome = round2(bucket.teamIncome + item.amount);
        bucket.totalIncome = round2(bucket.totalIncome + item.amount);
      } else if (item.category === 'wheel' || item.category === 'vault_profit') {
        const netReward = item.category === 'vault_profit' ? item.amount : item.amount;
        bucket.rewardsIncome = round2(bucket.rewardsIncome + netReward);
        bucket.totalIncome = round2(bucket.totalIncome + netReward);
      } else if (item.category === 'deposit' && item.status === 'completed') {
        bucket.depositsTotal = round2(bucket.depositsTotal + item.amount);
      } else if (item.category === 'withdraw' && item.status !== 'rejected') {
        bucket.withdrawalsTotal = round2(bucket.withdrawalsTotal + item.amount);
      }
    }

    const dailyStatements = Array.from(dayMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);

    return res.json({
      dailyStatements,
      ledgerEntries: ledger.slice(0, 60)
    });
  } catch (err) {
    console.error('Financial records error:', err);
    return res.status(500).json({ error: 'تعذر تحميل البيان اليومي والسجل المالي' });
  }
});

// ==================== LIVE TOURISM PHOTOS & TASKS ROUTES ====================

app.get('/api/live-image', (req, res) => {
  const rawUrl = String(req.query.u || '');
  proxyWikimediaImage(rawUrl, res);
});

app.get('/api/destinations/featured', authMiddleware, async (req, res) => {
  try {
    const seed = Number(req.query.seed || 0);
    const items = await getFeaturedDestinationsShowcase(seed);
    res.json({ items });
  } catch (err) {
    console.error('Featured destinations error:', err);
    res.status(500).json({ error: 'تعذر تحميل الصور الحية' });
  }
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const levels = getActiveVipLevels();
    const serialized = serializeUser(req.user);
    const currentVip = levels.find((v) => v.level === serialized.vipLevel) || levels[0];
    const nextVip = levels.find((v) => v.level === serialized.vipLevel + 1) || null;
    const today = getTodayDateStr();
    const seed = Number(req.query.seed || 0);

    const todayCompletions = db.prepare(`
      SELECT task_slot, task_title, location, image_url, reward, rating, review_tags, review_comment, created_at
      FROM task_completions
      WHERE user_id = ? AND completed_date = ?
    `).all(req.user.id, today);

    const completedMap = new Map();
    for (const c of todayCompletions) {
      completedMap.set(c.task_slot, c);
    }

    const dynamicSlots = await getDynamicDestinationsForSlots(
      currentVip.dailyTasks,
      completedMap,
      seed + req.user.id
    );

    const activeTasks = dynamicSlots.map((item) => ({
      ...item,
      vipRequired: currentVip.level,
      reward: currentVip.rewardPerTask
    }));

    let lockedPreviewTasks = [];
    if (nextVip) {
      const previewList = await getFeaturedDestinationsShowcase(seed + 77);
      lockedPreviewTasks = previewList.slice(0, 2).map((item, idx) => ({
        slot: currentVip.dailyTasks + idx + 1,
        key: item.key,
        sectorType: item.sectorType || 'landmark',
        sectorBadge: item.sectorBadge || 'عقد تقييم سياحي',
        codePrefix: item.codePrefix || '#AB',
        title: item.title,
        location: item.location,
        category: item.category,
        image: item.image,
        fallbackImage: item.fallbackImage,
        gallery: item.gallery,
        avgRating: item.avgRating,
        vipRequired: nextVip.level,
        vipName: nextVip.name,
        reward: nextVip.rewardPerTask,
        locked: true
      }));
    }

    const history = db.prepare(`
      SELECT id, task_slot as slot, task_title as title, vip_level as vipLevel,
             reward, rating, review_tags as reviewTags, review_comment as reviewComment,
             location, image_url as imageUrl, completed_date as completedDate, created_at as createdAt
      FROM task_completions
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 30
    `).all(req.user.id);

    // Active non-expired Limited Flash VIP Missions
    const rawFlash = db
      .prepare(
        `SELECT id, title, location, category, description, image_url as imageUrl,
                reward, min_vip_level as minVipLevel, max_claims as maxClaims,
                claimed_count as claimedCount, expires_at as expiresAt
         FROM flash_missions
         WHERE is_active = 1 AND expires_at > datetime('now')
         ORDER BY id DESC`
      )
      .all();

    const myFlashClaims = new Set(
      db
        .prepare('SELECT mission_id FROM flash_mission_claims WHERE user_id = ?')
        .all(req.user.id)
        .map((r) => r.mission_id)
    );

    const flashMissions = rawFlash.map((fm) => {
      const remainingSlots = Math.max(0, fm.maxClaims - fm.claimedCount);
      const alreadyClaimed = myFlashClaims.has(fm.id);
      const isVipQualified = serialized.vipLevel >= fm.minVipLevel;
      return {
        ...fm,
        reward: round2(fm.reward),
        remainingSlots,
        alreadyClaimed,
        isVipQualified,
        isSoldOut: remainingSlots <= 0
      };
    });

    res.json({
      currentVip,
      nextVip,
      today,
      activeTasks,
      lockedPreviewTasks,
      flashMissions,
      history,
      todayStats: getTodayStats(req.user.id, serialized.vipLevel)
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'تعذر تحميل الوجهات السياحية الحية' });
  }
});

app.post('/api/tasks/flash/:id/complete', authMiddleware, (req, res) => {
  try {
    const missionId = Number(req.params.id);
    const rawRating = Number(req.body.rating ?? 5);
    const rating = Math.min(5, Math.max(1, Math.round(isNaN(rawRating) ? 5 : rawRating)));
    const reviewComment = String(req.body.comment || '').trim().slice(0, 300);

    const serialized = serializeUser(req.user);

    const runFlash = db.transaction(() => {
      const fm = db
        .prepare(
          "SELECT * FROM flash_missions WHERE id = ? AND is_active = 1 AND expires_at > datetime('now')"
        )
        .get(missionId);
      if (!fm) throw new Error('NOT_AVAILABLE');

      if (serialized.vipLevel < fm.min_vip_level) {
        throw new Error(`NEED_VIP_${fm.min_vip_level}`);
      }

      const dup = db
        .prepare('SELECT id FROM flash_mission_claims WHERE mission_id = ? AND user_id = ?')
        .get(missionId, req.user.id);
      if (dup) throw new Error('ALREADY_CLAIMED');

      if (fm.claimed_count >= fm.max_claims) {
        throw new Error('SOLD_OUT');
      }

      const reward = round2(fm.reward);

      db.prepare('UPDATE flash_missions SET claimed_count = claimed_count + 1 WHERE id = ?').run(
        missionId
      );

      db.prepare(`
        INSERT INTO flash_mission_claims (mission_id, user_id, reward, rating, review_comment)
        VALUES (?, ?, ?, ?, ?)
      `).run(missionId, req.user.id, reward, rating, reviewComment);

      db.prepare(`
        UPDATE users
        SET balance = ROUND(balance + ?, 2),
            total_task_earnings = ROUND(total_task_earnings + ?, 2)
        WHERE id = ?
      `).run(reward, reward, req.user.id);

      createNotification(
        req.user.id,
        `مكافأة مهمة سياحية مميزة +$${reward.toFixed(2)} USDT`,
        `أنجزت تقييم المهمة المحدودة "${fm.title}" وحصلت على +$${reward.toFixed(2)} USDT!`,
        'reward'
      );

      return { title: fm.title, reward };
    });

    let result;
    try {
      result = runFlash();
    } catch (e) {
      if (e.message === 'NOT_AVAILABLE') {
        return res.status(400).json({ error: 'هذه المهمة المميزة انتهت صلاحيتها أو لم تعد متاحة' });
      }
      if (e.message.startsWith('NEED_VIP_')) {
        const reqVip = e.message.replace('NEED_VIP_', '');
        return res.status(403).json({
          error: `هذه المهمة الاستثنائية مخصصة لعقود الفئة A${reqVip} فأعلى`
        });
      }
      if (e.message === 'ALREADY_CLAIMED') {
        return res.status(400).json({ error: 'لقد قمت بإنجاز هذه المهمة المميزة مسبقاً' });
      }
      if (e.message === 'SOLD_OUT') {
        return res.status(400).json({ error: 'نفدت جميع المقاعد المتاحة لهذه المهمة المميزة' });
      }
      throw e;
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      message: `مبارك! أتممت تقييم "${result.title}" وأُضيف +$${result.reward.toFixed(2)} USDT لرصيدك`,
      reward: result.reward,
      user: serializeUser(updatedUser)
    });
  } catch (err) {
    console.error('Flash mission complete error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تنفيذ المهمة المميزة' });
  }
});

// ==================== ARONA SMART VAULT (STAKING) ====================

app.get('/api/vault', authMiddleware, (req, res) => {
  const plans = getVaultPlans();
  const rawPositions = db
    .prepare(
      `SELECT id, plan_id as planId, plan_title as planTitle, amount,
              daily_rate_pct as dailyRatePct, total_return_pct as totalReturnPct,
              expected_profit as expectedProfit, duration_days as durationDays,
              started_at as startedAt, matures_at as maturesAt, status, claimed_at as claimedAt
       FROM vault_positions
       WHERE user_id = ?
       ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id DESC
       LIMIT 30`
    )
    .all(req.user.id);

  const nowMs = Date.now();
  const positions = rawPositions.map((p) => {
    const startMs = new Date(p.startedAt.replace(' ', 'T') + 'Z').getTime();
    const matMs = new Date(p.maturesAt.replace(' ', 'T') + 'Z').getTime();
    const totalSpan = Math.max(1000, matMs - startMs);
    const elapsed = Math.max(0, nowMs - startMs);
    const progressPct =
      p.status === 'claimed' ? 100 : Math.min(100, Math.round((elapsed / totalSpan) * 100));
    const canClaim = p.status === 'active' && nowMs >= matMs;
    const remainingHours = Math.max(0, Math.ceil((matMs - nowMs) / 3600000));
    return {
      ...p,
      amount: round2(p.amount),
      expectedProfit: round2(p.expectedProfit),
      totalPayout: round2(p.amount + p.expectedProfit),
      progressPct,
      canClaim,
      remainingHours
    };
  });

  const activeLockedTotal = round2(
    positions.filter((p) => p.status === 'active').reduce((s, p) => s + p.amount, 0)
  );
  const activeExpectedProfit = round2(
    positions.filter((p) => p.status === 'active').reduce((s, p) => s + p.expectedProfit, 0)
  );
  const totalClaimedProfit = round2(
    positions.filter((p) => p.status === 'claimed').reduce((s, p) => s + p.expectedProfit, 0)
  );

  res.json({
    plans,
    positions,
    summary: {
      activeLockedTotal,
      activeExpectedProfit,
      totalClaimedProfit
    }
  });
});

app.post('/api/vault/stake', authMiddleware, (req, res) => {
  try {
    const planId = String(req.body.planId || '');
    const amount = round2(Number(req.body.amount || 0));
    const plans = getVaultPlans();
    const chosenPlan = plans.find((p) => p.id === planId);

    if (!chosenPlan) {
      return res.status(400).json({ error: 'محفظة الاستثمار المختارة غير صالحة' });
    }
    if (!amount || isNaN(amount) || amount < Number(chosenPlan.minAmount || 10)) {
      return res.status(400).json({
        error: `الحد الأدنى للاستثمار في "${chosenPlan.title}" هو ${chosenPlan.minAmount} USDT`
      });
    }

    const durationDays = Math.max(1, Math.round(Number(chosenPlan.durationDays || 7)));
    const totalReturnPct = Number(chosenPlan.totalReturnPct || 8.4);
    const dailyRatePct = round2(totalReturnPct / durationDays);
    const expectedProfit = round2((amount * totalReturnPct) / 100);

    const stakeTx = db.transaction(() => {
      const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      const availRecharge = round2(freshUser.recharge_balance || 0);
      const availIncome = round2(freshUser.balance || 0);
      if (round2(availRecharge + availIncome) < amount) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const deductRecharge = Math.min(availRecharge, amount);
      const deductIncome = round2(amount - deductRecharge);

      db.prepare(
        'UPDATE users SET recharge_balance = ROUND(recharge_balance - ?, 2), balance = ROUND(balance - ?, 2) WHERE id = ?'
      ).run(deductRecharge, deductIncome, req.user.id);

      db.prepare(`
        INSERT INTO vault_positions (
          user_id, plan_id, plan_title, amount, daily_rate_pct, total_return_pct,
          expected_profit, duration_days, started_at, matures_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', ?), 'active')
      `).run(
        req.user.id,
        chosenPlan.id,
        chosenPlan.title,
        amount,
        dailyRatePct,
        totalReturnPct,
        expectedProfit,
        durationDays,
        `+${durationDays} days`
      );

      createNotification(
        req.user.id,
        `تفعيل عقد استثمر مع أرونا ($${amount.toFixed(2)} USDT)`,
        `تم استثمار $${amount.toFixed(2)} USDT في "${chosenPlan.title}" بعائد مضمون +$${expectedProfit.toFixed(
          2
        )} USDT عند الاستحقاق.`,
        'success'
      );
    });

    try {
      stakeTx();
    } catch (e) {
      if (e.message === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({ error: 'رصيدك المتاح غير كافٍ لفتح عقد الاستثمار' });
      }
      throw e;
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.status(201).json({
      message: `تم ربط $${amount.toFixed(2)} USDT في "${chosenPlan.title}" بنجاح! الربح المضمون +$${expectedProfit.toFixed(
        2
      )} USDT`,
      user: serializeUser(updated)
    });
  } catch (err) {
    console.error('Vault stake error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء فتح استثمار الخزنة' });
  }
});

app.post('/api/vault/claim/:id', authMiddleware, (req, res) => {
  try {
    const posId = Number(req.params.id);

    const claimTx = db.transaction(() => {
      const pos = db
        .prepare("SELECT * FROM vault_positions WHERE id = ? AND user_id = ? AND status = 'active'")
        .get(posId, req.user.id);
      if (!pos) throw new Error('NOT_FOUND');

      const matMs = new Date(pos.matures_at.replace(' ', 'T') + 'Z').getTime();
      if (Date.now() < matMs) {
        throw new Error('NOT_MATURED');
      }

      const totalPayout = round2(pos.amount + pos.expected_profit);

      db.prepare(
        "UPDATE vault_positions SET status = 'claimed', claimed_at = datetime('now') WHERE id = ?"
      ).run(posId);

      db.prepare('UPDATE users SET balance = ROUND(balance + ?, 2) WHERE id = ?').run(
        totalPayout,
        req.user.id
      );

      createNotification(
        req.user.id,
        `استحقاق خزنة أرونا +$${totalPayout.toFixed(2)} USDT`,
        `تم فك استثمار "${pos.plan_title}" وإضافة الأصل مع الأرباح ($${totalPayout.toFixed(
          2
        )} USDT) إلى رصيدك المتاح.`,
        'reward'
      );

      return totalPayout;
    });

    let payout;
    try {
      payout = claimTx();
    } catch (e) {
      if (e.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'عقد الاستثمار غير موجود أو تم استلامه مسبقاً' });
      }
      if (e.message === 'NOT_MATURED') {
        return res.status(400).json({ error: 'لم يحن موعد استحقاق هذا العقد الاستثماري بعد' });
      }
      throw e;
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      message: `مبارك! تم استلام رأس المال والأرباح +$${payout.toFixed(2)} USDT في محفظة الدخل`,
      user: serializeUser(updated)
    });
  } catch (err) {
    console.error('Vault claim error:', err);
    return res.status(500).json({ error: 'تعذر استلام عائد الاستثمار' });
  }
});

// ==================== DEPOSIT-LINKED LUCKY WHEEL ====================

app.get('/api/wheel', authMiddleware, (req, res) => {
  const settings = getSettingsMap();
  const segments = getWheelSegments().map((s) => ({
    id: s.id,
    label: s.label,
    reward: round2(s.reward),
    color: s.color || '#0D9488'
  }));

  const freshUser = db.prepare('SELECT spin_credits FROM users WHERE id = ?').get(req.user.id);
  const myHistory = db
    .prepare(
      `SELECT id, segment_label as label, reward_amount as reward, created_at as createdAt
       FROM wheel_spins_log
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 10`
    )
    .all(req.user.id);

  res.json({
    segments,
    spinCredits: Number(freshUser?.spin_credits || 0),
    minDepositForSpin: Number(settings.wheel_min_deposit || 20),
    referrerSpinEnabled: settings.wheel_referrer_spin !== 'false',
    myHistory
  });
});

app.post('/api/wheel/spin', authMiddleware, (req, res) => {
  try {
    const fullSegments = getWheelSegments();
    const positiveWeights = fullSegments.map((s) => Math.max(0, Number(s.weight || 0)));
    const totalWeight = positiveWeights.reduce((a, b) => a + b, 0);

    let winningIndex = 0;
    if (totalWeight > 0) {
      let roll = Math.random() * totalWeight;
      for (let i = 0; i < positiveWeights.length; i++) {
        roll -= positiveWeights[i];
        if (roll <= 0) {
          winningIndex = i;
          break;
        }
      }
    }

    const wonSeg = fullSegments[winningIndex] || fullSegments[0];
    const reward = round2(Number(wonSeg.reward || 0));

    const spinTx = db.transaction(() => {
      const u = db.prepare('SELECT id, spin_credits FROM users WHERE id = ?').get(req.user.id);
      if (!u || u.spin_credits <= 0) {
        throw new Error('NO_SPINS');
      }

      db.prepare(`
        UPDATE users
        SET spin_credits = spin_credits - 1,
            balance = ROUND(balance + ?, 2)
        WHERE id = ?
      `).run(reward, req.user.id);

      db.prepare(`
        INSERT INTO wheel_spins_log (user_id, segment_label, reward_amount)
        VALUES (?, ?, ?)
      `).run(req.user.id, wonSeg.label, reward);

      createNotification(
        req.user.id,
        `جائزة عجلة الحظ +$${reward.toFixed(2)} USDT 🎡`,
        `ربحت "${wonSeg.label}" من عجلة حظ Arona Boost وتمت إضافتها فوراً لرصيدك!`,
        'reward'
      );
    });

    try {
      spinTx();
    } catch (e) {
      if (e.message === 'NO_SPINS') {
        return res.status(400).json({
          error: 'لا تملك لفات متاحة حالياً. قم بإيداع مؤهل للحصول على لفة حظ مجانية!'
        });
      }
      throw e;
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      winningIndex,
      segment: {
        id: wonSeg.id,
        label: wonSeg.label,
        reward
      },
      reward,
      message: `مبارك! ربحت +$${reward.toFixed(2)} USDT من عجلة الحظ!`,
      user: serializeUser(updated)
    });
  } catch (err) {
    console.error('Wheel spin error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تدوير عجلة الحظ' });
  }
});

app.post('/api/tasks/complete', authMiddleware, (req, res) => {
  try {
    const levels = getActiveVipLevels();
    const slot = Number(req.body.slot);
    const destKey = String(req.body.destKey || '').trim();
    const rawRating = Number(req.body.rating ?? 5);
    const rating = Math.min(5, Math.max(1, Math.round(isNaN(rawRating) ? 5 : rawRating)));
    const tagsArr = Array.isArray(req.body.tags)
      ? req.body.tags.map((t) => String(t).trim()).filter(Boolean)
      : String(req.body.tags || '').split('،').map((t) => t.trim()).filter(Boolean);
    const reviewTags = tagsArr.slice(0, 5).join('، ');
    const reviewComment = String(req.body.comment || '').trim().slice(0, 300);

    const serialized = serializeUser(req.user);
    const currentVip = levels.find((v) => v.level === serialized.vipLevel) || levels[0];

    const contractCode = String(req.body.contractCode || `#AB-${300 + slot * 37}`).trim().slice(0, 24);

    if (!slot || slot < 1 || slot > currentVip.dailyTasks) {
      return res.status(400).json({ error: 'هذا العقد الفندقي غير متاح ضمن درجتك الوظيفية الحالية' });
    }

    const matchedPool =
      TOURISM_POOL.find((d) => d.key === destKey) ||
      TASK_CATALOG.find((t) => t.slot === slot) || {
        title: `وجهة سياحية #${slot}`,
        location: 'وجهة عالمية',
        fallbackImage: '/destinations/dest-1.jpg'
      };

    const chosenImage =
      typeof req.body.activeImage === 'string' &&
      (req.body.activeImage.startsWith('/api/live-image') ||
        req.body.activeImage.startsWith('/destinations/'))
        ? req.body.activeImage
        : matchedPool.fallbackImage || matchedPool.image || '/destinations/dest-1.jpg';

    const today = getTodayDateStr();
    const reward = round2(currentVip.rewardPerTask);

    const completeTx = db.transaction(() => {
      const already = db.prepare(`
        SELECT id FROM task_completions
        WHERE user_id = ? AND task_slot = ? AND completed_date = ?
      `).get(req.user.id, slot, today);

      if (already) {
        throw new Error('ALREADY_COMPLETED');
      }

      db.prepare(`
        INSERT INTO task_completions (
          user_id, task_slot, task_title, vip_level, reward,
          rating, review_tags, review_comment, location, image_url, completed_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id,
        slot,
        matchedPool.title,
        currentVip.level,
        reward,
        rating,
        reviewTags,
        reviewComment,
        matchedPool.location,
        chosenImage,
        today
      );

      db.prepare(`
        UPDATE users
        SET balance = ROUND(balance + ?, 2),
            total_task_earnings = ROUND(total_task_earnings + ?, 2),
            points_balance = COALESCE(points_balance, 0) + 10
        WHERE id = ?
      `).run(reward, reward, req.user.id);

      db.prepare(`
        INSERT INTO point_logs (user_id, delta, reason)
        VALUES (?, 10, ?)
      `).run(req.user.id, `مكافأة نقاط توثيق: ${matchedPool.title}`);
    });

    try {
      completeTx();
    } catch (txErr) {
      if (txErr.message === 'ALREADY_COMPLETED') {
        return res.status(400).json({ error: 'لقد قمت بتقييم هذه المنطقة السياحية اليوم بالفعل' });
      }
      throw txErr;
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const updatedSerialized = serializeUser(updatedUser);

    const sectorReportName =
      matchedPool.sectorType === 'resort'
        ? 'تقرير المنتجع العالمي'
        : matchedPool.sectorType === 'hotel'
        ? 'التقرير الفندقي'
        : 'تقرير المعلم السياحي';

    createNotification(
      req.user.id,
      `اعتماد ${sectorReportName} (${contractCode})`,
      `تم توثيق ${sectorReportName} لـ "${matchedPool.title}" وإيداع +$${reward.toFixed(2)} USDT في محفظة الدخل.`,
      'success'
    );

    return res.json({
      message: `تم اعتماد ${sectorReportName} (${contractCode}) وإيداع +${reward.toFixed(2)} USDT في محفظة الدخل`,
      reward,
      contractCode,
      user: updatedSerialized,
      todayStats: getTodayStats(req.user.id, updatedSerialized.vipLevel)
    });
  } catch (err) {
    console.error('Complete task error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ التقييم السياحي' });
  }
});

// ==================== TEAM & MILESTONE BONUSES ====================

app.get('/api/team', authMiddleware, (req, res) => {
  const userId = req.user.id;

  const tier1Raw = db.prepare(`
    SELECT id, phone, vip_level, total_deposits, created_at
    FROM users WHERE referred_by = ?
    ORDER BY id DESC
  `).all(userId);

  const tier1Ids = tier1Raw.map((u) => u.id);
  let tier2Raw = [];
  if (tier1Ids.length > 0) {
    const placeholders = tier1Ids.map(() => '?').join(',');
    tier2Raw = db.prepare(`
      SELECT id, phone, vip_level, total_deposits, created_at
      FROM users WHERE referred_by IN (${placeholders})
      ORDER BY id DESC
    `).all(...tier1Ids);
  }

  const tier2Ids = tier2Raw.map((u) => u.id);
  let tier3Raw = [];
  if (tier2Ids.length > 0) {
    const placeholders = tier2Ids.map(() => '?').join(',');
    tier3Raw = db.prepare(`
      SELECT id, phone, vip_level, total_deposits, created_at
      FROM users WHERE referred_by IN (${placeholders})
      ORDER BY id DESC
    `).all(...tier2Ids);
  }

  const formatMember = (m, tier) => ({
    id: m.id,
    maskedPhone: maskPhone(m.phone),
    vipLevel: m.vip_level,
    totalDeposits: round2(m.total_deposits),
    tier,
    joinedAt: m.created_at
  });

  const members = [
    ...tier1Raw.map((m) => formatMember(m, 1)),
    ...tier2Raw.map((m) => formatMember(m, 2)),
    ...tier3Raw.map((m) => formatMember(m, 3))
  ];

  const teamTotalDeposits = round2(members.reduce((sum, m) => sum + m.totalDeposits, 0));
  const activeDepositors = members.filter((m) => m.totalDeposits > 0 || m.vipLevel > 0).length;
  const activeDirectTier1 = tier1Raw.filter((m) => m.total_deposits > 0 || m.vip_level > 0).length;

  const claimedRows = db
    .prepare('SELECT milestone_key FROM claimed_milestones WHERE user_id = ?')
    .all(userId);
  const claimedSet = new Set(claimedRows.map((r) => r.milestone_key));

  const milestones = TEAM_MILESTONES.map((ms) => ({
    ...ms,
    currentProgress: activeDirectTier1,
    claimed: claimedSet.has(ms.key),
    canClaim: !claimedSet.has(ms.key) && activeDirectTier1 >= ms.requiredActive
  }));

  const commissions = db.prepare(`
    SELECT tc.id, tc.tier, tc.base_amount as baseAmount,
           tc.commission_amount as commissionAmount, tc.reason,
           tc.created_at as createdAt, u.phone as sourcePhone
    FROM team_commissions tc
    JOIN users u ON u.id = tc.source_user_id
    WHERE tc.beneficiary_id = ?
    ORDER BY tc.id DESC
    LIMIT 30
  `).all(userId).map((c) => ({
    id: c.id,
    tier: c.tier,
    baseAmount: round2(c.baseAmount),
    commissionAmount: round2(c.commissionAmount),
    reason: c.reason,
    sourcePhone: maskPhone(c.sourcePhone),
    createdAt: c.createdAt
  }));

  // Official Career Positions, One-Time Promotion Bonuses, Physical Gifts & Monthly Fixed Salaries (100% Admin-Configurable)
  const settings = getSettingsMap();
  const salaryEnabled = settings.salary_system_enabled !== 'false';
  const salaryRequireApproval = settings.salary_require_approval !== 'false';
  const periodMonth = getTodayDateStr().slice(0, 7); // YYYY-MM
  const serializedMe = serializeUser(req.user);

  const monthlyNewMembers = members.filter(
    (m) => String(m.joinedAt || '').startsWith(periodMonth) && (m.totalDeposits > 0 || m.vipLevel > 0)
  ).length;

  const countVipAtLeast = (minTier) =>
    members.filter((m) => Number(m.vipLevel || 0) >= Number(minTier || 1)).length;

  const salaryRanksRaw = getSalaryRanks();
  const thisMonthClaims = db
    .prepare(
      'SELECT rank_id, status, amount, created_at FROM salary_claims WHERE user_id = ? AND period_month = ?'
    )
    .all(userId, periodMonth);
  const monthClaimMap = new Map(thisMonthClaims.map((c) => [c.rank_id, c]));

  const promoClaims = db
    .prepare(
      'SELECT rank_id, status, bonus_amount, physical_gift, created_at FROM claimed_position_bonuses WHERE user_id = ?'
    )
    .all(userId);
  const promoClaimMap = new Map(promoClaims.map((p) => [p.rank_id, p]));

  const evaluatedSalaryRanks = salaryRanksRaw.map((rk) => {
    const reqVip = Number(rk.minUserVip || 0);
    const reqDirect = Number(rk.minActiveDirect || 0);
    const reqTotalActive = Number(rk.minTotalActiveTeam || 0);
    const reqQualVipTier = Number(rk.qualifiedVipTier || 1);
    const reqQualVipCount = Number(rk.minQualifiedVipCount || 0);
    const reqMonthlyNew = Number(rk.minMonthlyNewMembers || 0);
    const reqTeamDep = Number(rk.minTeamDepositsUsdt || 0);

    const oneTimeBonusUsdt = round2(Number(rk.oneTimeBonusUsdt || 0));
    const physicalGift = String(rk.physicalGift || '').trim();
    const salaryAmt = round2(Number(rk.monthlySalaryUsdt || 0));
    const currentQualVipCount = countVipAtLeast(reqQualVipTier);

    const meetsVip = serializedMe.vipLevel >= reqVip;
    const meetsDirect = activeDirectTier1 >= reqDirect;
    const meetsTotalActive = activeDepositors >= reqTotalActive;
    const meetsQualVip = currentQualVipCount >= reqQualVipCount;
    const meetsMonthlyNew = monthlyNewMembers >= reqMonthlyNew;
    const meetsTeamDep = teamTotalDeposits >= reqTeamDep;

    const allConditionsMet =
      meetsVip &&
      meetsDirect &&
      meetsTotalActive &&
      meetsQualVip &&
      meetsMonthlyNew &&
      meetsTeamDep;

    const existingClaim = monthClaimMap.get(rk.id) || null;
    const existingPromo = promoClaimMap.get(rk.id) || null;

    return {
      id: rk.id,
      title: rk.title,
      oneTimeBonusUsdt,
      physicalGift,
      monthlySalaryUsdt: salaryAmt,
      minUserVip: reqVip,
      minActiveDirect: reqDirect,
      minTotalActiveTeam: reqTotalActive,
      qualifiedVipTier: reqQualVipTier,
      minQualifiedVipCount: reqQualVipCount,
      currentQualifiedVipCount: currentQualVipCount,
      minMonthlyNewMembers: reqMonthlyNew,
      minTeamDepositsUsdt: reqTeamDep,
      checks: {
        meetsVip,
        meetsDirect,
        meetsTotalActive,
        meetsQualVip,
        meetsMonthlyNew,
        meetsTeamDep
      },
      allConditionsMet,
      promotionClaimStatus: existingPromo ? existingPromo.status : null,
      canClaimPromotion:
        salaryEnabled &&
        oneTimeBonusUsdt > 0 &&
        allConditionsMet &&
        (!existingPromo || existingPromo.status === 'rejected'),
      claimStatus: existingClaim ? existingClaim.status : null,
      canClaim:
        salaryEnabled &&
        salaryAmt > 0 &&
        allConditionsMet &&
        (!existingClaim || existingClaim.status === 'rejected')
    };
  });

  const allTeamIds = members.map((m) => m.id);
  let activeTodayCount = 0;
  if (allTeamIds.length > 0) {
    const todayStr = getTodayDateStr();
    const ph = allTeamIds.map(() => '?').join(',');
    activeTodayCount = db
      .prepare(
        `SELECT COUNT(DISTINCT user_id) as c FROM task_completions
         WHERE completed_date = ? AND user_id IN (${ph})`
      )
      .get(todayStr, ...allTeamIds).c;
  }

  const nextSalaryTarget =
    evaluatedSalaryRanks.find((r) => !r.allConditionsMet && r.monthlySalaryUsdt > 0) ||
    evaluatedSalaryRanks.find((r) => !r.allConditionsMet) ||
    evaluatedSalaryRanks[evaluatedSalaryRanks.length - 1] ||
    null;

  let nextSalaryProgress = null;
  if (nextSalaryTarget) {
    const directRatio =
      nextSalaryTarget.minActiveDirect > 0
        ? Math.min(1, activeDirectTier1 / nextSalaryTarget.minActiveDirect)
        : 1;
    const totalRatio =
      nextSalaryTarget.minTotalActiveTeam > 0
        ? Math.min(1, activeDepositors / nextSalaryTarget.minTotalActiveTeam)
        : 1;
    const depRatio =
      nextSalaryTarget.minTeamDepositsUsdt > 0
        ? Math.min(1, teamTotalDeposits / nextSalaryTarget.minTeamDepositsUsdt)
        : 1;
    const pct = Math.min(100, Math.round(((directRatio + totalRatio + depRatio) / 3) * 100));
    nextSalaryProgress = {
      rankTitle: nextSalaryTarget.title,
      monthlySalaryUsdt: nextSalaryTarget.monthlySalaryUsdt,
      oneTimeBonusUsdt: nextSalaryTarget.oneTimeBonusUsdt,
      physicalGift: nextSalaryTarget.physicalGift,
      progressPct: pct,
      remainingDirect: Math.max(0, nextSalaryTarget.minActiveDirect - activeDirectTier1),
      remainingTotalActive: Math.max(0, nextSalaryTarget.minTotalActiveTeam - activeDepositors),
      remainingDepositsUsdt: round2(
        Math.max(0, nextSalaryTarget.minTeamDepositsUsdt - teamTotalDeposits)
      )
    };
  }

  res.json({
    inviteCode: req.user.invite_code,
    analytics: {
      activeTodayCount,
      fundedRatioPct:
        members.length > 0 ? Math.round((activeDepositors / members.length) * 100) : 0,
      nextSalaryProgress
    },
    stats: {
      totalMembers: members.length,
      activeMembers: activeDepositors,
      activeDirectTier1,
      monthlyNewMembers,
      tier1Count: tier1Raw.length,
      tier2Count: tier2Raw.length,
      tier3Count: tier3Raw.length,
      teamTotalDeposits,
      totalTeamEarnings: round2(req.user.total_team_earnings)
    },
    commissionRates: [
      { tier: 1, name: 'المستوى A (مباشر)', rate: '10%' },
      { tier: 2, name: 'المستوى B (غير مباشر)', rate: '5%' },
      { tier: 3, name: 'المستوى C (متقدم)', rate: '2%' }
    ],
    salaryProgram: {
      enabled: salaryEnabled,
      requireApproval: salaryRequireApproval,
      periodMonth,
      currentMetrics: {
        userVip: serializedMe.vipLevel,
        jobTitle: serializedMe.jobTitle,
        activeDirect: activeDirectTier1,
        totalActiveTeam: activeDepositors,
        monthlyNewMembers,
        teamTotalDeposits
      },
      ranks: evaluatedSalaryRanks
    },
    milestones,
    members,
    commissions
  });
});

function evaluateUserTeamMetricsServer(userId) {
  const tier1Raw = db
    .prepare('SELECT id, vip_level, total_deposits, created_at FROM users WHERE referred_by = ?')
    .all(userId);
  const tier1Ids = tier1Raw.map((u) => u.id);
  let tier2Raw = [];
  if (tier1Ids.length > 0) {
    tier2Raw = db
      .prepare(
        `SELECT id, vip_level, total_deposits, created_at FROM users WHERE referred_by IN (${tier1Ids
          .map(() => '?')
          .join(',')})`
      )
      .all(...tier1Ids);
  }
  const tier2Ids = tier2Raw.map((u) => u.id);
  let tier3Raw = [];
  if (tier2Ids.length > 0) {
    tier3Raw = db
      .prepare(
        `SELECT id, vip_level, total_deposits, created_at FROM users WHERE referred_by IN (${tier2Ids
          .map(() => '?')
          .join(',')})`
      )
      .all(...tier2Ids);
  }

  const periodMonth = getTodayDateStr().slice(0, 7);
  const allTeam = [...tier1Raw, ...tier2Raw, ...tier3Raw];
  const activeDirect = tier1Raw.filter((u) => u.total_deposits > 0 || u.vip_level > 0).length;
  const totalActiveTeam = allTeam.filter((u) => u.total_deposits > 0 || u.vip_level > 0).length;
  const monthlyNewMembers = allTeam.filter(
    (u) => String(u.created_at || '').startsWith(periodMonth) && (u.total_deposits > 0 || u.vip_level > 0)
  ).length;
  const teamTotalDeposits = round2(
    allTeam.reduce((sum, u) => sum + Number(u.total_deposits || 0), 0)
  );
  const countVipAtLeast = (minTier) =>
    allTeam.filter((u) => Number(u.vip_level || 0) >= Number(minTier || 1)).length;

  return {
    periodMonth,
    activeDirect,
    totalActiveTeam,
    monthlyNewMembers,
    teamTotalDeposits,
    countVipAtLeast
  };
}

app.post('/api/team/claim-promotion-bonus', authMiddleware, (req, res) => {
  try {
    const rankId = String(req.body.rankId || '');
    const settings = getSettingsMap();
    if (settings.salary_system_enabled === 'false') {
      return res.status(400).json({ error: 'برنامج الترقيات متوقف مؤقتاً من قِبل الإدارة' });
    }

    const ranks = getSalaryRanks();
    const targetRank = ranks.find((r) => r.id === rankId);
    if (!targetRank || Number(targetRank.oneTimeBonusUsdt || 0) <= 0) {
      return res.status(400).json({ error: 'منصب الترقية المطلوب غير صالح' });
    }

    const userId = req.user.id;
    const serializedMe = serializeUser(req.user);
    const m = evaluateUserTeamMetricsServer(userId);
    const qualVipCount = m.countVipAtLeast(targetRank.qualifiedVipTier || 1);

    if (
      serializedMe.vipLevel < Number(targetRank.minUserVip || 0) ||
      m.activeDirect < Number(targetRank.minActiveDirect || 0) ||
      m.totalActiveTeam < Number(targetRank.minTotalActiveTeam || 0) ||
      qualVipCount < Number(targetRank.minQualifiedVipCount || 0) ||
      m.monthlyNewMembers < Number(targetRank.minMonthlyNewMembers || 0) ||
      m.teamTotalDeposits < Number(targetRank.minTeamDepositsUsdt || 0)
    ) {
      return res.status(400).json({
        error: 'لم تستوفِ بعد جميع شروط الترقية المحددة لهذا المنصب'
      });
    }

    const bonusAmt = round2(Number(targetRank.oneTimeBonusUsdt || 0));
    const physicalGift = String(targetRank.physicalGift || '').trim();
    const requireApproval = settings.salary_require_approval !== 'false';

    const promoTx = db.transaction(() => {
      const existing = db
        .prepare(
          'SELECT id, status FROM claimed_position_bonuses WHERE user_id = ? AND rank_id = ?'
        )
        .get(userId, targetRank.id);

      if (existing && existing.status !== 'rejected') {
        throw new Error('ALREADY_CLAIMED_PROMO');
      }

      const status = requireApproval ? 'pending' : 'approved';
      if (existing && existing.status === 'rejected') {
        db.prepare(
          `UPDATE claimed_position_bonuses
           SET status = ?, bonus_amount = ?, physical_gift = ?, created_at = datetime('now'), decided_at = ''
           WHERE id = ?`
        ).run(status, bonusAmt, physicalGift, existing.id);
      } else {
        db.prepare(
          `INSERT INTO claimed_position_bonuses (user_id, rank_id, rank_title, bonus_amount, physical_gift, status)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(userId, targetRank.id, targetRank.title, bonusAmt, physicalGift, status);
      }

      if (!requireApproval) {
        db.prepare(`
          UPDATE users
          SET balance = ROUND(balance + ?, 2),
              total_team_earnings = ROUND(total_team_earnings + ?, 2),
              job_title = ?
          WHERE id = ?
        `).run(bonusAmt, bonusAmt, targetRank.title, userId);

        createNotification(
          userId,
          `مبارك الترقية لمنصب "${targetRank.title}" +$${bonusAmt.toFixed(2)} USDT 🏆`,
          `تمت ترقية منصبك رسمياً وصرف مكافأة الترقية ($${bonusAmt.toFixed(2)} USDT)${
            physicalGift ? ` وتوثيق استحقاقك لهدية (${physicalGift})` : ''
          }!`,
          'reward'
        );
      } else {
        db.prepare('UPDATE users SET job_title = ? WHERE id = ?').run(targetRank.title, userId);
        createNotification(
          userId,
          `طلب مكافأة ترقية "${targetRank.title}" قيد المراجعة ($${bonusAmt.toFixed(2)} USDT)`,
          `تم تحديث مسماك الوظيفي وإرسال طلب صرف مكافأة الترقية${
            physicalGift ? ` والهدية العينية (${physicalGift})` : ''
          } لاعتماد الإدارة.`,
          'info'
        );
      }
    });

    try {
      promoTx();
    } catch (e) {
      if (e.message === 'ALREADY_CLAIMED_PROMO') {
        return res.status(400).json({ error: 'لقد قمت بالمطالبة بمكافأة الترقية لهذا المنصب مسبقاً' });
      }
      throw e;
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    return res.json({
      message: requireApproval
        ? `تم تسجيل ترقيتك إلى "${targetRank.title}" وإرسال طلب مكافأة ($${bonusAmt.toFixed(2)} USDT) لاعتماد الإدارة!`
        : `مبارك! تمت ترقيتك إلى "${targetRank.title}" وإضافة +$${bonusAmt.toFixed(2)} USDT إلى محفظة الدخل!`,
      user: serializeUser(updated)
    });
  } catch (err) {
    console.error('Claim promotion bonus error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء المطالبة بمكافأة الترقية' });
  }
});

app.post('/api/team/claim-salary', authMiddleware, (req, res) => {
  try {
    const rankId = String(req.body.rankId || '');
    const settings = getSettingsMap();
    if (settings.salary_system_enabled === 'false') {
      return res.status(400).json({ error: 'نظام الرواتب الشهرية متوقف مؤقتاً من قِبل الإدارة' });
    }

    const ranks = getSalaryRanks();
    const targetRank = ranks.find((r) => r.id === rankId);
    if (!targetRank || Number(targetRank.monthlySalaryUsdt || 0) <= 0) {
      return res.status(400).json({ error: 'هذا المنصب لا يتضمن راتباً شهرياً أو غير صالح' });
    }

    // Recompute live team metrics server-side
    const userId = req.user.id;
    const serializedMe = serializeUser(req.user);
    const m = evaluateUserTeamMetricsServer(userId);
    const qualVipCount = m.countVipAtLeast(targetRank.qualifiedVipTier || 1);

    if (
      serializedMe.vipLevel < Number(targetRank.minUserVip || 0) ||
      m.activeDirect < Number(targetRank.minActiveDirect || 0) ||
      m.totalActiveTeam < Number(targetRank.minTotalActiveTeam || 0) ||
      qualVipCount < Number(targetRank.minQualifiedVipCount || 0) ||
      m.monthlyNewMembers < Number(targetRank.minMonthlyNewMembers || 0) ||
      m.teamTotalDeposits < Number(targetRank.minTeamDepositsUsdt || 0)
    ) {
      return res.status(400).json({
        error: 'لم تستوفِ بعد جميع الشروط التي حددتها الإدارة لاستحقاق هذا الراتب الشهري'
      });
    }

    const periodMonth = m.periodMonth;
    const salaryAmt = round2(Number(targetRank.monthlySalaryUsdt || 0));
    const requireApproval = settings.salary_require_approval !== 'false';
    const snapshot = JSON.stringify({
      userVip: serializedMe.vipLevel,
      activeDirect: m.activeDirect,
      totalActiveTeam: m.totalActiveTeam,
      qualifiedVipCount: qualVipCount,
      monthlyNewMembers: m.monthlyNewMembers,
      teamTotalDeposits: m.teamTotalDeposits
    });

    const salaryTx = db.transaction(() => {
      const existing = db
        .prepare(
          "SELECT id, status FROM salary_claims WHERE user_id = ? AND rank_id = ? AND period_month = ? AND status != 'rejected'"
        )
        .get(userId, targetRank.id, periodMonth);
      if (existing) throw new Error('ALREADY_CLAIMED_MONTH');

      const status = requireApproval ? 'pending' : 'approved';
      db.prepare(`
        INSERT INTO salary_claims (
          user_id, rank_id, rank_title, amount, period_month, status, stats_snapshot_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, targetRank.id, targetRank.title, salaryAmt, periodMonth, status, snapshot);

      if (!requireApproval) {
        db.prepare(`
          UPDATE users
          SET balance = ROUND(balance + ?, 2),
              total_team_earnings = ROUND(total_team_earnings + ?, 2)
          WHERE id = ?
        `).run(salaryAmt, salaryAmt, userId);

        createNotification(
          userId,
          `صرف راتب شهري ثابت +$${salaryAmt.toFixed(2)} USDT 💼`,
          `تم صرف راتب رتبة "${targetRank.title}" لشهر ${periodMonth} وإضافته لرصيدك.`,
          'reward'
        );
      } else {
        createNotification(
          userId,
          `طلب راتب شهري قيد المراجعة ($${salaryAmt.toFixed(2)} USDT)`,
          `تم إرسال طلب صرف راتب رتبة "${targetRank.title}" لشهر ${periodMonth} لمراجعة الإدارة.`,
          'info'
        );
      }
    });

    try {
      salaryTx();
    } catch (e) {
      if (e.message === 'ALREADY_CLAIMED_MONTH') {
        return res.status(400).json({
          error: 'لقد قدمت طلباً أو استلمت راتب هذه الرتبة لهذا الشهر بالفعل'
        });
      }
      throw e;
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    return res.json({
      message: requireApproval
        ? `تم تقديم طلب صرف راتب "${targetRank.title}" ($${salaryAmt.toFixed(
            2
          )} USDT) بنجاح وهو بانتظار اعتماد الإدارة`
        : `مبارك! تم صرف راتب "${targetRank.title}" +$${salaryAmt.toFixed(2)} USDT فوراً لرصيدك`,
      user: serializeUser(updated)
    });
  } catch (err) {
    console.error('Claim salary error:', err);
    return res.status(500).json({ error: 'تعذر معالجة طلب الراتب الشهري' });
  }
});

app.post('/api/team/claim-milestone', authMiddleware, (req, res) => {
  try {
    const key = String(req.body.key || '');
    const target = TEAM_MILESTONES.find((m) => m.key === key);
    if (!target) {
      return res.status(400).json({ error: 'المكافأة المطلوبة غير صالحة' });
    }

    const activeDirect = db
      .prepare('SELECT COUNT(*) as c FROM users WHERE referred_by = ? AND total_deposits > 0')
      .get(req.user.id).c;

    if (activeDirect < target.requiredActive) {
      return res.status(400).json({
        error: `تحتاج إلى ${target.requiredActive} أعضاء مباشرين نشطين لاستلام هذه المكافأة`
      });
    }

    const claimTx = db.transaction(() => {
      const exists = db
        .prepare('SELECT id FROM claimed_milestones WHERE user_id = ? AND milestone_key = ?')
        .get(req.user.id, target.key);
      if (exists) throw new Error('ALREADY_CLAIMED');

      db.prepare(
        'INSERT INTO claimed_milestones (user_id, milestone_key, reward_amount) VALUES (?, ?, ?)'
      ).run(req.user.id, target.key, target.reward);

      db.prepare(`
        UPDATE users
        SET balance = ROUND(balance + ?, 2),
            total_team_earnings = ROUND(total_team_earnings + ?, 2)
        WHERE id = ?
      `).run(target.reward, target.reward, req.user.id);

      createNotification(
        req.user.id,
        `مكافأة إنجاز الفريق +$${target.reward.toFixed(2)} USDT`,
        `مبارك! استلمت مكافأة "${target.title}" وتمت إضافتها إلى رصيدك الحالي.`,
        'reward'
      );
    });

    claimTx();
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      message: `مبارك! تمت إضافة مكافأة الإنجاز +${target.reward.toFixed(2)} USDT إلى رصيدك`,
      user: serializeUser(updated)
    });
  } catch (err) {
    if (err.message === 'ALREADY_CLAIMED') {
      return res.status(400).json({ error: 'تم استلام هذه المكافأة مسبقاً' });
    }
    console.error('Milestone error:', err);
    return res.status(500).json({ error: 'تعذر استلام مكافأة الإنجاز' });
  }
});

// ==================== ACCOUNT SETTINGS & PIN ====================

app.put('/api/account/wallet', authMiddleware, (req, res) => {
  const walletAddress = String(req.body.walletAddress || '').trim();
  const network = ['TRC20', 'BEP20'].includes(req.body.network) ? req.body.network : 'TRC20';
  const pin = normalizeDigitsAndStrip(req.body.pin || '');

  if (!walletAddress || walletAddress.length < 12) {
    return res.status(400).json({ error: 'يرجى إدخال عنوان محفظة USDT صحيح' });
  }

  const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (freshUser.wallet_locked) {
    if (!freshUser.withdraw_pin_hash || !pin || !bcrypt.compareSync(pin, freshUser.withdraw_pin_hash)) {
      return res.status(403).json({
        error: 'عنوان المحفظة مقفل بالحماية المصرفية — يرجى إدخال رمز الحماية المالي (PIN) لتعديل العنوان'
      });
    }
  }

  db.prepare(`
    UPDATE users SET saved_wallet_address = ?, saved_wallet_network = ? WHERE id = ?
  `).run(walletAddress, network, req.user.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({
    message: 'تم حفظ عنوان المحفظة بنجاح',
    user: serializeUser(updated)
  });
});

app.put('/api/account/pin', authMiddleware, (req, res) => {
  const newPin = normalizeDigitsAndStrip(req.body.newPin || '');
  const currentPinOrPassword = String(req.body.currentSecret || '');

  if (!/^\d{4,6}$/.test(newPin)) {
    return res.status(400).json({ error: 'يجب أن يتكون رمز الحماية المالي PIN من 4 إلى 6 أرقام' });
  }

  const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (freshUser.withdraw_pin_hash) {
    const cleanCurrentPin = normalizeDigitsAndStrip(currentPinOrPassword);
    const matchesOldPin =
      cleanCurrentPin && bcrypt.compareSync(cleanCurrentPin, freshUser.withdraw_pin_hash);
    const matchesPassword =
      currentPinOrPassword && bcrypt.compareSync(currentPinOrPassword, freshUser.password_hash);

    if (!matchesOldPin && !matchesPassword) {
      return res.status(401).json({
        error: 'يرجى إدخال الرمز المالي الحالي أو كلمة مرور الحساب بشكل صحيح للتأكيد'
      });
    }
  }

  const pinHash = bcrypt.hashSync(newPin, 10);
  db.prepare('UPDATE users SET withdraw_pin_hash = ? WHERE id = ?').run(pinHash, req.user.id);

  createNotification(
    req.user.id,
    'تحديث رمز الحماية المالي PIN',
    'تم تفعيل/تحديث رمز الحماية المالي الخاص بعمليات السحب بنجاح.',
    'success'
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({
    message: 'تم حفظ رمز الحماية المالي (PIN) بنجاح',
    user: serializeUser(updated)
  });
});

app.put('/api/account/password', authMiddleware, (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');

  if (!currentPassword || !newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور الجديدة عن 4 أحرف أو أرقام' });
  }

  const valid = bcrypt.compareSync(currentPassword, req.user.password_hash);
  if (!valid) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  res.json({ message: 'تم تحديث كلمة المرور بنجاح' });
});

// ==================== COMPREHENSIVE ADMIN DASHBOARD ROUTES ====================

app.get('/api/admin/overview', authMiddleware, adminMiddleware, (req, res) => {
  const settings = getSettingsMap();
  const search = String(req.query.search || '').trim();
  const txFilter = String(req.query.txFilter || 'all');
  const today = getTodayDateStr();

  const totals = db.prepare(`
    SELECT COUNT(*) as totalUsers,
           SUM(CASE WHEN vip_level > 0 THEN 1 ELSE 0 END) as paidVipUsers,
           COALESCE(SUM(balance), 0) as totalBalances,
           COALESCE(SUM(total_deposits), 0) as totalDeposits,
           COALESCE(SUM(total_withdrawals), 0) as totalWithdrawals
    FROM users
  `).get();

  const todayLiquidity = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END), 0) as todayDeposits,
      COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'completed' THEN amount ELSE 0 END), 0) as todayWithdrawals,
      COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'pending' THEN 1 ELSE 0 END), 0) as pendingDepositsCount,
      COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'pending' THEN 1 ELSE 0 END), 0) as pendingWithdrawalsCount
    FROM transactions
    WHERE substr(created_at, 1, 10) = ? OR status = 'pending'
  `).get(today);

  // Accurate today-only completed deposits/withdrawals
  const todayExact = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END), 0) as todayDeposits,
      COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'completed' THEN amount ELSE 0 END), 0) as todayWithdrawals
    FROM transactions
    WHERE substr(created_at, 1, 10) = ?
  `).get(today);

  const pendingCounts = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'pending' THEN 1 ELSE 0 END), 0) as pendingDepositsCount,
      COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'pending' THEN 1 ELSE 0 END), 0) as pendingWithdrawalsCount
    FROM transactions
  `).get();

  let txWhere = '';
  if (txFilter === 'pending') txWhere = "WHERE t.status = 'pending'";
  else if (txFilter === 'deposit') txWhere = "WHERE t.type = 'deposit'";
  else if (txFilter === 'withdraw') txWhere = "WHERE t.type = 'withdraw'";

  const rawTransactions = db.prepare(`
    SELECT t.id, t.type, t.amount, t.fee_amount as feeAmount, t.net_amount as netAmount,
           t.network, t.wallet_or_txid as walletOrTxid,
           t.reference_code as referenceCode, t.status, t.note, t.created_at as createdAt,
           t.chain_status as chainStatus, t.chain_details_json as chainDetailsJson,
           u.phone as userPhone, u.id as userId
    FROM transactions t
    JOIN users u ON u.id = t.user_id
    ${txWhere}
    ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.id DESC
    LIMIT 60
  `).all();

  const transactions = rawTransactions.map((tx) => {
    let chainDetails = null;
    if (tx.chainDetailsJson) {
      try {
        chainDetails = JSON.parse(tx.chainDetailsJson);
      } catch {
        chainDetails = null;
      }
    }
    const { chainDetailsJson, ...rest } = tx;
    return {
      ...rest,
      chainStatus: tx.chainStatus || 'unverified',
      chainDetails
    };
  });

  let users;
  if (search) {
    const likeTerm = `%${normalizeDigitsAndStrip(search)}%`;
    users = db.prepare(`
      SELECT id, phone, invite_code as inviteCode, balance, recharge_balance as rechargeBalance,
             work_guarantee_amount as workGuaranteeAmount, job_title as jobTitle,
             spin_credits as spinCredits,
             total_deposits as totalDeposits, total_withdrawals as totalWithdrawals,
             vip_level as vipLevel, is_banned as isBanned, is_admin as isAdmin,
             (withdraw_pin_hash != '') as hasPin, created_at as createdAt
      FROM users
      WHERE phone LIKE ? OR invite_code LIKE ?
      ORDER BY id DESC
      LIMIT 40
    `).all(likeTerm, `%${search.toUpperCase()}%`);
  } else {
    users = db.prepare(`
      SELECT id, phone, invite_code as inviteCode, balance, recharge_balance as rechargeBalance,
             work_guarantee_amount as workGuaranteeAmount, job_title as jobTitle,
             spin_credits as spinCredits,
             total_deposits as totalDeposits, total_withdrawals as totalWithdrawals,
             vip_level as vipLevel, is_banned as isBanned, is_admin as isAdmin,
             (withdraw_pin_hash != '') as hasPin, created_at as createdAt
      FROM users
      ORDER BY id DESC
      LIMIT 40
    `).all();
  }

  const notificationLogs = db
    .prepare(
      `SELECT id, scope, target_label as targetLabel, recipients_count as recipientsCount,
              title, body, type, created_at as createdAt
       FROM admin_notification_logs
       ORDER BY id DESC
       LIMIT 25`
    )
    .all();

  const salaryClaims = db
    .prepare(
      `SELECT sc.id, sc.user_id as userId, u.phone as userPhone, sc.rank_id as rankId,
              sc.rank_title as rankTitle, sc.amount, sc.period_month as periodMonth,
              sc.status, sc.stats_snapshot_json as statsJson, sc.created_at as createdAt
       FROM salary_claims sc
       JOIN users u ON u.id = sc.user_id
       ORDER BY CASE WHEN sc.status = 'pending' THEN 0 ELSE 1 END, sc.id DESC
       LIMIT 30`
    )
    .all();

  const promotionClaims = db
    .prepare(
      `SELECT pc.id, pc.user_id as userId, u.phone as userPhone, pc.rank_id as rankId,
              pc.rank_title as rankTitle, pc.bonus_amount as bonusAmount,
              pc.physical_gift as physicalGift, pc.status, pc.created_at as createdAt
       FROM claimed_position_bonuses pc
       JOIN users u ON u.id = pc.user_id
       ORDER BY CASE WHEN pc.status = 'pending' THEN 0 ELSE 1 END, pc.id DESC
       LIMIT 30`
    )
    .all();

  const flashMissions = db
    .prepare(
      `SELECT id, title, location, category, description, image_url as imageUrl,
              reward, min_vip_level as minVipLevel, max_claims as maxClaims,
              claimed_count as claimedCount, is_active as isActive, expires_at as expiresAt
       FROM flash_missions
       ORDER BY id DESC
       LIMIT 25`
    )
    .all();

  res.json({
    settings,
    vipLevels: getActiveVipLevels(),
    vaultPlans: getVaultPlans(),
    wheelSegments: getWheelSegments(),
    salaryRanks: getSalaryRanks(),
    withdrawPresets: getWithdrawPresets(),
    flashMissions,
    salaryClaims,
    promotionClaims,
    announcements: getAnnouncementsList(),
    notificationLogs,
    totals: {
      totalUsers: totals.totalUsers,
      paidVipUsers: totals.paidVipUsers || 0,
      totalBalances: round2(totals.totalBalances),
      totalDeposits: round2(totals.totalDeposits),
      totalWithdrawals: round2(totals.totalWithdrawals),
      todayDeposits: round2(todayExact.todayDeposits),
      todayWithdrawals: round2(todayExact.todayWithdrawals),
      todayNetLiquidity: round2(todayExact.todayDeposits - todayExact.todayWithdrawals),
      pendingDepositsCount: pendingCounts.pendingDepositsCount,
      pendingWithdrawalsCount: pendingCounts.pendingWithdrawalsCount,
      pendingSalariesCount:
        salaryClaims.filter((s) => s.status === 'pending').length +
        promotionClaims.filter((p) => p.status === 'pending').length
    },
    transactions,
    users: users.map((u) => ({
      ...u,
      balance: round2(u.balance),
      rechargeBalance: round2(u.rechargeBalance || 0),
      workGuaranteeAmount: round2(u.workGuaranteeAmount || 0),
      jobTitle: u.jobTitle || (u.vipLevel > 0 ? 'موظف رسمي' : 'موظف متدرب'),
      spinCredits: Number(u.spinCredits || 0),
      totalDeposits: round2(u.totalDeposits),
      totalWithdrawals: round2(u.totalWithdrawals),
      isBanned: Boolean(u.isBanned),
      isAdmin: Boolean(u.isAdmin),
      hasPin: Boolean(u.hasPin)
    }))
  });
});

app.put('/api/admin/settings', authMiddleware, adminMiddleware, (req, res) => {
  const allowedKeys = [
    'trc20_address',
    'bep20_address',
    'auto_approve_deposits',
    'auto_approve_withdrawals',
    'blockchain_auto_approve_verified',
    'min_deposit',
    'min_withdraw',
    'daily_withdraw_limit',
    'withdraw_fee_percent',
    'guarantee_duration_days',
    'whatsapp_number',
    'live_ticker_enabled',
    'wheel_min_deposit',
    'wheel_referrer_spin',
    'salary_system_enabled',
    'salary_require_approval'
  ];

  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const saveTx = db.transaction(() => {
    for (const k of allowedKeys) {
      if (req.body[k] !== undefined) {
        upsert.run(k, String(req.body[k]));
      }
    }

    if (Array.isArray(req.body.vipLevels)) {
      const sanitizedLevels = req.body.vipLevels.map((lvl) => {
        const minDep = Math.max(0, Number(lvl.minDeposit || 0));
        const tasks = Math.max(1, Math.round(Number(lvl.dailyTasks || 1)));
        const dailyProf = round2(Math.max(0, Number(lvl.dailyProfit || 0)));
        const rewardPerTask = round2(dailyProf / tasks);
        const monthlyProf = round2(dailyProf * 30);
        const dailyRate =
          lvl.level === 0 || minDep === 0
            ? 'مجاني'
            : `${round2((dailyProf / minDep) * 100)}%`;

        return {
          ...lvl,
          minDeposit: minDep,
          dailyTasks: tasks,
          dailyProfit: dailyProf,
          rewardPerTask,
          monthlyProfit: monthlyProf,
          dailyRate
        };
      });
      upsert.run('vip_levels_json', JSON.stringify(sanitizedLevels));
    }

    if (Array.isArray(req.body.announcements)) {
      const cleanAnn = req.body.announcements.map((a) => String(a).trim()).filter(Boolean);
      if (cleanAnn.length > 0) {
        upsert.run('announcements_json', JSON.stringify(cleanAnn));
      }
    }

    if (Array.isArray(req.body.vaultPlans) && req.body.vaultPlans.length > 0) {
      const sanitizedVault = req.body.vaultPlans.map((p, idx) => {
        const days = Math.max(1, Math.round(Number(p.durationDays || 7)));
        const minAmt = Math.max(1, round2(Number(p.minAmount || 20)));
        const totalPct = Math.max(0.5, round2(Number(p.totalReturnPct || 8.4)));
        return {
          ...p,
          id: p.id || `vault_custom_${idx + 1}`,
          title: String(p.title || `خزنة ${days} يوم`).trim(),
          durationDays: days,
          minAmount: minAmt,
          totalReturnPct: totalPct,
          dailyRatePct: round2(totalPct / days)
        };
      });
      upsert.run('vault_plans_json', JSON.stringify(sanitizedVault));
    }

    if (Array.isArray(req.body.wheelSegments) && req.body.wheelSegments.length >= 4) {
      const sanitizedWheel = req.body.wheelSegments.map((s, idx) => {
        const reward = Math.max(0, round2(Number(s.reward || 0)));
        const weight = Math.max(0, Number(s.weight || 0));
        return {
          ...s,
          id: s.id || `seg_${idx + 1}`,
          label: String(s.label || `$${reward.toFixed(2)} USDT`).trim(),
          reward,
          weight,
          color: s.color || '#0D9488'
        };
      });
      upsert.run('lucky_wheel_json', JSON.stringify(sanitizedWheel));
    }

    if (Array.isArray(req.body.salaryRanks) && req.body.salaryRanks.length > 0) {
      const sanitizedSalaries = req.body.salaryRanks.map((rk, idx) => ({
        id: rk.id || `pos_custom_${idx + 1}`,
        title: String(rk.title || `منصب #${idx + 1}`).trim(),
        oneTimeBonusUsdt: Math.max(0, round2(Number(rk.oneTimeBonusUsdt || 0))),
        physicalGift: String(rk.physicalGift || '').trim(),
        monthlySalaryUsdt: Math.max(0, round2(Number(rk.monthlySalaryUsdt || 0))),
        minUserVip: Math.min(6, Math.max(0, Math.round(Number(rk.minUserVip || 0)))),
        minActiveDirect: Math.max(0, Math.round(Number(rk.minActiveDirect || 0))),
        minTotalActiveTeam: Math.max(0, Math.round(Number(rk.minTotalActiveTeam || 0))),
        qualifiedVipTier: Math.min(6, Math.max(1, Math.round(Number(rk.qualifiedVipTier || 1)))),
        minQualifiedVipCount: Math.max(0, Math.round(Number(rk.minQualifiedVipCount || 0))),
        minMonthlyNewMembers: Math.max(0, Math.round(Number(rk.minMonthlyNewMembers || 0))),
        minTeamDepositsUsdt: Math.max(0, round2(Number(rk.minTeamDepositsUsdt || 0)))
      }));
      upsert.run('salary_ranks_json', JSON.stringify(sanitizedSalaries));
    }

    if (Array.isArray(req.body.withdrawPresets) && req.body.withdrawPresets.length > 0) {
      const cleanPresets = req.body.withdrawPresets
        .map((n) => Math.round(Number(n)))
        .filter((n) => !isNaN(n) && n > 0);
      if (cleanPresets.length > 0) {
        upsert.run('withdraw_presets_json', JSON.stringify(cleanPresets));
      }
    }
  });

  saveTx();

  res.json({
    message: 'تم حفظ إعدادات المنصة والخطط بنجاح',
    settings: getSettingsMap(),
    vipLevels: getActiveVipLevels(),
    announcements: getAnnouncementsList()
  });
});

app.post('/api/admin/transactions/:id/decision', authMiddleware, adminMiddleware, (req, res) => {
  const txId = Number(req.params.id);
  const decision = req.body.decision; // 'approve' | 'reject'
  const adminNote = String(req.body.reason || '').trim();

  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: 'قرار غير صالح' });
  }

  const txRow = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
  if (!txRow || txRow.status !== 'pending') {
    return res.status(400).json({ error: 'المعاملة غير موجودة أو تمت معالجتها مسبقاً' });
  }

  const processDecision = db.transaction(() => {
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(txRow.user_id);
    if (decision === 'approve') {
      const updatedNote = adminNote || (txRow.type === 'deposit' ? 'تمت الموافقة واعتماد الإيداع' : 'تمت الموافقة وتحويل السحب');
      db.prepare("UPDATE transactions SET status = 'completed', note = ? WHERE id = ?").run(updatedNote, txId);

      if (txRow.type === 'deposit') {
        applyApprovedDepositToUser(u.id, txRow.amount);
        distributeReferralCommissions(u.id, txRow.amount);
        grantDepositWheelSpins(u.id, txRow.amount);
        createNotification(
          u.id,
          `تمت الموافقة على إيداعك +$${txRow.amount.toFixed(2)} USDT`,
          `تم التحقق من المعاملة (${txRow.reference_code}) وإضافة الرصيد إلى محفظتك.`,
          'success'
        );
      } else if (txRow.type === 'withdraw') {
        const newWithdrawals = round2(u.total_withdrawals + txRow.amount);
        db.prepare('UPDATE users SET total_withdrawals = ? WHERE id = ?').run(newWithdrawals, u.id);
        createNotification(
          u.id,
          `تم تحويل سحبك ($${txRow.amount.toFixed(2)} USDT)`,
          `تمت الموافقة على طلب السحب (${txRow.reference_code}) وإرسال المبلغ لمحفظتك.`,
          'success'
        );
      }
    } else {
      const rejNote = adminNote || 'تم رفض المعاملة من الإدارة';
      db.prepare("UPDATE transactions SET status = 'rejected', note = ? WHERE id = ?").run(rejNote, txId);

      if (txRow.type === 'withdraw') {
        const refunded = round2(u.balance + txRow.amount);
        db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(refunded, u.id);
        createNotification(
          u.id,
          `تم رفض طلب السحب وإعادة الرصيد`,
          `تم إلغاء طلب السحب (${txRow.reference_code}) وإعادة ${txRow.amount.toFixed(2)} USDT إلى رصيدك. السبب: ${rejNote}`,
          'warning'
        );
      } else {
        createNotification(
          u.id,
          `تعذر اعتماد طلب الإيداع`,
          `لم تتم الموافقة على طلب الإيداع (${txRow.reference_code}). السبب: ${rejNote}`,
          'warning'
        );
      }
    }
  });

  processDecision();
  res.json({ message: decision === 'approve' ? 'تمت الموافقة على المعاملة بنجاح' : 'تم رفض المعاملة' });
});

// Live On-Chain Blockchain Verification Trigger for Admin
app.post('/api/admin/transactions/:id/verify-chain', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const txId = Number(req.params.id);
    const txRow = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
    if (!txRow || txRow.type !== 'deposit') {
      return res.status(404).json({ error: 'معاملة الإيداع غير موجودة' });
    }

    const settings = getSettingsMap();
    const expectedWallet =
      txRow.network === 'BEP20' ? settings.bep20_address : settings.trc20_address;

    const report = await verifyTransactionOnChain({
      txid: txRow.wallet_or_txid,
      network: txRow.network,
      expectedAmount: txRow.amount,
      expectedWallet
    });

    db.prepare('UPDATE transactions SET chain_status = ?, chain_details_json = ? WHERE id = ?').run(
      report.statusBadge || 'unverified',
      JSON.stringify(report),
      txId
    );

    return res.json({
      message: report.summaryAr,
      chainVerification: report
    });
  } catch (err) {
    console.error('Admin verify chain error:', err);
    return res.status(500).json({ error: 'تعذر إتمام الفحص الحي على البلوكتشين' });
  }
});

// Admin Decision on Monthly Team Leader Salary Claims
app.post('/api/admin/salaries/:id/decision', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const claimId = Number(req.params.id);
    const decision = req.body.decision; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'قرار غير صالح' });
    }

    const claim = db.prepare('SELECT * FROM salary_claims WHERE id = ?').get(claimId);
    if (!claim || claim.status !== 'pending') {
      return res.status(400).json({ error: 'طلب الراتب غير موجود أو تمت معالجته مسبقاً' });
    }

    const runSalaryDecision = db.transaction(() => {
      if (decision === 'approve') {
        db.prepare(
          "UPDATE salary_claims SET status = 'approved', decided_at = datetime('now') WHERE id = ?"
        ).run(claimId);

        db.prepare(`
          UPDATE users
          SET balance = ROUND(balance + ?, 2),
              total_team_earnings = ROUND(total_team_earnings + ?, 2)
          WHERE id = ?
        `).run(claim.amount, claim.amount, claim.user_id);

        createNotification(
          claim.user_id,
          `اعتماد وصرف راتبك الشهري +$${claim.amount.toFixed(2)} USDT 💼`,
          `تمت موافقة الإدارة على راتب رتبة "${claim.rank_title}" لشهر ${claim.period_month} وإضافته لرصيدك.`,
          'reward'
        );
      } else {
        db.prepare(
          "UPDATE salary_claims SET status = 'rejected', decided_at = datetime('now') WHERE id = ?"
        ).run(claimId);

        createNotification(
          claim.user_id,
          `تحديث بشأن طلب راتب شهر ${claim.period_month}`,
          `تعذر اعتماد طلب راتب "${claim.rank_title}" حالياً. يرجى مراجعة شروط الرتبة أو التواصل مع الإدارة.`,
          'warning'
        );
      }
    });

    runSalaryDecision();
    return res.json({
      message:
        decision === 'approve'
          ? `تم اعتماد وصرف الراتب الشهري ($${claim.amount.toFixed(2)} USDT) بنجاح`
          : 'تم رفض طلب الراتب الشهري'
    });
  } catch (err) {
    console.error('Admin salary decision error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء معالجة طلب الراتب' });
  }
});

// Admin Decision on One-Time Position Promotion Bonus Claims
app.post('/api/admin/promotions/:id/decision', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const claimId = Number(req.params.id);
    const decision = req.body.decision; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'قرار غير صالح' });
    }

    const claim = db.prepare('SELECT * FROM claimed_position_bonuses WHERE id = ?').get(claimId);
    if (!claim || claim.status !== 'pending') {
      return res.status(400).json({ error: 'طلب مكافأة الترقية غير موجود أو تمت معالجته مسبقاً' });
    }

    const runPromoDecision = db.transaction(() => {
      if (decision === 'approve') {
        db.prepare(
          "UPDATE claimed_position_bonuses SET status = 'approved', decided_at = datetime('now') WHERE id = ?"
        ).run(claimId);

        db.prepare(`
          UPDATE users
          SET balance = ROUND(balance + ?, 2),
              total_team_earnings = ROUND(total_team_earnings + ?, 2),
              job_title = ?
          WHERE id = ?
        `).run(claim.bonus_amount, claim.bonus_amount, claim.rank_title, claim.user_id);

        createNotification(
          claim.user_id,
          `اعتماد وصرف مكافأة ترقية منصب "${claim.rank_title}" +$${claim.bonus_amount.toFixed(2)} USDT 🏆`,
          `تمت موافقة الإدارة على مكافأة الترقية ($${claim.bonus_amount.toFixed(2)} USDT)${
            claim.physical_gift ? ` واعتماد تسليم هديتك (${claim.physical_gift})` : ''
          } وإضافة المبلغ إلى محفظة الدخل.`,
          'reward'
        );
      } else {
        db.prepare(
          "UPDATE claimed_position_bonuses SET status = 'rejected', decided_at = datetime('now') WHERE id = ?"
        ).run(claimId);

        createNotification(
          claim.user_id,
          `تحديث بشأن طلب مكافأة ترقية "${claim.rank_title}"`,
          `تعذر اعتماد طلب مكافأة الترقية حالياً. يرجى مراجعة استيفاء شروط المنصب أو التواصل مع الإدارة.`,
          'warning'
        );
      }
    });

    runPromoDecision();
    return res.json({
      message:
        decision === 'approve'
          ? `تم اعتماد وصرف مكافأة الترقية ($${claim.bonus_amount.toFixed(2)} USDT) بنجاح`
          : 'تم رفض طلب مكافأة الترقية'
    });
  } catch (err) {
    console.error('Admin promotion decision error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء معالجة طلب مكافأة الترقية' });
  }
});

// Admin Create / Delete Limited Flash VIP Tourism Missions
app.post('/api/admin/flash-missions', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const location = String(req.body.location || '').trim() || 'وجهة عالمية فاخرة';
    const description =
      String(req.body.description || '').trim() ||
      'مهمة تقييم سياحي مميزة بمقاعد محدودة وعائد معزز لأعضاء Arona Boost.';
    const reward = Math.max(0.1, round2(Number(req.body.reward || 2.0)));
    const minVipLevel = Math.min(6, Math.max(0, Math.round(Number(req.body.minVipLevel || 1))));
    const maxClaims = Math.max(1, Math.round(Number(req.body.maxClaims || 20)));
    const durationHours = Math.max(1, Math.round(Number(req.body.durationHours || 48)));
    const imgIdx = (Math.floor(Math.random() * 10) % 10) + 1;
    const imageUrl = String(req.body.imageUrl || `/destinations/dest-${imgIdx}.jpg`);

    if (title.length < 3) {
      return res.status(400).json({ error: 'يرجى إدخال اسم واضح للمهمة السياحية المميزة' });
    }

    db.prepare(`
      INSERT INTO flash_missions (
        title, location, category, description, image_url,
        reward, min_vip_level, max_claims, claimed_count, is_active, expires_at
      ) VALUES (?, ?, 'مهمة أرونا استثنائية محدودة', ?, ?, ?, ?, ?, 0, 1, datetime('now', ?))
    `).run(title, location, description, imageUrl, reward, minVipLevel, maxClaims, `+${durationHours} hours`);

    return res.status(201).json({
      message: `تم إطلاق المهمة السياحية المحدودة "${title}" بنجاح!`
    });
  } catch (err) {
    console.error('Create flash mission error:', err);
    return res.status(500).json({ error: 'تعذر إنشاء المهمة المميزة' });
  }
});

app.delete('/api/admin/flash-missions/:id', authMiddleware, adminMiddleware, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('UPDATE flash_missions SET is_active = 0 WHERE id = ?').run(id);
  res.json({ message: 'تم إيقاف/أرشفة المهمة السياحية المميزة بنجاح' });
});

app.post('/api/admin/users/:id/manage', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const action = String(req.body.action || '');
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);

    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (action === 'adjust_balance') {
      const delta = round2(Number(req.body.delta || 0));
      const note = String(req.body.note || '').trim() || 'تعديل رصيد إداري';
      if (!delta || isNaN(delta)) {
        return res.status(400).json({ error: 'يرجى إدخال قيمة موجبة للشحن أو سالبة للخصم' });
      }
      const newBal = round2(Math.max(0, targetUser.balance + delta));
      db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBal, targetId);
      createNotification(
        targetId,
        delta > 0
          ? `إضافة رصيد إداري +$${delta.toFixed(2)} USDT`
          : `خصم رصيد إداري -$${Math.abs(delta).toFixed(2)} USDT`,
        `${note} • رصيدك الحالي الآن $${newBal.toFixed(2)} USDT.`,
        delta > 0 ? 'reward' : 'warning'
      );
      return res.json({ message: `تم تعديل رصيد العضو إلى $${newBal.toFixed(2)} USDT` });
    }

    if (action === 'set_vip') {
      const vipLevel = Math.min(6, Math.max(0, Math.round(Number(req.body.vipLevel || 0))));
      const nextJob =
        targetUser.job_title && targetUser.job_title !== 'موظف متدرب'
          ? targetUser.job_title
          : vipLevel > 0
          ? 'موظف رسمي'
          : 'موظف متدرب';
      db.prepare('UPDATE users SET vip_level = ?, job_title = ? WHERE id = ?').run(
        vipLevel,
        nextJob,
        targetId
      );
      createNotification(
        targetId,
        `تحديث درجة العقد إلى الفئة A${vipLevel}`,
        `قامت الإدارة بتحديث درجتك الوظيفية المعتمدة إلى الفئة A${vipLevel}.`,
        'info'
      );
      return res.json({ message: `تم تحديث درجة العضو إلى الفئة A${vipLevel}` });
    }

    if (action === 'adjust_recharge') {
      const delta = round2(Number(req.body.amount || 0));
      if (!delta || isNaN(delta)) {
        return res.status(400).json({ error: 'يرجى إدخال مبلغ صحيح لتعديل رصيد الشحن' });
      }
      const nextRec = Math.max(0, round2(Number(targetUser.recharge_balance || 0) + delta));
      db.prepare('UPDATE users SET recharge_balance = ? WHERE id = ?').run(nextRec, targetId);
      createNotification(
        targetId,
        delta > 0
          ? `إضافة رصيد شحن +$${delta.toFixed(2)} USDT`
          : `تعديل رصيد الشحن $${delta.toFixed(2)} USDT`,
        `أصبح رصيد الشحن الخاص بك الآن $${nextRec.toFixed(2)} USDT.`,
        delta > 0 ? 'reward' : 'info'
      );
      return res.json({ message: `تم تعديل رصيد الشحن للعضو إلى $${nextRec.toFixed(2)} USDT` });
    }

    if (action === 'set_job_title') {
      const title = String(req.body.jobTitle || '').trim();
      if (!title) {
        return res.status(400).json({ error: 'يرجى إدخال المسمى الوظيفي' });
      }
      db.prepare('UPDATE users SET job_title = ? WHERE id = ?').run(title, targetId);
      createNotification(
        targetId,
        `تحديث المنصب الوظيفي إلى "${title}"`,
        `تم اعتماد منصبك الرسمي في Arona Boost كـ "${title}".`,
        'reward'
      );
      return res.json({ message: `تم تحديث منصب العضو إلى "${title}"` });
    }

    if (action === 'adjust_spins') {
      const spinsDelta = Math.round(Number(req.body.spins || 0));
      if (!spinsDelta || isNaN(spinsDelta)) {
        return res.status(400).json({ error: 'يرجى إدخال عدد لفات صحيح' });
      }
      const nextSpins = Math.max(0, Number(targetUser.spin_credits || 0) + spinsDelta);
      db.prepare('UPDATE users SET spin_credits = ? WHERE id = ?').run(nextSpins, targetId);
      if (spinsDelta > 0) {
        createNotification(
          targetId,
          `هدية لفات عجلة الحظ (+${spinsDelta} لفة) 🎡`,
          `منحتك إدارة Arona Boost عدد ${spinsDelta} لفات مجانية في عجلة الحظ!`,
          'reward'
        );
      }
      return res.json({ message: `أصبح رصيد لفات العضو الآن ${nextSpins} لفة` });
    }

    if (action === 'toggle_ban') {
      if (targetUser.is_admin) {
        return res.status(400).json({ error: 'لا يمكن حظر حساب مدير النظام' });
      }
      const nextBan = targetUser.is_banned ? 0 : 1;
      db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(nextBan, targetId);
      return res.json({
        message: nextBan ? 'تم تجميد حساب العضو' : 'تم إلغاء تجميد حساب العضو'
      });
    }

    if (action === 'reset_password') {
      const newPass = String(req.body.newPassword || '').trim();
      if (newPass.length < 4) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن لا تقل عن 4 محارف' });
      }
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
        bcrypt.hashSync(newPass, 10),
        targetId
      );
      return res.json({ message: 'تم إعادة تعيين كلمة مرور العضو بنجاح' });
    }

    if (action === 'reset_pin') {
      const newPin = normalizeDigitsAndStrip(req.body.newPin || '');
      if (!/^\d{4,6}$/.test(newPin)) {
        return res.status(400).json({ error: 'رمز PIN الجديد يجب أن يتكون من 4 إلى 6 أرقام' });
      }
      db.prepare('UPDATE users SET withdraw_pin_hash = ? WHERE id = ?').run(
        bcrypt.hashSync(newPin, 10),
        targetId
      );
      createNotification(
        targetId,
        'إعادة تعيين رمز السحب المالي PIN',
        'تم إعادة تعيين رمز الحماية المالي الخاص بحسابك بناءً على طلبك.',
        'info'
      );
      return res.json({ message: 'تم إعادة تعيين رمز PIN للعضو بنجاح' });
    }

    if (action === 'send_notification') {
      const title = String(req.body.title || '').trim();
      const body = String(req.body.body || '').trim();
      const notifType = ['info', 'reward', 'success', 'warning'].includes(req.body.type)
        ? req.body.type
        : 'info';

      if (title.length < 2 || body.length < 2) {
        return res.status(400).json({ error: 'يرجى كتابة عنوان ونص الإشعار قبل الإرسال' });
      }

      createNotification(targetId, title, body, notifType);
      db.prepare(`
        INSERT INTO admin_notification_logs (scope, target_label, recipients_count, title, body, type)
        VALUES ('private', ?, 1, ?, ?, ?)
      `).run(targetUser.phone, title, body, notifType);

      return res.json({
        message: `تم إرسال الإشعار الخاص إلى العضو (${targetUser.phone}) بنجاح`
      });
    }

    return res.status(400).json({ error: 'إجراء إداري غير معروف' });
  } catch (err) {
    console.error('Admin user manage error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تنفيذ الإجراء الإداري' });
  }
});

// Send Broadcast (All Users) or Private (Single User) Notification from Admin
app.post('/api/admin/notifications/send', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const scope = req.body.scope === 'private' ? 'private' : 'broadcast';
    const title = String(req.body.title || '').trim().slice(0, 140);
    const body = String(req.body.body || '').trim().slice(0, 600);
    const notifType = ['info', 'reward', 'success', 'warning'].includes(req.body.type)
      ? req.body.type
      : 'info';

    if (title.length < 2 || body.length < 2) {
      return res.status(400).json({ error: 'يرجى إدخال عنوان ونص واضح للإشعار' });
    }

    if (scope === 'broadcast') {
      const sendBroadcastTx = db.transaction(() => {
        const allUsers = db.prepare('SELECT id FROM users').all();
        const insertNotif = db.prepare(`
          INSERT INTO notifications (user_id, title, body, type, is_read)
          VALUES (?, ?, ?, ?, 0)
        `);
        for (const u of allUsers) {
          insertNotif.run(u.id, title, body, notifType);
        }
        db.prepare(`
          INSERT INTO admin_notification_logs (scope, target_label, recipients_count, title, body, type)
          VALUES ('broadcast', 'جميع الأعضاء', ?, ?, ?, ?)
        `).run(allUsers.length, title, body, notifType);
        return allUsers.length;
      });

      const count = sendBroadcastTx();
      return res.json({
        message: `تم إرسال الإشعار الجماعي بنجاح إلى جميع الأعضاء (${count} عضو)`,
        recipientsCount: count
      });
    }

    // scope === 'private'
    const rawTarget = String(req.body.target || '').trim();
    if (!rawTarget) {
      return res.status(400).json({
        error: 'يرجى تحديد رقم هاتف العضو أو رمز دعوته لإرسال الإشعار الخاص'
      });
    }

    let targetUser = null;
    if (req.body.userId) {
      targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.body.userId));
    }
    if (!targetUser && /^#?\d+$/.test(rawTarget)) {
      const numVal = Number(rawTarget.replace('#', ''));
      if (rawTarget.startsWith('#') && numVal > 1000) {
        targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(numVal - 1000);
      }
    }
    if (!targetUser) {
      targetUser = findUserByPhoneFlexible(rawTarget, '');
    }
    if (!targetUser) {
      targetUser = db
        .prepare('SELECT * FROM users WHERE UPPER(invite_code) = ?')
        .get(rawTarget.toUpperCase());
    }
    if (!targetUser) {
      const digits = normalizeDigitsAndStrip(rawTarget);
      if (digits.length >= 5) {
        targetUser = db
          .prepare('SELECT * FROM users WHERE phone LIKE ? ORDER BY id ASC LIMIT 1')
          .get(`%${digits}%`);
      }
    }

    if (!targetUser) {
      return res.status(404).json({
        error: 'لم يتم العثور على عضو مطابق لرقم الهاتف أو رمز الدعوة المدخل'
      });
    }

    createNotification(targetUser.id, title, body, notifType);
    db.prepare(`
      INSERT INTO admin_notification_logs (scope, target_label, recipients_count, title, body, type)
      VALUES ('private', ?, 1, ?, ?, ?)
    `).run(targetUser.phone, title, body, notifType);

    return res.json({
      message: `تم إرسال الإشعار الخاص بنجاح إلى العضو (${targetUser.phone})`,
      recipientsCount: 1,
      targetPhone: targetUser.phone
    });
  } catch (err) {
    console.error('Admin send notification error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء إرسال الإشعار' });
  }
});

// ==================== EXECUTIVE GLOBAL SUITE (INVITE, TRANSPARENCY, CONCIERGE, SECURITY) ====================

app.get('/api/public/referrer/:code', (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code || code.length < 3) {
      return res.json({ valid: false });
    }
    const inviter = db
      .prepare('SELECT id, phone, invite_code, vip_level, job_title, created_at FROM users WHERE invite_code = ?')
      .get(code);
    if (!inviter) {
      return res.json({ valid: false });
    }
    const levels = getActiveVipLevels();
    const vipObj = levels.find((v) => v.level === (inviter.vip_level || 0)) || levels[0];
    const effectiveTitle =
      inviter.job_title && inviter.job_title.trim()
        ? inviter.job_title.trim()
        : (inviter.vip_level || 0) > 0
        ? 'موظف رسمي'
        : 'مقيّم معتمد';

    return res.json({
      valid: true,
      inviteCode: inviter.invite_code,
      memberSerial: 1000 + inviter.id,
      maskedPhone: maskPhone(inviter.phone),
      vipLevel: inviter.vip_level || 0,
      gradeName: vipObj.name || `الفئة A${inviter.vip_level || 0}`,
      gradeTitle: vipObj.title || effectiveTitle,
      jobTitle: effectiveTitle
    });
  } catch (err) {
    console.error('Referrer lookup error:', err);
    return res.json({ valid: false });
  }
});

app.get('/api/transparency-metrics', (req, res) => {
  try {
    const realReports = db.prepare('SELECT COUNT(*) as c FROM task_completions').get().c;
    const realTx = db
      .prepare("SELECT COUNT(*) as c FROM transactions WHERE status = 'completed'")
      .get().c;

    const regionalHubs = [
      {
        id: 'dxb',
        codePrefix: '#DXB',
        city: 'دبي',
        country: 'الإمارات العربية المتحدة',
        x: 68,
        y: 56,
        contractedHotels: 42,
        activeContractsToday: 184,
        avgRating: 4.94,
        flagship: 'فنادق ومنتجعات نخلة جميرا وبوليفارد دبي'
      },
      {
        id: 'ruh',
        codePrefix: '#RUH',
        city: 'الرياض والعُلا',
        country: 'المملكة العربية السعودية',
        x: 61,
        y: 58,
        contractedHotels: 31,
        activeContractsToday: 138,
        avgRating: 4.92,
        flagship: 'منتجعات العُلا التراثية وفنادق الأعمال بالرياض'
      },
      {
        id: 'amm',
        codePrefix: '#AMM',
        city: 'عمّان والبتراء',
        country: 'المملكة الأردنية الهاشمية',
        x: 54,
        y: 48,
        contractedHotels: 24,
        activeContractsToday: 96,
        avgRating: 4.89,
        flagship: 'منشآت الضيافة في البحر الميت والبتراء وعمّان'
      },
      {
        id: 'ist',
        codePrefix: '#IST',
        city: 'إسطنبول',
        country: 'الجمهورية التركية',
        x: 51,
        y: 34,
        contractedHotels: 38,
        activeContractsToday: 162,
        avgRating: 4.91,
        flagship: 'فنادق مضيق البوسفور والسلطان أحمد التاريخية'
      },
      {
        id: 'cai',
        codePrefix: '#CAI',
        city: 'القاهرة وشرم الشيخ',
        country: 'جمهورية مصر العربية',
        x: 49,
        y: 55,
        contractedHotels: 29,
        activeContractsToday: 121,
        avgRating: 4.88,
        flagship: 'فنادق إطلالة النيل ومنتجعات البحر الأحمر'
      },
      {
        id: 'vce',
        codePrefix: '#VCE',
        city: 'البندقية',
        country: 'إيطاليا',
        x: 36,
        y: 30,
        contractedHotels: 19,
        activeContractsToday: 74,
        avgRating: 4.93,
        flagship: 'الأجنحة الكلاسيكية المطلة على القناة الكبرى'
      },
      {
        id: 'zrh',
        codePrefix: '#ZRH',
        city: 'زيورخ وإنترلاكن',
        country: 'سويسرا',
        x: 32,
        y: 25,
        contractedHotels: 16,
        activeContractsToday: 68,
        avgRating: 4.96,
        flagship: 'منتجعات جبال الألب السويسرية المصنفة 5 نجوم'
      }
    ];

    return res.json({
      avgSettlementMinutes: 4.2,
      blockchainAuditRatePct: 99.8,
      totalHospitalityReports: 14820 + realReports,
      totalSettledVouchers: 6390 + realTx,
      contractedHotelsTotal: regionalHubs.reduce((s, h) => s + h.contractedHotels, 0),
      regionalHubs
    });
  } catch (err) {
    console.error('Transparency metrics error:', err);
    return res.status(500).json({ error: 'تعذر تحميل مؤشرات الشفافية المؤسسية' });
  }
});

// ---- Feature 7: Banking Security Center & Active Sessions ----

app.get('/api/account/security', authMiddleware, (req, res) => {
  try {
    const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const sessions = db
      .prepare(
        `SELECT id, token_sig, device_label, ip_hint, created_at, last_seen_at
         FROM user_sessions
         WHERE user_id = ? AND is_revoked = 0
         ORDER BY last_seen_at DESC
         LIMIT 12`
      )
      .all(req.user.id)
      .map((s) => ({
        id: s.id,
        deviceLabel: s.device_label,
        ipHint: s.ip_hint,
        createdAt: s.created_at,
        lastSeenAt: s.last_seen_at,
        isCurrent: s.token_sig === req.tokenSig
      }));

    let securityScore = 45;
    if (freshUser.withdraw_pin_hash) securityScore += 25;
    if (freshUser.saved_wallet_address) securityScore += 15;
    if (freshUser.wallet_locked) securityScore += 15;

    return res.json({
      securityScore: Math.min(100, securityScore),
      walletLocked: Boolean(freshUser.wallet_locked),
      walletLockedAt: freshUser.wallet_locked_at || '',
      savedWalletAddress: freshUser.saved_wallet_address || '',
      savedWalletNetwork: freshUser.saved_wallet_network || 'TRC20',
      hasWithdrawPin: Boolean(freshUser.withdraw_pin_hash),
      sessions
    });
  } catch (err) {
    console.error('Get security center error:', err);
    return res.status(500).json({ error: 'تعذر تحميل بيانات مركز الحماية المصرفية' });
  }
});

app.post('/api/account/wallet-lock', authMiddleware, (req, res) => {
  try {
    const action = req.body.lock ? 'lock' : 'unlock';
    const pin = normalizeDigitsAndStrip(req.body.pin || '');
    const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!freshUser.withdraw_pin_hash) {
      return res.status(400).json({
        error: 'يرجى إعداد رمز الحماية المالي (PIN) أولاً لتفعيل قفل محفظة السحب'
      });
    }
    if (!freshUser.saved_wallet_address) {
      return res.status(400).json({
        error: 'يرجى حفظ عنوان محفظة السحب المعتمدة أولاً قبل تفعيل القفل المصرفي'
      });
    }
    if (!pin || !bcrypt.compareSync(pin, freshUser.withdraw_pin_hash)) {
      return res.status(401).json({ error: 'رمز الحماية المالي (PIN) غير صحيح' });
    }

    if (action === 'lock') {
      db.prepare(
        "UPDATE users SET wallet_locked = 1, wallet_locked_at = datetime('now') WHERE id = ?"
      ).run(req.user.id);
    } else {
      db.prepare("UPDATE users SET wallet_locked = 0, wallet_locked_at = '' WHERE id = ?").run(
        req.user.id
      );
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      message:
        action === 'lock'
          ? 'تم تفعيل القفل المصرفي لعنوان المحفظة — لن يُسمح بالسحب إلا لعنوانك المعتمد'
          : 'تم فك قفل عنوان المحفظة مؤقتاً لتحديث البيانات',
      user: serializeUser(updated)
    });
  } catch (err) {
    console.error('Wallet lock toggle error:', err);
    return res.status(500).json({ error: 'تعذر تحديث حالة قفل المحفظة' });
  }
});

app.post('/api/account/sessions/revoke-others', authMiddleware, (req, res) => {
  try {
    const info = db
      .prepare(
        'UPDATE user_sessions SET is_revoked = 1 WHERE user_id = ? AND token_sig != ? AND is_revoked = 0'
      )
      .run(req.user.id, req.tokenSig || '');

    return res.json({
      message:
        info.changes > 0
          ? `تم إنهاء ${info.changes} جلسة أخرى بنجاح وتأمين حسابك على هذا الجهاز فقط`
          : 'لا توجد أي جلسات أخرى نشطة خارج جهازك الحالي',
      revokedCount: info.changes
    });
  } catch (err) {
    console.error('Revoke other sessions error:', err);
    return res.status(500).json({ error: 'تعذر إنهاء الجلسات الأخرى' });
  }
});

app.post('/api/account/sessions/:id/revoke', authMiddleware, (req, res) => {
  try {
    const sessId = Number(req.params.id);
    db.prepare(
      'UPDATE user_sessions SET is_revoked = 1 WHERE id = ? AND user_id = ? AND token_sig != ?'
    ).run(sessId, req.user.id, req.tokenSig || '');
    return res.json({ message: 'تم إنهاء الجلسة المحددة بنجاح' });
  } catch (err) {
    console.error('Revoke single session error:', err);
    return res.status(500).json({ error: 'تعذر إنهاء الجلسة' });
  }
});

// ---- Feature 4: In-App Executive Concierge & Admin Support Desk ----

app.get('/api/support/tickets', authMiddleware, (req, res) => {
  try {
    const serialized = serializeUser(req.user);
    const isPriorityVip = (serialized.vipLevel || 0) >= 3;
    const tickets = db
      .prepare(
        `SELECT id, ticket_code as ticketCode, subject, category, priority, status,
                created_at as createdAt, updated_at as updatedAt
         FROM support_tickets
         WHERE user_id = ?
         ORDER BY updated_at DESC, id DESC
         LIMIT 25`
      )
      .all(req.user.id);

    const msgStmt = db.prepare(
      `SELECT id, sender_role as senderRole, body, created_at as createdAt
       FROM support_messages
       WHERE ticket_id = ?
       ORDER BY id ASC`
    );

    const enriched = tickets.map((t) => ({
      ...t,
      messages: msgStmt.all(t.id)
    }));

    return res.json({
      isPriorityVip,
      priorityLabel: isPriorityVip
        ? `أولوية المساندة التنفيذية (الفئة A${serialized.vipLevel})`
        : 'مكتب خدمة الأعضاء المعتمد',
      tickets: enriched
    });
  } catch (err) {
    console.error('Get support tickets error:', err);
    return res.status(500).json({ error: 'تعذر تحميل تذاكر مكتب المساندة' });
  }
});

app.post('/api/support/tickets', authMiddleware, (req, res) => {
  try {
    const subject = String(req.body.subject || '').trim().slice(0, 120);
    const category = String(req.body.category || 'استفسار عام').trim().slice(0, 40);
    const message = String(req.body.message || '').trim().slice(0, 1000);

    if (subject.length < 3 || message.length < 4) {
      return res.status(400).json({ error: 'يرجى كتابة عنوان واضح وتفاصيل الرسالة قبل الإرسال' });
    }

    const serialized = serializeUser(req.user);
    const priority = (serialized.vipLevel || 0) >= 3 ? 'vip' : 'standard';
    const ticketCode = generateRefCode('CNG');

    const createdId = db.transaction(() => {
      const tk = db
        .prepare(
          `INSERT INTO support_tickets (user_id, ticket_code, subject, category, priority, status)
           VALUES (?, ?, ?, ?, ?, 'open')`
        )
        .run(req.user.id, ticketCode, subject, category, priority);
      const id = tk.lastInsertRowid;
      db.prepare(
        `INSERT INTO support_messages (ticket_id, sender_role, body)
         VALUES (?, 'user', ?)`
      ).run(id, message);
      return id;
    })();

    return res.status(201).json({
      message:
        priority === 'vip'
          ? `تم فتح تذكرة أولوية تنفيذية (${ticketCode}) وتحويلها لمشرف الفئات العليا`
          : `تم استلام تذكرتك (${ticketCode}) بنجاح وسيتم الرد عليك في أقرب وقت`,
      ticketId: createdId,
      ticketCode
    });
  } catch (err) {
    console.error('Create support ticket error:', err);
    return res.status(500).json({ error: 'تعذر إرسال التذكرة حالياً' });
  }
});

app.post('/api/support/tickets/:id/reply', authMiddleware, (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const message = String(req.body.message || '').trim().slice(0, 1000);
    if (message.length < 2) {
      return res.status(400).json({ error: 'يرجى كتابة نص الرد قبل الإرسال' });
    }

    const ticket = db
      .prepare('SELECT * FROM support_tickets WHERE id = ? AND user_id = ?')
      .get(ticketId, req.user.id);
    if (!ticket) {
      return res.status(404).json({ error: 'لم يتم العثور على هذه التذكرة' });
    }

    db.transaction(() => {
      db.prepare(
        `INSERT INTO support_messages (ticket_id, sender_role, body)
         VALUES (?, 'user', ?)`
      ).run(ticketId, message);
      db.prepare(
        "UPDATE support_tickets SET status = 'open', updated_at = datetime('now') WHERE id = ?"
      ).run(ticketId);
    })();

    return res.json({ message: 'تم إرسال رسالتك إلى مكتب المساندة بنجاح' });
  } catch (err) {
    console.error('User reply ticket error:', err);
    return res.status(500).json({ error: 'تعذر إرسال الرسالة' });
  }
});

app.get('/api/admin/support', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const statusFilter = String(req.query.status || 'all');
    let rows;
    if (['open', 'answered', 'closed'].includes(statusFilter)) {
      rows = db
        .prepare(
          `SELECT st.id, st.user_id as userId, st.ticket_code as ticketCode, st.subject,
                  st.category, st.priority, st.status, st.created_at as createdAt, st.updated_at as updatedAt,
                  u.phone, u.vip_level as vipLevel, u.job_title as jobTitle
           FROM support_tickets st
           JOIN users u ON u.id = st.user_id
           WHERE st.status = ?
           ORDER BY CASE WHEN st.priority = 'vip' THEN 0 ELSE 1 END, st.updated_at DESC
           LIMIT 60`
        )
        .all(statusFilter);
    } else {
      rows = db
        .prepare(
          `SELECT st.id, st.user_id as userId, st.ticket_code as ticketCode, st.subject,
                  st.category, st.priority, st.status, st.created_at as createdAt, st.updated_at as updatedAt,
                  u.phone, u.vip_level as vipLevel, u.job_title as jobTitle
           FROM support_tickets st
           JOIN users u ON u.id = st.user_id
           ORDER BY CASE WHEN st.status = 'open' THEN 0 ELSE 1 END,
                    CASE WHEN st.priority = 'vip' THEN 0 ELSE 1 END,
                    st.updated_at DESC
           LIMIT 60`
        )
        .all();
    }

    const msgStmt = db.prepare(
      `SELECT id, sender_role as senderRole, body, created_at as createdAt
       FROM support_messages
       WHERE ticket_id = ?
       ORDER BY id ASC`
    );

    return res.json({
      tickets: rows.map((r) => ({
        ...r,
        messages: msgStmt.all(r.id)
      }))
    });
  } catch (err) {
    console.error('Admin get support error:', err);
    return res.status(500).json({ error: 'تعذر تحميل تذاكر الدعم الإدارية' });
  }
});

app.post('/api/admin/support/:id/reply', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const body = String(req.body.message || '').trim().slice(0, 1200);
    if (body.length < 2) {
      return res.status(400).json({ error: 'يرجى كتابة نص الرد الرسمي قبل الإرسال' });
    }

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'التذكرة غير موجودة' });
    }

    db.transaction(() => {
      db.prepare(
        `INSERT INTO support_messages (ticket_id, sender_role, body)
         VALUES (?, 'admin', ?)`
      ).run(ticketId, body);
      db.prepare(
        "UPDATE support_tickets SET status = 'answered', updated_at = datetime('now') WHERE id = ?"
      ).run(ticketId);
    })();

    createNotification(
      ticket.user_id,
      `رد رسمي من مكتب المساندة (${ticket.ticket_code})`,
      body.slice(0, 160),
      'info'
    );

    return res.json({ message: `تم إرسال الرد الرسمي إلى العضو (${ticket.ticket_code})` });
  } catch (err) {
    console.error('Admin reply support error:', err);
    return res.status(500).json({ error: 'تعذر إرسال الرد الإداري' });
  }
});

app.post('/api/admin/support/:id/close', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    db.prepare(
      "UPDATE support_tickets SET status = 'closed', updated_at = datetime('now') WHERE id = ?"
    ).run(ticketId);
    return res.json({ message: 'تم إغلاق التذكرة وأرشفتها بنجاح' });
  } catch (err) {
    console.error('Admin close ticket error:', err);
    return res.status(500).json({ error: 'تعذر إغلاق التذكرة' });
  }
});

// ==================== RED ENVELOPE (الظرف الأحمر) & POINT SHOP (متجر النقاط) ====================

app.get('/api/red-envelope', authMiddleware, (req, res) => {
  try {
    const claims = db
      .prepare(
        `
        SELECT id, code, amount, created_at as createdAt
        FROM red_envelope_claims
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 50
      `
      )
      .all(req.user.id);

    const totalReceived = round2(claims.reduce((s, c) => s + Number(c.amount || 0), 0));
    return res.json({ claims, totalReceived });
  } catch (err) {
    console.error('Red envelope get error:', err);
    return res.status(500).json({ error: 'تعذر تحميل سجل الظرف الأحمر' });
  }
});

app.post('/api/red-envelope/claim', authMiddleware, (req, res) => {
  try {
    const rawCode = String(req.body?.code || '')
      .trim()
      .toUpperCase();
    if (!rawCode) {
      return res.status(400).json({ error: 'يرجى إدخال رمز الظرف الأحمر أولاً' });
    }

    const envRow = db
      .prepare('SELECT * FROM red_envelopes WHERE UPPER(code) = ?')
      .get(rawCode);
    if (!envRow || !envRow.is_active) {
      return res.status(404).json({ error: 'رمز الظرف الأحمر غير صحيح أو منتهي الصلاحية' });
    }

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if ((userRow.vip_level || 0) < (envRow.min_vip || 0)) {
      return res.status(403).json({
        error: `هذا الظرف الأحمر مخصص لموظفي الفئة A${envRow.min_vip} فأعلى`
      });
    }

    let creditedAmount = 0;
    const claimTx = db.transaction(() => {
      const freshEnv = db
        .prepare('SELECT * FROM red_envelopes WHERE id = ?')
        .get(envRow.id);
      if (freshEnv.claimed_count >= freshEnv.max_claims) {
        throw new Error('SOLD_OUT');
      }
      const existing = db
        .prepare('SELECT id FROM red_envelope_claims WHERE envelope_id = ? AND user_id = ?')
        .get(freshEnv.id, req.user.id);
      if (existing) {
        throw new Error('ALREADY_CLAIMED');
      }

      creditedAmount = round2(freshEnv.reward_amount);
      db.prepare(
        'UPDATE red_envelopes SET claimed_count = claimed_count + 1 WHERE id = ?'
      ).run(freshEnv.id);

      db.prepare(
        'INSERT INTO red_envelope_claims (envelope_id, user_id, code, amount) VALUES (?, ?, ?, ?)'
      ).run(freshEnv.id, req.user.id, freshEnv.code, creditedAmount);

      db.prepare(
        'UPDATE users SET balance = ROUND(balance + ?, 2), points_balance = COALESCE(points_balance, 0) + 15 WHERE id = ?'
      ).run(creditedAmount, req.user.id);

      db.prepare('INSERT INTO point_logs (user_id, delta, reason) VALUES (?, 15, ?)').run(
        req.user.id,
        `مكافأة نقاط نشاط الظرف الأحمر (${freshEnv.code})`
      );
    });

    try {
      claimTx();
    } catch (txErr) {
      if (txErr.message === 'SOLD_OUT') {
        return res.status(400).json({ error: 'نفدت جميع مقاعد هذا الظرف الأحمر، ترقّب الرمز القادم!' });
      }
      if (txErr.message === 'ALREADY_CLAIMED') {
        return res.status(400).json({ error: 'لقد قمت باستلام مكافأة هذا الظرف الأحمر مسبقاً' });
      }
      throw txErr;
    }

    createNotification(
      req.user.id,
      `مكافأة الظرف الأحمر +$${creditedAmount.toFixed(2)} USDT`,
      `تهانينا! تم إيداع مكافأة الظرف الأحمر (${envRow.code}) بقيمة $${creditedAmount.toFixed(2)} USDT مباشرة في محفظة الدخل.`,
      'reward'
    );

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      message: `تهانينا! حصلت على مكافأة الظرف الأحمر +$${creditedAmount.toFixed(2)} USDT في محفظة الدخل`,
      amount: creditedAmount,
      user: serializeUser(updatedUser)
    });
  } catch (err) {
    console.error('Red envelope claim error:', err);
    return res.status(500).json({ error: 'تعذر صرف الظرف الأحمر حالياً' });
  }
});

app.get('/api/point-shop', authMiddleware, (req, res) => {
  try {
    const items = db
      .prepare(
        `
        SELECT id, title, subtitle, points_cost as pointsCost,
               official_price_usdt as officialPriceUsdt,
               usdt_credit as usdtCredit, category, stock
        FROM point_shop_items
        WHERE is_active = 1
        ORDER BY points_cost ASC
      `
      )
      .all();

    const orders = db
      .prepare(
        `
        SELECT id, item_title as itemTitle, points_spent as pointsSpent,
               usdt_credited as usdtCredited, shipping_address as shippingAddress,
               status, created_at as createdAt
        FROM point_orders
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 30
      `
      )
      .all(req.user.id);

    const logs = db
      .prepare(
        `
        SELECT id, delta, reason, created_at as createdAt
        FROM point_logs
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 40
      `
      )
      .all(req.user.id);

    const u = db.prepare('SELECT points_balance FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      pointsBalance: Number(u?.points_balance || 0),
      items,
      orders,
      logs
    });
  } catch (err) {
    console.error('Point shop get error:', err);
    return res.status(500).json({ error: 'تعذر تحميل متجر النقاط' });
  }
});

app.post('/api/point-shop/redeem', authMiddleware, (req, res) => {
  try {
    const itemId = Number(req.body?.itemId);
    const shippingAddress = String(req.body?.shippingAddress || '').trim();

    const item = db
      .prepare('SELECT * FROM point_shop_items WHERE id = ? AND is_active = 1')
      .get(itemId);
    if (!item) {
      return res.status(404).json({ error: 'المنتج المطلوب غير متوفر حالياً' });
    }
    if (item.category === 'physical' && shippingAddress.length < 6) {
      return res.status(400).json({ error: 'يرجى إدخال عنوان الاستلام ورقم التواصل لشحن الهدية العينية' });
    }

    const redeemTx = db.transaction(() => {
      const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      const freshItem = db.prepare('SELECT * FROM point_shop_items WHERE id = ?').get(itemId);
      if (freshItem.stock <= 0) throw new Error('OUT_OF_STOCK');
      if ((freshUser.points_balance || 0) < freshItem.points_cost) throw new Error('INSUFFICIENT_POINTS');

      const creditUsdt = round2(freshItem.usdt_credit || 0);
      const orderStatus = creditUsdt > 0 ? 'completed' : 'processing';

      db.prepare('UPDATE point_shop_items SET stock = stock - 1 WHERE id = ?').run(itemId);
      db.prepare(
        'UPDATE users SET points_balance = points_balance - ?, balance = ROUND(balance + ?, 2) WHERE id = ?'
      ).run(freshItem.points_cost, creditUsdt, req.user.id);

      db.prepare(
        `
        INSERT INTO point_orders (user_id, item_id, item_title, points_spent, usdt_credited, shipping_address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        req.user.id,
        itemId,
        freshItem.title,
        freshItem.points_cost,
        creditUsdt,
        shippingAddress,
        orderStatus
      );

      db.prepare('INSERT INTO point_logs (user_id, delta, reason) VALUES (?, ?, ?)').run(
        req.user.id,
        -freshItem.points_cost,
        `استبدال من متجر النقاط: ${freshItem.title}`
      );
    });

    try {
      redeemTx();
    } catch (txErr) {
      if (txErr.message === 'OUT_OF_STOCK') {
        return res.status(400).json({ error: 'نفدت الكمية المتاحة لهذا العنصر' });
      }
      if (txErr.message === 'INSUFFICIENT_POINTS') {
        return res.status(400).json({ error: 'رصيد نقاطك الحالي غير كافٍ لاستبدال هذا المنتج' });
      }
      throw txErr;
    }

    const creditUsdt = round2(item.usdt_credit || 0);
    createNotification(
      req.user.id,
      `استبدال ناجح من متجر النقاط`,
      creditUsdt > 0
        ? `تم استبدال "${item.title}" وإيداع +$${creditUsdt.toFixed(2)} USDT فوراً في محفظة الدخل.`
        : `تم تسجيل طلب شحن "${item.title}" بنجاح وسيتم التواصل معك للتسليم.`,
      'reward'
    );

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({
      message:
        creditUsdt > 0
          ? `تم استبدال النقاط وإيداع +$${creditUsdt.toFixed(2)} USDT في محفظة الدخل!`
          : `تم تأكيد استبدال "${item.title}" وتسجيل عنوان الشحن بنجاح!`,
      user: serializeUser(updatedUser)
    });
  } catch (err) {
    console.error('Point shop redeem error:', err);
    return res.status(500).json({ error: 'تعذر إتمام عملية استبدال النقاط' });
  }
});

app.get('/api/admin/red-envelopes', authMiddleware, adminMiddleware, (req, res) => {
  const list = db
    .prepare(
      `
      SELECT id, code, title, reward_amount as rewardAmount,
             max_claims as maxClaims, claimed_count as claimedCount,
             min_vip as minVip, is_active as isActive, created_at as createdAt
      FROM red_envelopes
      ORDER BY id DESC
    `
    )
    .all();
  res.json({ envelopes: list });
});

app.post('/api/admin/red-envelopes', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const code = String(req.body?.code || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    const title = String(req.body?.title || 'مكافأة الظرف الأحمر الرسمية').trim();
    const rewardAmount = round2(Math.max(0.1, Number(req.body?.rewardAmount || 1)));
    const maxClaims = Math.max(1, Math.round(Number(req.body?.maxClaims || 50)));
    const minVip = Math.max(0, Math.min(6, Math.round(Number(req.body?.minVip || 0))));

    if (code.length < 4) {
      return res.status(400).json({ error: 'يرجى إدخال رمز ظرف أحمر من 4 أحرف/أرقام على الأقل' });
    }

    db.prepare(
      `
      INSERT INTO red_envelopes (code, title, reward_amount, max_claims, min_vip, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `
    ).run(code, title, rewardAmount, maxClaims, minVip);

    return res.status(201).json({ message: `تم إنشاء كود الظرف الأحمر (${code}) بنجاح` });
  } catch (err) {
    if (String(err.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'هذا الرمز مستخدم مسبقاً، اختر رمزاً جديداً' });
    }
    return res.status(500).json({ error: 'تعذر إنشاء الظرف الأحمر' });
  }
});

app.delete('/api/admin/red-envelopes/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM red_envelopes WHERE id = ?').run(Number(req.params.id));
  res.json({ message: 'تم حذف رمز الظرف الأحمر' });
});

app.post('/api/admin/welcome-popup', authMiddleware, adminMiddleware, (req, res) => {
  const enabled = req.body?.enabled ? '1' : '0';
  const title = String(req.body?.title || 'إشعار الموظفين الرسمي — Arona Boost').trim();
  const body = String(req.body?.body || '').trim();
  const up = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  up.run('welcome_popup_enabled', enabled);
  up.run('welcome_popup_title', title);
  up.run('welcome_popup_body', body);
  res.json({ message: 'تم تحديث نافذة إشعار الموظفين الترحيبية بنجاح' });
});

// ==================== STATIC SPA SERVING ====================

const BUNDLE_DIR = path.join(__dirname, '..', 'app_bundle');
if (fs.existsSync(BUNDLE_DIR)) {
  app.use(
    express.static(BUNDLE_DIR, {
      maxAge: '7d',
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (/\.(jpg|jpeg|png|webp|svg|css|js)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=604800');
        }
      }
    })
  );
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(BUNDLE_DIR, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Arona Boost server listening on http://0.0.0.0:${PORT}`);
  warmUpLiveGalleries();
});
