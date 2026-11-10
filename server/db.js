const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'arona.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 8000');
db.pragma('foreign_keys = ON');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const DEFAULT_VIP_LEVELS = [
  {
    level: 0,
    name: 'الفئة A0',
    title: 'متدرب تقييم رقمي',
    subtitle: 'فترة تجربة مجانية لتقييم وجهة سياحية يومياً عبر منظومة أرونا',
    minDeposit: 0,
    dailyTasks: 1,
    rewardPerTask: 0.25,
    dailyProfit: 0.25,
    monthlyProfit: 7.5,
    dailyRate: 'تجريبي',
    badgeColor: 'slate',
    perks: ['تقييم وجهة سياحية واحدة يومياً', 'تسوية العوائد بعملة USDT', 'تفعيل فوري عند التسجيل']
  },
  {
    level: 1,
    name: 'الفئة A1',
    title: 'مقيّم وجهات معتمد',
    subtitle: 'عقد توظيف أساسي لتقييم الوجهات السياحية المتعاقدة بعائد يومي ثابت',
    minDeposit: 20,
    dailyTasks: 3,
    rewardPerTask: 0.25,
    dailyProfit: 0.75,
    monthlyProfit: 22.5,
    dailyRate: '3.75%',
    badgeColor: 'amber',
    perks: ['تقييم 3 وجهات سياحية يومياً', 'عائد يومي 0.75 USDT', 'سحب سريع عبر TRC20 و BEP20']
  },
  {
    level: 2,
    name: 'الفئة A2',
    title: 'مقيّم منشآت فندقية',
    subtitle: 'تصنيف الفنادق والمعالم السياحية الشريكة بـ 4 مهام يومية منتظمة',
    minDeposit: 60,
    dailyTasks: 4,
    rewardPerTask: 0.6,
    dailyProfit: 2.4,
    monthlyProfit: 72,
    dailyRate: '4.0%',
    badgeColor: 'blue',
    perks: ['تقييم 4 منشآت ووجهات يومياً', 'عائد يومي 2.40 USDT', 'أولوية معالجة طلبات السحب']
  },
  {
    level: 3,
    name: 'الفئة A3',
    title: 'أخصائي تصنيف سياحي',
    subtitle: 'تقييم أشهر الوجهات والمنتجعات الإقليمية والدولية بعائد مجزٍ ومستقر',
    minDeposit: 150,
    dailyTasks: 5,
    rewardPerTask: 1.28,
    dailyProfit: 6.38,
    monthlyProfit: 191.25,
    dailyRate: '4.25%',
    badgeColor: 'yellow',
    perks: ['تقييم 5 وجهات دولية يومياً', 'عائد يومي 6.38 USDT', 'عمولات فريق معززة ودعم مخصص']
  },
  {
    level: 4,
    name: 'الفئة A4',
    title: 'مستشار تقييم ضيافة',
    subtitle: 'مخصص لتقييم المنتجعات الكبرى والمنشآت الفندقية الفاخرة',
    minDeposit: 400,
    dailyTasks: 6,
    rewardPerTask: 3.0,
    dailyProfit: 18.0,
    monthlyProfit: 540,
    dailyRate: '4.5%',
    badgeColor: 'indigo',
    perks: ['تقييم 6 منشآت كبرى يومياً', 'عائد يومي 18.00 USDT', 'تسوية فورية ذات أولوية عليا']
  },
  {
    level: 5,
    name: 'الفئة A5',
    title: 'مشرف ترويج إقليمي',
    subtitle: 'إدارة تقييمات الوجهات السياحية النخبوية ضمن عقود الشراكة الإقليمية',
    minDeposit: 1000,
    dailyTasks: 8,
    rewardPerTask: 6.0,
    dailyProfit: 48.0,
    monthlyProfit: 1440,
    dailyRate: '4.8%',
    badgeColor: 'cyan',
    perks: ['تقييم 8 وجهات نخبوية يومياً', 'عائد يومي 48.00 USDT', 'مشرف متابعة حساب مخصص 24/7']
  },
  {
    level: 6,
    name: 'الفئة A6',
    title: 'شريك أرونا التنفيذي',
    subtitle: 'أعلى درجة تعاقدية في Arona Boost لخبراء التصنيف والترويج السياحي',
    minDeposit: 2500,
    dailyTasks: 10,
    rewardPerTask: 12.5,
    dailyProfit: 125.0,
    monthlyProfit: 3750,
    dailyRate: '5.0%',
    badgeColor: 'emerald',
    perks: ['تقييم 10 وجهات يومياً', 'عائد يومي 125.00 USDT', 'سقف سحب مفتوح وامتيازات تنفيذية']
  }
];

const DEFAULT_ANNOUNCEMENTS = [
  'تتجدد صور ومعالم الوجهات السياحية تلقائياً على مدار الساعة لجميع الموظفين المعتمدين',
  'أمان مصرفي مضاعف للمحافظ عبر رمز الحماية المالي PIN وتوثيق عقود البلوكتشين TXID',
  'ترقّ في سلم المناصب الرسمي واحصل على مكافآت رحلة النجوم والرواتب الشهرية الثابتة بعملة USDT'
];

const CHECKIN_REWARDS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.35, 0.50];

const TEAM_MILESTONES = [
  { key: 'team_3', requiredActive: 3, reward: 3.0, title: 'بناء النواة الأولى (3 أعضاء نشطين)' },
  { key: 'team_10', requiredActive: 10, reward: 12.0, title: 'قائد الفريق الفضي (10 أعضاء نشطين)' },
  { key: 'team_25', requiredActive: 25, reward: 35.0, title: 'سفير Arona الذهبي (25 عضواً نشطاً)' }
];

const TASK_CATALOG = [
  {
    slot: 1,
    title: 'برج خليفة ونافورة دبي الراقصة',
    location: 'دبي، الإمارات العربية المتحدة',
    category: 'معالم عصرية فاخرة',
    platform: 'دليل السياحة العربي',
    avgRating: 4.9,
    reviewsCount: '18.4K',
    image: '/destinations/dest-1.jpg',
    description:
      'أطول معلم عمراني في العالم محاط ببحيرة نافورة دبي المضيئة وممشى البوليفارد النابض بالحياة.'
  },
  {
    slot: 2,
    title: 'مضيق البوسفور وجامع أورتاكوي',
    location: 'إسطنبول، تركيا',
    category: 'إطلالات بحرية وتاريخية',
    avgRating: 4.9,
    reviewsCount: '14.2K',
    image: '/destinations/dest-2.jpg',
    description:
      'نقطة التقاء آسيا وأوروبا بإطلالة ساحرة عند الغروب تجمع روعة العمارة العثمانية والجسور المعلقة.'
  },
  {
    slot: 3,
    title: 'محمية العُلا ومدائن صالح التاريخية',
    location: 'العُلا، المملكة العربية السعودية',
    category: 'تراث عالمي وصحراء',
    avgRating: 4.9,
    reviewsCount: '9.8K',
    image: '/destinations/dest-3.jpg',
    description:
      'منحوتات صخرية نبطية مهيبة وسط التكوينات الرملية الذهبية المصنفة ضمن قائمة التراث العالمي.'
  },
  {
    slot: 4,
    title: 'مدينة البتراء الوردية (الخزنة)',
    location: 'معان، الأردن',
    category: 'عجائب الدنيا السبع',
    avgRating: 4.9,
    reviewsCount: '16.5K',
    image: '/destinations/dest-4.jpg',
    description:
      'تحفة معمارية محفورة في الصخور الوردية عبر ممر السيق الشهير وتعد من أبرز عجائب العالم الجديد.'
  },
  {
    slot: 5,
    title: 'أهرامات الجيزة وتمثال أبو الهول',
    location: 'القاهرة، مصر',
    category: 'حضارة وتاريخ عريق',
    avgRating: 4.8,
    reviewsCount: '22.1K',
    image: '/destinations/dest-5.jpg',
    description:
      'أعرق معالم الحضارة الإنسانية الخالدة على هضبة الجيزة مع عروض الصوت والضوء الساحرة.'
  },
  {
    slot: 6,
    title: 'خليج جونيه وجبال لبنان الخضراء',
    location: 'جبل لبنان، لبنان',
    category: 'طبيعة ساحلية وجبال',
    avgRating: 4.8,
    reviewsCount: '8.7K',
    image: '/destinations/dest-6.jpg',
    description:
      'لوحة طبيعية تجمع زرقة البحر الأبيض المتوسط مع قمم الجبال المكسوة بأشجار الصنوبر والتلفريك.'
  },
  {
    slot: 7,
    title: 'منتجعات جزر المالديف الفيروزية',
    location: 'ماليه، جزر المالديف',
    category: 'جزر استوائية وشواطئ',
    avgRating: 5.0,
    reviewsCount: '12.9K',
    image: '/destinations/dest-7.jpg',
    description:
      'أجنحة خشبية عائمة فوق المياه الفيروزية الصافية والشعاب المرجانية النادرة للاستجمام الفاخر.'
  },
  {
    slot: 8,
    title: 'جزيرة سانتوريني المطلة على بحر إيجة',
    location: 'سانتوريني، اليونان',
    category: 'منتجعات وجزر سياحية',
    avgRating: 4.9,
    reviewsCount: '15.3K',
    image: '/destinations/dest-8.jpg',
    description:
      'قرية أويا البيضاء ذات القباب الزرقاء الشهيرة بأجمل إطلالات غروب الشمس فوق بحر إيجة.'
  },
  {
    slot: 9,
    title: 'قصر الحمراء وحدائق العريف',
    location: 'غرناطة، إسبانيا',
    category: 'عمارة أندلسية وتراث',
    avgRating: 4.9,
    reviewsCount: '11.6K',
    image: '/destinations/dest-9.jpg',
    description:
      'درة العمارة الإسلامية الأندلسية بأروقتها المزخرفة ونوافيرها الهادئة المطلة على جبال سييرا نيفادا.'
  },
  {
    slot: 10,
    title: 'بحيرة إنترلاكن وجبال الألب السويسرية',
    location: 'إنترلاكن، سويسرا',
    category: 'بحيرات وطبيعة جبلية',
    avgRating: 4.9,
    reviewsCount: '13.4K',
    image: '/destinations/dest-10.jpg',
    description:
      'مياه زمردية نقية تحيط بها المروج الخضراء وقمم جبال الألب المكللة بالثلوج على مدار العام.'
  }
];

function ensureColumn(tableName, columnName, columnDef) {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!cols.some((c) => c.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
  }
}

function getSettingsMap() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

function getActiveVipLevels() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'vip_levels_json'").get();
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length === DEFAULT_VIP_LEVELS.length) {
        return parsed;
      }
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_VIP_LEVELS;
}

function getAnnouncementsList() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'announcements_json'").get();
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_ANNOUNCEMENTS;
}

const DEFAULT_VAULT_PLANS = [
  {
    id: 'vault_7',
    title: 'محفظة أرونا المرنة — 7 أيام',
    subtitle: 'عقد استثمار قصير الأجل في حملات الترويج الفندقي يعود مع رأس المال تلقائياً',
    durationDays: 7,
    minAmount: 20,
    dailyRatePct: 1.2,
    totalReturnPct: 8.4,
    badge: 'مرنة وسريعة'
  },
  {
    id: 'vault_15',
    title: 'محفظة أرونا السياحية — 15 يوماً',
    subtitle: 'الخيار الأكثر توازناً لتعظيم العوائد التراكمية ضمن مشاريع الضيافة المعتمدة',
    durationDays: 15,
    minAmount: 50,
    dailyRatePct: 1.5,
    totalReturnPct: 22.5,
    badge: 'الأكثر اختياراً'
  },
  {
    id: 'vault_30',
    title: 'محفظة أرونا التنفيذية — 30 يوماً',
    subtitle: 'أعلى عائد استثماري دوري للشركاء والمحافظ الكبرى في Arona Boost',
    durationDays: 30,
    minAmount: 100,
    dailyRatePct: 1.8,
    totalReturnPct: 54.0,
    badge: 'عائد استراتيجي'
  }
];

const DEFAULT_WHEEL_SEGMENTS = [
  { id: 'seg_1', label: '$0.50 USDT', reward: 0.5, weight: 45, color: '#0D9488' },
  { id: 'seg_2', label: '$1.00 USDT', reward: 1.0, weight: 28, color: '#0284C7' },
  { id: 'seg_3', label: '$2.00 USDT', reward: 2.0, weight: 15, color: '#4F46E5' },
  { id: 'seg_4', label: '$5.00 USDT', reward: 5.0, weight: 9, color: '#D97706' },
  { id: 'seg_5', label: '$10.00 USDT', reward: 10.0, weight: 3, color: '#059669' },
  { id: 'seg_6', label: '$25.00 كبرى', reward: 25.0, weight: 0, color: '#E11D48' }
];

const DEFAULT_WITHDRAW_PRESETS = [20, 80, 200, 800, 2000, 5000];

const DEFAULT_SALARY_RANKS = [
  {
    id: 'pos_specialist',
    title: 'أخصائي التوظيف',
    oneTimeBonusUsdt: 50,
    physicalGift: '',
    monthlySalaryUsdt: 0,
    minUserVip: 1,
    minActiveDirect: 6,
    minTotalActiveTeam: 6,
    qualifiedVipTier: 2,
    minQualifiedVipCount: 2,
    minMonthlyNewMembers: 0,
    minTeamDepositsUsdt: 150
  },
  {
    id: 'pos_assistant',
    title: 'مساعد التوظيف',
    oneTimeBonusUsdt: 200,
    physicalGift: '',
    monthlySalaryUsdt: 100,
    minUserVip: 2,
    minActiveDirect: 8,
    minTotalActiveTeam: 30,
    qualifiedVipTier: 2,
    minQualifiedVipCount: 12,
    minMonthlyNewMembers: 15,
    minTeamDepositsUsdt: 800
  },
  {
    id: 'pos_supervisor',
    title: 'مشرف التوظيف',
    oneTimeBonusUsdt: 500,
    physicalGift: '',
    monthlySalaryUsdt: 300,
    minUserVip: 3,
    minActiveDirect: 15,
    minTotalActiveTeam: 100,
    qualifiedVipTier: 3,
    minQualifiedVipCount: 40,
    minMonthlyNewMembers: 80,
    minTeamDepositsUsdt: 2500
  },
  {
    id: 'pos_manager',
    title: 'مدير التوظيف',
    oneTimeBonusUsdt: 2000,
    physicalGift: 'هاتف iPhone 17 Pro Max',
    monthlySalaryUsdt: 500,
    minUserVip: 4,
    minActiveDirect: 25,
    minTotalActiveTeam: 300,
    qualifiedVipTier: 3,
    minQualifiedVipCount: 120,
    minMonthlyNewMembers: 150,
    minTeamDepositsUsdt: 7500
  },
  {
    id: 'pos_regional_director',
    title: 'مدير التوظيف الإقليمي',
    oneTimeBonusUsdt: 5000,
    physicalGift: 'سيارة سيدان حديثة',
    monthlySalaryUsdt: 2000,
    minUserVip: 5,
    minActiveDirect: 40,
    minTotalActiveTeam: 800,
    qualifiedVipTier: 3,
    minQualifiedVipCount: 300,
    minMonthlyNewMembers: 450,
    minTeamDepositsUsdt: 20000
  }
];

function getWithdrawPresets() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'withdraw_presets_json'").get();
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((n) => Number(n)).filter((n) => n > 0);
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_WITHDRAW_PRESETS;
}

function getVaultPlans() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'vault_plans_json'").get();
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_VAULT_PLANS;
}

function getWheelSegments() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'lucky_wheel_json'").get();
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length >= 4) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_WHEEL_SEGMENTS;
}

function getSalaryRanks() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'salary_ranks_json'").get();
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_SALARY_RANKS;
}

function grantDepositWheelSpins(userId, depositAmount) {
  const settings = getSettingsMap();
  const minDep = Number(settings.wheel_min_deposit || 20);
  if (Number(depositAmount) < minDep) return 0;

  db.prepare('UPDATE users SET spin_credits = spin_credits + 1 WHERE id = ?').run(userId);
  createNotification(
    userId,
    'مكافأة عجلة الحظ 🎡 (+1 لفة مجانية)',
    `حصلت على لفة حظ مجانية في عجلة Arona Boost بمناسبة إيداعك بقيمة $${Number(
      depositAmount
    ).toFixed(2)} USDT!`,
    'reward'
  );

  if (settings.wheel_referrer_spin !== 'false') {
    const u = db.prepare('SELECT referred_by FROM users WHERE id = ?').get(userId);
    if (u && u.referred_by) {
      db.prepare('UPDATE users SET spin_credits = spin_credits + 1 WHERE id = ?').run(u.referred_by);
      createNotification(
        u.referred_by,
        'لفة حظ مجانية من نشاط فريقك 🎡',
        'حصلت على +1 لفة مجانية في عجلة الحظ بعد إتمام أحد أعضاء فريقك المباشرين لإيداع مؤهل!',
        'reward'
      );
    }
  }
  return 1;
}

function computeQualifiedVip(totalDeposits) {
  const levels = getActiveVipLevels();
  let qualified = 0;
  for (const v of levels) {
    if (totalDeposits >= v.minDeposit) {
      qualified = v.level;
    }
  }
  return qualified;
}

function createNotification(userId, title, body, type = 'info') {
  db.prepare(`
    INSERT INTO notifications (user_id, title, body, type, is_read)
    VALUES (?, ?, ?, ?, 0)
  `).run(userId, title, body, type);
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      withdraw_pin_hash TEXT DEFAULT '',
      invite_code TEXT UNIQUE NOT NULL,
      referred_by INTEGER REFERENCES users(id),
      balance REAL NOT NULL DEFAULT 0,
      total_deposits REAL NOT NULL DEFAULT 0,
      total_withdrawals REAL NOT NULL DEFAULT 0,
      total_task_earnings REAL NOT NULL DEFAULT 0,
      total_team_earnings REAL NOT NULL DEFAULT 0,
      vip_level INTEGER NOT NULL DEFAULT 0,
      saved_wallet_address TEXT DEFAULT '',
      saved_wallet_network TEXT DEFAULT 'TRC20',
      checkin_streak INTEGER NOT NULL DEFAULT 0,
      last_checkin_date TEXT DEFAULT '',
      is_banned INTEGER NOT NULL DEFAULT 0,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('deposit', 'withdraw')),
      amount REAL NOT NULL,
      fee_amount REAL NOT NULL DEFAULT 0,
      net_amount REAL NOT NULL DEFAULT 0,
      network TEXT NOT NULL DEFAULT 'TRC20',
      wallet_or_txid TEXT DEFAULT '',
      reference_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'rejected')),
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      task_slot INTEGER NOT NULL,
      task_title TEXT NOT NULL,
      vip_level INTEGER NOT NULL,
      reward REAL NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      review_tags TEXT DEFAULT '',
      review_comment TEXT DEFAULT '',
      location TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      completed_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, task_slot, completed_date)
    );

    CREATE TABLE IF NOT EXISTS team_commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      beneficiary_id INTEGER NOT NULL REFERENCES users(id),
      source_user_id INTEGER NOT NULL REFERENCES users(id),
      tier INTEGER NOT NULL CHECK(tier IN (1, 2, 3)),
      base_amount REAL NOT NULL,
      commission_amount REAL NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS claimed_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      milestone_key TEXT NOT NULL,
      reward_amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, milestone_key)
    );

    CREATE TABLE IF NOT EXISTS admin_notification_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scope TEXT NOT NULL DEFAULT 'broadcast',
      target_label TEXT NOT NULL DEFAULT 'جميع الأعضاء',
      recipients_count INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vault_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      plan_id TEXT NOT NULL,
      plan_title TEXT NOT NULL,
      amount REAL NOT NULL,
      daily_rate_pct REAL NOT NULL,
      total_return_pct REAL NOT NULL,
      expected_profit REAL NOT NULL,
      duration_days INTEGER NOT NULL,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      matures_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'claimed')),
      claimed_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS wheel_spins_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      segment_label TEXT NOT NULL,
      reward_amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS salary_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      rank_id TEXT NOT NULL,
      rank_title TEXT NOT NULL,
      amount REAL NOT NULL,
      period_month TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      stats_snapshot_json TEXT DEFAULT '{}',
      admin_note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      decided_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS flash_missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'وجهة استثنائية محدودة',
      description TEXT DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '/destinations/dest-7.jpg',
      reward REAL NOT NULL,
      min_vip_level INTEGER NOT NULL DEFAULT 1,
      max_claims INTEGER NOT NULL DEFAULT 25,
      claimed_count INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS flash_mission_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id INTEGER NOT NULL REFERENCES flash_missions(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      reward REAL NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      review_comment TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(mission_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS claimed_position_bonuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      rank_id TEXT NOT NULL,
      rank_title TEXT NOT NULL,
      bonus_amount REAL NOT NULL DEFAULT 0,
      physical_gift TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      decided_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      ticket_code TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      priority TEXT NOT NULL DEFAULT 'standard',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'answered', 'closed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS support_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES support_tickets(id),
      sender_role TEXT NOT NULL CHECK(sender_role IN ('user', 'admin')),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token_sig TEXT NOT NULL,
      device_label TEXT NOT NULL DEFAULT 'جهاز متصفح معتمد',
      ip_hint TEXT NOT NULL DEFAULT '',
      is_revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, token_sig)
    );
  `);

  // Safe migrations for existing databases
  ensureColumn('users', 'withdraw_pin_hash', "TEXT DEFAULT ''");
  ensureColumn('users', 'checkin_streak', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('users', 'last_checkin_date', "TEXT DEFAULT ''");
  ensureColumn('users', 'is_banned', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('users', 'spin_credits', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('users', 'recharge_balance', 'REAL NOT NULL DEFAULT 0');
  ensureColumn('users', 'work_guarantee_amount', 'REAL NOT NULL DEFAULT 0');
  ensureColumn('users', 'work_guarantee_start', "TEXT DEFAULT ''");
  ensureColumn('users', 'work_guarantee_expires', "TEXT DEFAULT ''");
  ensureColumn('users', 'job_title', "TEXT DEFAULT ''");
  ensureColumn('users', 'wallet_locked', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('users', 'wallet_locked_at', "TEXT DEFAULT ''");

  ensureColumn('transactions', 'fee_amount', 'REAL NOT NULL DEFAULT 0');
  ensureColumn('transactions', 'net_amount', 'REAL NOT NULL DEFAULT 0');
  ensureColumn('transactions', 'chain_status', "TEXT DEFAULT 'unverified'");
  ensureColumn('transactions', 'chain_details_json', "TEXT DEFAULT ''");

  ensureColumn('task_completions', 'rating', 'INTEGER NOT NULL DEFAULT 5');
  ensureColumn('task_completions', 'review_tags', "TEXT DEFAULT ''");
  ensureColumn('task_completions', 'review_comment', "TEXT DEFAULT ''");
  ensureColumn('task_completions', 'location', "TEXT DEFAULT ''");
  ensureColumn('task_completions', 'image_url', "TEXT DEFAULT ''");

  // Backfill net_amount on legacy transactions if 0
  db.prepare('UPDATE transactions SET net_amount = amount WHERE net_amount = 0 AND amount > 0').run();
  db.prepare('UPDATE task_completions SET reward = 1.28 WHERE reward = 2.55 AND vip_level = 3').run();

  // Ensure Demo user has default PIN '1234' if empty so testing Withdraw works seamlessly
  const demoRow = db.prepare("SELECT id, withdraw_pin_hash FROM users WHERE phone = '0991112233'").get();
  if (demoRow && !demoRow.withdraw_pin_hash) {
    db.prepare('UPDATE users SET withdraw_pin_hash = ? WHERE id = ?').run(
      bcrypt.hashSync('1234', 10),
      demoRow.id
    );
  }
  if (demoRow) {
    const notifCnt = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ?').get(demoRow.id).c;
    if (notifCnt === 0) {
      createNotification(
        demoRow.id,
        'مرحباً بك في Arona Boost',
        'حسابك التجريبي VIP 3 جاهز! رمز الحماية المالي للسحب هو 1234.',
        'info'
      );
      createNotification(
        demoRow.id,
        'عمولة إحالة مضافة +$3.50 USDT',
        'حصلت على عمولة فريق جديدة من نشاط أعضائك وتمت إضافتها لرصيدك.',
        'reward'
      );
    }
  }

  // Default platform settings (Manual review enabled for production security, toggleable in Admin!)
  const defaultSettings = {
    trc20_address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
    bep20_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    auto_approve_deposits: 'false',
    auto_approve_withdrawals: 'false',
    min_deposit: '10',
    min_withdraw: '5',
    daily_withdraw_limit: '2',
    withdraw_fee_percent: '10',
    guarantee_duration_days: '365',
    withdraw_presets_json: JSON.stringify(DEFAULT_WITHDRAW_PRESETS),
    whatsapp_number: '963990000000',
    live_ticker_enabled: 'true',
    blockchain_auto_approve_verified: 'true',
    strict_blockchain_txid: 'true',
    txid_max_age_hours: '72',
    wheel_min_deposit: '20',
    wheel_referrer_spin: 'true',
    salary_system_enabled: 'true',
    salary_require_approval: 'true',
    vault_plans_json: JSON.stringify(DEFAULT_VAULT_PLANS),
    lucky_wheel_json: JSON.stringify(DEFAULT_WHEEL_SEGMENTS),
    salary_ranks_json: JSON.stringify(DEFAULT_SALARY_RANKS),
    vip_levels_json: JSON.stringify(DEFAULT_VIP_LEVELS),
    announcements_json: JSON.stringify(DEFAULT_ANNOUNCEMENTS)
  };

  const upsertSetting = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO NOTHING
  `);

  for (const [k, v] of Object.entries(defaultSettings)) {
    upsertSetting.run(k, v);
  }

  // Upgrade existing db once to manual review mode if not explicitly configured yet
  const migrationMarker = db.prepare("SELECT value FROM settings WHERE key = 'security_v2_migrated'").get();
  if (!migrationMarker) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_approve_deposits', 'false')").run();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_approve_withdrawals', 'false')").run();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('vip_levels_json', ?)").run(
      JSON.stringify(DEFAULT_VIP_LEVELS)
    );
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('security_v2_migrated', 'true')").run();
  }

  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount === 0) {
    seedInitialData();
  }

  // Seed v3 advanced features once (initial Flash VIP Missions + 1 starter spin on Demo user)
  const v3Marker = db.prepare("SELECT value FROM settings WHERE key = 'v3_features_seeded'").get();
  if (!v3Marker) {
    const demoUser = db.prepare("SELECT id FROM users WHERE phone = '0991112233'").get();
    if (demoUser) {
      db.prepare('UPDATE users SET spin_credits = MAX(spin_credits, 1) WHERE id = ?').run(
        demoUser.id
      );
    }

    const fmCount = db.prepare('SELECT COUNT(*) as c FROM flash_missions').get().c;
    if (fmCount === 0) {
      const insertFm = db.prepare(`
        INSERT INTO flash_missions (
          title, location, category, description, image_url,
          reward, min_vip_level, max_claims, claimed_count, is_active, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now', ?))
      `);
      insertFm.run(
        'جناح أتلانتس الملكي والمنتجع المائي الفاخر',
        'دبي، الإمارات العربية المتحدة',
        'مهمة VIP استثنائية محدودة',
        'مهمة تقييم حصرية محدودة المقاعد لأجنحة الضيافة الفاخرة المطلة على جزيرة النخلة بعائد فوري معزز.',
        '/destinations/dest-2.jpg',
        1.85,
        2,
        25,
        18,
        '+48 hours'
      );
      insertFm.run(
        'منتجع الفلل العائمة في لاغون المالديف',
        'ماليه، جزر المالديف',
        'مهمة نخبة محدودة المقاعد',
        'تقييم استثنائي لمنتجعات الجزر المرجانية الخاصة المخصصة لأعضاء VIP 3 فأعلى بمكافأة مضاعفة.',
        '/destinations/dest-7.jpg',
        3.50,
        3,
        15,
        11,
        '+36 hours'
      );
      insertFm.run(
        'قصر السلاطين المطل على مضيق البوسفور',
        'إسطنبول، تركيا',
        'مهمة سياحية سريعة',
        'تقييم معماري وسياحي خاص لمعالم ضفاف البوسفور متاح لعدد محدود من الأعضاء النشطين.',
        '/destinations/dest-1.jpg',
        0.95,
        1,
        30,
        21,
        '+72 hours'
      );
    }

    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('v3_features_seeded', 'true')").run();
  }

  // Seed v4 career ladder, work guarantee bond, dual wallet & preset withdrawal tiers once
  const v4Marker = db.prepare("SELECT value FROM settings WHERE key = 'v4_career_guarantee_seeded'").get();
  if (!v4Marker) {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('salary_ranks_json', ?)").run(
      JSON.stringify(DEFAULT_SALARY_RANKS)
    );
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('withdraw_presets_json', ?)").run(
      JSON.stringify(DEFAULT_WITHDRAW_PRESETS)
    );
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('guarantee_duration_days', '365')").run();
    const curFee = db.prepare("SELECT value FROM settings WHERE key = 'withdraw_fee_percent'").get();
    if (!curFee || curFee.value === '0') {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('withdraw_fee_percent', '10')").run();
    }

    // Seed active 365-day Work Guarantee Bond on paid VIP accounts (including Demo VIP 3)
    db.prepare(`
      UPDATE users
      SET work_guarantee_amount = CASE
            WHEN vip_level = 1 THEN 20
            WHEN vip_level = 2 THEN 60
            WHEN vip_level = 3 THEN 150
            WHEN vip_level = 4 THEN 400
            WHEN vip_level = 5 THEN 1000
            WHEN vip_level = 6 THEN 2500
            ELSE 0
          END,
          work_guarantee_start = CASE WHEN vip_level > 0 THEN datetime('now', '-3 days') ELSE '' END,
          work_guarantee_expires = CASE WHEN vip_level > 0 THEN datetime('now', '+362 days') ELSE '' END,
          job_title = CASE WHEN vip_level > 0 THEN 'موظف رسمي' ELSE 'موظف متدرب' END
      WHERE work_guarantee_amount = 0
    `).run();

    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('v4_career_guarantee_seeded', 'true')").run();
  }

  // Seed v6 Executive Concierge welcome thread on Demo account once
  const v6Marker = db.prepare("SELECT value FROM settings WHERE key = 'v6_executive_suite_seeded'").get();
  if (!v6Marker) {
    const demoAcc = db.prepare("SELECT id FROM users WHERE phone = ?").get('0991112233');
    if (demoAcc) {
      const existingTickets = db
        .prepare('SELECT COUNT(*) as c FROM support_tickets WHERE user_id = ?')
        .get(demoAcc.id).c;
      if (existingTickets === 0) {
        const tkRes = db
          .prepare(
            `INSERT INTO support_tickets (user_id, ticket_code, subject, category, priority, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'vip', 'answered', datetime('now', '-1 days'), datetime('now', '-20 hours'))`
          )
          .run(
            demoAcc.id,
            'CNG-10029',
            'تفعيل أولوية المساندة التنفيذية للفئة A3',
            'عقود الضيافة'
          );
        const tkId = tkRes.lastInsertRowid;
        db.prepare(
          `INSERT INTO support_messages (ticket_id, sender_role, body, created_at)
           VALUES (?, 'user', ?, datetime('now', '-1 days'))`
        ).run(
          tkId,
          'مرحباً، أود الاستفسار عن آلية اعتماد إيصالات التسوية الرسمية وأولوية السحب لحاملي الفئة A3.'
        );
        db.prepare(
          `INSERT INTO support_messages (ticket_id, sender_role, body, created_at)
           VALUES (?, 'admin', ?, datetime('now', '-20 hours'))`
        ).run(
          tkId,
          'أهلاً بك في مكتب المساندة التنفيذية لشركة Arona Boost. تم تفعيل أولوية المعالجة الفورية لحسابك ضمن الفئة A3، ويمكنك الآن تحميل إيصالات التسوية الموثقة وبطاقة المقيّم الرقمية مباشرة من تبويب حسابي.'
        );
      }
    }
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('v6_executive_suite_seeded', 'true')").run();
  }
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  while (true) {
    let code = 'AB';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const exists = db.prepare('SELECT id FROM users WHERE invite_code = ?').get(code);
    if (!exists) return code;
  }
}

function generateRefCode(prefix = 'TX') {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${Date.now().toString().slice(-5)}${rand.toString().slice(0, 3)}`;
}

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function seedInitialData() {
  const seedTx = db.transaction(() => {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const demoHash = bcrypt.hashSync('123456', 10);
    const pinHash = bcrypt.hashSync('1234', 10);

    // 1. Admin user
    db.prepare(`
      INSERT INTO users (
        phone, password_hash, withdraw_pin_hash, invite_code, balance, total_deposits, total_withdrawals,
        total_task_earnings, total_team_earnings, vip_level, is_admin, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 5, 1, datetime('now', '-30 days'))
    `).run('0990000000', adminHash, pinHash, 'ABADMIN', 1250.0, 1000.0, 200.0, 350.0, 100.0);

    // 2. Demo showcase user (0991112233 / 123456 / PIN: 1234)
    const demoResult = db.prepare(`
      INSERT INTO users (
        phone, password_hash, withdraw_pin_hash, invite_code, balance, total_deposits, total_withdrawals,
        total_task_earnings, total_team_earnings, vip_level, saved_wallet_address,
        saved_wallet_network, is_admin, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 3, ?, 'TRC20', 0, datetime('now', '-14 days'))
    `).run(
      '0991112233',
      demoHash,
      pinHash,
      'AB77889',
      342.75,
      250.0,
      85.0,
      128.25,
      49.5,
      'TX8kP9wLmN4vQr2sYz7bHj5cDfG1uAeR9K'
    );
    const demoId = demoResult.lastInsertRowid;

    const demoTransactions = [
      {
        type: 'deposit',
        amount: 60.0,
        network: 'TRC20',
        wallet_or_txid: '8f94c2e19a7b3de41c90',
        reference_code: 'DEP-841209',
        status: 'completed',
        note: 'إيداع تفعيل المستوى الفضي VIP 2',
        offset: '-12 days'
      },
      {
        type: 'withdraw',
        amount: 35.0,
        network: 'TRC20',
        wallet_or_txid: 'TX8kP9wLmN4vQr2sYz7bHj5cDfG1uAeR9K',
        reference_code: 'WTH-892341',
        status: 'completed',
        note: 'سحب أرباح تقييم الوجهات عبر TRC20',
        offset: '-8 days'
      },
      {
        type: 'deposit',
        amount: 190.0,
        network: 'BEP20',
        wallet_or_txid: '0x93fa81d4c72b771a0e',
        reference_code: 'DEP-910452',
        status: 'completed',
        note: 'تعزيز الرصيد والترقية إلى VIP 3 الذهبي',
        offset: '-5 days'
      },
      {
        type: 'withdraw',
        amount: 50.0,
        network: 'TRC20',
        wallet_or_txid: 'TX8kP9wLmN4vQr2sYz7bHj5cDfG1uAeR9K',
        reference_code: 'WTH-954118',
        status: 'completed',
        note: 'سحب أرباح التقييمات السياحية والفريق',
        offset: '-2 days'
      }
    ];

    const insertTrans = db.prepare(`
      INSERT INTO transactions (
        user_id, type, amount, fee_amount, net_amount, network, wallet_or_txid, reference_code, status, note, created_at
      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);
    for (const t of demoTransactions) {
      insertTrans.run(
        demoId,
        t.type,
        t.amount,
        t.amount,
        t.network,
        t.wallet_or_txid,
        t.reference_code,
        t.status,
        t.note,
        t.offset
      );
    }

    const today = getTodayDateStr();
    const insertTask = db.prepare(`
      INSERT INTO task_completions (
        user_id, task_slot, task_title, vip_level, reward, rating, review_tags, review_comment, location, image_url, completed_date, created_at
      ) VALUES (?, ?, ?, 3, 1.28, 5, ?, ?, ?, ?, ?, datetime('now', '-2 hours'))
    `);
    insertTask.run(
      demoId,
      1,
      TASK_CATALOG[0].title,
      'إطلالة ساحرة، خدمات سياحية راقية',
      'تجربة مذهلة عند نافورة دبي وقت الغروب، تنظيم عالمي.',
      TASK_CATALOG[0].location,
      TASK_CATALOG[0].image,
      today
    );
    insertTask.run(
      demoId,
      2,
      TASK_CATALOG[1].title,
      'معلم تاريخي وثقافي، أنصح بزيارتها',
      'أجواء البوسفور ساحرة جداً والإطلالة البحرية لا مثيل لها.',
      TASK_CATALOG[1].location,
      TASK_CATALOG[1].image,
      today
    );

    const memberHash = bcrypt.hashSync('123456', 10);
    const m1 = db.prepare(`
      INSERT INTO users (phone, password_hash, invite_code, referred_by, balance, total_deposits, vip_level, created_at)
      VALUES ('0994518821', ?, 'ABM1001', ?, 182.0, 150.0, 3, datetime('now', '-10 days'))
    `).run(memberHash, demoId).lastInsertRowid;

    const m2 = db.prepare(`
      INSERT INTO users (phone, password_hash, invite_code, referred_by, balance, total_deposits, vip_level, created_at)
      VALUES ('0987623410', ?, 'ABM1002', ?, 74.5, 60.0, 2, datetime('now', '-7 days'))
    `).run(memberHash, demoId).lastInsertRowid;

    const m3 = db.prepare(`
      INSERT INTO users (phone, password_hash, invite_code, referred_by, balance, total_deposits, vip_level, created_at)
      VALUES ('0933194025', ?, 'ABM1003', ?, 24.5, 20.0, 1, datetime('now', '-3 days'))
    `).run(memberHash, demoId).lastInsertRowid;

    const m4 = db.prepare(`
      INSERT INTO users (phone, password_hash, invite_code, referred_by, balance, total_deposits, vip_level, created_at)
      VALUES ('0944812093', ?, 'ABM2001', ?, 415.0, 400.0, 4, datetime('now', '-6 days'))
    `).run(memberHash, m1).lastInsertRowid;

    const m5 = db.prepare(`
      INSERT INTO users (phone, password_hash, invite_code, referred_by, balance, total_deposits, vip_level, created_at)
      VALUES ('0955209184', ?, 'ABM2002', ?, 68.0, 60.0, 2, datetime('now', '-2 days'))
    `).run(memberHash, m2).lastInsertRowid;

    const m6 = db.prepare(`
      INSERT INTO users (phone, password_hash, invite_code, referred_by, balance, total_deposits, vip_level, created_at)
      VALUES ('0966718340', ?, 'ABM3001', ?, 165.0, 150.0, 3, datetime('now', '-1 days'))
    `).run(memberHash, m4).lastInsertRowid;

    const insertComm = db.prepare(`
      INSERT INTO team_commissions (beneficiary_id, source_user_id, tier, base_amount, commission_amount, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);
    insertComm.run(demoId, m1, 1, 150.0, 15.0, 'عمولة إيداع المستوى الأول (10%)', '-10 days');
    insertComm.run(demoId, m2, 1, 60.0, 6.0, 'عمولة إيداع المستوى الأول (10%)', '-7 days');
    insertComm.run(demoId, m4, 2, 400.0, 20.0, 'عمولة إيداع المستوى الثاني (5%)', '-6 days');
    insertComm.run(demoId, m3, 1, 20.0, 2.0, 'عمولة إيداع المستوى الأول (10%)', '-3 days');
    insertComm.run(demoId, m5, 2, 60.0, 3.0, 'عمولة إيداع المستوى الثاني (5%)', '-2 days');
    insertComm.run(demoId, m6, 3, 150.0, 3.5, 'عمولة إيداع ونشاط المستوى الثالث (2%)', '-1 days');

    createNotification(
      demoId,
      'مرحباً بك في Arona Boost',
      'حسابك التجريبي VIP 3 جاهز! رمز الحماية المالي للسحب هو 1234.',
      'info'
    );
  });

  seedTx();
}

function distributeReferralCommissions(sourceUserId, depositAmount) {
  const rates = [
    { tier: 1, rate: 0.10, label: 'عمولة إيداع المستوى الأول (10%)' },
    { tier: 2, rate: 0.05, label: 'عمولة إيداع المستوى الثاني (5%)' },
    { tier: 3, rate: 0.02, label: 'عمولة إيداع المستوى الثالث (2%)' }
  ];

  let currentUser = db.prepare('SELECT id, referred_by FROM users WHERE id = ?').get(sourceUserId);
  for (const r of rates) {
    if (!currentUser || !currentUser.referred_by) break;
    const upline = db.prepare('SELECT id, referred_by FROM users WHERE id = ?').get(currentUser.referred_by);
    if (!upline) break;

    const comm = round2(depositAmount * r.rate);
    if (comm > 0) {
      db.prepare(`
        UPDATE users
        SET balance = ROUND(balance + ?, 2),
            total_team_earnings = ROUND(total_team_earnings + ?, 2)
        WHERE id = ?
      `).run(comm, comm, upline.id);

      db.prepare(`
        INSERT INTO team_commissions (beneficiary_id, source_user_id, tier, base_amount, commission_amount, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(upline.id, sourceUserId, r.tier, depositAmount, comm, r.label);

      createNotification(
        upline.id,
        `مكافأة عمولة فريق +$${comm.toFixed(2)} USDT`,
        `تمت إضافة ${comm.toFixed(2)} USDT إلى رصيدك كعمولة إحالة (المستوى ${r.tier === 1 ? 'A' : r.tier === 2 ? 'B' : 'C'}).`,
        'reward'
      );
    }
    currentUser = upline;
  }
}

initDb();

function ensureTashareParitySchema() {
  const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!userCols.includes('points_balance')) {
    db.exec('ALTER TABLE users ADD COLUMN points_balance INTEGER NOT NULL DEFAULT 0');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS red_envelopes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      reward_amount REAL NOT NULL DEFAULT 1.0,
      max_claims INTEGER NOT NULL DEFAULT 100,
      claimed_count INTEGER NOT NULL DEFAULT 0,
      min_vip INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS red_envelope_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      envelope_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(envelope_id, user_id),
      FOREIGN KEY (envelope_id) REFERENCES red_envelopes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS point_shop_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      points_cost INTEGER NOT NULL,
      official_price_usdt REAL NOT NULL DEFAULT 0,
      usdt_credit REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'voucher',
      stock INTEGER NOT NULL DEFAULT 999,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS point_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      item_title TEXT NOT NULL,
      points_spent INTEGER NOT NULL,
      usdt_credited REAL NOT NULL DEFAULT 0,
      shipping_address TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS point_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const envCount = db.prepare('SELECT COUNT(*) as c FROM red_envelopes').get().c;
  if (envCount === 0) {
    const insEnv = db.prepare(`
      INSERT INTO red_envelopes (code, title, reward_amount, max_claims, claimed_count, min_vip, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    insEnv.run('ARONA2026', 'مكافأة الظرف الأحمر الترحيبية للموظفين', 1.5, 500, 38, 0);
    insEnv.run('VIPBOOST', 'ظرف مكافأة الموظفين الرسميين (الفئة A1+)', 5.0, 120, 19, 1);
  }

  const shopCount = db.prepare('SELECT COUNT(*) as c FROM point_shop_items').get().c;
  if (shopCount === 0) {
    const insItem = db.prepare(`
      INSERT INTO point_shop_items (title, subtitle, points_cost, official_price_usdt, usdt_credit, category, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insItem.run('قسيمة رصيد نقدي 2 USDT', 'تُضاف فوراً إلى محفظة الدخل القابلة للسحب', 200, 2, 2, 'voucher', 999);
    insItem.run('قسيمة رصيد نقدي 10 USDT', 'تُضاف فوراً إلى محفظة الدخل القابلة للسحب', 850, 10, 10, 'voucher', 999);
    insItem.run('قسيمة مكافأة 30 USDT', 'رصيد USDT مباشر بدون رسوم استبدال', 2400, 30, 30, 'voucher', 500);
    insItem.run('سماعات لاسلكية احترافية Pro', 'هدية عينية لموظفي التقييم النشطين مع شحن دولي', 4500, 249, 0, 'physical', 45);
    insItem.run('هاتف iPhone 17 Pro Max', 'الجائزة الكبرى لمتجر نقاط أرونا بوست', 18000, 1199, 0, 'physical', 12);
  }

  const demoUser = db.prepare('SELECT id, points_balance FROM users WHERE phone = ?').get('0991112233');
  if (demoUser && Number(demoUser.points_balance || 0) === 0) {
    const logExists = db.prepare('SELECT COUNT(*) as c FROM point_logs WHERE user_id = ?').get(demoUser.id).c;
    if (logExists === 0) {
      db.prepare('UPDATE users SET points_balance = 680 WHERE id = ?').run(demoUser.id);
      const insLog = db.prepare('INSERT INTO point_logs (user_id, delta, reason, created_at) VALUES (?, ?, ?, datetime(\'now\', ?))');
      insLog.run(demoUser.id, 300, 'مكافأة توثيق عقد الفئة A3 الرسمي', '-10 days');
      insLog.run(demoUser.id, 250, 'مكافأة دعوة وتنشيط أعضاء الفريق (A-B-C)', '-5 days');
      insLog.run(demoUser.id, 130, 'مكافآت إنجاز تقارير السفر والمنتجعات اليومية', '-1 days');
    }
  }

  const upsertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  upsertSetting.run('welcome_popup_enabled', '1');
  upsertSetting.run('welcome_popup_title', 'إشعار الموظفين الرسمي — Arona Boost');
  upsertSetting.run(
    'welcome_popup_body',
    'مرحباً بجميع موظفي التقييم المعتمدين في منظومة Arona Boost.\n• عقود المنتجعات العالمية والفنادق والمعالم السياحية متاحة يومياً بتسوية فورية عبر USDT.\n• فعالية «الظرف الأحمر» نشطة الآن! استخدم كود الهدية الموزّع في القنوات الرسمية للحصول على مكافأة نقدية فورية.\n• يُحفظ مبلغ ضمان العمل في عقد رسمي مسترد بالكامل بعد إتمام 365 يوماً.'
  );
}

ensureTashareParitySchema();

module.exports = {
  db,
  round2,
  DEFAULT_VIP_LEVELS,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_VAULT_PLANS,
  DEFAULT_WHEEL_SEGMENTS,
  DEFAULT_SALARY_RANKS,
  DEFAULT_WITHDRAW_PRESETS,
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
};
