import { validatePhoneNumber } from './phoneValidator';

const STATE_KEY = 'arona_gh_pages_state_v1';

const DEFAULT_VIP_LEVELS = [
  { level: 0, name: 'الفئة A0', title: 'متدرب تقييم رقمي', subtitle: 'فترة تجربة مجانية لتقييم وجهة يومياً', minDeposit: 0, dailyTasks: 1, rewardPerTask: 0.25, dailyProfit: 0.25, monthlyProfit: 7.5, dailyRate: 'تجريبي', perks: ['تقييم وجهة يومياً', 'تسوية USDT فورية'] },
  { level: 1, name: 'الفئة A1', title: 'مقيّم وجهات معتمد', subtitle: 'عقد توظيف أساسي بعائد يومي ثابت', minDeposit: 20, dailyTasks: 3, rewardPerTask: 0.25, dailyProfit: 0.75, monthlyProfit: 22.5, dailyRate: '3.75%', perks: ['3 عقود يومياً', 'عائد 0.75 USDT'] },
  { level: 2, name: 'الفئة A2', title: 'مقيّم منشآت فندقية', subtitle: 'تصنيف الفنادق والمنتجعات الشريكة', minDeposit: 60, dailyTasks: 4, rewardPerTask: 0.6, dailyProfit: 2.4, monthlyProfit: 72, dailyRate: '4.0%', perks: ['4 عقود يومياً', 'عائد 2.40 USDT'] },
  { level: 3, name: 'الفئة A3', title: 'أخصائي تصنيف سياحي', subtitle: 'تقييم المنتجعات والفنادق والمعالم الدولية', minDeposit: 150, dailyTasks: 5, rewardPerTask: 1.28, dailyProfit: 6.38, monthlyProfit: 191.25, dailyRate: '4.25%', perks: ['5 عقود دولية يومياً', 'عائد 6.38 USDT'] },
  { level: 4, name: 'الفئة A4', title: 'مستشار تقييم ضيافة', subtitle: 'تقييم منشآت الخمس نجوم العالمية', minDeposit: 400, dailyTasks: 6, rewardPerTask: 3.0, dailyProfit: 18.0, monthlyProfit: 540, dailyRate: '4.5%', perks: ['6 عقود يومياً', 'عائد 18.00 USDT'] },
  { level: 5, name: 'الفئة A5', title: 'مشرف ترويج إقليمي', subtitle: 'إدارة عقود الترويج الكبرى للمنتجعات', minDeposit: 1000, dailyTasks: 8, rewardPerTask: 6.0, dailyProfit: 48.0, monthlyProfit: 1440, dailyRate: '4.8%', perks: ['8 عقود يومياً', 'عائد 48.00 USDT'] },
  { level: 6, name: 'الفئة A6', title: 'شريك أرونا التنفيذي', subtitle: 'أعلى فئة تعاقدية في منظومة أرونا بوست', minDeposit: 2500, dailyTasks: 10, rewardPerTask: 12.5, dailyProfit: 125.0, monthlyProfit: 3750, dailyRate: '5.0%', perks: ['10 عقود يومياً', 'عائد 125.00 USDT'] }
];

const STATIC_POOL = [
  { slot: 1, key: 'maldives_resort', sectorType: 'resort', sectorBadge: 'عقد منتجع عالمي', codePrefix: '#MLE', title: 'منتجعات جزر المالديف الفيروزية العائمة', location: 'ماليه، جزر المالديف', category: 'منتجعات جزر استوائية فاخرة', avgRating: 5.0, reviewsCount: '19.4K', image: '/destinations/dest-7.jpg', fallbackImage: '/destinations/dest-7.jpg', gallery: ['/destinations/dest-7.jpg', '/destinations/dest-8.jpg'], description: 'فلل وأجنحة خشبية عائمة فوق المياه الفيروزية الصافية والشعاب المرجانية النادرة.' },
  { slot: 2, key: 'dubai_hotel', sectorType: 'hotel', sectorBadge: 'عقد فندق عالمي', codePrefix: '#DXB', title: 'فنادق وأجنحة بوليفارد دبي ونخلة جميرا', location: 'دبي، الإمارات العربية المتحدة', category: 'فنادق 5 نجوم وأجنحة ملكية', avgRating: 4.9, reviewsCount: '21.4K', image: '/destinations/dest-1.jpg', fallbackImage: '/destinations/dest-1.jpg', gallery: ['/destinations/dest-1.jpg', '/destinations/dest-2.jpg'], description: 'أفخم الفنادق والأجنحة التنفيذية المطلة مباشرة على نافورة دبي وأفق الخليج العربي.' },
  { slot: 3, key: 'petra_landmark', sectorType: 'landmark', sectorBadge: 'عقد معلم سياحي', codePrefix: '#PTR', title: 'مدينة البتراء الوردية ومحمية وادي رم', location: 'معان والعقبة، الأردن', category: 'عجائب العالم والمعالم الأثرية', avgRating: 4.9, reviewsCount: '24.5K', image: '/destinations/dest-4.jpg', fallbackImage: '/destinations/dest-4.jpg', gallery: ['/destinations/dest-4.jpg', '/destinations/dest-3.jpg'], description: 'إحدى عجائب الدنيا السبع الجديدة المحفورة في الصخور الوردية عبر ممر السيق التاريخي.' },
  { slot: 4, key: 'swiss_alps_resort', sectorType: 'resort', sectorBadge: 'عقد منتجع عالمي', codePrefix: '#ZRH', title: 'منتجع بحيرة إنترلاكن وجبال الألب السويسرية', location: 'إنترلاكن وزيورخ، سويسرا', category: 'منتجعات جبلية وبحيرات عالمية', avgRating: 4.9, reviewsCount: '13.4K', image: '/destinations/dest-10.jpg', fallbackImage: '/destinations/dest-10.jpg', gallery: ['/destinations/dest-10.jpg', '/destinations/dest-8.jpg'], description: 'منتجعات جبلية سويسرية فاخرة تحيط بها البحيرات الزمردية وقمم الألب الثلجية.' },
  { slot: 5, key: 'giza_landmark', sectorType: 'landmark', sectorBadge: 'عقد معلم سياحي', codePrefix: '#CAI', title: 'أهرامات الجيزة وتمثال أبو الهول وضفاف النيل', location: 'القاهرة والجيزة، مصر', category: 'معالم الحضارة الإنسانية الخالدة', avgRating: 4.9, reviewsCount: '29.1K', image: '/destinations/dest-5.jpg', fallbackImage: '/destinations/dest-5.jpg', gallery: ['/destinations/dest-5.jpg', '/destinations/dest-6.jpg'], description: 'أشهر مقصد أثري وسياحي في العالم يجمع عظمة الأهرامات الخالدة وجولات نهر النيل.' }
];

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const initial = {
    user: {
      id: 2,
      phone: '0991112233',
      maskedPhone: '099***2233',
      inviteCode: 'AB77889',
      balance: 342.75,
      rechargeBalance: 25.0,
      pointsBalance: 680,
      jobTitle: 'موظف رسمي',
      vipLevel: 3,
      workGuarantee: {
        amount: 150,
        startDate: '2026-11-01',
        expiresDate: '2027-11-01',
        remainingDays: 362,
        canRefund: false
      },
      totalCumulativeEarnings: 248.5,
      yesterdayEarnings: 6.38,
      thisWeekEarnings: 31.9,
      thisMonthEarnings: 112.4,
      totalDeposits: 175,
      totalWithdrawals: 60,
      totalTaskEarnings: 199,
      totalTeamEarnings: 49.5,
      spinCredits: 2,
      savedWalletAddress: 'TX8k9AronaBoostVerifiedWallet9921',
      savedWalletNetwork: 'TRC20',
      hasWithdrawPin: true,
      unreadNotifications: 1,
      isAdmin: false,
      createdAt: '2026-10-25T10:00:00Z'
    },
    completedSlots: {},
    redClaims: [],
    pointOrders: []
  };
  saveState(initial);
  return initial;
}

function saveState(st) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(st));
  } catch {
    // ignore
  }
}

export async function handleStaticPagesApi(endpoint, { method = 'GET', body } = {}) {
  const path = endpoint.split('?')[0];
  const st = loadState();
  const vip = DEFAULT_VIP_LEVELS.find((v) => v.level === (st.user.vipLevel || 0)) || DEFAULT_VIP_LEVELS[0];
  const doneCount = Object.keys(st.completedSlots || {}).length;

  const baseConfig = {
    whatsappNumber: '963990000000',
    liveTickerEnabled: true,
    vipLevels: DEFAULT_VIP_LEVELS,
    withdrawPresets: [20, 80, 200, 800, 2000, 5000],
    guaranteeDurationDays: 365,
    minDeposit: 10,
    minWithdraw: 5,
    withdrawFeePercent: 10,
    welcomePopup: {
      enabled: true,
      title: 'إشعار الموظفين الرسمي — Arona Boost',
      body: 'مرحباً بك في نسخة العرض التفاعلية لمنصة Arona Boost.\n• يمكنك تجربة عقود المنتجعات والفنادق والمعالم السياحية وفعالية الظرف الأحمر (الكود: ARONA2026) ومتجر النقاط مباشرة.'
    }
  };

  const todayStats = {
    todayCompletedCount: doneCount,
    todayTaskEarnings: Number((doneCount * vip.rewardPerTask).toFixed(2)),
    dailyTasksLimit: vip.dailyTasks,
    dailyProfitPotential: vip.dailyProfit
  };

  if (path === '/api/public-config') return baseConfig;
  if (path === '/api/validate-phone' || path === '/api/admin/validate-phone') {
    return validatePhoneNumber(body?.phone || '', body?.countryCode || 'LOCAL');
  }

  if (path === '/api/auth/login' || path === '/api/auth/register') {
    const rawPhone = String(body?.phone || '0991112233').trim();
    const isAdminLogin = rawPhone.includes('990000000');
    st.user.phone = rawPhone;
    st.user.isAdmin = isAdminLogin;
    saveState(st);
    return {
      token: 'gh-pages-demo-token',
      user: st.user,
      todayStats,
      ...baseConfig
    };
  }

  if (path === '/api/me') {
    return { user: st.user, todayStats, ...baseConfig };
  }

  if (path === '/api/destinations/featured') {
    return { items: STATIC_POOL };
  }

  if (path === '/api/tasks') {
    const activeTasks = STATIC_POOL.slice(0, vip.dailyTasks).map((item, idx) => ({
      ...item,
      slot: idx + 1,
      reward: vip.rewardPerTask,
      completed: Boolean(st.completedSlots[idx + 1]),
      userRating: st.completedSlots[idx + 1]?.rating || null
    }));
    return {
      currentVip: vip,
      nextVip: DEFAULT_VIP_LEVELS[vip.level + 1] || null,
      activeTasks,
      lockedPreviewTasks: [],
      flashMissions: [],
      history: Object.values(st.completedSlots),
      todayStats
    };
  }

  if (path === '/api/tasks/complete' && method === 'POST') {
    const slot = Number(body?.slot || 1);
    const matched = STATIC_POOL[(slot - 1) % STATIC_POOL.length];
    st.completedSlots[slot] = {
      id: Date.now(),
      title: matched.title,
      location: matched.location,
      imageUrl: matched.image,
      reward: vip.rewardPerTask,
      rating: body?.rating || 5,
      vipLevel: vip.level,
      createdAt: new Date().toISOString()
    };
    st.user.balance = Number((st.user.balance + vip.rewardPerTask).toFixed(2));
    st.user.pointsBalance = (st.user.pointsBalance || 0) + 10;
    st.user.totalCumulativeEarnings = Number((st.user.totalCumulativeEarnings + vip.rewardPerTask).toFixed(2));
    saveState(st);
    return {
      message: `تم اعتماد التقرير وإيداع +${vip.rewardPerTask.toFixed(2)} USDT (+10 نقاط)`,
      user: st.user,
      todayStats: {
        ...todayStats,
        todayCompletedCount: Object.keys(st.completedSlots).length,
        todayTaskEarnings: Number((Object.keys(st.completedSlots).length * vip.rewardPerTask).toFixed(2))
      }
    };
  }

  if (path === '/api/red-envelope') {
    const totalReceived = st.redClaims.reduce((s, c) => s + c.amount, 0);
    return { claims: st.redClaims, totalReceived };
  }

  if (path === '/api/red-envelope/claim' && method === 'POST') {
    const code = String(body?.code || '').trim().toUpperCase();
    const amount = code === 'VIPBOOST' ? 5.0 : 1.5;
    st.redClaims.unshift({ id: Date.now(), code: code || 'ARONA2026', amount, createdAt: new Date().toISOString() });
    st.user.balance = Number((st.user.balance + amount).toFixed(2));
    st.user.pointsBalance = (st.user.pointsBalance || 0) + 15;
    saveState(st);
    return {
      message: `تهانينا! حصلت على مكافأة الظرف الأحمر +$${amount.toFixed(2)} USDT`,
      amount,
      user: st.user
    };
  }

  if (path === '/api/point-shop') {
    return {
      pointsBalance: st.user.pointsBalance || 680,
      items: [
        { id: 1, title: 'قسيمة رصيد نقدي 2 USDT', subtitle: 'تُضاف فوراً إلى محفظة الدخل', pointsCost: 200, officialPriceUsdt: 2, usdtCredit: 2, category: 'voucher', stock: 99 },
        { id: 2, title: 'قسيمة رصيد نقدي 10 USDT', subtitle: 'تُضاف فوراً إلى محفظة الدخل', pointsCost: 850, officialPriceUsdt: 10, usdtCredit: 10, category: 'voucher', stock: 99 },
        { id: 3, title: 'هاتف iPhone 17 Pro Max', subtitle: 'الجائزة الكبرى لمتجر نقاط أرونا بوست', pointsCost: 18000, officialPriceUsdt: 1199, usdtCredit: 0, category: 'physical', stock: 12 }
      ],
      orders: st.pointOrders || [],
      logs: [{ id: 1, delta: 680, reason: 'رصيد نقاط ترحيبي وتقييمات معتمدة', createdAt: new Date().toISOString() }]
    };
  }

  if (path === '/api/point-shop/redeem' && method === 'POST') {
    st.user.pointsBalance = Math.max(0, (st.user.pointsBalance || 680) - 200);
    st.user.balance = Number((st.user.balance + 2).toFixed(2));
    st.pointOrders.unshift({ id: Date.now(), itemTitle: 'قسيمة رصيد نقدي 2 USDT', pointsSpent: 200, status: 'completed', createdAt: new Date().toISOString() });
    saveState(st);
    return { message: 'تم استبدال النقاط وإيداع +$2.00 USDT في محفظة الدخل!', user: st.user };
  }

  if (path === '/api/transactions') return { transactions: [] };
  if (path === '/api/notifications') return { notifications: [] };
  if (path === '/api/team') {
    return {
      inviteCode: st.user.inviteCode,
      totalTeamSize: 14,
      totalCommissions: 49.5,
      tiers: { tier1: { count: 6, totalCommission: 26 }, tier2: { count: 5, totalCommission: 16 }, tier3: { count: 3, totalCommission: 7.5 } },
      members: [],
      recentCommissions: [],
      milestones: [],
      salaryProgram: { ranks: [] }
    };
  }
  if (path === '/api/financial-records') return { dailyStatements: [], ledgerEntries: [] };
  if (path === '/api/vault') return { plans: [], locks: [], lockedTotal: 0 };
  if (path === '/api/wheel') return { spinCredits: st.user.spinCredits || 1, segments: [], history: [] };
  if (path === '/api/support/tickets') return { tickets: [] };
  if (path === '/api/transparency-metrics') {
    return { avgSettlementMinutes: 4.2, blockchainAuditRatePct: 99.8, totalHospitalityReports: 14820, contractedHotelsTotal: 199, regionalHubs: [] };
  }

  return { message: 'تم التنفيذ بنجاح', user: st.user };
}
