const bcrypt = {
  hashSync: (...a) => globalThis.__ARONA_DEPS.bcrypt.hashSync(...a),
  compareSync: (...a) => globalThis.__ARONA_DEPS.bcrypt.compareSync(...a)
};
import {
  round2,
  nowUtcStr,
  getTodayDateStr,
  validatePhoneNumber,
  makeQrDataUri,
  signJwt,
  extractTxHash64,
  verifyTransactionOnChain,
  TEAM_MILESTONES,
  TASK_CATALOG,
  TOURISM_POOL,
  getDynamicDestinationsForSlots,
  getFeaturedDestinationsShowcase,
  proxyWikimediaImageEdge
} from './helpers.js';

import {
  normalizeDigitsAndStrip,
  maskPhone,
  generateRefCode,
  generateInviteCode,
  getSettingsMap,
  parseVipLevels,
  parseVaultPlans,
  parseWheelSegments,
  parseSalaryRanks,
  buildPublicPlatformPayload,
  createNotification,
  findUserByPhoneFlexible,
  getTodayStats,
  serializeUser,
  applyApprovedDepositToUser,
  distributeReferralCommissions,
  grantDepositWheelSpins,
  evaluateUserTeamMetricsServer
} from './dbOps.js';

export async function handleUserRoutes({ sql, method, path, url, body, user, tokenSig, jwtSecret }) {
  // ---- PUBLIC ROUTES ----

  if (method === 'GET' && path === '/api/live-image') {
    return proxyWikimediaImageEdge(url.searchParams.get('u') || '');
  }

  if (method === 'GET' && path === '/api/public-config') {
    const settings = await getSettingsMap(sql);
    return { status: 200, json: buildPublicPlatformPayload(settings) };
  }

  if (method === 'GET' && path === '/api/live-activity') {
    const settings = await getSettingsMap(sql);
    if (settings.live_ticker_enabled === 'false') {
      return { status: 200, json: { enabled: false, items: [] } };
    }
    const realItems = [];
    const recentTx = await sql`
      SELECT t.id, t.type, t.amount, t.network, u.phone
      FROM arona_boost.transactions t
      JOIN arona_boost.users u ON u.id = t.user_id
      WHERE t.status = 'completed'
      ORDER BY t.id DESC LIMIT 5
    `;
    recentTx.forEach((tx, idx) => {
      const mPhone = maskPhone(tx.phone);
      realItems.push(
        tx.type === 'withdraw'
          ? {
              id: `tx-w-${tx.id}`,
              kind: 'withdraw',
              member: mPhone,
              text: `أتم سحب أرباح عبر ${tx.network}`,
              amountText: `$${round2(tx.amount).toFixed(2)} USDT`,
              timeLabel: idx === 0 ? 'الآن' : `منذ ${idx * 2 + 1} د`
            }
          : {
              id: `tx-d-${tx.id}`,
              kind: 'deposit',
              member: mPhone,
              text: `فعّل رصيد محفظته عبر ${tx.network}`,
              amountText: `+$${round2(tx.amount).toFixed(2)} USDT`,
              timeLabel: `منذ ${idx * 3 + 2} د`
            }
      );
    });

    const recentTasks = await sql`
      SELECT tc.id, tc.reward, tc.vip_level, u.phone
      FROM arona_boost.task_completions tc
      JOIN arona_boost.users u ON u.id = tc.user_id
      ORDER BY tc.id DESC LIMIT 3
    `;
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
      { kind: 'commission', member: '+961***408', text: 'استلم عائد محفظة استثمر مع أرونا', amountText: '+$16.80 USDT' }
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
    const combined = [];
    const maxLen = Math.max(realItems.length, rotatedSynthetic.length);
    for (let i = 0; i < maxLen && combined.length < 14; i++) {
      if (i < rotatedSynthetic.length) combined.push(rotatedSynthetic[i]);
      if (i < realItems.length && combined.length < 14) combined.push(realItems[i]);
    }
    return { status: 200, json: { enabled: true, items: combined } };
  }

  if (method === 'POST' && path === '/api/validate-phone') {
    return { status: 200, json: validatePhoneNumber(body.phone, body.countryCode || '+963') };
  }

  const refMatch = path.match(/^\/api\/public\/referrer\/([^/]+)$/);
  if (method === 'GET' && refMatch) {
    const code = decodeURIComponent(refMatch[1] || '').trim().toUpperCase();
    if (!code || code.length < 3) return { status: 200, json: { valid: false } };
    const [inviter] = await sql`
      SELECT id, phone, invite_code, vip_level, job_title, created_at
      FROM arona_boost.users WHERE invite_code = ${code} LIMIT 1
    `;
    if (!inviter) return { status: 200, json: { valid: false } };
    const settings = await getSettingsMap(sql);
    const levels = parseVipLevels(settings);
    const vipObj = levels.find((v) => v.level === (inviter.vip_level || 0)) || levels[0];
    const effectiveTitle =
      inviter.job_title && inviter.job_title.trim()
        ? inviter.job_title.trim()
        : (inviter.vip_level || 0) > 0
        ? 'موظف رسمي'
        : 'مقيّم معتمد';
    return {
      status: 200,
      json: {
        valid: true,
        inviteCode: inviter.invite_code,
        memberSerial: 1000 + inviter.id,
        maskedPhone: maskPhone(inviter.phone),
        vipLevel: inviter.vip_level || 0,
        gradeName: vipObj.name || `الفئة A${inviter.vip_level || 0}`,
        gradeTitle: vipObj.title || effectiveTitle,
        jobTitle: effectiveTitle
      }
    };
  }

  if (method === 'GET' && path === '/api/transparency-metrics') {
    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM arona_boost.task_completions) AS "realReports",
        (SELECT COUNT(*)::int FROM arona_boost.transactions WHERE status = 'completed') AS "realTx"
    `;
    const regionalHubs = [
      { id: 'dxb', codePrefix: '#DXB', city: 'دبي', country: 'الإمارات العربية المتحدة', x: 68, y: 56, contractedHotels: 42, activeContractsToday: 184, avgRating: 4.94, flagship: 'فنادق ومنتجعات نخلة جميرا وبوليفارد دبي' },
      { id: 'ruh', codePrefix: '#RUH', city: 'الرياض والعُلا', country: 'المملكة العربية السعودية', x: 61, y: 58, contractedHotels: 31, activeContractsToday: 138, avgRating: 4.92, flagship: 'منتجعات العُلا التراثية وفنادق الأعمال بالرياض' },
      { id: 'amm', codePrefix: '#AMM', city: 'عمّان والبتراء', country: 'المملكة الأردنية الهاشمية', x: 54, y: 48, contractedHotels: 24, activeContractsToday: 96, avgRating: 4.89, flagship: 'منشآت الضيافة في البحر الميت والبتراء وعمّان' },
      { id: 'ist', codePrefix: '#IST', city: 'إسطنبول', country: 'الجمهورية التركية', x: 51, y: 34, contractedHotels: 38, activeContractsToday: 162, avgRating: 4.91, flagship: 'فنادق مضيق البوسفور والسلطان أحمد التاريخية' },
      { id: 'cai', codePrefix: '#CAI', city: 'القاهرة وشرم الشيخ', country: 'جمهورية مصر العربية', x: 49, y: 55, contractedHotels: 29, activeContractsToday: 121, avgRating: 4.88, flagship: 'فنادق إطلالة النيل ومنتجعات البحر الأحمر' },
      { id: 'vce', codePrefix: '#VCE', city: 'البندقية', country: 'إيطاليا', x: 36, y: 30, contractedHotels: 19, activeContractsToday: 74, avgRating: 4.93, flagship: 'الأجنحة الكلاسيكية المطلة على القناة الكبرى' },
      { id: 'zrh', codePrefix: '#ZRH', city: 'زيورخ وإنترلاكن', country: 'سويسرا', x: 32, y: 25, contractedHotels: 16, activeContractsToday: 68, avgRating: 4.96, flagship: 'منتجعات جبال الألب السويسرية المصنفة 5 نجوم' }
    ];
    return {
      status: 200,
      json: {
        avgSettlementMinutes: 4.2,
        blockchainAuditRatePct: 99.8,
        totalHospitalityReports: 14820 + Number(counts?.realReports || 0),
        totalSettledVouchers: 6390 + Number(counts?.realTx || 0),
        contractedHotelsTotal: regionalHubs.reduce((s, h) => s + h.contractedHotels, 0),
        regionalHubs
      }
    };
  }

  // ---- AUTH ROUTES ----

  if (method === 'POST' && path === '/api/auth/register') {
    const phoneCheck = validatePhoneNumber(body.phone, body.countryCode || '+963');
    const password = String(body.password || '');
    const inviteCode = String(body.inviteCode || '').trim().toUpperCase();
    if (!phoneCheck.valid) {
      return {
        status: 400,
        json: {
          error: phoneCheck.error || 'رقم الهاتف المدخل غير صحيح أو غير مطابق لشبكات الاتصالات المعتمدة',
          phoneValidation: phoneCheck
        }
      };
    }
    const phone = phoneCheck.e164;
    if (password.length < 4) {
      return { status: 400, json: { error: 'يجب أن تتكون كلمة المرور من 4 أحرف أو أرقام على الأقل' } };
    }
    const existing = await findUserByPhoneFlexible(sql, body.phone, body.countryCode);
    if (existing) {
      return { status: 409, json: { error: 'رقم الهاتف مسجل مسبقاً، يرجى تسجيل الدخول' } };
    }
    let referredById = null;
    if (inviteCode) {
      const [inviter] = await sql`SELECT id FROM arona_boost.users WHERE invite_code = ${inviteCode} LIMIT 1`;
      if (inviter) referredById = inviter.id;
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const newInviteCode = await generateInviteCode(sql);
    const [created] = await sql`
      INSERT INTO arona_boost.users (phone, password_hash, invite_code, referred_by, vip_level, job_title)
      VALUES (${phone}, ${passwordHash}, ${newInviteCode}, ${referredById}, 0, 'موظف متدرب')
      RETURNING *
    `;
    await createNotification(
      sql,
      created.id,
      'أهلاً بك في منصة Arona Boost!',
      'تم تفعيل حسابك بنجاح ضمن الفئة التمهيدية A0. يمكنك إعداد رمز السحب المالي PIN من تبويب حسابي.',
      'success'
    );
    if (referredById) {
      await createNotification(
        sql,
        referredById,
        'انضم عضو جديد إلى فريقك!',
        `انضم عضو جديد (${maskPhone(phone)}) عبر رمز دعوتك بنجاح.`,
        'info'
      );
    }
    const settings = await getSettingsMap(sql);
    const levels = parseVipLevels(settings);
    const serialized = await serializeUser(sql, created, settings);
    const token = await signJwt({ userId: created.id }, jwtSecret, 30);
    return {
      status: 201,
      json: {
        token,
        user: serialized,
        todayStats: await getTodayStats(sql, created.id, serialized.vipLevel, levels),
        ...buildPublicPlatformPayload(settings)
      }
    };
  }

  if (method === 'POST' && path === '/api/auth/login') {
    const password = String(body.password || '');
    if (!body.phone || !password) {
      return { status: 400, json: { error: 'يرجى إدخال رقم الهاتف وكلمة المرور' } };
    }
    const found = await findUserByPhoneFlexible(sql, body.phone, body.countryCode);
    if (!found) {
      return { status: 401, json: { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' } };
    }
    if (found.is_banned && !found.is_admin) {
      return { status: 403, json: { error: 'هذا الحساب موقوف مؤقتاً من الإدارة، يرجى التواصل مع الدعم عبر واتساب' } };
    }
    if (!bcrypt.compareSync(password, found.password_hash)) {
      return { status: 401, json: { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' } };
    }
    const settings = await getSettingsMap(sql);
    const levels = parseVipLevels(settings);
    const serialized = await serializeUser(sql, found, settings);
    const token = await signJwt({ userId: found.id }, jwtSecret, 30);
    return {
      status: 200,
      json: {
        token,
        user: serialized,
        todayStats: await getTodayStats(sql, found.id, serialized.vipLevel, levels),
        ...buildPublicPlatformPayload(settings)
      }
    };
  }

  // ---- PROTECTED USER ROUTES ----
  if (!user) return null;

  if (method === 'GET' && path === '/api/me') {
    const settings = await getSettingsMap(sql);
    const levels = parseVipLevels(settings);
    const serialized = await serializeUser(sql, user, settings);
    return {
      status: 200,
      json: {
        user: serialized,
        todayStats: await getTodayStats(sql, user.id, serialized.vipLevel, levels),
        ...buildPublicPlatformPayload(settings)
      }
    };
  }

  if (method === 'GET' && path === '/api/notifications') {
    const rows = await sql`
      SELECT id, title, body, type, is_read AS "isRead", created_at AS "createdAt"
      FROM arona_boost.notifications
      WHERE user_id = ${user.id}
      ORDER BY id DESC LIMIT 40
    `;
    const [cnt] = await sql`
      SELECT COUNT(*)::int AS c FROM arona_boost.notifications WHERE user_id = ${user.id} AND is_read = 0
    `;
    return {
      status: 200,
      json: {
        notifications: rows.map((r) => ({ ...r, isRead: Boolean(r.isRead) })),
        unreadCount: Number(cnt?.c || 0)
      }
    };
  }

  if (method === 'POST' && path === '/api/notifications/read-all') {
    await sql`UPDATE arona_boost.notifications SET is_read = 1 WHERE user_id = ${user.id}`;
    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message: 'تم تحديد جميع الإشعارات كمقروءة',
        user: await serializeUser(sql, updated)
      }
    };
  }

  if (method === 'GET' && path === '/api/deposit-info') {
    const settings = await getSettingsMap(sql);
    const trc20Address = String(settings.trc20_address || 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE').trim();
    const bep20Address = String(settings.bep20_address || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e').trim();
    const [trc20Qr, bep20Qr] = await Promise.all([makeQrDataUri(trc20Address), makeQrDataUri(bep20Address)]);
    return {
      status: 200,
      json: {
        trc20Address,
        bep20Address,
        trc20Qr,
        bep20Qr,
        unifiedStaticWallets: true,
        minDeposit: Number(settings.min_deposit || 10),
        minWithdraw: Number(settings.min_withdraw || 5),
        dailyWithdrawLimit: Number(settings.daily_withdraw_limit || 2),
        withdrawFeePercent: Number(settings.withdraw_fee_percent || 0),
        autoApproveDeposits: settings.auto_approve_deposits === 'true',
        blockchainAutoApprove: settings.blockchain_auto_approve_verified !== 'false',
        strictBlockchainTxid: settings.strict_blockchain_txid !== 'false',
        txidMaxAgeHours: Number(settings.txid_max_age_hours || 72),
        autoApproveWithdrawals: settings.auto_approve_withdrawals === 'true',
        whatsappNumber: settings.whatsapp_number || '963990000000'
      }
    };
  }

  if (method === 'POST' && path === '/api/transactions/deposit') {
    const amount = round2(Number(body.amount));
    const network = ['TRC20', 'BEP20'].includes(body.network) ? body.network : 'TRC20';
    const rawTxid = String(body.txid || '').trim();
    const clean64 = extractTxHash64(rawTxid);
    const settings = await getSettingsMap(sql);
    const minDeposit = Number(settings.min_deposit || 10);
    const strictBlockchainTxid = settings.strict_blockchain_txid !== 'false';
    const autoApproveAlways = settings.auto_approve_deposits === 'true';
    const maxAgeHours = Number(settings.txid_max_age_hours || 72);

    if (!amount || isNaN(amount) || amount < minDeposit) {
      return { status: 400, json: { error: `الحد الأدنى للإيداع هو ${minDeposit} USDT` } };
    }
    if (amount > 100000) {
      return { status: 400, json: { error: 'المبلغ المدخل يتجاوز الحد المسموح للعملية الواحدة' } };
    }

    if (strictBlockchainTxid && !autoApproveAlways && !clean64) {
      return {
        status: 400,
        json: {
          error:
            network === 'BEP20'
              ? 'صيغة معرّف العملية (TXID) غير صحيحة لشبكة BEP20 — يرجى لصق معرّف التحويل المكوّن من 64 حرفاً ورقماً (أو رابط BscScan)'
              : 'صيغة معرّف العملية (TXID) غير صحيحة لشبكة TRC20 — يرجى لصق معرّف التحويل المكوّن من 64 حرفاً ورقماً (أو رابط TronScan)'
        }
      };
    }

    const txid = clean64 ? (network === 'BEP20' ? '0x' + clean64 : clean64) : rawTxid;
    if (!txid || txid.length < 6) {
      return { status: 400, json: { error: 'يرجى إدخال معرّف عملية التحويل (TXID) بشكل صحيح لتوثيق الإيداع' } };
    }

    const normTxKey = clean64 || txid.toLowerCase().replace(/^0x/, '');
    const [dup] = await sql`
      SELECT id FROM arona_boost.transactions
      WHERE type = 'deposit'
        AND regexp_replace(lower(trim(wallet_or_txid)), '^0x', '') = ${normTxKey}
        AND status != 'rejected'
      LIMIT 1
    `;
    if (dup) {
      return { status: 409, json: { error: 'معرّف المعاملة (TXID) هذا مستخدم وموثّق مسبقاً في النظام — لا يمكن استخدام نفس المعاملة مرتين' } };
    }

    const expectedWallet = String(network === 'BEP20' ? settings.bep20_address : settings.trc20_address || '').trim();
    const chainReport = await verifyTransactionOnChain({
      txid,
      network,
      expectedAmount: amount,
      expectedWallet,
      maxAgeHours
    });

    if (
      strictBlockchainTxid &&
      !autoApproveAlways &&
      !chainReport.fullyVerified &&
      chainReport.statusBadge !== 'network_error'
    ) {
      return {
        status: 400,
        json: {
          error: chainReport.summaryAr || 'تعذر التحقق من معرّف العملية (TXID) على البلوكتشين',
          chainVerification: chainReport
        }
      };
    }

    const creditedAmount =
      chainReport.fullyVerified && Number(chainReport.onChainAmount) > 0
        ? round2(Number(chainReport.onChainAmount))
        : amount;

    if (chainReport.fullyVerified && creditedAmount + 1.0 < minDeposit) {
      return {
        status: 400,
        json: {
          error: `المبلغ الفعلي المستلم على الشبكة ($${creditedAmount.toFixed(2)} USDT) أقل من الحد الأدنى للإيداع (${minDeposit} USDT)`,
          chainVerification: chainReport
        }
      };
    }

    const autoApproveByBlockchain =
      settings.blockchain_auto_approve_verified !== 'false' && chainReport.fullyVerified === true;
    const shouldCompleteImmediately = autoApproveAlways || autoApproveByBlockchain;
    const refCode = generateRefCode('DEP');
    const status = shouldCompleteImmediately ? 'completed' : 'pending';
    const note = autoApproveByBlockchain
      ? `تم التحقق الآلي الفوري عبر TXID على شبكة ${network} واعتماد $${creditedAmount.toFixed(2)} USDT`
      : autoApproveAlways
      ? `إيداع موثق عبر شبكة ${network}`
      : `طلب إيداع قيد مراجعة الإدارة (${chainReport.summaryAr})`;

    let createdTx;
    try {
      createdTx = await sql.begin(async (tx) => {
        const [ins] = await tx`
          INSERT INTO arona_boost.transactions (
            user_id, type, amount, fee_amount, net_amount, network,
            wallet_or_txid, reference_code, status, note, chain_status, chain_details_json
          ) VALUES (
            ${user.id}, 'deposit', ${creditedAmount}, 0, ${creditedAmount}, ${network},
            ${txid}, ${refCode}, ${status}, ${note}, ${chainReport.statusBadge || 'unverified'}, ${JSON.stringify(chainReport)}
          ) RETURNING *
        `;
        if (shouldCompleteImmediately) {
          await applyApprovedDepositToUser(tx, user.id, creditedAmount, settings);
          await distributeReferralCommissions(tx, user.id, creditedAmount);
          await grantDepositWheelSpins(tx, user.id, creditedAmount, settings);
          await createNotification(
            tx,
            user.id,
            `تم تأكيد إيداعك +$${creditedAmount.toFixed(2)} USDT`,
            autoApproveByBlockchain
              ? `تم التحقق الآلي من معرّف TXID على بلوكتشين ${network} وإضافة الرصيد فوراً إلى حسابك!`
              : `تم توثيق المعاملة (${refCode}) وإضافة الرصيد إلى محفظتك بنجاح.`,
            'success'
          );
        } else {
          await createNotification(
            tx,
            user.id,
            `استلام طلب إيداع $${creditedAmount.toFixed(2)} USDT`,
            `تم تسجيل طلب الإيداع (${refCode}) وفحصه أولياً على الشبكة وهو قيد المراجعة لاعتماد الرصيد.`,
            'info'
          );
        }
        return ins;
      });
    } catch (dbErr) {
      if (String(dbErr?.code) === '23505') {
        return { status: 409, json: { error: 'معرّف المعاملة (TXID) هذا مستخدم وموثّق مسبقاً في النظام' } };
      }
      throw dbErr;
    }

    const [updatedUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    const serialized = await serializeUser(sql, updatedUser, settings);
    const levels = parseVipLevels(settings);
    return {
      status: 201,
      json: {
        message: autoApproveByBlockchain
          ? `تم التحقق الآلي من الـ TXID على بلوكتشين ${network} وإضافة +${creditedAmount.toFixed(2)} USDT فوراً!`
          : shouldCompleteImmediately
          ? `تم إيداع ${creditedAmount.toFixed(2)} USDT بنجاح وتحديث رصيدك!`
          : `تم إرسال طلب إيداع ${creditedAmount.toFixed(2)} USDT بمعرّف TXID بنجاح وهو قيد مراجعة الإدارة`,
        transaction: createdTx,
        chainVerification: chainReport,
        user: serialized,
        todayStats: await getTodayStats(sql, user.id, serialized.vipLevel, levels)
      }
    };
  }

  if (method === 'POST' && path === '/api/transactions/withdraw') {
    const amount = round2(Number(body.amount));
    const network = ['TRC20', 'BEP20'].includes(body.network) ? body.network : 'TRC20';
    const walletAddress = String(body.walletAddress || '').trim();
    const pin = normalizeDigitsAndStrip(body.pin || '');
    const settings = await getSettingsMap(sql);
    const minWithdraw = Number(settings.min_withdraw || 5);
    const dailyLimit = Number(settings.daily_withdraw_limit || 2);
    const feePct = Math.max(0, Number(settings.withdraw_fee_percent || 0));

    if (!walletAddress || walletAddress.length < 12) {
      return { status: 400, json: { error: 'يرجى إدخال عنوان محفظة USDT صحيح لاستلام السحب' } };
    }
    if (!amount || isNaN(amount) || amount < minWithdraw) {
      return { status: 400, json: { error: `الحد الأدنى للسحب هو ${minWithdraw} USDT` } };
    }

    const [freshCheck] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    if (!freshCheck.withdraw_pin_hash) {
      return {
        status: 400,
        json: { error: 'يرجى تعيين رمز الحماية المالي للسحب (PIN) أولاً لحماية رصيدك', requirePinSetup: true }
      };
    }
    if (!pin || !bcrypt.compareSync(pin, freshCheck.withdraw_pin_hash)) {
      return { status: 401, json: { error: 'رمز الحماية المالي (PIN) غير صحيح' } };
    }
    if (
      freshCheck.wallet_locked &&
      freshCheck.saved_wallet_address &&
      (walletAddress !== freshCheck.saved_wallet_address || network !== (freshCheck.saved_wallet_network || 'TRC20'))
    ) {
      return {
        status: 403,
        json: { error: 'قفل الحماية المصرفية مفعّل: يُسمح بالسحب حصراً إلى عنوان محفظتك المعتمدة والمقفلة في مركز الأمان' }
      };
    }

    const since24h = nowUtcStr(-24 * 3600000);
    const [cntRow] = await sql`
      SELECT COUNT(*)::int AS cnt FROM arona_boost.transactions
      WHERE user_id = ${user.id} AND type = 'withdraw' AND status != 'rejected' AND created_at >= ${since24h}
    `;
    if (dailyLimit > 0 && Number(cntRow?.cnt || 0) >= dailyLimit) {
      return {
        status: 400,
        json: { error: `لقد وصلت إلى الحد الأقصى لعمليات السحب المسموحة خلال 24 ساعة (${dailyLimit} عمليات)` }
      };
    }

    const feeAmount = round2((amount * feePct) / 100);
    const netAmount = round2(Math.max(0, amount - feeAmount));
    const autoApprove = settings.auto_approve_withdrawals === 'true';
    const refCode = generateRefCode('WTH');

    let createdTx;
    try {
      createdTx = await sql.begin(async (tx) => {
        const [locked] = await tx`SELECT * FROM arona_boost.users WHERE id = ${user.id} FOR UPDATE`;
        if (locked.balance < amount) throw new Error('INSUFFICIENT_BALANCE');
        const status = autoApprove ? 'completed' : 'pending';
        const note = autoApprove
          ? `سحب أرباح مكتمل إلى محفظة ${network}`
          : `طلب سحب موثق برمز PIN قيد المعالجة عبر ${network}`;
        const newBalance = round2(locked.balance - amount);
        const newTotalWithdrawals = autoApprove ? round2(locked.total_withdrawals + amount) : round2(locked.total_withdrawals);

        await tx`
          UPDATE arona_boost.users
          SET balance = ${newBalance},
              total_withdrawals = ${newTotalWithdrawals},
              saved_wallet_address = ${walletAddress},
              saved_wallet_network = ${network}
          WHERE id = ${user.id}
        `;
        const [ins] = await tx`
          INSERT INTO arona_boost.transactions (user_id, type, amount, fee_amount, net_amount, network, wallet_or_txid, reference_code, status, note)
          VALUES (${user.id}, 'withdraw', ${amount}, ${feeAmount}, ${netAmount}, ${network}, ${walletAddress}, ${refCode}, ${status}, ${note})
          RETURNING *
        `;
        await createNotification(
          tx,
          user.id,
          autoApprove ? `تم تنفيذ سحب $${amount.toFixed(2)} USDT` : `طلب سحب قيد المراجعة ($${amount.toFixed(2)} USDT)`,
          autoApprove
            ? `تم تحويل صافي ${netAmount.toFixed(2)} USDT إلى محفظتك عبر شبكة ${network}.`
            : `تم تسجيل طلب السحب (${refCode}) بنجاح وسيتم تحويل ${netAmount.toFixed(2)} USDT بعد مراجعة الإدارة.`,
          autoApprove ? 'success' : 'info'
        );
        return ins;
      });
    } catch (e) {
      if (e.message === 'INSUFFICIENT_BALANCE') {
        return { status: 400, json: { error: 'الرصيد الحالي غير كافٍ لإتمام عملية السحب' } };
      }
      throw e;
    }

    const [updatedUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    const serialized = await serializeUser(sql, updatedUser, settings);
    const levels = parseVipLevels(settings);
    return {
      status: 201,
      json: {
        message: autoApprove
          ? `تم تنفيذ سحب ${amount.toFixed(2)} USDT بنجاح!`
          : `تم إرسال طلب سحب ${amount.toFixed(2)} USDT بنجاح وهو قيد مراجعة الإدارة`,
        transaction: createdTx,
        user: serialized,
        todayStats: await getTodayStats(sql, user.id, serialized.vipLevel, levels)
      }
    };
  }

  if (method === 'GET' && path === '/api/transactions') {
    const rows = await sql`
      SELECT id, type, amount, fee_amount AS "feeAmount", net_amount AS "netAmount",
             network, wallet_or_txid AS "walletOrTxid",
             reference_code AS "referenceCode", status, note, created_at AS "createdAt"
      FROM arona_boost.transactions
      WHERE user_id = ${user.id}
      ORDER BY id DESC LIMIT 100
    `;
    return { status: 200, json: { transactions: rows } };
  }

  if (method === 'POST' && path === '/api/vip/activate') {
    const settings = await getSettingsMap(sql);
    const levels = parseVipLevels(settings);
    const targetLevel = Number(body.level);
    const targetVip = levels.find((v) => v.level === targetLevel);
    if (!targetVip) return { status: 400, json: { error: 'المستوى المطلوب غير موجود' } };

    const [freshCheck] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    if (freshCheck.vip_level >= targetLevel) {
      return {
        status: 200,
        json: { message: `أنت بالفعل في ${targetVip.name} أو أعلى`, user: await serializeUser(sql, freshCheck, settings) }
      };
    }

    const currentGuarantee = round2(freshCheck.work_guarantee_amount || 0);
    const incrementalNeeded = Math.max(0, round2(targetVip.minDeposit - currentGuarantee));
    const spendablePool = round2((freshCheck.recharge_balance || 0) + (freshCheck.balance || 0));

    if (freshCheck.total_deposits < targetVip.minDeposit && spendablePool < incrementalNeeded) {
      const shortfall = round2(incrementalNeeded - spendablePool);
      return {
        status: 400,
        json: {
          error: `يتطلب تفعيل ${targetVip.name} ضمان عمل بقيمة ${targetVip.minDeposit} USDT (ينقصك ${shortfall.toFixed(2)} USDT في رصيد الشحن)`,
          neededAmount: shortfall > 0 ? shortfall : targetVip.minDeposit
        }
      };
    }

    const guarDays = Math.max(1, Math.round(Number(settings.guarantee_duration_days || 365)));
    await sql.begin(async (tx) => {
      const [locked] = await tx`SELECT * FROM arona_boost.users WHERE id = ${user.id} FOR UPDATE`;
      let nextRecharge = round2(locked.recharge_balance || 0);
      let nextBalance = round2(locked.balance || 0);
      let nextGuarantee = round2(locked.work_guarantee_amount || 0);
      const deltaGuar = Math.max(0, round2(targetVip.minDeposit - nextGuarantee));
      if (deltaGuar > 0 && nextRecharge + nextBalance >= deltaGuar) {
        const fromRecharge = Math.min(nextRecharge, deltaGuar);
        const fromBalance = round2(deltaGuar - fromRecharge);
        nextRecharge = round2(nextRecharge - fromRecharge);
        nextBalance = round2(nextBalance - fromBalance);
        nextGuarantee = round2(nextGuarantee + deltaGuar);
      } else if (locked.total_deposits >= targetVip.minDeposit && nextGuarantee < targetVip.minDeposit) {
        nextGuarantee = round2(targetVip.minDeposit);
      }
      const startStr = locked.work_guarantee_start || nowUtcStr();
      const expStr = nowUtcStr(guarDays * 86400000);
      const nextJob = locked.job_title && locked.job_title !== 'موظف متدرب' ? locked.job_title : 'موظف رسمي';

      await tx`
        UPDATE arona_boost.users
        SET vip_level = ${targetLevel},
            recharge_balance = ${nextRecharge},
            balance = ${nextBalance},
            work_guarantee_amount = ${nextGuarantee},
            work_guarantee_start = ${startStr},
            work_guarantee_expires = ${expStr},
            job_title = ${nextJob}
        WHERE id = ${user.id}
      `;
    });

    await createNotification(
      sql,
      user.id,
      `ترقية العضوية إلى ${targetVip.name} وتوثيق ضمان العمل`,
      `مبارك! تم تفعيل ${targetVip.name} (${targetVip.title}) وتوثيق عقد ضمان العمل لمدة ${guarDays} يوماً بنجاح.`,
      'success'
    );
    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    const serialized = await serializeUser(sql, updated, settings);
    return {
      status: 200,
      json: {
        message: `مبارك! تم تفعيل ${targetVip.name} (${targetVip.title}) وتوثيق ضمان العمل بنجاح`,
        user: serialized,
        todayStats: await getTodayStats(sql, user.id, serialized.vipLevel, levels)
      }
    };
  }

  if (method === 'POST' && path === '/api/account/refund-guarantee') {
    let refundedAmount = 0;
    try {
      refundedAmount = await sql.begin(async (tx) => {
        const [u] = await tx`SELECT * FROM arona_boost.users WHERE id = ${user.id} FOR UPDATE`;
        const guarAmt = round2(u.work_guarantee_amount || 0);
        if (guarAmt <= 0) throw new Error('NO_GUARANTEE');
        if (u.work_guarantee_expires) {
          const expMs = new Date(u.work_guarantee_expires.replace(' ', 'T') + 'Z').getTime();
          if (Date.now() < expMs) throw new Error('NOT_EXPIRED');
        }
        await tx`
          UPDATE arona_boost.users
          SET balance = ROUND((balance + ${guarAmt})::numeric, 2)::float8,
              work_guarantee_amount = 0,
              work_guarantee_start = '',
              work_guarantee_expires = ''
          WHERE id = ${u.id}
        `;
        await createNotification(
          tx,
          u.id,
          `استرداد مبلغ ضمان العمل +$${guarAmt.toFixed(2)} USDT`,
          `انتهت مدة عقد ضمان العمل وتم استرداد كامل مبلغ الضمان ($${guarAmt.toFixed(2)} USDT) إلى محفظة الدخل القابلة للسحب.`,
          'reward'
        );
        return guarAmt;
      });
    } catch (e) {
      if (e.message === 'NO_GUARANTEE') {
        return { status: 400, json: { error: 'لا يوجد مبلغ ضمان عمل مقيّد حالياً على حسابك' } };
      }
      if (e.message === 'NOT_EXPIRED') {
        return { status: 400, json: { error: 'لم تنتهِ بعد فترة العد التنازلي لاسترداد ضمان العمل' } };
      }
      throw e;
    }
    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message: `تم استرداد مبلغ ضمان العمل (+$${refundedAmount.toFixed(2)} USDT) بنجاح إلى محفظة الدخل!`,
        user: await serializeUser(sql, updated)
      }
    };
  }

  if (method === 'GET' && path === '/api/account/financial-records') {
    const uid = user.id;
    const ledger = [];
    const [txRows, taskRows, flashRows, commRows, wheelRows, vaultRows, salRows, promoRows, redRows] =
      await Promise.all([
        sql`SELECT id, type, amount, fee_amount, net_amount, network, status, reference_code, created_at FROM arona_boost.transactions WHERE user_id = ${uid} ORDER BY id DESC LIMIT 40`,
        sql`SELECT id, task_title, reward, completed_date, created_at FROM arona_boost.task_completions WHERE user_id = ${uid} ORDER BY id DESC LIMIT 45`,
        sql`SELECT fc.id, fm.title, fc.reward, fc.created_at FROM arona_boost.flash_mission_claims fc JOIN arona_boost.flash_missions fm ON fm.id = fc.mission_id WHERE fc.user_id = ${uid} ORDER BY fc.id DESC LIMIT 20`,
        sql`SELECT id, tier, commission_amount, reason, created_at FROM arona_boost.team_commissions WHERE beneficiary_id = ${uid} ORDER BY id DESC LIMIT 35`,
        sql`SELECT id, segment_label, reward_amount, created_at FROM arona_boost.wheel_spins_log WHERE user_id = ${uid} ORDER BY id DESC LIMIT 20`,
        sql`SELECT id, plan_title, amount, expected_profit, status, started_at, claimed_at FROM arona_boost.vault_positions WHERE user_id = ${uid} ORDER BY id DESC LIMIT 20`,
        sql`SELECT id, rank_title, amount, period_month, status, created_at FROM arona_boost.salary_claims WHERE user_id = ${uid} ORDER BY id DESC LIMIT 15`,
        sql`SELECT id, rank_title, bonus_amount, physical_gift, status, created_at FROM arona_boost.claimed_position_bonuses WHERE user_id = ${uid} ORDER BY id DESC LIMIT 15`,
        sql`SELECT id, code, amount, created_at FROM arona_boost.red_envelope_claims WHERE user_id = ${uid} ORDER BY id DESC LIMIT 20`
      ]);

    for (const t of txRows) {
      ledger.push(
        t.type === 'deposit'
          ? {
              id: `tx_${t.id}`,
              category: 'deposit',
              categoryAr: 'شحن رصيد / ضمان',
              title: `إيداع عبر شبكة ${t.network} (${t.reference_code})`,
              amount: round2(t.amount),
              direction: 'in',
              walletAr: 'رصيد الشحن / ضمان العمل',
              status: t.status,
              createdAt: t.created_at
            }
          : {
              id: `tx_${t.id}`,
              category: 'withdraw',
              categoryAr: 'سحب أرباح',
              title: `سحب إلى ${t.network} (صافي $${round2(t.net_amount || t.amount).toFixed(2)})`,
              amount: round2(t.amount),
              direction: 'out',
              walletAr: 'محفظة الدخل',
              status: t.status,
              createdAt: t.created_at
            }
      );
    }
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
    for (const rc of redRows) {
      ledger.push({
        id: `red_${rc.id}`,
        category: 'wheel',
        categoryAr: 'مكافأة الظرف الأحمر',
        title: `صرف الظرف الأحمر (${rc.code})`,
        amount: round2(rc.amount),
        direction: 'in',
        walletAr: 'محفظة الدخل',
        status: 'completed',
        createdAt: rc.created_at
      });
    }
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
    const dayMap = new Map();
    const todayDate = new Date();
    for (let i = 0; i < 14; i++) {
      const key = new Date(todayDate.getTime() - i * 86400000).toISOString().slice(0, 10);
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
      } else if ((item.category === 'commission' || item.category === 'salary' || item.category === 'promotion') && item.status === 'completed') {
        bucket.teamIncome = round2(bucket.teamIncome + item.amount);
        bucket.totalIncome = round2(bucket.totalIncome + item.amount);
      } else if (item.category === 'wheel' || item.category === 'vault_profit') {
        bucket.rewardsIncome = round2(bucket.rewardsIncome + item.amount);
        bucket.totalIncome = round2(bucket.totalIncome + item.amount);
      } else if (item.category === 'deposit' && item.status === 'completed') {
        bucket.depositsTotal = round2(bucket.depositsTotal + item.amount);
      } else if (item.category === 'withdraw' && item.status !== 'rejected') {
        bucket.withdrawalsTotal = round2(bucket.withdrawalsTotal + item.amount);
      }
    }
    const dailyStatements = Array.from(dayMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);
    return { status: 200, json: { dailyStatements, ledgerEntries: ledger.slice(0, 60) } };
  }

  if (method === 'GET' && path === '/api/destinations/featured') {
    const seed = Number(url.searchParams.get('seed') || 0);
    const items = await getFeaturedDestinationsShowcase(seed);
    return { status: 200, json: { items } };
  }

  if (method === 'GET' && path === '/api/tasks') {
    const today = getTodayDateStr();
    const nowStr = nowUtcStr();
    const seed = Number(url.searchParams.get('seed') || 0);

    const [settings, todayCompletions, history, rawFlash, myClaimsRows] = await Promise.all([
      getSettingsMap(sql),
      sql`
        SELECT task_slot, task_title, location, image_url, reward, rating, review_tags, review_comment, created_at
        FROM arona_boost.task_completions
        WHERE user_id = ${user.id} AND completed_date = ${today}
      `,
      sql`
        SELECT id, task_slot AS slot, task_title AS title, vip_level AS "vipLevel",
               reward, rating, review_tags AS "reviewTags", review_comment AS "reviewComment",
               location, image_url AS "imageUrl", completed_date AS "completedDate", created_at AS "createdAt"
        FROM arona_boost.task_completions
        WHERE user_id = ${user.id}
        ORDER BY id DESC LIMIT 30
      `,
      sql`
        SELECT id, title, location, category, description, image_url AS "imageUrl",
               reward, min_vip_level AS "minVipLevel", max_claims AS "maxClaims",
               claimed_count AS "claimedCount", expires_at AS "expiresAt"
        FROM arona_boost.flash_missions
        WHERE is_active = 1 AND expires_at > ${nowStr}
        ORDER BY id DESC
      `,
      sql`SELECT mission_id FROM arona_boost.flash_mission_claims WHERE user_id = ${user.id}`
    ]);

    const levels = parseVipLevels(settings);
    const serialized = await serializeUser(sql, user, settings);
    const currentVip = levels.find((v) => v.level === serialized.vipLevel) || levels[0];
    const nextVip = levels.find((v) => v.level === serialized.vipLevel + 1) || null;

    const completedMap = new Map();
    for (const c of todayCompletions) completedMap.set(c.task_slot, c);

    const [dynamicSlots, previewList, todayStats] = await Promise.all([
      getDynamicDestinationsForSlots(currentVip.dailyTasks, completedMap, seed + user.id),
      nextVip ? getFeaturedDestinationsShowcase(seed + 77) : Promise.resolve([]),
      getTodayStats(sql, user.id, serialized.vipLevel, levels)
    ]);

    const activeTasks = dynamicSlots.map((item) => ({
      ...item,
      vipRequired: currentVip.level,
      reward: currentVip.rewardPerTask
    }));

    const lockedPreviewTasks = nextVip
      ? previewList.slice(0, 2).map((item, idx) => ({
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
        }))
      : [];

    const myFlashClaims = new Set(myClaimsRows.map((r) => r.mission_id));
    const flashMissions = rawFlash.map((fm) => {
      const remainingSlots = Math.max(0, fm.maxClaims - fm.claimedCount);
      const alreadyClaimed = myFlashClaims.has(fm.id);
      const isVipQualified = serialized.vipLevel >= fm.minVipLevel;
      const isSoldOut = remainingSlots <= 0;
      return {
        ...fm,
        reward: round2(fm.reward),
        minVip: fm.minVipLevel,
        remainingSlots,
        remainingClaims: remainingSlots,
        alreadyClaimed,
        completedByUser: alreadyClaimed,
        isVipQualified,
        eligibleVip: isVipQualified,
        isSoldOut,
        soldOut: isSoldOut
      };
    });

    return {
      status: 200,
      json: {
        currentVip,
        nextVip,
        today,
        activeTasks,
        lockedPreviewTasks,
        flashMissions,
        history,
        todayStats
      }
    };
  }

  const flashMatch = path.match(/^\/api\/tasks\/flash\/(\d+)\/complete$/);
  if (method === 'POST' && flashMatch) {
    const missionId = Number(flashMatch[1]);
    const rawRating = Number(body.rating ?? 5);
    const rating = Math.min(5, Math.max(1, Math.round(isNaN(rawRating) ? 5 : rawRating)));
    const reviewComment = String(body.comment || '').trim().slice(0, 300);
    const serialized = await serializeUser(sql, user);

    let result;
    try {
      result = await sql.begin(async (tx) => {
        const nowStr = nowUtcStr();
        const [fm] = await tx`
          SELECT * FROM arona_boost.flash_missions
          WHERE id = ${missionId} AND is_active = 1 AND expires_at > ${nowStr}
          FOR UPDATE
        `;
        if (!fm) throw new Error('NOT_AVAILABLE');
        if (serialized.vipLevel < fm.min_vip_level) throw new Error(`NEED_VIP_${fm.min_vip_level}`);
        const [dup] = await tx`
          SELECT id FROM arona_boost.flash_mission_claims WHERE mission_id = ${missionId} AND user_id = ${user.id}
        `;
        if (dup) throw new Error('ALREADY_CLAIMED');
        if (fm.claimed_count >= fm.max_claims) throw new Error('SOLD_OUT');

        const reward = round2(fm.reward);
        await tx`UPDATE arona_boost.flash_missions SET claimed_count = claimed_count + 1 WHERE id = ${missionId}`;
        await tx`
          INSERT INTO arona_boost.flash_mission_claims (mission_id, user_id, reward, rating, review_comment)
          VALUES (${missionId}, ${user.id}, ${reward}, ${rating}, ${reviewComment})
        `;
        await tx`
          UPDATE arona_boost.users
          SET balance = ROUND((balance + ${reward})::numeric, 2)::float8,
              total_task_earnings = ROUND((total_task_earnings + ${reward})::numeric, 2)::float8
          WHERE id = ${user.id}
        `;
        await createNotification(
          tx,
          user.id,
          `مكافأة مهمة سياحية مميزة +$${reward.toFixed(2)} USDT`,
          `أنجزت تقييم المهمة المحدودة "${fm.title}" وحصلت على +$${reward.toFixed(2)} USDT!`,
          'reward'
        );
        return { title: fm.title, reward };
      });
    } catch (e) {
      if (e.message === 'NOT_AVAILABLE') return { status: 400, json: { error: 'هذه المهمة المميزة انتهت صلاحيتها أو لم تعد متاحة' } };
      if (e.message.startsWith('NEED_VIP_')) {
        return { status: 403, json: { error: `هذه المهمة الاستثنائية مخصصة لعقود الفئة A${e.message.replace('NEED_VIP_', '')} فأعلى` } };
      }
      if (e.message === 'ALREADY_CLAIMED') return { status: 400, json: { error: 'لقد قمت بإنجاز هذه المهمة المميزة مسبقاً' } };
      if (e.message === 'SOLD_OUT') return { status: 400, json: { error: 'نفدت جميع المقاعد المتاحة لهذه المهمة المميزة' } };
      throw e;
    }

    const [updatedUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message: `مبارك! أتممت تقييم "${result.title}" وأُضيف +$${result.reward.toFixed(2)} USDT لرصيدك`,
        reward: result.reward,
        user: await serializeUser(sql, updatedUser)
      }
    };
  }

  if (method === 'POST' && path === '/api/tasks/complete') {
    const settings = await getSettingsMap(sql);
    const levels = parseVipLevels(settings);
    const slot = Number(body.slot);
    const destKey = String(body.destKey || '').trim();
    const rawRating = Number(body.rating ?? 5);
    const rating = Math.min(5, Math.max(1, Math.round(isNaN(rawRating) ? 5 : rawRating)));
    const tagsArr = Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).trim()).filter(Boolean)
      : String(body.tags || '').split('،').map((t) => t.trim()).filter(Boolean);
    const reviewTags = tagsArr.slice(0, 5).join('، ');
    const reviewComment = String(body.comment || '').trim().slice(0, 300);

    const serialized = await serializeUser(sql, user, settings);
    const currentVip = levels.find((v) => v.level === serialized.vipLevel) || levels[0];
    const contractCode = String(body.contractCode || `#AB-${300 + slot * 37}`).trim().slice(0, 24);

    if (!slot || slot < 1 || slot > currentVip.dailyTasks) {
      return { status: 400, json: { error: 'هذا العقد الفندقي غير متاح ضمن درجتك الوظيفية الحالية' } };
    }

    const matchedPool =
      TOURISM_POOL.find((d) => d.key === destKey) ||
      TASK_CATALOG.find((t) => t.slot === slot) || {
        title: `وجهة سياحية #${slot}`,
        location: 'وجهة عالمية',
        fallbackImage: '/destinations/dest-1.jpg'
      };

    const chosenImage =
      typeof body.activeImage === 'string' && body.activeImage.trim()
        ? body.activeImage.trim()
        : matchedPool.fallbackImage || matchedPool.image || '/destinations/dest-1.jpg';

    const today = getTodayDateStr();
    const reward = round2(currentVip.rewardPerTask);

    try {
      await sql.begin(async (tx) => {
        const [already] = await tx`
          SELECT id FROM arona_boost.task_completions
          WHERE user_id = ${user.id} AND task_slot = ${slot} AND completed_date = ${today}
        `;
        if (already) throw new Error('ALREADY_COMPLETED');

        await tx`
          INSERT INTO arona_boost.task_completions (
            user_id, task_slot, task_title, vip_level, reward,
            rating, review_tags, review_comment, location, image_url, completed_date
          ) VALUES (
            ${user.id}, ${slot}, ${matchedPool.title}, ${currentVip.level}, ${reward},
            ${rating}, ${reviewTags}, ${reviewComment}, ${matchedPool.location}, ${chosenImage}, ${today}
          )
        `;
        await tx`
          UPDATE arona_boost.users
          SET balance = ROUND((balance + ${reward})::numeric, 2)::float8,
              total_task_earnings = ROUND((total_task_earnings + ${reward})::numeric, 2)::float8,
              points_balance = COALESCE(points_balance, 0) + 10
          WHERE id = ${user.id}
        `;
        await tx`
          INSERT INTO arona_boost.point_logs (user_id, delta, reason)
          VALUES (${user.id}, 10, ${`مكافأة نقاط توثيق: ${matchedPool.title}`})
        `;
      });
    } catch (e) {
      if (e.message === 'ALREADY_COMPLETED') {
        return { status: 400, json: { error: 'لقد قمت بتقييم هذه المنطقة السياحية اليوم بالفعل' } };
      }
      throw e;
    }

    const sectorReportName =
      matchedPool.sectorType === 'resort'
        ? 'تقرير المنتجع العالمي'
        : matchedPool.sectorType === 'hotel'
        ? 'التقرير الفندقي'
        : 'تقرير المعلم السياحي';

    await createNotification(
      sql,
      user.id,
      `اعتماد ${sectorReportName} (${contractCode})`,
      `تم توثيق ${sectorReportName} لـ "${matchedPool.title}" وإيداع +$${reward.toFixed(2)} USDT في محفظة الدخل.`,
      'success'
    );

    const [updatedUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    const updatedSerialized = await serializeUser(sql, updatedUser, settings);
    return {
      status: 200,
      json: {
        message: `تم اعتماد ${sectorReportName} (${contractCode}) وإيداع +${reward.toFixed(2)} USDT في محفظة الدخل`,
        reward,
        contractCode,
        user: updatedSerialized,
        todayStats: await getTodayStats(sql, user.id, updatedSerialized.vipLevel, levels)
      }
    };
  }

  // ---- VAULT (استثمر مع أرونا) ----

  if (method === 'GET' && path === '/api/vault') {
    const settings = await getSettingsMap(sql);
    const plans = parseVaultPlans(settings);
    const rawPositions = await sql`
      SELECT id, plan_id AS "planId", plan_title AS "planTitle", amount,
             daily_rate_pct AS "dailyRatePct", total_return_pct AS "totalReturnPct",
             expected_profit AS "expectedProfit", duration_days AS "durationDays",
             started_at AS "startedAt", matures_at AS "maturesAt", status, claimed_at AS "claimedAt"
      FROM arona_boost.vault_positions
      WHERE user_id = ${user.id}
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id DESC LIMIT 30
    `;
    const nowMs = Date.now();
    const positions = rawPositions.map((p) => {
      const startMs = new Date(p.startedAt.replace(' ', 'T') + 'Z').getTime();
      const matMs = new Date(p.maturesAt.replace(' ', 'T') + 'Z').getTime();
      const totalSpan = Math.max(1000, matMs - startMs);
      const elapsed = Math.max(0, nowMs - startMs);
      const progressPct = p.status === 'claimed' ? 100 : Math.min(100, Math.round((elapsed / totalSpan) * 100));
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
    return {
      status: 200,
      json: {
        plans,
        positions,
        summary: {
          activeLockedTotal: round2(positions.filter((p) => p.status === 'active').reduce((s, p) => s + p.amount, 0)),
          activeExpectedProfit: round2(positions.filter((p) => p.status === 'active').reduce((s, p) => s + p.expectedProfit, 0)),
          totalClaimedProfit: round2(positions.filter((p) => p.status === 'claimed').reduce((s, p) => s + p.expectedProfit, 0))
        }
      }
    };
  }

  if (method === 'POST' && path === '/api/vault/stake') {
    const settings = await getSettingsMap(sql);
    const plans = parseVaultPlans(settings);
    const planId = String(body.planId || '');
    const amount = round2(Number(body.amount || 0));
    const chosenPlan = plans.find((p) => p.id === planId);
    if (!chosenPlan) return { status: 400, json: { error: 'محفظة الاستثمار المختارة غير صالحة' } };
    if (!amount || isNaN(amount) || amount < Number(chosenPlan.minAmount || 10)) {
      return { status: 400, json: { error: `الحد الأدنى للاستثمار في "${chosenPlan.title}" هو ${chosenPlan.minAmount} USDT` } };
    }
    const durationDays = Math.max(1, Math.round(Number(chosenPlan.durationDays || 7)));
    const totalReturnPct = Number(chosenPlan.totalReturnPct || 8.4);
    const dailyRatePct = round2(totalReturnPct / durationDays);
    const expectedProfit = round2((amount * totalReturnPct) / 100);

    try {
      await sql.begin(async (tx) => {
        const [locked] = await tx`SELECT * FROM arona_boost.users WHERE id = ${user.id} FOR UPDATE`;
        const availRecharge = round2(locked.recharge_balance || 0);
        const availIncome = round2(locked.balance || 0);
        if (round2(availRecharge + availIncome) < amount) throw new Error('INSUFFICIENT_BALANCE');
        const deductRecharge = Math.min(availRecharge, amount);
        const deductIncome = round2(amount - deductRecharge);
        await tx`
          UPDATE arona_boost.users
          SET recharge_balance = ROUND((recharge_balance - ${deductRecharge})::numeric, 2)::float8,
              balance = ROUND((balance - ${deductIncome})::numeric, 2)::float8
          WHERE id = ${user.id}
        `;
        await tx`
          INSERT INTO arona_boost.vault_positions (
            user_id, plan_id, plan_title, amount, daily_rate_pct, total_return_pct,
            expected_profit, duration_days, started_at, matures_at, status
          ) VALUES (
            ${user.id}, ${chosenPlan.id}, ${chosenPlan.title}, ${amount}, ${dailyRatePct}, ${totalReturnPct},
            ${expectedProfit}, ${durationDays}, ${nowUtcStr()}, ${nowUtcStr(durationDays * 86400000)}, 'active'
          )
        `;
        await createNotification(
          tx,
          user.id,
          `تفعيل عقد استثمر مع أرونا ($${amount.toFixed(2)} USDT)`,
          `تم استثمار $${amount.toFixed(2)} USDT في "${chosenPlan.title}" بعائد مضمون +$${expectedProfit.toFixed(2)} USDT عند الاستحقاق.`,
          'success'
        );
      });
    } catch (e) {
      if (e.message === 'INSUFFICIENT_BALANCE') {
        return { status: 400, json: { error: 'رصيدك المتاح غير كافٍ لفتح عقد الاستثمار' } };
      }
      throw e;
    }

    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 201,
      json: {
        message: `تم ربط $${amount.toFixed(2)} USDT في "${chosenPlan.title}" بنجاح! الربح المضمون +$${expectedProfit.toFixed(2)} USDT`,
        user: await serializeUser(sql, updated, settings)
      }
    };
  }

  const vaultClaimMatch = path.match(/^\/api\/vault\/claim\/(\d+)$/);
  if (method === 'POST' && vaultClaimMatch) {
    const posId = Number(vaultClaimMatch[1]);
    let payout;
    try {
      payout = await sql.begin(async (tx) => {
        const [pos] = await tx`
          SELECT * FROM arona_boost.vault_positions
          WHERE id = ${posId} AND user_id = ${user.id} AND status = 'active'
          FOR UPDATE
        `;
        if (!pos) throw new Error('NOT_FOUND');
        const matMs = new Date(pos.matures_at.replace(' ', 'T') + 'Z').getTime();
        if (Date.now() < matMs) throw new Error('NOT_MATURED');
        const totalPayout = round2(pos.amount + pos.expected_profit);
        await tx`
          UPDATE arona_boost.vault_positions
          SET status = 'claimed', claimed_at = ${nowUtcStr()}
          WHERE id = ${posId}
        `;
        await tx`
          UPDATE arona_boost.users
          SET balance = ROUND((balance + ${totalPayout})::numeric, 2)::float8
          WHERE id = ${user.id}
        `;
        await createNotification(
          tx,
          user.id,
          `استحقاق استثمر مع أرونا +$${totalPayout.toFixed(2)} USDT`,
          `تم فك استثمار "${pos.plan_title}" وإضافة الأصل مع الأرباح ($${totalPayout.toFixed(2)} USDT) إلى رصيدك المتاح.`,
          'reward'
        );
        return totalPayout;
      });
    } catch (e) {
      if (e.message === 'NOT_FOUND') return { status: 404, json: { error: 'عقد الاستثمار غير موجود أو تم استلامه مسبقاً' } };
      if (e.message === 'NOT_MATURED') return { status: 400, json: { error: 'لم يحن موعد استحقاق هذا العقد الاستثماري بعد' } };
      throw e;
    }
    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message: `مبارك! تم استلام رأس المال والأرباح +$${payout.toFixed(2)} USDT في محفظة الدخل`,
        user: await serializeUser(sql, updated)
      }
    };
  }

  // ---- LUCKY WHEEL ----

  if (method === 'GET' && path === '/api/wheel') {
    const settings = await getSettingsMap(sql);
    const segments = parseWheelSegments(settings).map((s) => ({
      id: s.id,
      label: s.label,
      reward: round2(s.reward),
      color: s.color || '#0D9488'
    }));
    const [freshUser] = await sql`SELECT spin_credits FROM arona_boost.users WHERE id = ${user.id}`;
    const myHistory = await sql`
      SELECT id, segment_label AS label, reward_amount AS reward, created_at AS "createdAt"
      FROM arona_boost.wheel_spins_log
      WHERE user_id = ${user.id}
      ORDER BY id DESC LIMIT 10
    `;
    return {
      status: 200,
      json: {
        segments,
        spinCredits: Number(freshUser?.spin_credits || 0),
        minDepositForSpin: Number(settings.wheel_min_deposit || 20),
        referrerSpinEnabled: settings.wheel_referrer_spin !== 'false',
        myHistory
      }
    };
  }

  if (method === 'POST' && path === '/api/wheel/spin') {
    const settings = await getSettingsMap(sql);
    const fullSegments = parseWheelSegments(settings);
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

    try {
      await sql.begin(async (tx) => {
        const [u] = await tx`SELECT id, spin_credits FROM arona_boost.users WHERE id = ${user.id} FOR UPDATE`;
        if (!u || u.spin_credits <= 0) throw new Error('NO_SPINS');
        await tx`
          UPDATE arona_boost.users
          SET spin_credits = spin_credits - 1,
              balance = ROUND((balance + ${reward})::numeric, 2)::float8
          WHERE id = ${user.id}
        `;
        await tx`
          INSERT INTO arona_boost.wheel_spins_log (user_id, segment_label, reward_amount)
          VALUES (${user.id}, ${wonSeg.label}, ${reward})
        `;
        await createNotification(
          tx,
          user.id,
          `جائزة عجلة الحظ +$${reward.toFixed(2)} USDT 🎡`,
          `ربحت "${wonSeg.label}" من عجلة حظ Arona Boost وتمت إضافتها فوراً لرصيدك!`,
          'reward'
        );
      });
    } catch (e) {
      if (e.message === 'NO_SPINS') {
        return { status: 400, json: { error: 'لا تملك لفات متاحة حالياً. قم بإيداع مؤهل للحصول على لفة حظ مجانية!' } };
      }
      throw e;
    }

    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        winningIndex,
        segment: { id: wonSeg.id, label: wonSeg.label, reward },
        reward,
        message: `مبارك! ربحت +$${reward.toFixed(2)} USDT من عجلة الحظ!`,
        user: await serializeUser(sql, updated, settings)
      }
    };
  }

  // ---- TEAM, SALARIES, PROMOTIONS & MILESTONES ----

  if (method === 'GET' && path === '/api/team') {
    const [settings, mData, claimedRows, commRows, promoClaims] = await Promise.all([
      getSettingsMap(sql),
      evaluateUserTeamMetricsServer(sql, user.id),
      sql`SELECT milestone_key FROM arona_boost.claimed_milestones WHERE user_id = ${user.id}`,
      sql`
        SELECT tc.id, tc.tier, tc.base_amount AS "baseAmount",
               tc.commission_amount AS "commissionAmount", tc.reason,
               tc.created_at AS "createdAt", u.phone AS "sourcePhone"
        FROM arona_boost.team_commissions tc
        JOIN arona_boost.users u ON u.id = tc.source_user_id
        WHERE tc.beneficiary_id = ${user.id}
        ORDER BY tc.id DESC LIMIT 30
      `,
      sql`SELECT rank_id, status, bonus_amount, physical_gift, created_at FROM arona_boost.claimed_position_bonuses WHERE user_id = ${user.id}`
    ]);
    const serializedMe = await serializeUser(sql, user, settings);
    const formatMember = (m, tier) => ({
      id: m.id,
      maskedPhone: maskPhone(m.phone),
      vipLevel: m.vip_level,
      totalDeposits: round2(m.total_deposits),
      tier,
      joinedAt: m.created_at
    });
    const members = [
      ...mData.tier1Raw.map((m) => formatMember(m, 1)),
      ...mData.tier2Raw.map((m) => formatMember(m, 2)),
      ...mData.tier3Raw.map((m) => formatMember(m, 3))
    ];

    const claimedSet = new Set(claimedRows.map((r) => r.milestone_key));
    const milestones = TEAM_MILESTONES.map((ms) => ({
      ...ms,
      currentProgress: mData.activeDirect,
      claimed: claimedSet.has(ms.key),
      canClaim: !claimedSet.has(ms.key) && mData.activeDirect >= ms.requiredActive
    }));

    const commissions = commRows.map((c) => ({
      id: c.id,
      tier: c.tier,
      baseAmount: round2(c.baseAmount),
      commissionAmount: round2(c.commissionAmount),
      reason: c.reason,
      sourcePhone: maskPhone(c.sourcePhone),
      createdAt: c.createdAt
    }));

    const salaryEnabled = settings.salary_system_enabled !== 'false';
    const salaryRequireApproval = settings.salary_require_approval !== 'false';
    const periodMonth = mData.periodMonth;
    const salaryRanksRaw = parseSalaryRanks(settings);

    const thisMonthClaims = await sql`SELECT rank_id, status, amount, created_at FROM arona_boost.salary_claims WHERE user_id = ${user.id} AND period_month = ${periodMonth}`;
    const monthClaimMap = new Map(thisMonthClaims.map((c) => [c.rank_id, c]));
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
      const currentQualVipCount = mData.countVipAtLeast(reqQualVipTier);

      const checks = {
        meetsVip: serializedMe.vipLevel >= reqVip,
        meetsDirect: mData.activeDirect >= reqDirect,
        meetsTotalActive: mData.totalActiveTeam >= reqTotalActive,
        meetsQualVip: currentQualVipCount >= reqQualVipCount,
        meetsMonthlyNew: mData.monthlyNewMembers >= reqMonthlyNew,
        meetsTeamDep: mData.teamTotalDeposits >= reqTeamDep
      };
      const allConditionsMet = Object.values(checks).every(Boolean);
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
        checks,
        allConditionsMet,
        promotionClaimStatus: existingPromo ? existingPromo.status : null,
        canClaimPromotion: salaryEnabled && oneTimeBonusUsdt > 0 && allConditionsMet && (!existingPromo || existingPromo.status === 'rejected'),
        claimStatus: existingClaim ? existingClaim.status : null,
        canClaim: salaryEnabled && salaryAmt > 0 && allConditionsMet && (!existingClaim || existingClaim.status === 'rejected')
      };
    });

    const allTeamIds = members.map((m) => m.id);
    let activeTodayCount = 0;
    if (allTeamIds.length > 0) {
      const [ac] = await sql`
        SELECT COUNT(DISTINCT user_id)::int AS c FROM arona_boost.task_completions
        WHERE completed_date = ${getTodayDateStr()} AND user_id IN ${sql(allTeamIds)}
      `;
      activeTodayCount = Number(ac?.c || 0);
    }

    const nextSalaryTarget =
      evaluatedSalaryRanks.find((r) => !r.allConditionsMet && r.monthlySalaryUsdt > 0) ||
      evaluatedSalaryRanks.find((r) => !r.allConditionsMet) ||
      evaluatedSalaryRanks[evaluatedSalaryRanks.length - 1] ||
      null;

    let nextSalaryProgress = null;
    if (nextSalaryTarget) {
      const directRatio = nextSalaryTarget.minActiveDirect > 0 ? Math.min(1, mData.activeDirect / nextSalaryTarget.minActiveDirect) : 1;
      const totalRatio = nextSalaryTarget.minTotalActiveTeam > 0 ? Math.min(1, mData.totalActiveTeam / nextSalaryTarget.minTotalActiveTeam) : 1;
      const depRatio = nextSalaryTarget.minTeamDepositsUsdt > 0 ? Math.min(1, mData.teamTotalDeposits / nextSalaryTarget.minTeamDepositsUsdt) : 1;
      nextSalaryProgress = {
        rankTitle: nextSalaryTarget.title,
        monthlySalaryUsdt: nextSalaryTarget.monthlySalaryUsdt,
        oneTimeBonusUsdt: nextSalaryTarget.oneTimeBonusUsdt,
        physicalGift: nextSalaryTarget.physicalGift,
        progressPct: Math.min(100, Math.round(((directRatio + totalRatio + depRatio) / 3) * 100)),
        remainingDirect: Math.max(0, nextSalaryTarget.minActiveDirect - mData.activeDirect),
        remainingTotalActive: Math.max(0, nextSalaryTarget.minTotalActiveTeam - mData.totalActiveTeam),
        remainingDepositsUsdt: round2(Math.max(0, nextSalaryTarget.minTeamDepositsUsdt - mData.teamTotalDeposits))
      };
    }

    return {
      status: 200,
      json: {
        inviteCode: user.invite_code,
        analytics: {
          activeTodayCount,
          fundedRatioPct: members.length > 0 ? Math.round((mData.totalActiveTeam / members.length) * 100) : 0,
          nextSalaryProgress
        },
        stats: {
          totalMembers: members.length,
          activeMembers: mData.totalActiveTeam,
          activeDirectTier1: mData.activeDirect,
          monthlyNewMembers: mData.monthlyNewMembers,
          tier1Count: mData.tier1Raw.length,
          tier2Count: mData.tier2Raw.length,
          tier3Count: mData.tier3Raw.length,
          teamTotalDeposits: mData.teamTotalDeposits,
          totalTeamEarnings: round2(user.total_team_earnings)
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
            activeDirect: mData.activeDirect,
            totalActiveTeam: mData.totalActiveTeam,
            monthlyNewMembers: mData.monthlyNewMembers,
            teamTotalDeposits: mData.teamTotalDeposits
          },
          ranks: evaluatedSalaryRanks
        },
        milestones,
        members,
        commissions
      }
    };
  }

  if (method === 'POST' && path === '/api/team/claim-promotion-bonus') {
    const rankId = String(body.rankId || '');
    const settings = await getSettingsMap(sql);
    if (settings.salary_system_enabled === 'false') {
      return { status: 400, json: { error: 'برنامج الترقيات متوقف مؤقتاً من قِبل الإدارة' } };
    }
    const targetRank = parseSalaryRanks(settings).find((r) => r.id === rankId);
    if (!targetRank || Number(targetRank.oneTimeBonusUsdt || 0) <= 0) {
      return { status: 400, json: { error: 'منصب الترقية المطلوب غير صالح' } };
    }
    const serializedMe = await serializeUser(sql, user, settings);
    const m = await evaluateUserTeamMetricsServer(sql, user.id);
    const qualVipCount = m.countVipAtLeast(targetRank.qualifiedVipTier || 1);
    if (
      serializedMe.vipLevel < Number(targetRank.minUserVip || 0) ||
      m.activeDirect < Number(targetRank.minActiveDirect || 0) ||
      m.totalActiveTeam < Number(targetRank.minTotalActiveTeam || 0) ||
      qualVipCount < Number(targetRank.minQualifiedVipCount || 0) ||
      m.monthlyNewMembers < Number(targetRank.minMonthlyNewMembers || 0) ||
      m.teamTotalDeposits < Number(targetRank.minTeamDepositsUsdt || 0)
    ) {
      return { status: 400, json: { error: 'لم تستوفِ بعد جميع شروط الترقية المحددة لهذا المنصب' } };
    }

    const bonusAmt = round2(Number(targetRank.oneTimeBonusUsdt || 0));
    const physicalGift = String(targetRank.physicalGift || '').trim();
    const requireApproval = settings.salary_require_approval !== 'false';

    try {
      await sql.begin(async (tx) => {
        const [existing] = await tx`
          SELECT id, status FROM arona_boost.claimed_position_bonuses
          WHERE user_id = ${user.id} AND rank_id = ${targetRank.id} FOR UPDATE
        `;
        if (existing && existing.status !== 'rejected') throw new Error('ALREADY_CLAIMED_PROMO');
        const status = requireApproval ? 'pending' : 'approved';
        if (existing && existing.status === 'rejected') {
          await tx`
            UPDATE arona_boost.claimed_position_bonuses
            SET status = ${status}, bonus_amount = ${bonusAmt}, physical_gift = ${physicalGift}, created_at = ${nowUtcStr()}, decided_at = ''
            WHERE id = ${existing.id}
          `;
        } else {
          await tx`
            INSERT INTO arona_boost.claimed_position_bonuses (user_id, rank_id, rank_title, bonus_amount, physical_gift, status)
            VALUES (${user.id}, ${targetRank.id}, ${targetRank.title}, ${bonusAmt}, ${physicalGift}, ${status})
          `;
        }
        if (!requireApproval) {
          await tx`
            UPDATE arona_boost.users
            SET balance = ROUND((balance + ${bonusAmt})::numeric, 2)::float8,
                total_team_earnings = ROUND((total_team_earnings + ${bonusAmt})::numeric, 2)::float8,
                job_title = ${targetRank.title}
            WHERE id = ${user.id}
          `;
          await createNotification(
            tx,
            user.id,
            `مبارك الترقية لمنصب "${targetRank.title}" +$${bonusAmt.toFixed(2)} USDT 🏆`,
            `تمت ترقية منصبك رسمياً وصرف مكافأة الترقية ($${bonusAmt.toFixed(2)} USDT)${physicalGift ? ` وتوثيق استحقاقك لهدية (${physicalGift})` : ''}!`,
            'reward'
          );
        } else {
          await tx`UPDATE arona_boost.users SET job_title = ${targetRank.title} WHERE id = ${user.id}`;
          await createNotification(
            tx,
            user.id,
            `طلب مكافأة ترقية "${targetRank.title}" قيد المراجعة ($${bonusAmt.toFixed(2)} USDT)`,
            `تم تحديث مسماك الوظيفي وإرسال طلب صرف مكافأة الترقية لاعتماد الإدارة.`,
            'info'
          );
        }
      });
    } catch (e) {
      if (e.message === 'ALREADY_CLAIMED_PROMO') {
        return { status: 400, json: { error: 'لقد قمت بالمطالبة بمكافأة الترقية لهذا المنصب مسبقاً' } };
      }
      throw e;
    }

    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message: requireApproval
          ? `تم تسجيل ترقيتك إلى "${targetRank.title}" وإرسال طلب مكافأة ($${bonusAmt.toFixed(2)} USDT) لاعتماد الإدارة!`
          : `مبارك! تمت ترقيتك إلى "${targetRank.title}" وإضافة +$${bonusAmt.toFixed(2)} USDT إلى محفظة الدخل!`,
        user: await serializeUser(sql, updated, settings)
      }
    };
  }

  if (method === 'POST' && path === '/api/team/claim-salary') {
    const rankId = String(body.rankId || '');
    const settings = await getSettingsMap(sql);
    if (settings.salary_system_enabled === 'false') {
      return { status: 400, json: { error: 'نظام الرواتب الشهرية متوقف مؤقتاً من قِبل الإدارة' } };
    }
    const targetRank = parseSalaryRanks(settings).find((r) => r.id === rankId);
    if (!targetRank || Number(targetRank.monthlySalaryUsdt || 0) <= 0) {
      return { status: 400, json: { error: 'هذا المنصب لا يتضمن راتباً شهرياً أو غير صالح' } };
    }
    const serializedMe = await serializeUser(sql, user, settings);
    const m = await evaluateUserTeamMetricsServer(sql, user.id);
    const qualVipCount = m.countVipAtLeast(targetRank.qualifiedVipTier || 1);
    if (
      serializedMe.vipLevel < Number(targetRank.minUserVip || 0) ||
      m.activeDirect < Number(targetRank.minActiveDirect || 0) ||
      m.totalActiveTeam < Number(targetRank.minTotalActiveTeam || 0) ||
      qualVipCount < Number(targetRank.minQualifiedVipCount || 0) ||
      m.monthlyNewMembers < Number(targetRank.minMonthlyNewMembers || 0) ||
      m.teamTotalDeposits < Number(targetRank.minTeamDepositsUsdt || 0)
    ) {
      return { status: 400, json: { error: 'لم تستوفِ بعد جميع الشروط التي حددتها الإدارة لاستحقاق هذا الراتب الشهري' } };
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

    try {
      await sql.begin(async (tx) => {
        const [existing] = await tx`
          SELECT id FROM arona_boost.salary_claims
          WHERE user_id = ${user.id} AND rank_id = ${targetRank.id} AND period_month = ${periodMonth} AND status != 'rejected'
          FOR UPDATE
        `;
        if (existing) throw new Error('ALREADY_CLAIMED_MONTH');
        const status = requireApproval ? 'pending' : 'approved';
        await tx`
          INSERT INTO arona_boost.salary_claims (user_id, rank_id, rank_title, amount, period_month, status, stats_snapshot_json)
          VALUES (${user.id}, ${targetRank.id}, ${targetRank.title}, ${salaryAmt}, ${periodMonth}, ${status}, ${snapshot})
        `;
        if (!requireApproval) {
          await tx`
            UPDATE arona_boost.users
            SET balance = ROUND((balance + ${salaryAmt})::numeric, 2)::float8,
                total_team_earnings = ROUND((total_team_earnings + ${salaryAmt})::numeric, 2)::float8
            WHERE id = ${user.id}
          `;
          await createNotification(
            tx,
            user.id,
            `صرف راتب شهري ثابت +$${salaryAmt.toFixed(2)} USDT 💼`,
            `تم صرف راتب رتبة "${targetRank.title}" لشهر ${periodMonth} وإضافته لرصيدك.`,
            'reward'
          );
        } else {
          await createNotification(
            tx,
            user.id,
            `طلب راتب شهري قيد المراجعة ($${salaryAmt.toFixed(2)} USDT)`,
            `تم إرسال طلب صرف راتب رتبة "${targetRank.title}" لشهر ${periodMonth} لمراجعة الإدارة.`,
            'info'
          );
        }
      });
    } catch (e) {
      if (e.message === 'ALREADY_CLAIMED_MONTH') {
        return { status: 400, json: { error: 'لقد قدمت طلباً أو استلمت راتب هذه الرتبة لهذا الشهر بالفعل' } };
      }
      throw e;
    }

    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message: requireApproval
          ? `تم تقديم طلب صرف راتب "${targetRank.title}" ($${salaryAmt.toFixed(2)} USDT) بنجاح وهو بانتظار اعتماد الإدارة`
          : `مبارك! تم صرف راتب "${targetRank.title}" +$${salaryAmt.toFixed(2)} USDT فوراً لرصيدك`,
        user: await serializeUser(sql, updated, settings)
      }
    };
  }

  if (method === 'POST' && path === '/api/team/claim-milestone') {
    const key = String(body.key || '');
    const target = TEAM_MILESTONES.find((m) => m.key === key);
    if (!target) return { status: 400, json: { error: 'المكافأة المطلوبة غير صالحة' } };
    const [cnt] = await sql`
      SELECT COUNT(*)::int AS c FROM arona_boost.users WHERE referred_by = ${user.id} AND total_deposits > 0
    `;
    if (Number(cnt?.c || 0) < target.requiredActive) {
      return { status: 400, json: { error: `تحتاج إلى ${target.requiredActive} أعضاء مباشرين نشطين لاستلام هذه المكافأة` } };
    }
    try {
      await sql.begin(async (tx) => {
        const [exists] = await tx`
          SELECT id FROM arona_boost.claimed_milestones WHERE user_id = ${user.id} AND milestone_key = ${target.key}
        `;
        if (exists) throw new Error('ALREADY_CLAIMED');
        await tx`
          INSERT INTO arona_boost.claimed_milestones (user_id, milestone_key, reward_amount)
          VALUES (${user.id}, ${target.key}, ${target.reward})
        `;
        await tx`
          UPDATE arona_boost.users
          SET balance = ROUND((balance + ${target.reward})::numeric, 2)::float8,
              total_team_earnings = ROUND((total_team_earnings + ${target.reward})::numeric, 2)::float8
          WHERE id = ${user.id}
        `;
        await createNotification(
          tx,
          user.id,
          `مكافأة إنجاز الفريق +$${target.reward.toFixed(2)} USDT`,
          `مبارك! استلمت مكافأة "${target.title}" وتمت إضافتها إلى رصيدك الحالي.`,
          'reward'
        );
      });
    } catch (e) {
      if (e.message === 'ALREADY_CLAIMED') return { status: 400, json: { error: 'تم استلام هذه المكافأة مسبقاً' } };
      throw e;
    }
    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message: `مبارك! تمت إضافة مكافأة الإنجاز +${target.reward.toFixed(2)} USDT إلى رصيدك`,
        user: await serializeUser(sql, updated)
      }
    };
  }

  // ---- ACCOUNT SETTINGS & SECURITY ----

  if (method === 'PUT' && path === '/api/account/wallet') {
    const walletAddress = String(body.walletAddress || '').trim();
    const network = ['TRC20', 'BEP20'].includes(body.network) ? body.network : 'TRC20';
    const pin = normalizeDigitsAndStrip(body.pin || '');
    if (!walletAddress || walletAddress.length < 12) {
      return { status: 400, json: { error: 'يرجى إدخال عنوان محفظة USDT صحيح' } };
    }
    const [freshUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    if (freshUser.wallet_locked) {
      if (!freshUser.withdraw_pin_hash || !pin || !bcrypt.compareSync(pin, freshUser.withdraw_pin_hash)) {
        return {
          status: 403,
          json: { error: 'عنوان المحفظة مقفل بالحماية المصرفية — يرجى إدخال رمز الحماية المالي (PIN) لتعديل العنوان' }
        };
      }
    }
    await sql`
      UPDATE arona_boost.users
      SET saved_wallet_address = ${walletAddress}, saved_wallet_network = ${network}
      WHERE id = ${user.id}
    `;
    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return { status: 200, json: { message: 'تم حفظ عنوان المحفظة بنجاح', user: await serializeUser(sql, updated) } };
  }

  if (method === 'PUT' && path === '/api/account/pin') {
    const newPin = normalizeDigitsAndStrip(body.newPin || '');
    const currentPinOrPassword = String(body.currentSecret || '');
    if (!/^\d{4,6}$/.test(newPin)) {
      return { status: 400, json: { error: 'يجب أن يتكون رمز الحماية المالي PIN من 4 إلى 6 أرقام' } };
    }
    const [freshUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    if (freshUser.withdraw_pin_hash) {
      const cleanCurrentPin = normalizeDigitsAndStrip(currentPinOrPassword);
      const matchesOldPin = cleanCurrentPin && bcrypt.compareSync(cleanCurrentPin, freshUser.withdraw_pin_hash);
      const matchesPassword = currentPinOrPassword && bcrypt.compareSync(currentPinOrPassword, freshUser.password_hash);
      if (!matchesOldPin && !matchesPassword) {
        return { status: 401, json: { error: 'يرجى إدخال الرمز المالي الحالي أو كلمة مرور الحساب بشكل صحيح للتأكيد' } };
      }
    }
    const pinHash = bcrypt.hashSync(newPin, 10);
    await sql`UPDATE arona_boost.users SET withdraw_pin_hash = ${pinHash} WHERE id = ${user.id}`;
    await createNotification(sql, user.id, 'تحديث رمز الحماية المالي PIN', 'تم تفعيل/تحديث رمز الحماية المالي الخاص بعمليات السحب بنجاح.', 'success');
    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return { status: 200, json: { message: 'تم حفظ رمز الحماية المالي (PIN) بنجاح', user: await serializeUser(sql, updated) } };
  }

  if (method === 'PUT' && path === '/api/account/password') {
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (!currentPassword || !newPassword || newPassword.length < 4) {
      return { status: 400, json: { error: 'يجب أن لا تقل كلمة المرور الجديدة عن 4 أحرف أو أرقام' } };
    }
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return { status: 400, json: { error: 'كلمة المرور الحالية غير صحيحة' } };
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    await sql`UPDATE arona_boost.users SET password_hash = ${newHash} WHERE id = ${user.id}`;
    return { status: 200, json: { message: 'تم تحديث كلمة المرور بنجاح' } };
  }

  if (method === 'GET' && path === '/api/account/security') {
    const [freshUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    const rawSessions = await sql`
      SELECT id, token_sig, device_label, ip_hint, created_at, last_seen_at
      FROM arona_boost.user_sessions
      WHERE user_id = ${user.id} AND is_revoked = 0
      ORDER BY last_seen_at DESC LIMIT 12
    `;
    const sessions = rawSessions.map((s) => ({
      id: s.id,
      deviceLabel: s.device_label,
      ipHint: s.ip_hint,
      createdAt: s.created_at,
      lastSeenAt: s.last_seen_at,
      isCurrent: s.token_sig === tokenSig
    }));
    let securityScore = 45;
    if (freshUser.withdraw_pin_hash) securityScore += 25;
    if (freshUser.saved_wallet_address) securityScore += 15;
    if (freshUser.wallet_locked) securityScore += 15;
    return {
      status: 200,
      json: {
        securityScore: Math.min(100, securityScore),
        walletLocked: Boolean(freshUser.wallet_locked),
        walletLockedAt: freshUser.wallet_locked_at || '',
        savedWalletAddress: freshUser.saved_wallet_address || '',
        savedWalletNetwork: freshUser.saved_wallet_network || 'TRC20',
        hasWithdrawPin: Boolean(freshUser.withdraw_pin_hash),
        sessions
      }
    };
  }

  if (method === 'POST' && path === '/api/account/wallet-lock') {
    const action = body.lock ? 'lock' : 'unlock';
    const pin = normalizeDigitsAndStrip(body.pin || '');
    const [freshUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    if (!freshUser.withdraw_pin_hash) {
      return { status: 400, json: { error: 'يرجى إعداد رمز الحماية المالي (PIN) أولاً لتفعيل قفل محفظة السحب' } };
    }
    if (!freshUser.saved_wallet_address) {
      return { status: 400, json: { error: 'يرجى حفظ عنوان محفظة السحب المعتمدة أولاً قبل تفعيل القفل المصرفي' } };
    }
    if (!pin || !bcrypt.compareSync(pin, freshUser.withdraw_pin_hash)) {
      return { status: 401, json: { error: 'رمز الحماية المالي (PIN) غير صحيح' } };
    }
    if (action === 'lock') {
      await sql`UPDATE arona_boost.users SET wallet_locked = 1, wallet_locked_at = ${nowUtcStr()} WHERE id = ${user.id}`;
    } else {
      await sql`UPDATE arona_boost.users SET wallet_locked = 0, wallet_locked_at = '' WHERE id = ${user.id}`;
    }
    const [updated] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message:
          action === 'lock'
            ? 'تم تفعيل القفل المصرفي لعنوان المحفظة — لن يُسمح بالسحب إلا لعنوانك المعتمد'
            : 'تم فك قفل عنوان المحفظة مؤقتاً لتحديث البيانات',
        user: await serializeUser(sql, updated)
      }
    };
  }

  if (method === 'POST' && path === '/api/account/sessions/revoke-others') {
    const revoked = await sql`
      UPDATE arona_boost.user_sessions
      SET is_revoked = 1
      WHERE user_id = ${user.id} AND token_sig != ${tokenSig || ''} AND is_revoked = 0
      RETURNING id
    `;
    return {
      status: 200,
      json: {
        message:
          revoked.length > 0
            ? `تم إنهاء ${revoked.length} جلسة أخرى بنجاح وتأمين حسابك على هذا الجهاز فقط`
            : 'لا توجد أي جلسات أخرى نشطة خارج جهازك الحالي',
        revokedCount: revoked.length
      }
    };
  }

  const sessRevokeMatch = path.match(/^\/api\/account\/sessions\/(\d+)\/revoke$/);
  if (method === 'POST' && sessRevokeMatch) {
    const sessId = Number(sessRevokeMatch[1]);
    await sql`
      UPDATE arona_boost.user_sessions
      SET is_revoked = 1
      WHERE id = ${sessId} AND user_id = ${user.id} AND token_sig != ${tokenSig || ''}
    `;
    return { status: 200, json: { message: 'تم إنهاء الجلسة المحددة بنجاح' } };
  }

  // ---- SUPPORT CONCIERGE ----

  if (method === 'GET' && path === '/api/support/tickets') {
    const serialized = await serializeUser(sql, user);
    const isPriorityVip = (serialized.vipLevel || 0) >= 3;
    const tickets = await sql`
      SELECT id, ticket_code AS "ticketCode", subject, category, priority, status,
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM arona_boost.support_tickets
      WHERE user_id = ${user.id}
      ORDER BY updated_at DESC, id DESC LIMIT 25
    `;
    const ticketIds = tickets.map((t) => t.id);
    const allMsgs =
      ticketIds.length > 0
        ? await sql`
            SELECT id, ticket_id, sender_role AS "senderRole", body, created_at AS "createdAt"
            FROM arona_boost.support_messages
            WHERE ticket_id IN ${sql(ticketIds)}
            ORDER BY id ASC
          `
        : [];
    const msgMap = new Map();
    for (const m of allMsgs) {
      if (!msgMap.has(m.ticket_id)) msgMap.set(m.ticket_id, []);
      msgMap.get(m.ticket_id).push({ id: m.id, senderRole: m.senderRole, body: m.body, createdAt: m.createdAt });
    }
    return {
      status: 200,
      json: {
        isPriorityVip,
        priorityLabel: isPriorityVip ? `أولوية المساندة التنفيذية (الفئة A${serialized.vipLevel})` : 'مكتب خدمة الأعضاء المعتمد',
        tickets: tickets.map((t) => ({ ...t, messages: msgMap.get(t.id) || [] }))
      }
    };
  }

  if (method === 'POST' && path === '/api/support/tickets') {
    const subject = String(body.subject || '').trim().slice(0, 120);
    const category = String(body.category || 'استفسار عام').trim().slice(0, 40);
    const message = String(body.message || '').trim().slice(0, 1000);
    if (subject.length < 3 || message.length < 4) {
      return { status: 400, json: { error: 'يرجى كتابة عنوان واضح وتفاصيل الرسالة قبل الإرسال' } };
    }
    const serialized = await serializeUser(sql, user);
    const priority = (serialized.vipLevel || 0) >= 3 ? 'vip' : 'standard';
    const ticketCode = generateRefCode('CNG');

    const createdId = await sql.begin(async (tx) => {
      const [tk] = await tx`
        INSERT INTO arona_boost.support_tickets (user_id, ticket_code, subject, category, priority, status)
        VALUES (${user.id}, ${ticketCode}, ${subject}, ${category}, ${priority}, 'open')
        RETURNING id
      `;
      await tx`
        INSERT INTO arona_boost.support_messages (ticket_id, sender_role, body)
        VALUES (${tk.id}, 'user', ${message})
      `;
      return tk.id;
    });

    return {
      status: 201,
      json: {
        message:
          priority === 'vip'
            ? `تم فتح تذكرة أولوية تنفيذية (${ticketCode}) وتحويلها لمشرف الفئات العليا`
            : `تم استلام تذكرتك (${ticketCode}) بنجاح وسيتم الرد عليك في أقرب وقت`,
        ticketId: createdId,
        ticketCode
      }
    };
  }

  const ticketReplyMatch = path.match(/^\/api\/support\/tickets\/(\d+)\/reply$/);
  if (method === 'POST' && ticketReplyMatch) {
    const ticketId = Number(ticketReplyMatch[1]);
    const message = String(body.message || '').trim().slice(0, 1000);
    if (message.length < 2) return { status: 400, json: { error: 'يرجى كتابة نص الرد قبل الإرسال' } };
    const [ticket] = await sql`
      SELECT * FROM arona_boost.support_tickets WHERE id = ${ticketId} AND user_id = ${user.id}
    `;
    if (!ticket) return { status: 404, json: { error: 'لم يتم العثور على هذه التذكرة' } };
    await sql.begin(async (tx) => {
      await tx`INSERT INTO arona_boost.support_messages (ticket_id, sender_role, body) VALUES (${ticketId}, 'user', ${message})`;
      await tx`UPDATE arona_boost.support_tickets SET status = 'open', updated_at = ${nowUtcStr()} WHERE id = ${ticketId}`;
    });
    return { status: 200, json: { message: 'تم إرسال رسالتك إلى مكتب المساندة بنجاح' } };
  }

  // ---- RED ENVELOPE & POINT SHOP ----

  if (method === 'GET' && path === '/api/red-envelope') {
    const claims = await sql`
      SELECT id, code, amount, created_at AS "createdAt"
      FROM arona_boost.red_envelope_claims
      WHERE user_id = ${user.id}
      ORDER BY id DESC LIMIT 50
    `;
    const totalReceived = round2(claims.reduce((s, c) => s + Number(c.amount || 0), 0));
    return { status: 200, json: { claims, totalReceived } };
  }

  if (method === 'POST' && path === '/api/red-envelope/claim') {
    const rawCode = String(body?.code || '').trim().toUpperCase();
    if (!rawCode) return { status: 400, json: { error: 'يرجى إدخال رمز الظرف الأحمر أولاً' } };
    const [envRow] = await sql`SELECT * FROM arona_boost.red_envelopes WHERE UPPER(code) = ${rawCode} LIMIT 1`;
    if (!envRow || !envRow.is_active) {
      return { status: 404, json: { error: 'رمز الظرف الأحمر غير صحيح أو منتهي الصلاحية' } };
    }
    if ((user.vip_level || 0) < (envRow.min_vip || 0)) {
      return { status: 403, json: { error: `هذا الظرف الأحمر مخصص لموظفي الفئة A${envRow.min_vip} فأعلى` } };
    }

    let creditedAmount = 0;
    try {
      await sql.begin(async (tx) => {
        const [freshEnv] = await tx`SELECT * FROM arona_boost.red_envelopes WHERE id = ${envRow.id} FOR UPDATE`;
        if (freshEnv.claimed_count >= freshEnv.max_claims) throw new Error('SOLD_OUT');
        const [existing] = await tx`
          SELECT id FROM arona_boost.red_envelope_claims
          WHERE envelope_id = ${freshEnv.id} AND user_id = ${user.id}
        `;
        if (existing) throw new Error('ALREADY_CLAIMED');
        creditedAmount = round2(freshEnv.reward_amount);
        await tx`UPDATE arona_boost.red_envelopes SET claimed_count = claimed_count + 1 WHERE id = ${freshEnv.id}`;
        await tx`
          INSERT INTO arona_boost.red_envelope_claims (envelope_id, user_id, code, amount)
          VALUES (${freshEnv.id}, ${user.id}, ${freshEnv.code}, ${creditedAmount})
        `;
        await tx`
          UPDATE arona_boost.users
          SET balance = ROUND((balance + ${creditedAmount})::numeric, 2)::float8,
              points_balance = COALESCE(points_balance, 0) + 15
          WHERE id = ${user.id}
        `;
        await tx`
          INSERT INTO arona_boost.point_logs (user_id, delta, reason)
          VALUES (${user.id}, 15, ${`مكافأة نقاط نشاط الظرف الأحمر (${freshEnv.code})`})
        `;
      });
    } catch (e) {
      if (e.message === 'SOLD_OUT') return { status: 400, json: { error: 'نفدت جميع مقاعد هذا الظرف الأحمر، ترقّب الرمز القادم!' } };
      if (e.message === 'ALREADY_CLAIMED') return { status: 400, json: { error: 'لقد قمت باستلام مكافأة هذا الظرف الأحمر مسبقاً' } };
      throw e;
    }

    await createNotification(
      sql,
      user.id,
      `مكافأة الظرف الأحمر +$${creditedAmount.toFixed(2)} USDT`,
      `تهانينا! تم إيداع مكافأة الظرف الأحمر (${envRow.code}) بقيمة $${creditedAmount.toFixed(2)} USDT مباشرة في محفظة الدخل.`,
      'reward'
    );
    const [updatedUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message: `تهانينا! حصلت على مكافأة الظرف الأحمر +$${creditedAmount.toFixed(2)} USDT في محفظة الدخل`,
        amount: creditedAmount,
        user: await serializeUser(sql, updatedUser)
      }
    };
  }

  if (method === 'GET' && path === '/api/point-shop') {
    const [items, orders, logs, uRows] = await Promise.all([
      sql`
        SELECT id, title, subtitle, points_cost AS "pointsCost",
               official_price_usdt AS "officialPriceUsdt",
               usdt_credit AS "usdtCredit", category, stock
        FROM arona_boost.point_shop_items
        WHERE is_active = 1
        ORDER BY points_cost ASC
      `,
      sql`
        SELECT id, item_title AS "itemTitle", points_spent AS "pointsSpent",
               usdt_credited AS "usdtCredited", shipping_address AS "shippingAddress",
               status, created_at AS "createdAt"
        FROM arona_boost.point_orders
        WHERE user_id = ${user.id}
        ORDER BY id DESC LIMIT 30
      `,
      sql`
        SELECT id, delta, reason, created_at AS "createdAt"
        FROM arona_boost.point_logs
        WHERE user_id = ${user.id}
        ORDER BY id DESC LIMIT 40
      `,
      sql`SELECT points_balance FROM arona_boost.users WHERE id = ${user.id}`
    ]);
    return {
      status: 200,
      json: {
        pointsBalance: Number(uRows[0]?.points_balance || 0),
        items,
        orders,
        logs
      }
    };
  }

  if (method === 'POST' && path === '/api/point-shop/redeem') {
    const itemId = Number(body?.itemId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return { status: 400, json: { error: 'معرّف المنتج المطلوب غير صالح' } };
    }
    const shippingAddress = String(body?.shippingAddress || '').trim();
    const [item] = await sql`SELECT * FROM arona_boost.point_shop_items WHERE id = ${itemId} AND is_active = 1`;
    if (!item) return { status: 404, json: { error: 'المنتج المطلوب غير متوفر حالياً' } };
    if (item.category === 'physical' && shippingAddress.length < 6) {
      return { status: 400, json: { error: 'يرجى إدخال عنوان الاستلام ورقم التواصل لشحن الهدية العينية' } };
    }

    try {
      await sql.begin(async (tx) => {
        const [freshUser] = await tx`SELECT * FROM arona_boost.users WHERE id = ${user.id} FOR UPDATE`;
        const [freshItem] = await tx`SELECT * FROM arona_boost.point_shop_items WHERE id = ${itemId} FOR UPDATE`;
        if (freshItem.stock <= 0) throw new Error('OUT_OF_STOCK');
        if ((freshUser.points_balance || 0) < freshItem.points_cost) throw new Error('INSUFFICIENT_POINTS');
        const creditUsdt = round2(freshItem.usdt_credit || 0);
        const orderStatus = creditUsdt > 0 ? 'completed' : 'processing';
        await tx`UPDATE arona_boost.point_shop_items SET stock = stock - 1 WHERE id = ${itemId}`;
        await tx`
          UPDATE arona_boost.users
          SET points_balance = points_balance - ${freshItem.points_cost},
              balance = ROUND((balance + ${creditUsdt})::numeric, 2)::float8
          WHERE id = ${user.id}
        `;
        await tx`
          INSERT INTO arona_boost.point_orders (user_id, item_id, item_title, points_spent, usdt_credited, shipping_address, status)
          VALUES (${user.id}, ${itemId}, ${freshItem.title}, ${freshItem.points_cost}, ${creditUsdt}, ${shippingAddress}, ${orderStatus})
        `;
        await tx`
          INSERT INTO arona_boost.point_logs (user_id, delta, reason)
          VALUES (${user.id}, ${-freshItem.points_cost}, ${`استبدال من متجر النقاط: ${freshItem.title}`})
        `;
      });
    } catch (e) {
      if (e.message === 'OUT_OF_STOCK') return { status: 400, json: { error: 'نفدت الكمية المتاحة لهذا العنصر' } };
      if (e.message === 'INSUFFICIENT_POINTS') return { status: 400, json: { error: 'رصيد نقاطك الحالي غير كافٍ لاستبدال هذا المنتج' } };
      throw e;
    }

    const creditUsdt = round2(item.usdt_credit || 0);
    await createNotification(
      sql,
      user.id,
      'استبدال ناجح من متجر النقاط',
      creditUsdt > 0
        ? `تم استبدال "${item.title}" وإيداع +$${creditUsdt.toFixed(2)} USDT فوراً في محفظة الدخل.`
        : `تم تسجيل طلب شحن "${item.title}" بنجاح وسيتم التواصل معك للتسليم.`,
      'reward'
    );
    const [updatedUser] = await sql`SELECT * FROM arona_boost.users WHERE id = ${user.id}`;
    return {
      status: 200,
      json: {
        message:
          creditUsdt > 0
            ? `تم استبدال النقاط وإيداع +$${creditUsdt.toFixed(2)} USDT في محفظة الدخل!`
            : `تم تأكيد استبدال "${item.title}" وتسجيل عنوان الشحن بنجاح!`,
        user: await serializeUser(sql, updatedUser)
      }
    };
  }

  return null;
}
