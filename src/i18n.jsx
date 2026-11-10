import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Globe2, Check } from 'lucide-react';

export const SUPPORTED_LANGUAGES = [
  { code: 'ar', short: 'AR', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'en', short: 'EN', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'tr', short: 'TR', name: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'fr', short: 'FR', name: 'Français', flag: '🇫🇷', dir: 'ltr' }
];

export const REFERENCE_CURRENCIES = [
  { code: 'USDT', symbol: '$', rate: 1, label: 'USDT فقط', decimals: 2 },
  { code: 'AED', symbol: 'AED', rate: 3.673, label: 'درهم إماراتي (AED)', decimals: 2 },
  { code: 'SAR', symbol: 'SAR', rate: 3.75, label: 'ريال سعودي (SAR)', decimals: 2 },
  { code: 'TRY', symbol: '₺', rate: 34.6, label: 'ليرة تركية (TRY)', decimals: 2 },
  { code: 'IQD', symbol: 'IQD', rate: 1310, label: 'دينار عراقي (IQD)', decimals: 0 },
  { code: 'JOD', symbol: 'JOD', rate: 0.709, label: 'دينار أردني (JOD)', decimals: 2 },
  { code: 'EGP', symbol: 'EGP', rate: 49.25, label: 'جنيه مصري (EGP)', decimals: 2 },
  { code: 'EUR', symbol: '€', rate: 0.92, label: 'يورو أوروبي (EUR)', decimals: 2 }
];

const DICTIONARY = {
  ar: {
    nav_home: 'الرئيسية',
    nav_earnings: 'الأرباح',
    nav_tasks: 'السفر',
    nav_team: 'الفريق',
    nav_account: 'حسابي',
    grade_prefix: 'الفئة A',
    admin_btn: 'الإدارة',
    concierge_tip: 'مكتب المساندة التنفيذية',
    wallet_central_title: 'المحفظة المركزية المعتمدة',
    wallet_account_no: 'حساب رقم',
    wallet_instant_usdt: 'تسوية فورية USDT',
    wallet_income_label: 'محفظة الدخل (الرصيد القابل للسحب)',
    wallet_recharge_label: 'رصيد الشحن',
    wallet_total_deposits: 'إجمالي الإيداعات',
    wallet_total_withdrawals: 'إجمالي المسحوبات',
    btn_deposit: 'إيداع رصيد',
    btn_withdraw: 'سحب الأرباح',
    ref_equiv_prefix: 'المعادل المرجعي التقريبي:',
    auth_login_tab: 'تسجيل الدخول',
    auth_register_tab: 'عضوية جديدة'
  },
  en: {
    nav_home: 'Home',
    nav_earnings: 'Profit',
    nav_tasks: 'Travel',
    nav_team: 'Team',
    nav_account: 'Mine',
    grade_prefix: 'Grade A',
    admin_btn: 'Admin',
    concierge_tip: 'Executive Concierge Desk',
    wallet_central_title: 'Verified Sovereign Wallet',
    wallet_account_no: 'Account',
    wallet_instant_usdt: 'Instant USDT Settlement',
    wallet_income_label: 'Income Wallet (Withdrawable)',
    wallet_recharge_label: 'Contract Balance',
    wallet_total_deposits: 'Total Deposits',
    wallet_total_withdrawals: 'Total Withdrawals',
    btn_deposit: 'Deposit USDT',
    btn_withdraw: 'Withdraw Profit',
    ref_equiv_prefix: 'Approx. Local Equivalent:',
    auth_login_tab: 'Sign In',
    auth_register_tab: 'Create Account'
  },
  tr: {
    nav_home: 'Ana Sayfa',
    nav_earnings: 'Kazançlar',
    nav_tasks: 'Seyahat',
    nav_team: 'Ekip',
    nav_account: 'Hesabım',
    grade_prefix: 'Seviye A',
    admin_btn: 'Yönetim',
    concierge_tip: 'VIP Destek Masası',
    wallet_central_title: 'Onaylı Merkez Cüzdan',
    wallet_account_no: 'Hesap',
    wallet_instant_usdt: 'Anında USDT Takası',
    wallet_income_label: 'Gelir Cüzdanı (Çekilebilir)',
    wallet_recharge_label: 'Yükleme Bakiyesi',
    wallet_total_deposits: 'Toplam Yatırım',
    wallet_total_withdrawals: 'Toplam Çekim',
    btn_deposit: 'Bakiye Yatır',
    btn_withdraw: 'Kazanç Çek',
    ref_equiv_prefix: 'Yaklaşık Yerel Karşılık:',
    auth_login_tab: 'Giriş Yap',
    auth_register_tab: 'Yeni Hesap'
  },
  fr: {
    nav_home: 'Accueil',
    nav_earnings: 'Revenus',
    nav_tasks: 'Évaluer',
    nav_team: 'Équipe',
    nav_account: 'Compte',
    grade_prefix: 'Catégorie A',
    admin_btn: 'Admin',
    concierge_tip: 'Conciergerie Exécutive',
    wallet_central_title: 'Portefeuille Central Certifié',
    wallet_account_no: 'Compte',
    wallet_instant_usdt: 'Règlement USDT Instantané',
    wallet_income_label: 'Portefeuille Revenus (Retirable)',
    wallet_recharge_label: 'Solde Contrat',
    wallet_total_deposits: 'Total Dépôts',
    wallet_total_withdrawals: 'Total Retraits',
    btn_deposit: 'Déposer USDT',
    btn_withdraw: 'Retirer Gains',
    ref_equiv_prefix: 'Équivalent Local Approx. :',
    auth_login_tab: 'Connexion',
    auth_register_tab: 'Inscription'
  }
};

const I18nContext = createContext(null);

function safeReadStorage(key, fallback) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function safeWriteStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore iframe storage errors
  }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = safeReadStorage('arona_lang', 'ar');
    return SUPPORTED_LANGUAGES.some((l) => l.code === saved) ? saved : 'ar';
  });

  const [currency, setCurrencyState] = useState(() => {
    const saved = safeReadStorage('arona_ref_currency', 'AED');
    return REFERENCE_CURRENCIES.some((c) => c.code === saved) ? saved : 'AED';
  });

  const setLang = useCallback((code) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === code)) return;
    setLangState(code);
    safeWriteStorage('arona_lang', code);
  }, []);

  const setCurrency = useCallback((code) => {
    if (!REFERENCE_CURRENCIES.some((c) => c.code === code)) return;
    setCurrencyState(code);
    safeWriteStorage('arona_ref_currency', code);
  }, []);

  useEffect(() => {
    const meta = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
  }, [lang]);

  const t = useCallback(
    (key, fallback = '') => {
      const pack = DICTIONARY[lang] || DICTIONARY.ar;
      return pack[key] || DICTIONARY.ar[key] || fallback || key;
    },
    [lang]
  );

  const formatReferenceEquivalent = useCallback(
    (usdtAmount) => {
      const curr = REFERENCE_CURRENCIES.find((c) => c.code === currency);
      if (!curr || curr.code === 'USDT') return null;
      const converted = Number(usdtAmount || 0) * curr.rate;
      const formatted = converted.toLocaleString('en-US', {
        minimumFractionDigits: curr.decimals,
        maximumFractionDigits: curr.decimals
      });
      return `≈ ${formatted} ${curr.code}`;
    },
    [currency]
  );

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        currency,
        setCurrency,
        t,
        formatReferenceEquivalent
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: 'ar',
      setLang: () => {},
      currency: 'AED',
      setCurrency: () => {},
      t: (k, fb) => DICTIONARY.ar[k] || fb || k,
      formatReferenceEquivalent: () => null
    };
  }
  return ctx;
}

export function LanguageSwitcherPill({ compact = true }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="اللغة / Language"
        className="h-8 px-2 rounded-xl bg-white/10 hover:bg-white/18 border border-white/15 text-slate-100 inline-flex items-center gap-1 text-[10.5px] font-extrabold transition-colors cursor-pointer"
      >
        <Globe2 className="w-3.5 h-3.5 text-[#F5D076]" />
        <span className="ltr-num">{compact ? current.short : current.name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 z-50 w-40 rounded-2xl bg-[#07192E] border border-[#F5D076]/35 shadow-2xl p-1.5 space-y-0.5 text-white">
            {SUPPORTED_LANGUAGES.map((item) => {
              const active = item.code === lang;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLang(item.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#F5D076]/20 text-[#F5D076] border border-[#F5D076]/35'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{item.flag}</span>
                    <span>{item.name}</span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 text-[#F5D076]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
