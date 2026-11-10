import {
  round2,
  nowUtcStr,
  getTodayDateStr,
  validatePhoneNumber,
  DEFAULT_VIP_LEVELS,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_VAULT_PLANS,
  DEFAULT_WHEEL_SEGMENTS,
  DEFAULT_SALARY_RANKS,
  DEFAULT_WITHDRAW_PRESETS
} from './helpers.js';

export function normalizeDigitsAndStrip(raw = '') {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let out = String(raw || '').trim();
  out = out.replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  out = out.replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)));
  out = out.replace(/[\s\-()]/g, '');
  return out;
}

export function buildNormalizedPhone(rawPhone = '', countryCode = '') {
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

export function maskPhone(phone = '') {
  const s = String(phone || '');
  if (s.length <= 5) return s;
  return `${s.slice(0, 4)}***${s.slice(-3)}`;
}

export function generateRefCode(prefix = 'TX') {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${Date.now().toString().slice(-5)}${rand.toString().slice(0, 3)}`;
}

export async function generateInviteCode(db) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  while (true) {
    let code = 'AB';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const rows = await db`SELECT id FROM arona_boost.users WHERE invite_code = ${code} LIMIT 1`;
    if (rows.length === 0) return code;
  }
}

export async function getSettingsMap(db) {
  const rows = await db`SELECT key, value FROM arona_boost.settings`;
  const map = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export function parseVipLevels(settings) {
  try {
    if (settings.vip_levels_json) {
      const parsed = JSON.parse(settings.vip_levels_json);
      if (Array.isArray(parsed) && parsed.length === DEFAULT_VIP_LEVELS.length) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_VIP_LEVELS;
}

export function parseAnnouncements(settings) {
  try {
    if (settings.announcements_json) {
      const parsed = JSON.parse(settings.announcements_json);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_ANNOUNCEMENTS;
}

export function parseVaultPlans(settings) {
  try {
    if (settings.vault_plans_json) {
      const parsed = JSON.parse(settings.vault_plans_json);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_VAULT_PLANS;
}

export function parseWheelSegments(settings) {
  try {
    if (settings.lucky_wheel_json) {
      const parsed = JSON.parse(settings.lucky_wheel_json);
      if (Array.isArray(parsed) && parsed.length >= 4) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_WHEEL_SEGMENTS;
}

export function parseSalaryRanks(settings) {
  try {
    if (settings.salary_ranks_json) {
      const parsed = JSON.parse(settings.salary_ranks_json);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_SALARY_RANKS;
}

export function parseWithdrawPresets(settings) {
  try {
    if (settings.withdraw_presets_json) {
      const parsed = JSON.parse(settings.withdraw_presets_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((n) => Number(n)).filter((n) => n > 0);
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_WITHDRAW_PRESETS;
}

export function computeQualifiedVipFromLevels(totalDeposits, levels) {
  let qualified = 0;
  for (const v of levels) {
    if (Number(totalDeposits || 0) >= Number(v.minDeposit || 0)) qualified = v.level;
  }
  return qualified;
}

export function buildPublicPlatformPayload(settings) {
  return {
    whatsappNumber: settings.whatsapp_number || '963990000000',
    liveTickerEnabled: settings.live_ticker_enabled !== 'false',
    announcements: parseAnnouncements(settings),
    vipLevels: parseVipLevels(settings),
    vaultPlans: parseVaultPlans(settings),
    salaryRanks: parseSalaryRanks(settings),
    withdrawPresets: parseWithdrawPresets(settings),
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

export async function createNotification(db, userId, title, body, type = 'info') {
  await db`
    INSERT INTO arona_boost.notifications (user_id, title, body, type, is_read)
    VALUES (${userId}, ${title}, ${body}, ${type}, 0)
  `;
}

export async function findUserByPhoneFlexible(db, rawPhone = '', countryCode = '') {
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
  const arr = Array.from(candidates).filter(Boolean);
  if (arr.length === 0) return null;
  const rows = await db`SELECT * FROM arona_boost.users WHERE phone IN ${db(arr)} ORDER BY id ASC LIMIT 1`;
  return rows[0] || null;
}

export async function getTodayStats(db, userId, vipLevel, levels) {
  const today = getTodayDateStr();
  const [row] = await db`
    SELECT COUNT(*)::int AS "completedCount", COALESCE(SUM(reward), 0)::float8 AS "todayEarnings"
    FROM arona_boost.task_completions
    WHERE user_id = ${userId} AND completed_date = ${today}
  `;
  const vipObj = levels.find((v) => v.level === vipLevel) || levels[0];
  return {
    todayCompletedCount: Number(row?.completedCount || 0),
    todayTaskEarnings: round2(row?.todayEarnings || 0),
    dailyTasksLimit: vipObj.dailyTasks,
    dailyProfitPotential: vipObj.dailyProfit
  };
}

export async function serializeUser(db, u, settingsArg = null) {
  if (!u) return null;
  const settings = settingsArg || (await getSettingsMap(db));
  const levels = parseVipLevels(settings);
  const qualifiedByDeposits = computeQualifiedVipFromLevels(u.total_deposits, levels);
  const effectiveVip = Math.max(u.vip_level || 0, qualifiedByDeposits);
  if (effectiveVip !== u.vip_level) {
    await db`UPDATE arona_boost.users SET vip_level = ${effectiveVip} WHERE id = ${u.id}`;
    u.vip_level = effectiveVip;
  }

  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const weekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const monthPrefix = getTodayDateStr().slice(0, 7);

  const [agg] = await db`
    SELECT
      (SELECT COALESCE(SUM(amount), 0)::float8 FROM arona_boost.vault_positions WHERE user_id = ${u.id} AND status = 'active') AS "lockedTotal",
      (SELECT COUNT(*)::int FROM arona_boost.vault_positions WHERE user_id = ${u.id} AND status = 'active') AS "activeCount",
      (
        (SELECT COALESCE(SUM(expected_profit), 0)::float8 FROM arona_boost.vault_positions WHERE user_id = ${u.id} AND status = 'claimed') +
        (SELECT COALESCE(SUM(reward_amount), 0)::float8 FROM arona_boost.wheel_spins_log WHERE user_id = ${u.id}) +
        (SELECT COALESCE(SUM(amount), 0)::float8 FROM arona_boost.red_envelope_claims WHERE user_id = ${u.id})
      ) AS "extraTotal",
      (SELECT COUNT(*)::int FROM arona_boost.notifications WHERE user_id = ${u.id} AND is_read = 0) AS "unreadCount",
      (SELECT COALESCE(SUM(CASE WHEN completed_date = ${yesterdayStr} THEN reward ELSE 0 END), 0)::float8 FROM arona_boost.task_completions WHERE user_id = ${u.id}) AS "yTask",
      (SELECT COALESCE(SUM(CASE WHEN completed_date >= ${weekAgoStr} THEN reward ELSE 0 END), 0)::float8 FROM arona_boost.task_completions WHERE user_id = ${u.id}) AS "wTask",
      (SELECT COALESCE(SUM(CASE WHEN substr(completed_date, 1, 7) = ${monthPrefix} THEN reward ELSE 0 END), 0)::float8 FROM arona_boost.task_completions WHERE user_id = ${u.id}) AS "mTask",
      (SELECT COALESCE(SUM(CASE WHEN substr(created_at, 1, 10) = ${yesterdayStr} THEN commission_amount ELSE 0 END), 0)::float8 FROM arona_boost.team_commissions WHERE beneficiary_id = ${u.id}) AS "yComm",
      (SELECT COALESCE(SUM(CASE WHEN substr(created_at, 1, 10) >= ${weekAgoStr} THEN commission_amount ELSE 0 END), 0)::float8 FROM arona_boost.team_commissions WHERE beneficiary_id = ${u.id}) AS "wComm",
      (SELECT COALESCE(SUM(CASE WHEN substr(created_at, 1, 7) = ${monthPrefix} THEN commission_amount ELSE 0 END), 0)::float8 FROM arona_boost.team_commissions WHERE beneficiary_id = ${u.id}) AS "mComm"
  `;

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
    totalCumulativeEarnings: round2(
      Number(u.total_task_earnings || 0) +
        Number(u.total_team_earnings || 0) +
        Number(agg?.extraTotal || 0)
    ),
    yesterdayEarnings: round2(Number(agg?.yTask || 0) + Number(agg?.yComm || 0)),
    thisWeekEarnings: round2(Number(agg?.wTask || 0) + Number(agg?.wComm || 0)),
    thisMonthEarnings: round2(Number(agg?.mTask || 0) + Number(agg?.mComm || 0)),
    vaultLockedBalance: round2(agg?.lockedTotal || 0),
    activeVaultCount: Number(agg?.activeCount || 0),
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
    unreadNotifications: Number(agg?.unreadCount || 0),
    isBanned: Boolean(u.is_banned),
    isAdmin: Boolean(u.is_admin),
    createdAt: u.created_at
  };
}

export async function applyApprovedDepositToUser(db, userId, amount, settings) {
  const [current] = await db`SELECT * FROM arona_boost.users WHERE id = ${userId}`;
  if (!current) return;
  const guarDays = Math.max(1, Math.round(Number(settings.guarantee_duration_days || 365)));
  const levels = parseVipLevels(settings);

  const newTotalDeposits = round2(current.total_deposits + amount);
  const qualifiedVip = computeQualifiedVipFromLevels(newTotalDeposits, levels);
  const newVip = Math.max(current.vip_level || 0, qualifiedVip);
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
    if (!guarStart) guarStart = nowUtcStr();
    guarExpires = nowUtcStr(guarDays * 86400000);
  }

  const nextJobTitle =
    current.job_title && current.job_title !== 'موظف متدرب'
      ? current.job_title
      : newVip > 0
      ? 'موظف رسمي'
      : 'موظف متدرب';

  await db`
    UPDATE arona_boost.users
    SET recharge_balance = ${nextRecharge},
        total_deposits = ${newTotalDeposits},
        vip_level = ${newVip},
        work_guarantee_amount = ${nextGuarantee},
        work_guarantee_start = ${guarStart},
        work_guarantee_expires = ${guarExpires},
        job_title = ${nextJobTitle}
    WHERE id = ${userId}
  `;
}

export async function distributeReferralCommissions(db, sourceUserId, depositAmount) {
  const rates = [
    { tier: 1, rate: 0.10, label: 'عمولة إيداع المستوى الأول (10%)' },
    { tier: 2, rate: 0.05, label: 'عمولة إيداع المستوى الثاني (5%)' },
    { tier: 3, rate: 0.02, label: 'عمولة إيداع المستوى الثالث (2%)' }
  ];
  let [currentUser] = await db`SELECT id, referred_by FROM arona_boost.users WHERE id = ${sourceUserId}`;
  for (const r of rates) {
    if (!currentUser || !currentUser.referred_by) break;
    const [upline] = await db`SELECT id, referred_by FROM arona_boost.users WHERE id = ${currentUser.referred_by}`;
    if (!upline) break;
    const comm = round2(depositAmount * r.rate);
    if (comm > 0) {
      await db`
        UPDATE arona_boost.users
        SET balance = ROUND((balance + ${comm})::numeric, 2)::float8,
            total_team_earnings = ROUND((total_team_earnings + ${comm})::numeric, 2)::float8
        WHERE id = ${upline.id}
      `;
      await db`
        INSERT INTO arona_boost.team_commissions (beneficiary_id, source_user_id, tier, base_amount, commission_amount, reason)
        VALUES (${upline.id}, ${sourceUserId}, ${r.tier}, ${depositAmount}, ${comm}, ${r.label})
      `;
      await createNotification(
        db,
        upline.id,
        `مكافأة عمولة فريق +$${comm.toFixed(2)} USDT`,
        `تمت إضافة ${comm.toFixed(2)} USDT إلى رصيدك كعمولة إحالة (المستوى ${r.tier === 1 ? 'A' : r.tier === 2 ? 'B' : 'C'}).`,
        'reward'
      );
    }
    currentUser = upline;
  }
}

export async function grantDepositWheelSpins(db, userId, depositAmount, settings) {
  const minDep = Number(settings.wheel_min_deposit || 20);
  if (Number(depositAmount) < minDep) return 0;

  await db`UPDATE arona_boost.users SET spin_credits = spin_credits + 1 WHERE id = ${userId}`;
  await createNotification(
    db,
    userId,
    'مكافأة عجلة الحظ 🎡 (+1 لفة مجانية)',
    `حصلت على لفة حظ مجانية في عجلة Arona Boost بمناسبة إيداعك بقيمة $${Number(depositAmount).toFixed(2)} USDT!`,
    'reward'
  );

  if (settings.wheel_referrer_spin !== 'false') {
    const [u] = await db`SELECT referred_by FROM arona_boost.users WHERE id = ${userId}`;
    if (u && u.referred_by) {
      await db`UPDATE arona_boost.users SET spin_credits = spin_credits + 1 WHERE id = ${u.referred_by}`;
      await createNotification(
        db,
        u.referred_by,
        'لفة حظ مجانية من نشاط فريقك 🎡',
        'حصلت على +1 لفة مجانية في عجلة الحظ بعد إتمام أحد أعضاء فريقك المباشرين لإيداع مؤهل!',
        'reward'
      );
    }
  }
  return 1;
}

export async function evaluateUserTeamMetricsServer(db, userId) {
  const tier1Raw = await db`
    SELECT id, phone, vip_level, total_deposits, created_at
    FROM arona_boost.users WHERE referred_by = ${userId} ORDER BY id DESC
  `;
  const tier1Ids = tier1Raw.map((u) => u.id);
  const tier2Raw =
    tier1Ids.length > 0
      ? await db`
          SELECT id, phone, vip_level, total_deposits, created_at
          FROM arona_boost.users WHERE referred_by IN ${db(tier1Ids)} ORDER BY id DESC
        `
      : [];
  const tier2Ids = tier2Raw.map((u) => u.id);
  const tier3Raw =
    tier2Ids.length > 0
      ? await db`
          SELECT id, phone, vip_level, total_deposits, created_at
          FROM arona_boost.users WHERE referred_by IN ${db(tier2Ids)} ORDER BY id DESC
        `
      : [];

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
    tier1Raw,
    tier2Raw,
    tier3Raw,
    periodMonth,
    activeDirect,
    totalActiveTeam,
    monthlyNewMembers,
    teamTotalDeposits,
    countVipAtLeast
  };
}
