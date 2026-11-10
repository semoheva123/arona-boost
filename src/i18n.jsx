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
    auth_register_tab: 'عضوية جديدة',
    home_act_withdraw: 'سحب',
    home_act_deposit: 'إيداع',
    home_act_invite: 'دعوة',
    home_act_vault: 'استثمر مع أرونا',
    home_star_sub: 'سلم المناصب والرواتب',
    home_star_title: '< رحلة النجوم >',
    home_profit_sub: 'درجات العقود وجدول العوائد',
    home_profit_title: '< الأرباح >',
    corp_reports_title: 'التقارير التنفيذية والمجالس',
    promo_badge: 'العرض التعريفي — Arona Boost',
    promo_grades_btn: 'درجات الوظيفة',
    services_title: 'المنتجعات والفنادق والوجهات المتعاقدة',
    services_sub: 'صور حية متجددة للمنتجعات العالمية والفنادق والمعالم السياحية',
    services_cta: 'بدء التقييم',
    install_title: 'ثبّت تطبيق Arona Boost على هاتفك',
    install_sub: 'تصفح أسرع بملء الشاشة مثل تطبيقات الهواتف الأصلية',
    install_btn: 'تثبيت',
    feed_about_title: 'نبذة عن شركة Arona Boost',
    feed_about_sub: 'منظومة دولية متخصصة في الترويج الرقمي وتصنيف المنتجعات والفنادق والمعالم السياحية الشريكة حول العالم.',
    feed_job_title: 'وصف وظيفة الموظف الجزئي عبر الإنترنت',
    feed_job_sub: 'يقوم الموظف بإتمام عقود التقييم اليومية للمعالم والفنادق والمنتجعات مقابل دخل يومي ثابت ومكافآت ترقية.',
    feed_charter_title: 'بيان شركة Arona Boost الرسمي',
    feed_charter_sub: 'المبادئ العشرة المعتمدة لضمان حقوق الموظفين، استرداد ضمان العمل الكامل (365 يوماً)، وشفافية الأرباح.',
    feed_guide_title: 'إشعار الموظفين وإرشادات العمل',
    feed_guide_sub: 'ضوابط ساعات التقييم اليومية، مواعيد السحب الفئوي، والمشاركة في فعاليات الظرف الأحمر ومتجر النقاط.'
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
    auth_register_tab: 'Create Account',
    home_act_withdraw: 'Withdraw',
    home_act_deposit: 'Deposit',
    home_act_invite: 'Invite',
    home_act_vault: 'Invest w/ Arona',
    home_star_sub: 'Career Ladder & Salaries',
    home_star_title: '< Star Journey >',
    home_profit_sub: 'Contract Grades & Yields',
    home_profit_title: '< Earnings >',
    corp_reports_title: 'Executive Councils & Reports',
    promo_badge: 'Official Showcase — Arona Boost',
    promo_grades_btn: 'Job Grades',
    services_title: 'Contracted Resorts, Hotels & Landmarks',
    services_sub: 'Auto-renewing live imagery of global resorts, luxury hotels & landmarks',
    services_cta: 'Start Rating',
    install_title: 'Install Arona Boost on your phone',
    install_sub: 'Faster full-screen experience like native mobile apps',
    install_btn: 'Install',
    feed_about_title: 'About Arona Boost Corporation',
    feed_about_sub: 'Global platform specializing in digital promotion and rating of partner resorts, luxury hotels, and landmarks.',
    feed_job_title: 'Online Part-Time Evaluator Role',
    feed_job_sub: 'Complete daily resort, hotel, and landmark rating contracts for steady daily USDT income and career bonuses.',
    feed_charter_title: 'Official Arona Boost Charter',
    feed_charter_sub: 'Ten core principles guaranteeing member rights, 100% refundable 365-day work bond, and transparent payouts.',
    feed_guide_title: 'Employee Notice & Guidelines',
    feed_guide_sub: 'Daily evaluation schedule, withdrawal tiers, Red Envelope gift events, and Point Shop rewards.'
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
    auth_register_tab: 'Yeni Hesap',
    home_act_withdraw: 'Çekim',
    home_act_deposit: 'Yatırım',
    home_act_invite: 'Davet Et',
    home_act_vault: 'Arona Yatırım',
    home_star_sub: 'Kariyer ve Aylık Maaşlar',
    home_star_title: '< Yıldız Yolculuğu >',
    home_profit_sub: 'Sözleşme Seviyeleri ve Getiri',
    home_profit_title: '< Kazançlar >',
    corp_reports_title: 'Yönetim Raporları ve Toplantılar',
    promo_badge: 'Tanıtım Sunumu — Arona Boost',
    promo_grades_btn: 'Seviyeler',
    services_title: 'Anlaşmalı Tatil Köyleri ve Oteller',
    services_sub: 'Dünya çapında tatil köyleri, oteller ve turistik yerlerden canlı kareler',
    services_cta: 'Değerlendir',
    install_title: 'Arona Boost Uygulamasını Yükle',
    install_sub: 'Tam ekran hızlı mobil uygulama deneyimi',
    install_btn: 'Yükle',
    feed_about_title: 'Arona Boost Hakkında',
    feed_about_sub: 'Küresel tatil köyleri, lüks oteller ve turistik noktaların dijital tanıtım ve derecelendirme ağı.',
    feed_job_title: 'Çevrimiçi Yarı Zamanlı Görev Tanımı',
    feed_job_sub: 'Sabit günlük USDT geliri ve terfi ödülleri için günlük turizm değerlendirme sözleşmelerini tamamlayın.',
    feed_charter_title: 'Arona Boost Resmi Şirket Beyanı',
    feed_charter_sub: 'Çalışan hakları, 365 gün sonunda %100 iade edilen iş teminatı ve şeffaf ödeme ilkeleri.',
    feed_guide_title: 'Çalışan Duyuruları ve Rehberi',
    feed_guide_sub: 'Günlük değerlendirme saatleri, çekim kuralları, Kırmızı Zarf etkinlikleri ve Puan Mağazası.'
  },
  fr: {
    nav_home: 'Accueil',
    nav_earnings: 'Revenus',
    nav_tasks: 'Voyage',
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
    auth_register_tab: 'Inscription',
    home_act_withdraw: 'Retrait',
    home_act_deposit: 'Dépôt',
    home_act_invite: 'Inviter',
    home_act_vault: 'Investir Arona',
    home_star_sub: 'Carrière & Salaires Mensuels',
    home_star_title: '< Parcours Étoiles >',
    home_profit_sub: 'Grades & Tableau des Revenus',
    home_profit_title: '< Revenus >',
    corp_reports_title: 'Conseils Exécutifs & Rapports',
    promo_badge: 'Présentation — Arona Boost',
    promo_grades_btn: 'Grades',
    services_title: 'Complexes, Hôtels & Sites Partenaires',
    services_sub: 'Photos en direct renouvelées des complexes mondiaux, hôtels et monuments',
    services_cta: 'Évaluer',
    install_title: 'Installer l’application Arona Boost',
    install_sub: 'Navigation plein écran rapide sur votre téléphone',
    install_btn: 'Installer',
    feed_about_title: 'À propos d’Arona Boost',
    feed_about_sub: 'Réseau international dédié à la promotion numérique et à l’évaluation des complexes, hôtels et sites touristiques.',
    feed_job_title: 'Poste d’Évaluateur à Temps Partiel',
    feed_job_sub: 'Complétez les contrats quotidiens d’évaluation touristique pour un revenu USDT stable et des primes.',
    feed_charter_title: 'Charte Officielle Arona Boost',
    feed_charter_sub: 'Dix principes garantissant les droits des membres et le remboursement intégral de la caution (365 jours).',
    feed_guide_title: 'Avis aux Employés & Directives',
    feed_guide_sub: 'Horaires d’évaluation, retraits, événements Enveloppe Rouge et Boutique de Points.'
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
