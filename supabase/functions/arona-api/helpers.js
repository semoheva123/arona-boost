const getQRCode = () => globalThis.__ARONA_DEPS.QRCode;
import phoneValidatorMod from '../../../server/phoneValidator.js';

export const validatePhoneNumber = phoneValidatorMod.validatePhoneNumber;

export const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

export const nowUtcStr = (offsetMs = 0) => {
  const d = new Date(Date.now() + offsetMs);
  return d.toISOString().replace('T', ' ').slice(0, 19);
};

export const getTodayDateStr = () => new Date().toISOString().slice(0, 10);

export const DEFAULT_VIP_LEVELS = [
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

export const DEFAULT_ANNOUNCEMENTS = [
  'تتجدد صور ومعالم الوجهات السياحية تلقائياً على مدار الساعة لجميع الموظفين المعتمدين',
  'أمان مصرفي مضاعف للمحافظ عبر رمز الحماية المالي PIN وتوثيق عقود البلوكتشين TXID',
  'ترقّ في سلم المناصب الرسمي واحصل على مكافآت رحلة النجوم والرواتب الشهرية الثابتة بعملة USDT'
];

export const TEAM_MILESTONES = [
  { key: 'team_3', requiredActive: 3, reward: 3.0, title: 'بناء النواة الأولى (3 أعضاء نشطين)' },
  { key: 'team_10', requiredActive: 10, reward: 12.0, title: 'قائد الفريق الفضي (10 أعضاء نشطين)' },
  { key: 'team_25', requiredActive: 25, reward: 35.0, title: 'سفير Arona الذهبي (25 عضواً نشطاً)' }
];

export const DEFAULT_VAULT_PLANS = [
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

export const DEFAULT_WHEEL_SEGMENTS = [
  { id: 'seg_1', label: '$0.50 USDT', reward: 0.5, weight: 45, color: '#0D9488' },
  { id: 'seg_2', label: '$1.00 USDT', reward: 1.0, weight: 28, color: '#0284C7' },
  { id: 'seg_3', label: '$2.00 USDT', reward: 2.0, weight: 15, color: '#4F46E5' },
  { id: 'seg_4', label: '$5.00 USDT', reward: 5.0, weight: 9, color: '#D97706' },
  { id: 'seg_5', label: '$10.00 USDT', reward: 10.0, weight: 3, color: '#059669' },
  { id: 'seg_6', label: '$25.00 كبرى', reward: 25.0, weight: 0, color: '#E11D48' }
];

export const DEFAULT_WITHDRAW_PRESETS = [20, 80, 200, 800, 2000, 5000];

export const DEFAULT_SALARY_RANKS = [
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

export const TASK_CATALOG = [
  { slot: 1, title: 'برج خليفة ونافورة دبي الراقصة', location: 'دبي، الإمارات العربية المتحدة', image: '/destinations/dest-1.jpg' },
  { slot: 2, title: 'مضيق البوسفور وجامع أورتاكوي', location: 'إسطنبول، تركيا', image: '/destinations/dest-2.jpg' },
  { slot: 3, title: 'محمية العُلا ومدائن صالح التاريخية', location: 'العُلا، المملكة العربية السعودية', image: '/destinations/dest-3.jpg' },
  { slot: 4, title: 'مدينة البتراء الوردية (الخزنة)', location: 'معان، الأردن', image: '/destinations/dest-4.jpg' },
  { slot: 5, title: 'أهرامات الجيزة وتمثال أبو الهول', location: 'القاهرة، مصر', image: '/destinations/dest-5.jpg' },
  { slot: 6, title: 'خليج جونيه وجبال لبنان الخضراء', location: 'جبل لبنان، لبنان', image: '/destinations/dest-6.jpg' },
  { slot: 7, title: 'منتجعات جزر المالديف الفيروزية', location: 'ماليه، جزر المالديف', image: '/destinations/dest-7.jpg' },
  { slot: 8, title: 'جزيرة سانتوريني المطلة على بحر إيجة', location: 'سانتوريني، اليونان', image: '/destinations/dest-8.jpg' },
  { slot: 9, title: 'قصر الحمراء وحدائق العريف', location: 'غرناطة، إسبانيا', image: '/destinations/dest-9.jpg' },
  { slot: 10, title: 'بحيرة إنترلاكن وجبال الألب السويسرية', location: 'إنترلاكن، سويسرا', image: '/destinations/dest-10.jpg' }
];

// ==================== PURE SVG QR CODE GENERATOR ====================

export async function makeQrDataUri(text) {
  const svg = await getQRCode().toString(String(text || ''), {
    type: 'svg',
    margin: 1,
    width: 220,
    color: { dark: '#0F172A', light: '#FFFFFF' }
  });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ==================== PURE WEB CRYPTO JWT (HS256) ====================

const te = new TextEncoder();
const td = new TextDecoder();

function b64UrlEncodeBytes(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64UrlDecodeBytes(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cachedHmacKey = null;
let cachedSecretStr = '';

async function getHmacKey(secret) {
  if (cachedHmacKey && cachedSecretStr === secret) return cachedHmacKey;
  cachedSecretStr = secret;
  cachedHmacKey = await crypto.subtle.importKey(
    'raw',
    te.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return cachedHmacKey;
}

export async function signJwt(payload, secret, expiresDays = 30) {
  const nowSec = Math.floor(Date.now() / 1000);
  const headerB64 = b64UrlEncodeBytes(te.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const bodyB64 = b64UrlEncodeBytes(
    te.encode(JSON.stringify({ ...payload, iat: nowSec, exp: nowSec + expiresDays * 86400 }))
  );
  const signingInput = `${headerB64}.${bodyB64}`;
  const key = await getHmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, te.encode(signingInput)));
  return `${signingInput}.${b64UrlEncodeBytes(sig)}`;
}

export async function verifyJwt(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('INVALID_TOKEN');
  const [h, p, s] = parts;
  const key = await getHmacKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    b64UrlDecodeBytes(s),
    te.encode(`${h}.${p}`)
  );
  if (!valid) throw new Error('BAD_SIG');
  const payload = JSON.parse(td.decode(b64UrlDecodeBytes(p)));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('EXPIRED');
  }
  return payload;
}

// ==================== WEB CRYPTO BLOCKCHAIN VERIFIER (TRC20 / BEP20) ====================

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const TRON_USDT_HEX_NO_PREFIX = 'a614f803b6fd780986a42c78ec9c7f77e6ded13c';
const BSC_USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';
const TRANSFER_EVENT_TOPIC0 = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function sha256Bytes(bytes) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

function hexToBytes(hex) {
  const clean = hex.length % 2 === 0 ? hex : '0' + hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function encodeBase58(bytes) {
  if (!bytes || bytes.length === 0) return '';
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let leadingZeros = '';
  for (let k = 0; k < bytes.length && bytes[k] === 0; k++) leadingZeros += '1';
  return leadingZeros + digits.reverse().map((d) => BASE58_ALPHABET[d]).join('');
}

async function tronHexToBase58(rawHex = '') {
  const clean = String(rawHex).replace(/^0x/i, '').toLowerCase();
  const addr20 = clean.length >= 40 ? clean.slice(-40) : clean.padStart(40, '0');
  const payload = hexToBytes('41' + addr20);
  const h1 = await sha256Bytes(payload);
  const h2 = await sha256Bytes(h1);
  const full = new Uint8Array(payload.length + 4);
  full.set(payload, 0);
  full.set(h2.subarray(0, 4), payload.length);
  return encodeBase58(full);
}

async function verifyTronTrc20({ txid, expectedAmount, expectedWallet }) {
  const cleanHash = String(txid || '').trim().replace(/^0x/i, '');
  const explorerUrl = `https://tronscan.org/#/transaction/${cleanHash}`;
  if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
    return {
      checkedAt: new Date().toISOString(),
      network: 'TRC20',
      txid: cleanHash,
      validFormat: false,
      foundOnChain: false,
      txSuccess: false,
      isUsdtTransfer: false,
      recipientMatches: false,
      amountMatches: false,
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'invalid_format',
      summaryAr: 'صيغة معرّف TXID غير مطابقة لشبكة TRON (يجب أن يتكون من 64 محرفاً سداسياً عشرياً)'
    };
  }
  try {
    const [infoRes, txRes] = await Promise.all([
      fetch('https://api.trongrid.io/wallet/gettransactioninfobyid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: cleanHash }),
        signal: AbortSignal.timeout(8000)
      }),
      fetch('https://api.trongrid.io/wallet/gettransactionbyid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: cleanHash }),
        signal: AbortSignal.timeout(8000)
      })
    ]);
    const info = await infoRes.json();
    const tx = await txRes.json();
    if ((!info || !info.id) && (!tx || !tx.txID)) {
      return {
        checkedAt: new Date().toISOString(),
        network: 'TRC20',
        txid: cleanHash,
        validFormat: true,
        foundOnChain: false,
        txSuccess: false,
        isUsdtTransfer: false,
        recipientMatches: false,
        amountMatches: false,
        fullyVerified: false,
        onChainAmount: null,
        expectedAmount,
        fromAddress: null,
        toAddress: null,
        expectedWallet,
        explorerUrl,
        statusBadge: 'not_found',
        summaryAr: 'لم يتم العثور على هذه المعاملة على بلوكتشين TRON حتى الآن'
      };
    }
    const contractRet = info?.receipt?.result || tx?.ret?.[0]?.contractRet || 'UNKNOWN';
    const txSuccess = contractRet === 'SUCCESS';
    const logs = Array.isArray(info?.log) ? info.log : [];
    let matchedTransfer = null;
    for (const lg of logs) {
      const contractHex = String(lg.address || '').replace(/^0x|^41/i, '').toLowerCase();
      const topics = Array.isArray(lg.topics) ? lg.topics : [];
      const topic0 = String(topics[0] || '').replace(/^0x/i, '').toLowerCase();
      if (contractHex === TRON_USDT_HEX_NO_PREFIX && topic0 === TRANSFER_EVENT_TOPIC0 && topics.length >= 3) {
        const fromAddr = await tronHexToBase58(topics[1]);
        const toAddr = await tronHexToBase58(topics[2]);
        const rawHexData = String(lg.data || '0').replace(/^0x/i, '') || '0';
        const usdtVal = Number(BigInt('0x' + rawHexData)) / 1e6;
        matchedTransfer = { fromAddress: fromAddr, toAddress: toAddr, onChainAmount: round2(usdtVal) };
        if (toAddr === expectedWallet) break;
      }
    }
    if (!matchedTransfer) {
      return {
        checkedAt: new Date().toISOString(),
        network: 'TRC20',
        txid: cleanHash,
        validFormat: true,
        foundOnChain: true,
        txSuccess,
        isUsdtTransfer: false,
        recipientMatches: false,
        amountMatches: false,
        fullyVerified: false,
        onChainAmount: null,
        expectedAmount,
        fromAddress: null,
        toAddress: null,
        expectedWallet,
        explorerUrl,
        statusBadge: 'mismatch',
        summaryAr: txSuccess
          ? 'المعاملة موجودة على TRON ولكنها ليست تحويل عملة USDT (TRC20) رسمية'
          : `المعاملة موجودة على TRON لكن حالتها (${contractRet})`
      };
    }
    const recipientMatches = matchedTransfer.toAddress.trim() === String(expectedWallet || '').trim();
    const amountMatches =
      matchedTransfer.onChainAmount + 0.05 >= Number(expectedAmount || 0) &&
      Math.abs(matchedTransfer.onChainAmount - Number(expectedAmount || 0)) <= 1.0;
    const fullyVerified = txSuccess && recipientMatches && amountMatches;
    const summaryAr = fullyVerified
      ? `تم التحقق بنجاح على TRON: تحويل مؤكد بقيمة $${matchedTransfer.onChainAmount.toFixed(2)} USDT إلى محفظة المنصة`
      : !txSuccess
      ? `المعاملة فاشلة على الشبكة (${contractRet})`
      : !recipientMatches
      ? `تنبيه: المستلم على الشبكة (${matchedTransfer.toAddress.slice(0, 8)}...) لا يطابق محفظة المنصة!`
      : `تنبيه: المبلغ الفعلي على الشبكة ($${matchedTransfer.onChainAmount.toFixed(2)} USDT) يختلف عن المبلغ المدخل`;
    return {
      checkedAt: new Date().toISOString(),
      network: 'TRC20',
      txid: cleanHash,
      validFormat: true,
      foundOnChain: true,
      txSuccess,
      isUsdtTransfer: true,
      recipientMatches,
      amountMatches,
      fullyVerified,
      onChainAmount: matchedTransfer.onChainAmount,
      expectedAmount,
      fromAddress: matchedTransfer.fromAddress,
      toAddress: matchedTransfer.toAddress,
      expectedWallet,
      explorerUrl,
      statusBadge: fullyVerified ? 'verified' : 'mismatch',
      summaryAr
    };
  } catch {
    return {
      checkedAt: new Date().toISOString(),
      network: 'TRC20',
      txid: cleanHash,
      validFormat: true,
      foundOnChain: false,
      txSuccess: false,
      isUsdtTransfer: false,
      recipientMatches: false,
      amountMatches: false,
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'network_error',
      summaryAr: 'تعذر الاتصال المؤقت بعقدة TRON، يرجى إعادة الفحص بعد لحظات'
    };
  }
}

async function verifyBscBep20({ txid, expectedAmount, expectedWallet }) {
  const cleanNoPrefix = String(txid || '').trim().replace(/^0x/i, '');
  const fullHash = '0x' + cleanNoPrefix;
  const explorerUrl = `https://bscscan.com/tx/${fullHash}`;
  if (!/^[0-9a-fA-F]{64}$/.test(cleanNoPrefix)) {
    return {
      checkedAt: new Date().toISOString(),
      network: 'BEP20',
      txid: fullHash,
      validFormat: false,
      foundOnChain: false,
      txSuccess: false,
      isUsdtTransfer: false,
      recipientMatches: false,
      amountMatches: false,
      fullyVerified: false,
      onChainAmount: null,
      expectedAmount,
      fromAddress: null,
      toAddress: null,
      expectedWallet,
      explorerUrl,
      statusBadge: 'invalid_format',
      summaryAr: 'صيغة معرّف TXID غير مطابقة لشبكة BSC BEP20 (يجب أن يتكون من 64 محرفاً سداسياً عشرياً)'
    };
  }
  for (const rpcUrl of ['https://bsc-rpc.publicnode.com', 'https://bsc-dataseed.binance.org']) {
    try {
      const rpcRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [fullHash] }),
        signal: AbortSignal.timeout(8000)
      });
      const receipt = (await rpcRes.json())?.result;
      if (!receipt) {
        return {
          checkedAt: new Date().toISOString(),
          network: 'BEP20',
          txid: fullHash,
          validFormat: true,
          foundOnChain: false,
          txSuccess: false,
          isUsdtTransfer: false,
          recipientMatches: false,
          amountMatches: false,
          fullyVerified: false,
          onChainAmount: null,
          expectedAmount,
          fromAddress: null,
          toAddress: null,
          expectedWallet,
          explorerUrl,
          statusBadge: 'not_found',
          summaryAr: 'لم يتم العثور على هذه المعاملة على شبكة BNB Smart Chain (BEP20)'
        };
      }
      const txSuccess = receipt.status === '0x1';
      let matchedTransfer = null;
      for (const lg of Array.isArray(receipt.logs) ? receipt.logs : []) {
        const contractAddr = String(lg.address || '').toLowerCase();
        const topics = Array.isArray(lg.topics) ? lg.topics : [];
        const topic0 = String(topics[0] || '').replace(/^0x/i, '').toLowerCase();
        if (contractAddr === BSC_USDT_CONTRACT && topic0 === TRANSFER_EVENT_TOPIC0 && topics.length >= 3) {
          const fromAddr = '0x' + topics[1].slice(-40).toLowerCase();
          const toAddr = '0x' + topics[2].slice(-40).toLowerCase();
          const scaled = Number(BigInt(lg.data || '0x0') / 100000000000000n) / 10000;
          matchedTransfer = { fromAddress: fromAddr, toAddress: toAddr, onChainAmount: round2(scaled) };
          if (toAddr === String(expectedWallet || '').trim().toLowerCase()) break;
        }
      }
      if (!matchedTransfer) {
        return {
          checkedAt: new Date().toISOString(),
          network: 'BEP20',
          txid: fullHash,
          validFormat: true,
          foundOnChain: true,
          txSuccess,
          isUsdtTransfer: false,
          recipientMatches: false,
          amountMatches: false,
          fullyVerified: false,
          onChainAmount: null,
          expectedAmount,
          fromAddress: null,
          toAddress: null,
          expectedWallet,
          explorerUrl,
          statusBadge: 'mismatch',
          summaryAr: 'المعاملة موجودة على BSC ولكنها لا تتضمن تحويل عملة USDT (BEP20) رسمية'
        };
      }
      const recipientMatches = matchedTransfer.toAddress === String(expectedWallet || '').trim().toLowerCase();
      const amountMatches =
        matchedTransfer.onChainAmount + 0.05 >= Number(expectedAmount || 0) &&
        Math.abs(matchedTransfer.onChainAmount - Number(expectedAmount || 0)) <= 1.0;
      const fullyVerified = txSuccess && recipientMatches && amountMatches;
      const summaryAr = fullyVerified
        ? `تم التحقق بنجاح على BSC: تحويل مؤكد بقيمة $${matchedTransfer.onChainAmount.toFixed(2)} USDT إلى محفظة المنصة`
        : !txSuccess
        ? 'المعاملة مرفوضة/فاشلة على شبكة BSC'
        : !recipientMatches
        ? 'تنبيه: المستلم على الشبكة لا يطابق محفظة المنصة!'
        : 'تنبيه: المبلغ الفعلي على الشبكة يختلف عن المبلغ المدخل';
      return {
        checkedAt: new Date().toISOString(),
        network: 'BEP20',
        txid: fullHash,
        validFormat: true,
        foundOnChain: true,
        txSuccess,
        isUsdtTransfer: true,
        recipientMatches,
        amountMatches,
        fullyVerified,
        onChainAmount: matchedTransfer.onChainAmount,
        expectedAmount,
        fromAddress: matchedTransfer.fromAddress,
        toAddress: matchedTransfer.toAddress,
        expectedWallet,
        explorerUrl,
        statusBadge: fullyVerified ? 'verified' : 'mismatch',
        summaryAr
      };
    } catch {
      // try next RPC
    }
  }
  return {
    checkedAt: new Date().toISOString(),
    network: 'BEP20',
    txid: fullHash,
    validFormat: true,
    foundOnChain: false,
    txSuccess: false,
    isUsdtTransfer: false,
    recipientMatches: false,
    amountMatches: false,
    fullyVerified: false,
    onChainAmount: null,
    expectedAmount,
    fromAddress: null,
    toAddress: null,
    expectedWallet,
    explorerUrl,
    statusBadge: 'network_error',
    summaryAr: 'تعذر الاتصال المؤقت بعقدة BSC، يرجى إعادة الفحص بعد لحظات'
  };
}

export async function verifyTransactionOnChain({ txid, network = 'TRC20', expectedAmount = 0, expectedWallet = '' }) {
  return network === 'BEP20'
    ? verifyBscBep20({ txid, expectedAmount, expectedWallet })
    : verifyTronTrc20({ txid, expectedAmount, expectedWallet });
}

// ==================== EDGE LIVE TOURISM PHOTOS ENGINE ====================

export const TOURISM_POOL = [
  {
    key: 'maldives_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#MLE',
    title: 'منتجعات جزر المالديف الفيروزية العائمة',
    location: 'ماليه، جزر المالديف',
    category: 'منتجعات جزر استوائية فاخرة',
    avgRating: 5.0,
    reviewsCount: '19.4K',
    fallbackImage: '/destinations/dest-7.jpg',
    queries: ['Maldives turquoise lagoon resort beach', 'Maldives island overwater bungalow'],
    description: 'فلل وأجنحة خشبية عائمة فوق المياه الفيروزية الصافية والشعاب المرجانية النادرة للاستجمام العالمي الفاخر.'
  },
  {
    key: 'santorini_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#JTR',
    title: 'منتجعات كالديرا أويا المطلة على بحر إيجة',
    location: 'سانتوريني، اليونان',
    category: 'منتجعات ساحلية بانورامية',
    avgRating: 4.9,
    reviewsCount: '15.3K',
    fallbackImage: '/destinations/dest-8.jpg',
    queries: ['Oia Santorini sunset caldera', 'Santorini blue domes Aegean sea'],
    description: 'منتجعات صخرية بيضاء بمفروشات متوسطية ومسابح لا متناهية تطل مباشرة على غروب بحر إيجة الساحر.'
  },
  {
    key: 'bali_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#DPS',
    title: 'منتجعات أوبود الاستوائية وشواطئ بالي',
    location: 'بالي، إندونيسيا',
    category: 'منتجعات استجمام وطبيعة استوائية',
    avgRating: 4.9,
    reviewsCount: '16.2K',
    fallbackImage: '/destinations/dest-7.jpg',
    queries: ['Tegallalang rice terraces Bali', 'Uluwatu cliff sunset Bali ocean'],
    description: 'منتجعات استوائية هادئة تتوسط الغابات الخضراء والمدرجات المائية مع إطلالات محيطية خلابة.'
  },
  {
    key: 'swiss_alps_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#ZRH',
    title: 'منتجع بحيرة إنترلاكن وجبال الألب السويسرية',
    location: 'إنترلاكن وزيورخ، سويسرا',
    category: 'منتجعات جبلية وبحيرات عالمية',
    avgRating: 4.9,
    reviewsCount: '13.4K',
    fallbackImage: '/destinations/dest-10.jpg',
    queries: ['Lauterbrunnen valley Swiss Alps', 'Lake Brienz Interlaken Switzerland'],
    description: 'منتجعات جبلية سويسرية فاخرة تحيط بها البحيرات الزمردية والمروج الخضراء وقمم الألب الثلجية.'
  },
  {
    key: 'alula_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#ULH',
    title: 'منتجع وادي العُلا الصحراوي ومحمية الحِجر',
    location: 'العُلا، المملكة العربية السعودية',
    category: 'منتجعات صحراوية وتراث عالمي',
    avgRating: 4.9,
    reviewsCount: '11.8K',
    fallbackImage: '/destinations/dest-3.jpg',
    queries: ['AlUla Saudi Arabia desert rock', 'Elephant Rock AlUla Saudi'],
    description: 'أجنحة ضيافة صحراوية فاخرة مندمجة مع التشكيلات الصخرية الذهبية المهيبة في قلب العُلا.'
  },
  {
    key: 'redsea_resort',
    sectorType: 'resort',
    sectorBadge: 'عقد منتجع عالمي',
    codePrefix: '#SSH',
    title: 'منتجعات خليج القرش وشواطئ البحر الأحمر',
    location: 'شرم الشيخ والغردقة، مصر',
    category: 'منتجعات بحرية وغوص عالمية',
    avgRating: 4.8,
    reviewsCount: '14.9K',
    fallbackImage: '/destinations/dest-6.jpg',
    queries: ['Red Sea coral reef beach Egypt', 'Hurghada turquoise coast resort'],
    description: 'منتجعات شاطئية متكاملة على ضفاف البحر الأحمر تجمع صفاء المياه الدافئة ورياضات الغوص والاستجمام العائلي.'
  },
  {
    key: 'dubai_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#DXB',
    title: 'فنادق وأجنحة بوليفارد دبي ونخلة جميرا',
    location: 'دبي، الإمارات العربية المتحدة',
    category: 'فنادق 5 نجوم وأجنحة ملكية',
    avgRating: 4.9,
    reviewsCount: '21.4K',
    fallbackImage: '/destinations/dest-1.jpg',
    queries: ['Dubai skyline twilight Marina', 'Downtown Dubai skyline fountain'],
    description: 'أفخم الفنادق والأجنحة التنفيذية المطلة مباشرة على نافورة دبي الراقصة وأفق الخليج العربي.'
  },
  {
    key: 'istanbul_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#IST',
    title: 'فنادق قصور البوسفور التاريخية — إسطنبول',
    location: 'إسطنبول، تركيا',
    category: 'فنادق قصور وإطلالات بحرية',
    avgRating: 4.9,
    reviewsCount: '15.7K',
    fallbackImage: '/destinations/dest-2.jpg',
    queries: ['Bosphorus Istanbul sunset mosque', 'Ortakoy Mosque Istanbul Bosphorus'],
    description: 'فنادق عريقة على ضفاف مضيق البوسفور تمزج فخامة القصور التاريخية مع أرقى خدمات الضيافة العصرية.'
  },
  {
    key: 'venice_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#VCE',
    title: 'فنادق القصور المائية على القناة الكبرى — فينيسيا',
    location: 'البندقية، إيطاليا',
    category: 'فنادق تاريخية كلاسيكية',
    avgRating: 4.9,
    reviewsCount: '17.8K',
    fallbackImage: '/destinations/dest-8.jpg',
    queries: ['Grand Canal Venice sunset gondola', 'Rialto Bridge Venice Italy'],
    description: 'فنادق إيطالية كلاسيكية بأرصفتها الخاصة لقوارب الجوندولا وإطلالات مباشرة على جسر ريالتو والقناة الكبرى.'
  },
  {
    key: 'jounieh_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#BEY',
    title: 'فنادق خليج جونيه والواجهة البحرية المتوسطية',
    location: 'جبل لبنان وبيروت، لبنان',
    category: 'فنادق أعمال وإطلالات ساحلية',
    avgRating: 4.8,
    reviewsCount: '9.6K',
    fallbackImage: '/destinations/dest-6.jpg',
    queries: ['Jounieh Bay Lebanon coast', 'Pigeon Rocks Raouche Beirut sunset'],
    description: 'منشآت فندقية راقية تطل على زرقة البحر الأبيض المتوسط وسفوح الجبال الخضراء.'
  },
  {
    key: 'marrakech_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#RAK',
    title: 'فنادق ورياض الضيافة الملكية في مراكش وشفشاون',
    location: 'مراكش وشفشاون، المغرب',
    category: 'فنادق ورياض تراثية فاخرة',
    avgRating: 4.9,
    reviewsCount: '12.3K',
    fallbackImage: '/destinations/dest-9.jpg',
    queries: ['Chefchaouen blue city Morocco', 'Koutoubia Mosque Marrakech sunset'],
    description: 'فنادق ورياض مغربية فاخرة تتميز بالحدائق الأندلسية الداخلية والأقواس المزخرفة وخدمات الضيافة الأصيلة.'
  },
  {
    key: 'deadsea_hotel',
    sectorType: 'hotel',
    sectorBadge: 'عقد فندق عالمي',
    codePrefix: '#AMM',
    title: 'فنادق الأعمال والضيافة في عمّان والبحر الميت',
    location: 'عمّان والبحر الميت، الأردن',
    category: 'فنادق استشفاء ومؤتمرات دولية',
    avgRating: 4.8,
    reviewsCount: '10.8K',
    fallbackImage: '/destinations/dest-4.jpg',
    queries: ['Dead Sea Jordan sunset resort', 'Amman citadel skyline Jordan'],
    description: 'فنادق ومنشآت ضيافة علاجية ومؤتمرات فاخرة على أخفض بقعة في العالم وأبراج العاصمة عمّان.'
  },
  {
    key: 'petra_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#PTR',
    title: 'مدينة البتراء الوردية ومحمية وادي رم',
    location: 'معان والعقبة، الأردن',
    category: 'عجائب العالم والمعالم الأثرية',
    avgRating: 4.9,
    reviewsCount: '24.5K',
    fallbackImage: '/destinations/dest-4.jpg',
    queries: ['Petra Jordan Treasury Khazneh', 'Wadi Rum Jordan desert landscape'],
    description: 'إحدى عجائب الدنيا السبع الجديدة المحفورة في الصخور الوردية عبر ممر السيق التاريخي المهيب.'
  },
  {
    key: 'giza_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#CAI',
    title: 'أهرامات الجيزة وتمثال أبو الهول وضفاف النيل',
    location: 'القاهرة والجيزة، مصر',
    category: 'معالم الحضارة الإنسانية الخالدة',
    avgRating: 4.9,
    reviewsCount: '29.1K',
    fallbackImage: '/destinations/dest-5.jpg',
    queries: ['Pyramids of Giza sunset Egypt', 'Great Sphinx Giza Pyramids'],
    description: 'أشهر مقصد أثري وسياحي في العالم يجمع عظمة الأهرامات الخالدة وجولات نهر النيل الساحرة.'
  },
  {
    key: 'abudhabi_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#AUH',
    title: 'جامع الشيخ زايد الكبير وكورنيش أبوظبي الثقافي',
    location: 'أبوظبي، الإمارات العربية المتحدة',
    category: 'معالم معمارية وثقافية عالمية',
    avgRating: 5.0,
    reviewsCount: '23.3K',
    fallbackImage: '/destinations/dest-1.jpg',
    queries: ['Sheikh Zayed Mosque Abu Dhabi reflection', 'Abu Dhabi Corniche skyline twilight'],
    description: 'أيقونة معمارية رخامية ناصعة البياض تضم اثنتين وثمانين قبة وأحواض مائية عاكسة تستقطب ملايين الزوار.'
  },
  {
    key: 'alhambra_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#GRX',
    title: 'قصر الحمراء وحدائق العريف التاريخية',
    location: 'غرناطة، إسبانيا',
    category: 'أماكن تراثية وعمارة عالمية',
    avgRating: 4.9,
    reviewsCount: '18.6K',
    fallbackImage: '/destinations/dest-9.jpg',
    queries: ['Alhambra Granada palace Sierra Nevada', 'Generalife gardens Granada'],
    description: 'درة المعالم التاريخية في الأندلس بأروقتها المنقوشة وحدائقها الغنّاء المطلة على قمم سييرا نيفادا.'
  },
  {
    key: 'cappadocia_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#CAP',
    title: 'وادي كابادوكيا ومناطيد الشروق البانورامية',
    location: 'نوشهر، تركيا',
    category: 'أماكن سياحية طبيعية ومغامرات',
    avgRating: 4.9,
    reviewsCount: '19.8K',
    fallbackImage: '/destinations/dest-2.jpg',
    queries: ['Cappadocia hot air balloons sunrise', 'Goreme Cappadocia valley landscape'],
    description: 'وجهة سياحية عالمية فريدة تحلق في سمائها مئات المناطيد الملونة فوق الوديان والتكوينات الصخرية.'
  },
  {
    key: 'dubai_frame_landmark',
    sectorType: 'landmark',
    sectorBadge: 'عقد معلم سياحي',
    codePrefix: '#DXB',
    title: 'برج خليفة ومتحف المستقبل وواجهة دبي المائية',
    location: 'دبي، الإمارات العربية المتحدة',
    category: 'أماكن سياحية عصرية عالمية',
    avgRating: 5.0,
    reviewsCount: '26.7K',
    fallbackImage: '/destinations/dest-1.jpg',
    queries: ['Burj Khalifa Downtown Dubai', 'Dubai Marina waterfront promenade'],
    description: 'أبرز المعالم السياحية العصرية في العالم وأعلى منصة مشاهدة بانورامية تستقطب الزوار من مختلف القارات.'
  }
];

const EXCLUDED_WORDS = [
  'map', 'diagram', 'plan', 'logo', 'flag', 'stamp', 'coat_of_arms',
  'construction', '2007', '2008', 'sign', 'plaque', 'ticket', 'menu',
  'portrait', 'selfie', 'collage', 'banner_page'
];

const queryGalleryCache = new Map();
const inFlightQueries = new Set();

function shuffleWithSeed(arr, seedNum) {
  const copy = [...arr];
  let s = seedNum || Date.now();
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildBalancedSectorRotation(seedNum) {
  const resorts = shuffleWithSeed(TOURISM_POOL.filter((d) => d.sectorType === 'resort'), seedNum + 11);
  const hotels = shuffleWithSeed(TOURISM_POOL.filter((d) => d.sectorType === 'hotel'), seedNum + 29);
  const landmarks = shuffleWithSeed(TOURISM_POOL.filter((d) => d.sectorType === 'landmark'), seedNum + 53);
  const buckets = [resorts, hotels, landmarks];
  const shift = Math.abs(seedNum) % 3;
  const ordered = [buckets[shift], buckets[(shift + 1) % 3], buckets[(shift + 2) % 3]];
  const interleaved = [];
  const maxLen = Math.max(resorts.length, hotels.length, landmarks.length);
  for (let i = 0; i < maxLen; i++) {
    for (const b of ordered) {
      if (b[i]) interleaved.push(b[i]);
    }
  }
  return interleaved;
}

async function fetchWikimediaPhotosForQuery(searchQuery) {
  const cached = queryGalleryCache.get(searchQuery);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < 45 * 60 * 1000 && cached.urls.length > 0) return cached.urls;
  if (inFlightQueries.has(searchQuery)) return cached?.urls || [];
  inFlightQueries.add(searchQuery);
  try {
    const q = encodeURIComponent(searchQuery);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=640&format=json&origin=*`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'AronaBoostTourismPlatform/2.0 (https://semoheva123.github.io/arona-boost/)' },
      signal: AbortSignal.timeout(2800)
    });
    if (!res.ok) return cached?.urls || [];
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    const cleanUrls = [];
    for (const p of pages) {
      const titleLower = String(p.title || '').toLowerCase();
      if (EXCLUDED_WORDS.some((w) => titleLower.includes(w))) continue;
      const ii = p.imageinfo?.[0];
      if (!ii || (ii.mime !== 'image/jpeg' && ii.mime !== 'image/webp')) continue;
      if (!ii.width || !ii.height || ii.width < 800 || ii.width < ii.height * 1.18 || ii.width > ii.height * 3.2) continue;
      const rawThumb = ii.thumburl || (ii.size && ii.size < 450000 ? ii.url : null);
      if (rawThumb) {
        const proxied = `/api/live-image?u=${encodeURIComponent(rawThumb)}`;
        if (!cleanUrls.includes(proxied)) cleanUrls.push(proxied);
      }
    }
    if (cleanUrls.length > 0) queryGalleryCache.set(searchQuery, { urls: cleanUrls, fetchedAt: now });
    return cleanUrls;
  } catch {
    return cached?.urls || [];
  } finally {
    inFlightQueries.delete(searchQuery);
  }
}

async function buildLiveGalleryForDestination(dest, rotationSeed = 0) {
  const now = Date.now();
  const queryResults = dest.queries.map((q) => {
    const cached = queryGalleryCache.get(q);
    if (!cached || now - cached.fetchedAt >= 45 * 60 * 1000) {
      fetchWikimediaPhotosForQuery(q).catch(() => {});
    }
    return cached?.urls || [];
  });
  const combined = [];
  const maxLen = Math.max(0, ...queryResults.map((r) => r.length));
  for (let i = 0; i < maxLen; i++) {
    for (const list of queryResults) {
      if (list[i] && !combined.includes(list[i])) combined.push(list[i]);
    }
  }
  const timeBucket = Math.floor(Date.now() / 45000) + Number(rotationSeed || 0);
  const rotatedLive = shuffleWithSeed(combined, timeBucket + dest.key.length * 97).slice(0, 4);
  return [dest.fallbackImage, ...rotatedLive.filter((u) => u !== dest.fallbackImage)];
}

export async function getDynamicDestinationsForSlots(slotCount, completedMap, rotationSeed = 0) {
  const daySeed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const effectiveSeed = daySeed + Number(rotationSeed || 0) * 31;
  const rotatedPool = buildBalancedSectorRotation(effectiveSeed);
  const usedKeys = new Set();
  const chosenForSlots = [];

  for (let slot = 1; slot <= slotCount; slot++) {
    const done = completedMap.get(slot);
    if (done) {
      const matched = TOURISM_POOL.find((d) => d.title === done.task_title) || TOURISM_POOL[(slot - 1) % TOURISM_POOL.length];
      usedKeys.add(matched.key);
    }
  }
  let poolCursor = 0;
  for (let slot = 1; slot <= slotCount; slot++) {
    const done = completedMap.get(slot);
    if (done) {
      const matched = TOURISM_POOL.find((d) => d.title === done.task_title) || TOURISM_POOL[(slot - 1) % TOURISM_POOL.length];
      chosenForSlots.push({ slot, dest: matched, done });
    } else {
      while (poolCursor < rotatedPool.length && usedKeys.has(rotatedPool[poolCursor].key)) poolCursor++;
      const picked = rotatedPool[poolCursor % rotatedPool.length];
      usedKeys.add(picked.key);
      poolCursor++;
      chosenForSlots.push({ slot, dest: picked, done: null });
    }
  }

  return Promise.all(
    chosenForSlots.map(async ({ slot, dest, done }) => {
      const gallery = await buildLiveGalleryForDestination(dest, effectiveSeed + slot);
      return {
        slot,
        key: dest.key,
        sectorType: dest.sectorType || 'landmark',
        sectorBadge: dest.sectorBadge || 'عقد تقييم سياحي',
        codePrefix: dest.codePrefix || '#AB',
        title: done ? done.task_title : dest.title,
        location: done && done.location ? done.location : dest.location,
        category: dest.category,
        avgRating: dest.avgRating,
        reviewsCount: dest.reviewsCount,
        image: gallery[0] || dest.fallbackImage,
        fallbackImage: dest.fallbackImage,
        gallery,
        description: dest.description,
        completed: Boolean(done),
        completedAt: done ? done.created_at : null,
        userRating: done ? done.rating : null,
        userTags: done ? done.review_tags : '',
        userComment: done ? done.review_comment : ''
      };
    })
  );
}

export async function getFeaturedDestinationsShowcase(seed = 0) {
  const timeBucket = Math.floor(Date.now() / 60000) + Number(seed || 0);
  const picks = buildBalancedSectorRotation(timeBucket).slice(0, 6);
  return Promise.all(
    picks.map(async (dest, idx) => {
      const gallery = await buildLiveGalleryForDestination(dest, timeBucket + idx);
      return {
        key: dest.key,
        sectorType: dest.sectorType || 'landmark',
        sectorBadge: dest.sectorBadge || 'عقد تقييم سياحي',
        codePrefix: dest.codePrefix || '#AB',
        title: dest.title,
        location: dest.location,
        category: dest.category,
        avgRating: dest.avgRating,
        image: gallery[0] || dest.fallbackImage,
        fallbackImage: dest.fallbackImage,
        gallery: gallery.slice(0, 4)
      };
    })
  );
}

export async function proxyWikimediaImageEdge(rawUrl) {
  if (!rawUrl || !/^https:\/\/(thumb|upload)\.wikimedia\.org\//.test(rawUrl)) {
    return new Response('Bad url', { status: 400 });
  }
  try {
    const upstream = await fetch(rawUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AronaBoostTourismPlatform/2.0)' },
      signal: AbortSignal.timeout(6000)
    });
    if (!upstream.ok) {
      return Response.redirect('https://semoheva123.github.io/arona-boost/destinations/dest-1.jpg', 302);
    }
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=1800',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch {
    return Response.redirect('https://semoheva123.github.io/arona-boost/destinations/dest-1.jpg', 302);
  }
}
