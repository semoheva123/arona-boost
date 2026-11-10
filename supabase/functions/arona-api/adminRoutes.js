const bcrypt = {
  hashSync: (...a) => globalThis.__ARONA_DEPS.bcrypt.hashSync(...a),
  compareSync: (...a) => globalThis.__ARONA_DEPS.bcrypt.compareSync(...a)
};
import {
  round2,
  nowUtcStr,
  getTodayDateStr,
  validatePhoneNumber,
  validateCryptoWalletFormat,
  verifyTransactionOnChain
} from './helpers.js';

import {
  normalizeDigitsAndStrip,
  getSettingsMap,
  parseVipLevels,
  parseAnnouncements,
  parseVaultPlans,
  parseWheelSegments,
  parseSalaryRanks,
  parseWithdrawPresets,
  createNotification,
  findUserByPhoneFlexible,
  applyApprovedDepositToUser,
  distributeReferralCommissions,
  grantDepositWheelSpins
} from './dbOps.js';

export async function handleAdminRoutes({ sql, method, path, url, body, user }) {
  if (!path.startsWith('/api/admin/')) return null;
  if (!user || !user.is_admin) {
    return { status: 403, json: { error: 'غير مصرح بالوصول إلى لوحة الإدارة' } };
  }

  if (method === 'POST' && path === '/api/admin/validate-phone') {
    const rawPhone = String(body.phone || '');
    const countryCode = String(body.countryCode || 'LOCAL');
    const result = validatePhoneNumber(rawPhone, countryCode);
    const matchedUser = await findUserByPhoneFlexible(sql, rawPhone, countryCode);
    return {
      status: 200,
      json: {
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
      }
    };
  }

  if (method === 'GET' && path === '/api/admin/overview') {
    const settings = await getSettingsMap(sql);
    const search = String(url.searchParams.get('search') || '').trim();
    const txFilter = String(url.searchParams.get('txFilter') || 'all');
    const today = getTodayDateStr();

    const [totalsRows, todayExactRows, pendingRows] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS "totalUsers",
               COALESCE(SUM(CASE WHEN vip_level > 0 THEN 1 ELSE 0 END), 0)::int AS "paidVipUsers",
               COALESCE(SUM(balance), 0)::float8 AS "totalBalances",
               COALESCE(SUM(total_deposits), 0)::float8 AS "totalDeposits",
               COALESCE(SUM(total_withdrawals), 0)::float8 AS "totalWithdrawals"
        FROM arona_boost.users
      `,
      sql`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'completed' THEN amount ELSE 0 END), 0)::float8 AS "todayDeposits",
          COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'completed' THEN amount ELSE 0 END), 0)::float8 AS "todayWithdrawals"
        FROM arona_boost.transactions
        WHERE substr(created_at, 1, 10) = ${today}
      `,
      sql`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'pending' THEN 1 ELSE 0 END), 0)::int AS "pendingDepositsCount",
          COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'pending' THEN 1 ELSE 0 END), 0)::int AS "pendingWithdrawalsCount"
        FROM arona_boost.transactions
      `
    ]);

    const totals = totalsRows[0] || {};
    const todayExact = todayExactRows[0] || {};
    const pendingCounts = pendingRows[0] || {};

    let rawTransactions;
    if (txFilter === 'pending') {
      rawTransactions = await sql`
        SELECT t.id, t.type, t.amount, t.fee_amount AS "feeAmount", t.net_amount AS "netAmount",
               t.network, t.wallet_or_txid AS "walletOrTxid", t.reference_code AS "referenceCode",
               t.status, t.note, t.created_at AS "createdAt",
               t.chain_status AS "chainStatus", t.chain_details_json AS "chainDetailsJson",
               u.phone AS "userPhone", u.id AS "userId"
        FROM arona_boost.transactions t
        JOIN arona_boost.users u ON u.id = t.user_id
        WHERE t.status = 'pending'
        ORDER BY t.id DESC LIMIT 60
      `;
    } else if (txFilter === 'deposit' || txFilter === 'withdraw') {
      rawTransactions = await sql`
        SELECT t.id, t.type, t.amount, t.fee_amount AS "feeAmount", t.net_amount AS "netAmount",
               t.network, t.wallet_or_txid AS "walletOrTxid", t.reference_code AS "referenceCode",
               t.status, t.note, t.created_at AS "createdAt",
               t.chain_status AS "chainStatus", t.chain_details_json AS "chainDetailsJson",
               u.phone AS "userPhone", u.id AS "userId"
        FROM arona_boost.transactions t
        JOIN arona_boost.users u ON u.id = t.user_id
        WHERE t.type = ${txFilter}
        ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.id DESC LIMIT 60
      `;
    } else {
      rawTransactions = await sql`
        SELECT t.id, t.type, t.amount, t.fee_amount AS "feeAmount", t.net_amount AS "netAmount",
               t.network, t.wallet_or_txid AS "walletOrTxid", t.reference_code AS "referenceCode",
               t.status, t.note, t.created_at AS "createdAt",
               t.chain_status AS "chainStatus", t.chain_details_json AS "chainDetailsJson",
               u.phone AS "userPhone", u.id AS "userId"
        FROM arona_boost.transactions t
        JOIN arona_boost.users u ON u.id = t.user_id
        ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.id DESC LIMIT 60
      `;
    }

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
      return { ...rest, chainStatus: tx.chainStatus || 'unverified', chainDetails };
    });

    let users;
    if (search) {
      const likeTerm = `%${normalizeDigitsAndStrip(search)}%`;
      const inviteTerm = `%${search.toUpperCase()}%`;
      users = await sql`
        SELECT id, phone, invite_code AS "inviteCode", balance, recharge_balance AS "rechargeBalance",
               work_guarantee_amount AS "workGuaranteeAmount", job_title AS "jobTitle",
               spin_credits AS "spinCredits", total_deposits AS "totalDeposits",
               total_withdrawals AS "totalWithdrawals", vip_level AS "vipLevel",
               is_banned AS "isBanned", is_admin AS "isAdmin",
               (withdraw_pin_hash != '') AS "hasPin", created_at AS "createdAt"
        FROM arona_boost.users
        WHERE phone LIKE ${likeTerm} OR invite_code LIKE ${inviteTerm}
        ORDER BY id DESC LIMIT 40
      `;
    } else {
      users = await sql`
        SELECT id, phone, invite_code AS "inviteCode", balance, recharge_balance AS "rechargeBalance",
               work_guarantee_amount AS "workGuaranteeAmount", job_title AS "jobTitle",
               spin_credits AS "spinCredits", total_deposits AS "totalDeposits",
               total_withdrawals AS "totalWithdrawals", vip_level AS "vipLevel",
               is_banned AS "isBanned", is_admin AS "isAdmin",
               (withdraw_pin_hash != '') AS "hasPin", created_at AS "createdAt"
        FROM arona_boost.users
        ORDER BY id DESC LIMIT 40
      `;
    }

    const [notificationLogs, salaryClaims, promotionClaims, flashMissions] = await Promise.all([
      sql`
        SELECT id, scope, target_label AS "targetLabel", recipients_count AS "recipientsCount",
               title, body, type, created_at AS "createdAt"
        FROM arona_boost.admin_notification_logs
        ORDER BY id DESC LIMIT 25
      `,
      sql`
        SELECT sc.id, sc.user_id AS "userId", u.phone AS "userPhone", sc.rank_id AS "rankId",
               sc.rank_title AS "rankTitle", sc.amount, sc.period_month AS "periodMonth",
               sc.status, sc.stats_snapshot_json AS "statsJson", sc.created_at AS "createdAt"
        FROM arona_boost.salary_claims sc
        JOIN arona_boost.users u ON u.id = sc.user_id
        ORDER BY CASE WHEN sc.status = 'pending' THEN 0 ELSE 1 END, sc.id DESC LIMIT 30
      `,
      sql`
        SELECT pc.id, pc.user_id AS "userId", u.phone AS "userPhone", pc.rank_id AS "rankId",
               pc.rank_title AS "rankTitle", pc.bonus_amount AS "bonusAmount",
               pc.physical_gift AS "physicalGift", pc.status, pc.created_at AS "createdAt"
        FROM arona_boost.claimed_position_bonuses pc
        JOIN arona_boost.users u ON u.id = pc.user_id
        ORDER BY CASE WHEN pc.status = 'pending' THEN 0 ELSE 1 END, pc.id DESC LIMIT 30
      `,
      sql`
        SELECT id, title, location, category, description, image_url AS "imageUrl",
               reward, min_vip_level AS "minVipLevel", max_claims AS "maxClaims",
               claimed_count AS "claimedCount", is_active AS "isActive", expires_at AS "expiresAt"
        FROM arona_boost.flash_missions
        ORDER BY id DESC LIMIT 25
      `
    ]);

    return {
      status: 200,
      json: {
        settings,
        vipLevels: parseVipLevels(settings),
        vaultPlans: parseVaultPlans(settings),
        wheelSegments: parseWheelSegments(settings),
        salaryRanks: parseSalaryRanks(settings),
        withdrawPresets: parseWithdrawPresets(settings),
        flashMissions,
        salaryClaims,
        promotionClaims,
        announcements: parseAnnouncements(settings),
        notificationLogs,
        totals: {
          totalUsers: Number(totals.totalUsers || 0),
          paidVipUsers: Number(totals.paidVipUsers || 0),
          totalBalances: round2(totals.totalBalances),
          totalDeposits: round2(totals.totalDeposits),
          totalWithdrawals: round2(totals.totalWithdrawals),
          todayDeposits: round2(todayExact.todayDeposits),
          todayWithdrawals: round2(todayExact.todayWithdrawals),
          todayNetLiquidity: round2((todayExact.todayDeposits || 0) - (todayExact.todayWithdrawals || 0)),
          pendingDepositsCount: Number(pendingCounts.pendingDepositsCount || 0),
          pendingWithdrawalsCount: Number(pendingCounts.pendingWithdrawalsCount || 0),
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
      }
    };
  }

  if (method === 'PUT' && path === '/api/admin/settings') {
    if (body.trc20_address !== undefined) {
      const cleanTrc20 = String(body.trc20_address || '').trim();
      if (!validateCryptoWalletFormat(cleanTrc20, 'TRC20')) {
        return {
          status: 400,
          json: { error: 'عنوان محفظة TRC20 غير صحيح — يجب أن يبدأ بحرف T ويتكون من 34 محرفاً' }
        };
      }
      body.trc20_address = cleanTrc20;
    }
    if (body.bep20_address !== undefined) {
      const cleanBep20 = String(body.bep20_address || '').trim();
      if (!validateCryptoWalletFormat(cleanBep20, 'BEP20')) {
        return {
          status: 400,
          json: { error: 'عنوان محفظة BEP20 غير صحيح — يجب أن يبدأ بـ 0x ويتكون من 42 محرفاً' }
        };
      }
      body.bep20_address = cleanBep20;
    }

    const allowedKeys = [
      'trc20_address', 'bep20_address', 'auto_approve_deposits', 'auto_approve_withdrawals',
      'blockchain_auto_approve_verified', 'strict_blockchain_txid', 'txid_max_age_hours',
      'min_deposit', 'min_withdraw', 'daily_withdraw_limit',
      'withdraw_fee_percent', 'guarantee_duration_days', 'whatsapp_number', 'live_ticker_enabled',
      'wheel_min_deposit', 'wheel_referrer_spin', 'salary_system_enabled', 'salary_require_approval'
    ];

    await sql.begin(async (tx) => {
      const upsert = async (k, v) => {
        await tx`
          INSERT INTO arona_boost.settings (key, value)
          VALUES (${k}, ${String(v)})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;
      };
      for (const k of allowedKeys) {
        if (body[k] !== undefined) await upsert(k, body[k]);
      }
      if (Array.isArray(body.vipLevels)) {
        const sanitizedLevels = body.vipLevels.map((lvl) => {
          const minDep = Math.max(0, Number(lvl.minDeposit || 0));
          const tasks = Math.max(1, Math.round(Number(lvl.dailyTasks || 1)));
          const dailyProf = round2(Math.max(0, Number(lvl.dailyProfit || 0)));
          return {
            ...lvl,
            minDeposit: minDep,
            dailyTasks: tasks,
            dailyProfit: dailyProf,
            rewardPerTask: round2(dailyProf / tasks),
            monthlyProfit: round2(dailyProf * 30),
            dailyRate: lvl.level === 0 || minDep === 0 ? 'تجريبي' : `${round2((dailyProf / minDep) * 100)}%`
          };
        });
        await upsert('vip_levels_json', JSON.stringify(sanitizedLevels));
      }
      if (Array.isArray(body.announcements)) {
        const cleanAnn = body.announcements.map((a) => String(a).trim()).filter(Boolean);
        if (cleanAnn.length > 0) await upsert('announcements_json', JSON.stringify(cleanAnn));
      }
      if (Array.isArray(body.vaultPlans) && body.vaultPlans.length > 0) {
        const sanitizedVault = body.vaultPlans.map((p, idx) => {
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
        await upsert('vault_plans_json', JSON.stringify(sanitizedVault));
      }
      if (Array.isArray(body.wheelSegments) && body.wheelSegments.length >= 4) {
        const sanitizedWheel = body.wheelSegments.map((s, idx) => {
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
        await upsert('lucky_wheel_json', JSON.stringify(sanitizedWheel));
      }
      if (Array.isArray(body.salaryRanks) && body.salaryRanks.length > 0) {
        const sanitizedSalaries = body.salaryRanks.map((rk, idx) => ({
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
        await upsert('salary_ranks_json', JSON.stringify(sanitizedSalaries));
      }
      if (Array.isArray(body.withdrawPresets) && body.withdrawPresets.length > 0) {
        const cleanPresets = body.withdrawPresets.map((n) => Math.round(Number(n))).filter((n) => !isNaN(n) && n > 0);
        if (cleanPresets.length > 0) await upsert('withdraw_presets_json', JSON.stringify(cleanPresets));
      }
    });

    const settings = await getSettingsMap(sql);
    return {
      status: 200,
      json: {
        message: 'تم حفظ إعدادات المنصة والخطط بنجاح',
        settings,
        vipLevels: parseVipLevels(settings),
        announcements: parseAnnouncements(settings)
      }
    };
  }

  const txDecMatch = path.match(/^\/api\/admin\/transactions\/(\d+)\/decision$/);
  if (method === 'POST' && txDecMatch) {
    const txId = Number(txDecMatch[1]);
    const decision = body.decision;
    const adminNote = String(body.reason || '').trim();
    if (!['approve', 'reject'].includes(decision)) {
      return { status: 400, json: { error: 'قرار غير صالح' } };
    }
    const settings = await getSettingsMap(sql);
    try {
      await sql.begin(async (tx) => {
        const [txRow] = await tx`SELECT * FROM arona_boost.transactions WHERE id = ${txId} FOR UPDATE`;
        if (!txRow || txRow.status !== 'pending') throw new Error('NOT_PENDING');
        const [u] = await tx`SELECT * FROM arona_boost.users WHERE id = ${txRow.user_id} FOR UPDATE`;
        if (decision === 'approve') {
          const updatedNote = adminNote || (txRow.type === 'deposit' ? 'تمت الموافقة واعتماد الإيداع' : 'تمت الموافقة وتحويل السحب');
          await tx`UPDATE arona_boost.transactions SET status = 'completed', note = ${updatedNote} WHERE id = ${txId}`;
          if (txRow.type === 'deposit') {
            await applyApprovedDepositToUser(tx, u.id, txRow.amount, settings);
            await distributeReferralCommissions(tx, u.id, txRow.amount);
            await grantDepositWheelSpins(tx, u.id, txRow.amount, settings);
            await createNotification(
              tx,
              u.id,
              `تمت الموافقة على إيداعك +$${txRow.amount.toFixed(2)} USDT`,
              `تم التحقق من المعاملة (${txRow.reference_code}) وإضافة الرصيد إلى محفظتك.`,
              'success'
            );
          } else {
            const newWithdrawals = round2(u.total_withdrawals + txRow.amount);
            await tx`UPDATE arona_boost.users SET total_withdrawals = ${newWithdrawals} WHERE id = ${u.id}`;
            await createNotification(
              tx,
              u.id,
              `تم تحويل سحبك ($${txRow.amount.toFixed(2)} USDT)`,
              `تمت الموافقة على طلب السحب (${txRow.reference_code}) وإرسال المبلغ لمحفظتك.`,
              'success'
            );
          }
        } else {
          const rejNote = adminNote || 'تم رفض المعاملة من الإدارة';
          await tx`UPDATE arona_boost.transactions SET status = 'rejected', note = ${rejNote} WHERE id = ${txId}`;
          if (txRow.type === 'withdraw') {
            const refunded = round2(u.balance + txRow.amount);
            await tx`UPDATE arona_boost.users SET balance = ${refunded} WHERE id = ${u.id}`;
            await createNotification(
              tx,
              u.id,
              'تم رفض طلب السحب وإعادة الرصيد',
              `تم إلغاء طلب السحب (${txRow.reference_code}) وإعادة ${txRow.amount.toFixed(2)} USDT إلى رصيدك. السبب: ${rejNote}`,
              'warning'
            );
          } else {
            await createNotification(
              tx,
              u.id,
              'تعذر اعتماد طلب الإيداع',
              `لم تتم الموافقة على طلب الإيداع (${txRow.reference_code}). السبب: ${rejNote}`,
              'warning'
            );
          }
        }
      });
    } catch (e) {
      if (e.message === 'NOT_PENDING') return { status: 400, json: { error: 'المعاملة غير موجودة أو تمت معالجتها مسبقاً' } };
      throw e;
    }
    return { status: 200, json: { message: decision === 'approve' ? 'تمت الموافقة على المعاملة بنجاح' : 'تم رفض المعاملة' } };
  }

  const txChainMatch = path.match(/^\/api\/admin\/transactions\/(\d+)\/verify-chain$/);
  if (method === 'POST' && txChainMatch) {
    const txId = Number(txChainMatch[1]);
    const [txRow] = await sql`SELECT * FROM arona_boost.transactions WHERE id = ${txId}`;
    if (!txRow || txRow.type !== 'deposit') {
      return { status: 404, json: { error: 'معاملة الإيداع غير موجودة' } };
    }
    const settings = await getSettingsMap(sql);
    const expectedWallet = txRow.network === 'BEP20' ? settings.bep20_address : settings.trc20_address;
    const report = await verifyTransactionOnChain({
      txid: txRow.wallet_or_txid,
      network: txRow.network,
      expectedAmount: txRow.amount,
      expectedWallet
    });
    await sql`
      UPDATE arona_boost.transactions
      SET chain_status = ${report.statusBadge || 'unverified'}, chain_details_json = ${JSON.stringify(report)}
      WHERE id = ${txId}
    `;
    return { status: 200, json: { message: report.summaryAr, chainVerification: report } };
  }

  const salDecMatch = path.match(/^\/api\/admin\/salaries\/(\d+)\/decision$/);
  if (method === 'POST' && salDecMatch) {
    const claimId = Number(salDecMatch[1]);
    const decision = body.decision;
    if (!['approve', 'reject'].includes(decision)) return { status: 400, json: { error: 'قرار غير صالح' } };
    let amt = 0;
    try {
      await sql.begin(async (tx) => {
        const [claim] = await tx`SELECT * FROM arona_boost.salary_claims WHERE id = ${claimId} FOR UPDATE`;
        if (!claim || claim.status !== 'pending') throw new Error('NOT_PENDING');
        amt = round2(claim.amount);
        if (decision === 'approve') {
          await tx`UPDATE arona_boost.salary_claims SET status = 'approved', decided_at = ${nowUtcStr()} WHERE id = ${claimId}`;
          await tx`
            UPDATE arona_boost.users
            SET balance = ROUND((balance + ${amt})::numeric, 2)::float8,
                total_team_earnings = ROUND((total_team_earnings + ${amt})::numeric, 2)::float8
            WHERE id = ${claim.user_id}
          `;
          await createNotification(
            tx,
            claim.user_id,
            `اعتماد وصرف راتبك الشهري +$${amt.toFixed(2)} USDT 💼`,
            `تمت موافقة الإدارة على راتب رتبة "${claim.rank_title}" لشهر ${claim.period_month} وإضافته لرصيدك.`,
            'reward'
          );
        } else {
          await tx`UPDATE arona_boost.salary_claims SET status = 'rejected', decided_at = ${nowUtcStr()} WHERE id = ${claimId}`;
          await createNotification(
            tx,
            claim.user_id,
            `تحديث بشأن طلب راتب شهر ${claim.period_month}`,
            `تعذر اعتماد طلب راتب "${claim.rank_title}" حالياً. يرجى مراجعة شروط الرتبة أو التواصل مع الإدارة.`,
            'warning'
          );
        }
      });
    } catch (e) {
      if (e.message === 'NOT_PENDING') return { status: 400, json: { error: 'طلب الراتب غير موجود أو تمت معالجته مسبقاً' } };
      throw e;
    }
    return {
      status: 200,
      json: { message: decision === 'approve' ? `تم اعتماد وصرف الراتب الشهري ($${amt.toFixed(2)} USDT) بنجاح` : 'تم رفض طلب الراتب الشهري' }
    };
  }

  const promoDecMatch = path.match(/^\/api\/admin\/promotions\/(\d+)\/decision$/);
  if (method === 'POST' && promoDecMatch) {
    const claimId = Number(promoDecMatch[1]);
    const decision = body.decision;
    if (!['approve', 'reject'].includes(decision)) return { status: 400, json: { error: 'قرار غير صالح' } };
    let amt = 0;
    try {
      await sql.begin(async (tx) => {
        const [claim] = await tx`SELECT * FROM arona_boost.claimed_position_bonuses WHERE id = ${claimId} FOR UPDATE`;
        if (!claim || claim.status !== 'pending') throw new Error('NOT_PENDING');
        amt = round2(claim.bonus_amount);
        if (decision === 'approve') {
          await tx`UPDATE arona_boost.claimed_position_bonuses SET status = 'approved', decided_at = ${nowUtcStr()} WHERE id = ${claimId}`;
          await tx`
            UPDATE arona_boost.users
            SET balance = ROUND((balance + ${amt})::numeric, 2)::float8,
                total_team_earnings = ROUND((total_team_earnings + ${amt})::numeric, 2)::float8,
                job_title = ${claim.rank_title}
            WHERE id = ${claim.user_id}
          `;
          await createNotification(
            tx,
            claim.user_id,
            `اعتماد وصرف مكافأة ترقية منصب "${claim.rank_title}" +$${amt.toFixed(2)} USDT 🏆`,
            `تمت موافقة الإدارة على مكافأة الترقية ($${amt.toFixed(2)} USDT) وإضافة المبلغ إلى محفظة الدخل.`,
            'reward'
          );
        } else {
          await tx`UPDATE arona_boost.claimed_position_bonuses SET status = 'rejected', decided_at = ${nowUtcStr()} WHERE id = ${claimId}`;
          await createNotification(
            tx,
            claim.user_id,
            `تحديث بشأن طلب مكافأة ترقية "${claim.rank_title}"`,
            `تعذر اعتماد طلب مكافأة الترقية حالياً.`,
            'warning'
          );
        }
      });
    } catch (e) {
      if (e.message === 'NOT_PENDING') return { status: 400, json: { error: 'طلب مكافأة الترقية غير موجود أو تمت معالجته مسبقاً' } };
      throw e;
    }
    return {
      status: 200,
      json: { message: decision === 'approve' ? `تم اعتماد وصرف مكافأة الترقية ($${amt.toFixed(2)} USDT) بنجاح` : 'تم رفض طلب مكافأة الترقية' }
    };
  }

  if (method === 'POST' && path === '/api/admin/flash-missions') {
    const title = String(body.title || '').trim();
    const location = String(body.location || '').trim() || 'وجهة عالمية فاخرة';
    const description = String(body.description || '').trim() || 'مهمة تقييم سياحي مميزة بمقاعد محدودة وعائد معزز لأعضاء Arona Boost.';
    const reward = Math.max(0.1, round2(Number(body.reward || 2.0)));
    const minVipLevel = Math.min(6, Math.max(0, Math.round(Number(body.minVipLevel || 1))));
    const maxClaims = Math.max(1, Math.round(Number(body.maxClaims || 20)));
    const durationHours = Math.max(1, Math.round(Number(body.durationHours || 48)));
    const imgIdx = (Math.floor(Math.random() * 10) % 10) + 1;
    const imageUrl = String(body.imageUrl || `/destinations/dest-${imgIdx}.jpg`);
    if (title.length < 3) return { status: 400, json: { error: 'يرجى إدخال اسم واضح للمهمة السياحية المميزة' } };

    await sql`
      INSERT INTO arona_boost.flash_missions (
        title, location, category, description, image_url,
        reward, min_vip_level, max_claims, claimed_count, is_active, expires_at
      ) VALUES (
        ${title}, ${location}, 'مهمة أرونا استثنائية محدودة', ${description}, ${imageUrl},
        ${reward}, ${minVipLevel}, ${maxClaims}, 0, 1, ${nowUtcStr(durationHours * 3600000)}
      )
    `;
    return { status: 201, json: { message: `تم إطلاق المهمة السياحية المحدودة "${title}" بنجاح!` } };
  }

  const delFlashMatch = path.match(/^\/api\/admin\/flash-missions\/(\d+)$/);
  if (method === 'DELETE' && delFlashMatch) {
    await sql`UPDATE arona_boost.flash_missions SET is_active = 0 WHERE id = ${Number(delFlashMatch[1])}`;
    return { status: 200, json: { message: 'تم إيقاف/أرشفة المهمة السياحية المميزة بنجاح' } };
  }

  const manageUserMatch = path.match(/^\/api\/admin\/users\/(\d+)\/manage$/);
  if (method === 'POST' && manageUserMatch) {
    const targetId = Number(manageUserMatch[1]);
    const action = String(body.action || '');
    const [targetUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${targetId}`;
    if (!targetUser) return { status: 404, json: { error: 'المستخدم غير موجود' } };

    if (action === 'adjust_balance') {
      const delta = round2(Number(body.delta || 0));
      const note = String(body.note || '').trim() || 'تعديل رصيد إداري';
      if (!delta || isNaN(delta)) return { status: 400, json: { error: 'يرجى إدخال قيمة موجبة للشحن أو سالبة للخصم' } };
      const newBal = round2(Math.max(0, targetUser.balance + delta));
      await sql`UPDATE arona_boost.users SET balance = ${newBal} WHERE id = ${targetId}`;
      await createNotification(
        sql,
        targetId,
        delta > 0 ? `إضافة رصيد إداري +$${delta.toFixed(2)} USDT` : `خصم رصيد إداري -$${Math.abs(delta).toFixed(2)} USDT`,
        `${note} • رصيدك الحالي الآن $${newBal.toFixed(2)} USDT.`,
        delta > 0 ? 'reward' : 'warning'
      );
      return { status: 200, json: { message: `تم تعديل رصيد العضو إلى $${newBal.toFixed(2)} USDT` } };
    }
    if (action === 'set_vip') {
      const vipLevel = Math.min(6, Math.max(0, Math.round(Number(body.vipLevel || 0))));
      const nextJob = targetUser.job_title && targetUser.job_title !== 'موظف متدرب' ? targetUser.job_title : vipLevel > 0 ? 'موظف رسمي' : 'موظف متدرب';
      await sql`UPDATE arona_boost.users SET vip_level = ${vipLevel}, job_title = ${nextJob} WHERE id = ${targetId}`;
      await createNotification(sql, targetId, `تحديث درجة العقد إلى الفئة A${vipLevel}`, `قامت الإدارة بتحديث درجتك الوظيفية المعتمدة إلى الفئة A${vipLevel}.`, 'info');
      return { status: 200, json: { message: `تم تحديث درجة العضو إلى الفئة A${vipLevel}` } };
    }
    if (action === 'adjust_recharge') {
      const delta = round2(Number(body.amount || 0));
      if (!delta || isNaN(delta)) return { status: 400, json: { error: 'يرجى إدخال مبلغ صحيح لتعديل رصيد الشحن' } };
      const nextRec = Math.max(0, round2(Number(targetUser.recharge_balance || 0) + delta));
      await sql`UPDATE arona_boost.users SET recharge_balance = ${nextRec} WHERE id = ${targetId}`;
      await createNotification(
        sql,
        targetId,
        delta > 0 ? `إضافة رصيد شحن +$${delta.toFixed(2)} USDT` : `تعديل رصيد الشحن $${delta.toFixed(2)} USDT`,
        `أصبح رصيد الشحن الخاص بك الآن $${nextRec.toFixed(2)} USDT.`,
        delta > 0 ? 'reward' : 'info'
      );
      return { status: 200, json: { message: `تم تعديل رصيد الشحن للعضو إلى $${nextRec.toFixed(2)} USDT` } };
    }
    if (action === 'set_job_title') {
      const title = String(body.jobTitle || '').trim();
      if (!title) return { status: 400, json: { error: 'يرجى إدخال المسمى الوظيفي' } };
      await sql`UPDATE arona_boost.users SET job_title = ${title} WHERE id = ${targetId}`;
      await createNotification(sql, targetId, `تحديث المنصب الوظيفي إلى "${title}"`, `تم اعتماد منصبك الرسمي في Arona Boost كـ "${title}".`, 'reward');
      return { status: 200, json: { message: `تم تحديث منصب العضو إلى "${title}"` } };
    }
    if (action === 'adjust_spins') {
      const spinsDelta = Math.round(Number(body.spins || 0));
      if (!spinsDelta || isNaN(spinsDelta)) return { status: 400, json: { error: 'يرجى إدخال عدد لفات صحيح' } };
      const nextSpins = Math.max(0, Number(targetUser.spin_credits || 0) + spinsDelta);
      await sql`UPDATE arona_boost.users SET spin_credits = ${nextSpins} WHERE id = ${targetId}`;
      if (spinsDelta > 0) {
        await createNotification(sql, targetId, `هدية لفات عجلة الحظ (+${spinsDelta} لفة) 🎡`, `منحتك إدارة Arona Boost عدد ${spinsDelta} لفات مجانية في عجلة الحظ!`, 'reward');
      }
      return { status: 200, json: { message: `أصبح رصيد لفات العضو الآن ${nextSpins} لفة` } };
    }
    if (action === 'toggle_ban') {
      if (targetUser.is_admin) return { status: 400, json: { error: 'لا يمكن حظر حساب مدير النظام' } };
      const nextBan = targetUser.is_banned ? 0 : 1;
      await sql`UPDATE arona_boost.users SET is_banned = ${nextBan} WHERE id = ${targetId}`;
      return { status: 200, json: { message: nextBan ? 'تم تجميد حساب العضو' : 'تم إلغاء تجميد حساب العضو' } };
    }
    if (action === 'reset_password') {
      const newPass = String(body.newPassword || '').trim();
      if (newPass.length < 4) return { status: 400, json: { error: 'كلمة المرور الجديدة يجب أن لا تقل عن 4 محارف' } };
      await sql`UPDATE arona_boost.users SET password_hash = ${bcrypt.hashSync(newPass, 10)} WHERE id = ${targetId}`;
      return { status: 200, json: { message: 'تم إعادة تعيين كلمة مرور العضو بنجاح' } };
    }
    if (action === 'reset_pin') {
      const newPin = normalizeDigitsAndStrip(body.newPin || '');
      if (!/^\d{4,6}$/.test(newPin)) return { status: 400, json: { error: 'رمز PIN الجديد يجب أن يتكون من 4 إلى 6 أرقام' } };
      await sql`UPDATE arona_boost.users SET withdraw_pin_hash = ${bcrypt.hashSync(newPin, 10)} WHERE id = ${targetId}`;
      await createNotification(sql, targetId, 'إعادة تعيين رمز السحب المالي PIN', 'تم إعادة تعيين رمز الحماية المالي الخاص بحسابك بناءً على طلبك.', 'info');
      return { status: 200, json: { message: 'تم إعادة تعيين رمز PIN للعضو بنجاح' } };
    }
    if (action === 'send_notification') {
      const title = String(body.title || '').trim();
      const nBody = String(body.body || '').trim();
      const notifType = ['info', 'reward', 'success', 'warning'].includes(body.type) ? body.type : 'info';
      if (title.length < 2 || nBody.length < 2) return { status: 400, json: { error: 'يرجى كتابة عنوان ونص الإشعار قبل الإرسال' } };
      await createNotification(sql, targetId, title, nBody, notifType);
      await sql`
        INSERT INTO arona_boost.admin_notification_logs (scope, target_label, recipients_count, title, body, type)
        VALUES ('private', ${targetUser.phone}, 1, ${title}, ${nBody}, ${notifType})
      `;
      return { status: 200, json: { message: `تم إرسال الإشعار الخاص إلى العضو (${targetUser.phone}) بنجاح` } };
    }
    return { status: 400, json: { error: 'إجراء إداري غير معروف' } };
  }

  if (method === 'POST' && path === '/api/admin/notifications/send') {
    const scope = body.scope === 'private' ? 'private' : 'broadcast';
    const title = String(body.title || '').trim().slice(0, 140);
    const nBody = String(body.body || '').trim().slice(0, 600);
    const notifType = ['info', 'reward', 'success', 'warning'].includes(body.type) ? body.type : 'info';
    if (title.length < 2 || nBody.length < 2) {
      return { status: 400, json: { error: 'يرجى إدخال عنوان ونص واضح للإشعار' } };
    }
    if (scope === 'broadcast') {
      const count = await sql.begin(async (tx) => {
        const inserted = await tx`
          INSERT INTO arona_boost.notifications (user_id, title, body, type, is_read)
          SELECT id, ${title}, ${nBody}, ${notifType}, 0 FROM arona_boost.users
          RETURNING id
        `;
        await tx`
          INSERT INTO arona_boost.admin_notification_logs (scope, target_label, recipients_count, title, body, type)
          VALUES ('broadcast', 'جميع الأعضاء', ${inserted.length}, ${title}, ${nBody}, ${notifType})
        `;
        return inserted.length;
      });
      return {
        status: 200,
        json: { message: `تم إرسال الإشعار الجماعي بنجاح إلى جميع الأعضاء (${count} عضو)`, recipientsCount: count }
      };
    }

    const rawTarget = String(body.target || '').trim();
    if (!rawTarget) {
      return { status: 400, json: { error: 'يرجى تحديد رقم هاتف العضو أو رمز دعوته لإرسال الإشعار الخاص' } };
    }
    let targetUser = null;
    if (body.userId) {
      const [u] = await sql`SELECT * FROM arona_boost.users WHERE id = ${Number(body.userId)}`;
      targetUser = u || null;
    }
    if (!targetUser && /^#?\d+$/.test(rawTarget)) {
      const numVal = Number(rawTarget.replace('#', ''));
      if (rawTarget.startsWith('#') && numVal > 1000) {
        const [u] = await sql`SELECT * FROM arona_boost.users WHERE id = ${numVal - 1000}`;
        targetUser = u || null;
      }
    }
    if (!targetUser) targetUser = await findUserByPhoneFlexible(sql, rawTarget, '');
    if (!targetUser) {
      const [u] = await sql`SELECT * FROM arona_boost.users WHERE UPPER(invite_code) = ${rawTarget.toUpperCase()} LIMIT 1`;
      targetUser = u || null;
    }
    if (!targetUser) {
      const digits = normalizeDigitsAndStrip(rawTarget);
      if (digits.length >= 5) {
        const [u] = await sql`SELECT * FROM arona_boost.users WHERE phone LIKE ${`%${digits}%`} ORDER BY id ASC LIMIT 1`;
        targetUser = u || null;
      }
    }
    if (!targetUser) {
      return { status: 404, json: { error: 'لم يتم العثور على عضو مطابق لرقم الهاتف أو رمز الدعوة المدخل' } };
    }
    await createNotification(sql, targetUser.id, title, nBody, notifType);
    await sql`
      INSERT INTO arona_boost.admin_notification_logs (scope, target_label, recipients_count, title, body, type)
      VALUES ('private', ${targetUser.phone}, 1, ${title}, ${nBody}, ${notifType})
    `;
    return {
      status: 200,
      json: { message: `تم إرسال الإشعار الخاص بنجاح إلى العضو (${targetUser.phone})`, recipientsCount: 1, targetPhone: targetUser.phone }
    };
  }

  if (method === 'GET' && path === '/api/admin/support') {
    const statusFilter = String(url.searchParams.get('status') || 'all');
    const rows = ['open', 'answered', 'closed'].includes(statusFilter)
      ? await sql`
          SELECT st.id, st.user_id AS "userId", st.ticket_code AS "ticketCode", st.subject,
                 st.category, st.priority, st.status, st.created_at AS "createdAt", st.updated_at AS "updatedAt",
                 u.phone, u.vip_level AS "vipLevel", u.job_title AS "jobTitle"
          FROM arona_boost.support_tickets st
          JOIN arona_boost.users u ON u.id = st.user_id
          WHERE st.status = ${statusFilter}
          ORDER BY CASE WHEN st.priority = 'vip' THEN 0 ELSE 1 END, st.updated_at DESC LIMIT 60
        `
      : await sql`
          SELECT st.id, st.user_id AS "userId", st.ticket_code AS "ticketCode", st.subject,
                 st.category, st.priority, st.status, st.created_at AS "createdAt", st.updated_at AS "updatedAt",
                 u.phone, u.vip_level AS "vipLevel", u.job_title AS "jobTitle"
          FROM arona_boost.support_tickets st
          JOIN arona_boost.users u ON u.id = st.user_id
          ORDER BY CASE WHEN st.status = 'open' THEN 0 ELSE 1 END,
                   CASE WHEN st.priority = 'vip' THEN 0 ELSE 1 END,
                   st.updated_at DESC LIMIT 60
        `;
    const ticketIds = rows.map((r) => r.id);
    const msgs =
      ticketIds.length > 0
        ? await sql`
            SELECT id, ticket_id, sender_role AS "senderRole", body, created_at AS "createdAt"
            FROM arona_boost.support_messages
            WHERE ticket_id IN ${sql(ticketIds)}
            ORDER BY id ASC
          `
        : [];
    const msgMap = new Map();
    for (const m of msgs) {
      if (!msgMap.has(m.ticket_id)) msgMap.set(m.ticket_id, []);
      msgMap.get(m.ticket_id).push({ id: m.id, senderRole: m.senderRole, body: m.body, createdAt: m.createdAt });
    }
    return { status: 200, json: { tickets: rows.map((r) => ({ ...r, messages: msgMap.get(r.id) || [] })) } };
  }

  const adminReplyMatch = path.match(/^\/api\/admin\/support\/(\d+)\/reply$/);
  if (method === 'POST' && adminReplyMatch) {
    const ticketId = Number(adminReplyMatch[1]);
    const rBody = String(body.message || '').trim().slice(0, 1200);
    if (rBody.length < 2) return { status: 400, json: { error: 'يرجى كتابة نص الرد الرسمي قبل الإرسال' } };
    const [ticket] = await sql`SELECT * FROM arona_boost.support_tickets WHERE id = ${ticketId}`;
    if (!ticket) return { status: 404, json: { error: 'التذكرة غير موجودة' } };
    await sql.begin(async (tx) => {
      await tx`INSERT INTO arona_boost.support_messages (ticket_id, sender_role, body) VALUES (${ticketId}, 'admin', ${rBody})`;
      await tx`UPDATE arona_boost.support_tickets SET status = 'answered', updated_at = ${nowUtcStr()} WHERE id = ${ticketId}`;
      await createNotification(tx, ticket.user_id, `رد رسمي من مكتب المساندة (${ticket.ticket_code})`, rBody.slice(0, 160), 'info');
    });
    return { status: 200, json: { message: `تم إرسال الرد الرسمي إلى العضو (${ticket.ticket_code})` } };
  }

  const adminCloseMatch = path.match(/^\/api\/admin\/support\/(\d+)\/close$/);
  if (method === 'POST' && adminCloseMatch) {
    await sql`UPDATE arona_boost.support_tickets SET status = 'closed', updated_at = ${nowUtcStr()} WHERE id = ${Number(adminCloseMatch[1])}`;
    return { status: 200, json: { message: 'تم إغلاق التذكرة وأرشفتها بنجاح' } };
  }

  if (method === 'GET' && path === '/api/admin/red-envelopes') {
    const envelopes = await sql`
      SELECT id, code, title, reward_amount AS "rewardAmount",
             max_claims AS "maxClaims", claimed_count AS "claimedCount",
             min_vip AS "minVip", is_active AS "isActive", created_at AS "createdAt"
      FROM arona_boost.red_envelopes
      ORDER BY id DESC
    `;
    return { status: 200, json: { envelopes } };
  }

  if (method === 'POST' && path === '/api/admin/red-envelopes') {
    const code = String(body?.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const title = String(body?.title || 'مكافأة الظرف الأحمر الرسمية').trim();
    const rewardAmount = round2(Math.max(0.1, Number(body?.rewardAmount || 1)));
    const maxClaims = Math.max(1, Math.round(Number(body?.maxClaims || 50)));
    const minVip = Math.max(0, Math.min(6, Math.round(Number(body?.minVip || 0))));
    if (code.length < 4) {
      return { status: 400, json: { error: 'يرجى إدخال رمز ظرف أحمر من 4 أحرف/أرقام على الأقل' } };
    }
    try {
      await sql`
        INSERT INTO arona_boost.red_envelopes (code, title, reward_amount, max_claims, min_vip, is_active)
        VALUES (${code}, ${title}, ${rewardAmount}, ${maxClaims}, ${minVip}, 1)
      `;
    } catch (e) {
      if (String(e.message || '').toLowerCase().includes('unique') || e.code === '23505') {
        return { status: 409, json: { error: 'هذا الرمز مستخدم مسبقاً، اختر رمزاً جديداً' } };
      }
      throw e;
    }
    return { status: 201, json: { message: `تم إنشاء كود الظرف الأحمر (${code}) بنجاح` } };
  }

  const delEnvMatch = path.match(/^\/api\/admin\/red-envelopes\/(\d+)$/);
  if (method === 'DELETE' && delEnvMatch) {
    await sql`DELETE FROM arona_boost.red_envelopes WHERE id = ${Number(delEnvMatch[1])}`;
    return { status: 200, json: { message: 'تم حذف رمز الظرف الأحمر' } };
  }

  if (method === 'POST' && path === '/api/admin/welcome-popup') {
    const enabled = body?.enabled ? '1' : '0';
    const title = String(body?.title || 'إشعار الموظفين الرسمي — Arona Boost').trim();
    const pBody = String(body?.body || '').trim();
    await sql.begin(async (tx) => {
      for (const [k, v] of [
        ['welcome_popup_enabled', enabled],
        ['welcome_popup_title', title],
        ['welcome_popup_body', pBody]
      ]) {
        await tx`
          INSERT INTO arona_boost.settings (key, value) VALUES (${k}, ${v})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;
      }
    });
    return { status: 200, json: { message: 'تم تحديث نافذة إشعار الموظفين الترحيبية بنجاح' } };
  }

  return { status: 404, json: { error: 'المسار الإداري غير موجود' } };
}
