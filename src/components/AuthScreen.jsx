import React, { useState, useEffect, useMemo } from 'react';
import ModalPortal from './ModalPortal';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  UserPlus,
  LogIn,
  Award,
  MessageCircle,
  FileText,
  Building2,
  ChevronDown,
  Check,
  X,
  Globe2,
  Loader2,
  BadgeCheck,
  KeyRound,
  Crown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import AboutTermsSheet from './AboutTermsSheet';
import CorporateCharterSheet from './CorporateCharterSheet';
import { LanguageSwitcherPill } from '../i18n';
import { validatePhoneNumber, COUNTRY_RULES } from '../phoneValidator';
import { apiRequest } from '../api';

const COUNTRY_CODES = [
  { code: '+963', flag: '🇸🇾', country: 'الجمهورية العربية السورية' },
  { code: '+90', flag: '🇹🇷', country: 'الجمهورية التركية' },
  { code: '+966', flag: '🇸🇦', country: 'المملكة العربية السعودية' },
  { code: '+964', flag: '🇮🇶', country: 'جمهورية العراق' },
  { code: '+962', flag: '🇯🇴', country: 'المملكة الأردنية الهاشمية' },
  { code: '+20', flag: '🇪🇬', country: 'جمهورية مصر العربية' },
  { code: '+971', flag: '🇦🇪', country: 'الإمارات العربية المتحدة' },
  { code: '+961', flag: '🇱🇧', country: 'الجمهورية اللبنانية' },
  { code: '+965', flag: '🇰🇼', country: 'دولة الكويت' },
  { code: '+974', flag: '🇶🇦', country: 'دولة قطر' },
  { code: '+968', flag: '🇴🇲', country: 'سلطنة عُمان' },
  { code: '+973', flag: '🇧🇭', country: 'مملكة البحرين' },
  { code: '+218', flag: '🇱🇾', country: 'دولة ليبيا' },
  { code: '+213', flag: '🇩🇿', country: 'الجمهورية الجزائرية' },
  { code: '+212', flag: '🇲🇦', country: 'المملكة المغربية' },
  { code: 'LOCAL', flag: '🌐', country: 'إدخال الرقم الكامل مباشرة (بدون مفتاح)' }
];

function evaluatePasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: 'bg-slate-200' };
  if (pw.length < 4) return { level: 1, label: 'قصيرة جداً (4 محارف على الأقل)', color: 'bg-rose-500' };
  let score = 1;
  if (pw.length >= 6) score += 1;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) score += 1;
  if (pw.length >= 8 || /[^A-Za-z0-9]/.test(pw)) score += 1;

  if (score <= 2) return { level: 2, label: 'حماية مقبولة', color: 'bg-amber-500' };
  if (score === 3) return { level: 3, label: 'حماية جيدة جداً', color: 'bg-teal-600' };
  return { level: 4, label: 'حماية مصرفية ممتازة', color: 'bg-emerald-600' };
}

export default function AuthScreen({ onAuthSuccess, whatsappNumber, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [countryCode, setCountryCode] = useState('+963');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteField, setShowInviteField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [charterOpen, setCharterOpen] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setInviteCode(ref.toUpperCase());
        setShowInviteField(true);
        setMode('register');
      }
    } catch {
      // ignore URL parsing error
    }
  }, []);

  useEffect(() => {
    const clean = String(inviteCode || '').trim().toUpperCase();
    if (clean.length < 4) {
      setReferrerInfo(null);
      return;
    }
    let active = true;
    apiRequest(`/api/public/referrer/${encodeURIComponent(clean)}`, { token: null })
      .then((res) => {
        if (active) setReferrerInfo(res?.valid ? res : null);
      })
      .catch(() => {
        if (active) setReferrerInfo(null);
      });
    return () => {
      active = false;
    };
  }, [inviteCode]);

  const selectedCountry = useMemo(
    () => COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0],
    [countryCode]
  );

  const phoneValidation = useMemo(
    () => validatePhoneNumber(phone, countryCode),
    [phone, countryCode]
  );

  const countryExample = useMemo(() => {
    if (countryCode === 'LOCAL') return '0991234567';
    return COUNTRY_RULES.find((r) => r.code === countryCode)?.example || '991234567';
  }, [countryCode]);

  const pwStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const switchMode = (target) => {
    setMode(target);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phone.trim() || !password) {
      setErrorMsg('يرجى إدخال رقم الهاتف المعتمد وكلمة المرور للمتابعة');
      return;
    }
    if (mode === 'register' && !phoneValidation.valid) {
      setErrorMsg(phoneValidation.error || 'رقم الهاتف المدخل غير صحيح');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { phone, countryCode, password }
          : { phone, countryCode, password, inviteCode: inviteCode.trim() };

      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: payload,
        token: null
      });

      onAuthSuccess(data);
      showToast(
        mode === 'login'
          ? 'تم التحقق من بيانات الاعتماد — مرحباً بك في Arona Boost'
          : 'تم توثيق وإنشاء حسابك الرسمي بنجاح'
      );
    } catch (err) {
      setErrorMsg(err.message || 'تعذر إتمام عملية المصادقة، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  const cleanWa = String(whatsappNumber || '963990000000').replace(/\D/g, '');
  const waHref = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    'مرحباً مكتب الدعم الرسمي في Arona Boost، أود الاستفسار بخصوص حسابي.'
  )}`;

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-[#EEF2F7] relative overflow-x-hidden">
      {/* ==================== EXECUTIVE ROYAL HERO HEADER ==================== */}
      <div
        className="relative px-5 pt-5 pb-14 text-white overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, #051322 0%, #0A233D 48%, #0C4359 82%, #0D6E68 100%)'
        }}
      >
        {/* Architectural Geometric Filigree Pattern */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.06]"
           xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="aronaExecGrid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="#F5D076"
                strokeWidth="0.8"
              />
              <circle cx="18" cy="18" r="1.2" fill="#F5D076" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#aronaExecGrid)" />
        </svg>

        {/* Ambient Champagne Gold & Emerald Glows */}
        <div
          className="pointer-events-none absolute -top-20 -right-16 w-60 h-60 rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #F5D076 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 -left-20 w-64 h-64 rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #14B8A6 0%, transparent 70%)' }}
        />

        {/* Top Institutional Bar */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/8 border border-white/15 backdrop-blur-xs px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            <span className="text-[10.5px] font-bold text-slate-100 tracking-wide">
              البوابة الرسمية المعتمدة
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcherPill compact={true} variant="dark" />
            <button
              type="button"
              onClick={() => setCharterOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/12 hover:bg-amber-300/20 border border-amber-300/35 px-3 py-1 text-[10.5px] font-extrabold text-[#F5D076] transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>بيان الشركة</span>
            </button>
          </div>
        </div>

        {/* Executive Crest & Formal Identity */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-3.5">
            {/* Outer Halo Ring */}
            <div className="w-[72px] h-[72px] rounded-[22px] p-[1.5px] bg-gradient-to-b from-[#F5D076]/75 via-white/25 to-teal-300/50 shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
              <div
                className="w-full h-full rounded-[20.5px] flex items-center justify-center relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(145deg, #071A2E 0%, #0C3654 60%, #0D7A72 100%)'
                }}
              >
                <div className="pointer-events-none absolute inset-[3px] rounded-[17px] border border-white/10" />
                <svg viewBox="0 0 64 64" className="w-9 h-9 relative z-10" fill="none">
                  <path
                    d="M32 9L52 49H41.8L37.2 39.2H26.8L22.2 49H12L32 9ZM32 22.8L28.9 30.8H35.1L32 22.8Z"
                    fill="#FFFFFF"
                  />
                  <circle cx="48.5" cy="15.5" r="5.5" fill="#F5D076" />
                </svg>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <h1 className="font-display text-[26px] font-extrabold tracking-tight text-white leading-none">
              Arona <span className="text-[#F5D076]">Boost</span>
            </h1>
            <BadgeCheck className="w-5 h-5 text-[#F5D076] shrink-0" />
          </div>

          <p className="mt-1.5 text-xs font-semibold text-teal-100/90 max-w-[310px] leading-relaxed">
            المجموعة الدولية للترويج السياحي الرقمي وإدارة العوائد اليومية
          </p>

          {/* 3-Pillar Institutional Trust Strip */}
          <div className="mt-4 w-full grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-950/35 border border-white/12 backdrop-blur-xs p-2.5 text-center">
            <div className="px-1 border-l border-white/10">
              <p className="text-[10.5px] font-extrabold text-[#F5D076]">تسوية USDT</p>
              <p className="text-[9.5px] text-slate-300 mt-0.5 ltr-num">TRC20 • BEP20</p>
            </div>
            <div className="px-1 border-l border-white/10">
              <p className="text-[10.5px] font-extrabold text-emerald-300">ضمان عمل رسمي</p>
              <p className="text-[9.5px] text-slate-300 mt-0.5">مسترد 100%</p>
            </div>
            <div className="px-1">
              <p className="text-[10.5px] font-extrabold text-white">حماية مصرفية</p>
              <p className="text-[9.5px] text-slate-300 mt-0.5 ltr-num">256-Bit + PIN</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ELEVATED FORMAL PORTAL CARD ==================== */}
      <div className="relative z-20 px-4 -mt-7 flex-1 flex flex-col justify-between pb-6">
        <div className="bg-white rounded-[28px] p-5 shadow-[0_20px_50px_-15px_rgba(6,21,38,0.16)] border border-slate-200/90">
          {/* Executive Personal Nomination Banner (when invited via ?ref=CODE) */}
          {referrerInfo && (
            <div
              className="mb-4 rounded-2xl p-3.5 text-white border border-[#F5D076]/45 relative overflow-hidden"
              style={{
                background: 'linear-gradient(140deg, #051322 0%, #0A2542 58%, #0D6E68 100%)'
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5D076]/20 border border-[#F5D076]/45 px-2.5 py-0.5 text-[10px] font-extrabold text-[#F5D076]">
                  <Crown className="w-3 h-3" />
                  <span>بطاقة ترشيح رسمية معتمدة</span>
                </span>
                <span className="ltr-num text-[10px] font-bold text-teal-200">
                  #{referrerInfo.memberSerial}
                </span>
              </div>
              <p className="text-xs font-extrabold text-white leading-relaxed">
                تم ترشيحك للانضمام إلى كادر تقييم الضيافة في Arona Boost عبر{' '}
                <span className="text-[#F5D076]">
                  {referrerInfo.jobTitle} ({referrerInfo.gradeName})
                </span>
              </p>
              <p className="text-[10.5px] text-teal-100/85 mt-1">
                حساب المُرَشِّح الموثق: <span className="ltr-num font-bold">{referrerInfo.maskedPhone}</span> • كود الإحالة:{' '}
                <span className="ltr-num font-extrabold text-[#F5D076]">{referrerInfo.inviteCode}</span>
              </p>
            </div>
          )}

          {/* Executive Segmented Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-[#F1F5F9] rounded-2xl border border-slate-200/75 mb-4">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#081E36] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn
                className={`w-3.5 h-3.5 ${
                  mode === 'login' ? 'text-[#F5D076]' : 'text-slate-400'
                }`}
              />
              <span>تسجيل دخول الأعضاء</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#081E36] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus
                className={`w-3.5 h-3.5 ${
                  mode === 'register' ? 'text-[#F5D076]' : 'text-slate-400'
                }`}
              />
              <span>توثيق حساب جديد</span>
            </button>
          </div>

          {/* Formal Contextual Subtitle */}
          <div className="mb-4 pb-3.5 border-b border-slate-100">
            {mode === 'login' ? (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-extrabold text-slate-900">
                    الوصول إلى الحساب الوظيفي والمحفظة
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    يرجى إدخال رقم الهاتف المسجّل وكلمة المرور الخاصة بك
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
                  <KeyRound className="w-4 h-4 text-[#0C4359]" />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-l from-teal-50/90 to-slate-50 border border-teal-200/75 px-3.5 py-2.5 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    اعتماد فوري لحساب الموظف الرسمي
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    يُنشأ الحساب مباشرة برقم الهاتف وكلمة المرور دون الحاجة لانتظار رسائل تحقق
                    نصية (OTP).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200/90 px-3.5 py-2.5 text-xs font-bold text-rose-800 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number + Custom Country Code Trigger */}
            <div>
              <label className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-1.5">
                <span>رقم الهاتف المعتمد</span>
                <span className="text-[10.5px] font-semibold text-slate-400">
                  {selectedCountry.country}
                </span>
              </label>

              <div className="flex items-stretch gap-2" dir="ltr">
                {/* Luxury Country Picker Trigger */}
                <button
                  type="button"
                  onClick={() => setCountryPickerOpen(true)}
                  className="shrink-0 min-w-[114px] rounded-2xl border border-slate-200/95 bg-slate-50/90 hover:bg-slate-100/80 px-3 py-3 flex items-center justify-between gap-1.5 text-xs font-extrabold text-slate-900 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                    <span className="tabular-nums">
                      {selectedCountry.code === 'LOCAL' ? 'مباشر' : selectedCountry.code}
                    </span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Phone Input */}
                <div className="relative flex-1 flex items-center">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={countryExample}
                    className={`w-full rounded-2xl border pl-3.5 pr-9 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white outline-none transition-all tabular-nums ${
                      phone.trim().length > 0 && phoneValidation.valid
                        ? 'border-emerald-400 bg-emerald-50/30 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/12'
                        : mode === 'register' &&
                          phone.trim().length > 0 &&
                          phoneValidation.state !== 'incomplete'
                        ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/12'
                        : 'border-slate-200/95 bg-slate-50/60 focus:border-[#0B2742] focus:ring-4 focus:ring-[#0B2742]/8'
                    }`}
                  />
                  <div className="pointer-events-none absolute right-3">
                    {phone.trim().length > 0 && phoneValidation.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Phone className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Live Telecom Carrier & Anti-Fake Phone Validation Feedback */}
              {phone.trim().length > 0 && (
                <div className="mt-2">
                  {phoneValidation.valid ? (
                    <div className="rounded-xl bg-emerald-50/90 border border-emerald-200/85 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{phoneValidation.summaryAr}</span>
                      </span>
                      <span className="ltr-num font-bold text-emerald-700 text-[10.5px] shrink-0">
                        {phoneValidation.e164}
                      </span>
                    </div>
                  ) : mode === 'register' ? (
                    <div
                      className={`rounded-xl px-3 py-1.5 flex items-start gap-1.5 text-[11px] font-bold leading-relaxed ${
                        phoneValidation.state === 'incomplete'
                          ? 'bg-amber-50/90 border border-amber-200 text-amber-800'
                          : 'bg-rose-50/90 border border-rose-200 text-rose-700'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{phoneValidation.error}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-1.5">
                <span>كلمة المرور</span>
                {mode === 'register' && password.length > 0 && (
                  <span className="text-[10.5px] font-bold text-slate-600">
                    {pwStrength.label}
                  </span>
                )}
              </label>

              <div className="relative flex items-center">
                <div className="pointer-events-none absolute right-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === 'login'
                      ? 'أدخل كلمة المرور الخاصة بحسابك'
                      : 'اختر كلمة مرور آمنة لحسابك (4 محارف فأكثر)'
                  }
                  className="w-full rounded-2xl border border-slate-200/95 bg-slate-50/60 pr-10 pl-11 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-[#0B2742] focus:ring-4 focus:ring-[#0B2742]/8 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  aria-label="إظهار أو إخفاء كلمة المرور"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Subtle 4-segment Password Security Bar on Registration */}
              {mode === 'register' && password.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className={`h-1 rounded-full transition-all ${
                        pwStrength.level >= seg ? pwStrength.color : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Login Session Option OR Registration Invite/Supervisor Code */}
            {mode === 'login' ? (
              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#0B2742]"
                  />
                  <span className="text-[11.5px] font-semibold text-slate-600">
                    حفظ الجلسة المشفرة على هذا الجهاز
                  </span>
                </label>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11.5px] font-bold text-[#0C4359] hover:underline"
                >
                  مساعدة في الدخول؟
                </a>
              </div>
            ) : (
              <div className="space-y-2.5">
                {!showInviteField ? (
                  <button
                    type="button"
                    onClick={() => setShowInviteField(true)}
                    className="w-full rounded-2xl border border-dashed border-slate-300 hover:border-teal-600 bg-slate-50/60 px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>إدخال كود المشرف أو رمز الدعوة المعتمد</span>
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-semibold">اختياري</span>
                  </button>
                ) : (
                  <div className="rounded-2xl bg-slate-50/90 border border-slate-200/90 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>رمز الدعوة / كود المشرف</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">اختياري</span>
                    </div>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="مثال: AB77889"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold tracking-wider text-slate-900 placeholder:text-slate-400 focus:border-[#0B2742] outline-none uppercase tabular-nums ltr-num"
                    />
                  </div>
                )}

                <p className="text-[10.5px] text-slate-500 leading-relaxed text-center">
                  بإنشاء الحساب فإنك توافق على{' '}
                  <button
                    type="button"
                    onClick={() => setCharterOpen(true)}
                    className="font-extrabold text-[#0B2742] underline cursor-pointer"
                  >
                    ميثاق الشركة الرسمي
                  </button>{' '}
                  و{' '}
                  <button
                    type="button"
                    onClick={() => setAboutOpen(true)}
                    className="font-extrabold text-[#0B2742] underline cursor-pointer"
                  >
                    الضوابط التنظيمية
                  </button>
                  .
                </p>
              </div>
            )}

            {/* Executive Primary CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-sm font-extrabold text-white border border-amber-300/25 shadow-[0_12px_26px_-8px_rgba(7,25,46,0.45)] active:scale-[0.99] transition-all disabled:opacity-65 cursor-pointer"
              style={{
                background:
                  'linear-gradient(135deg, #07192E 0%, #0C3654 55%, #0D7A72 100%)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#F5D076]" />
                  <span>جاري التحقق وتأمين الجلسة...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'الدخول الآمن إلى البوابة الرسمية'
                      : 'اعتماد وتوثيق الحساب الرسمي'}
                  </span>
                  <ArrowLeft className="w-4 h-4 text-[#F5D076]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ==================== INSTITUTIONAL FOOTER ==================== */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-emerald-50/70 border border-slate-200/90 px-3 py-2 text-[11px] font-extrabold text-slate-800 shadow-2xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>مكتب الدعم الرسمي</span>
            </a>

            <button
              type="button"
              onClick={() => setCharterOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 px-3 py-2 text-[11px] font-extrabold text-slate-800 shadow-2xs transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>الميثاق الرسمي</span>
            </button>

            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 px-3 py-2 text-[11px] font-extrabold text-slate-800 shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#0C4359]" />
              <span>الشروط والضوابط</span>
            </button>
          </div>

          <div className="text-center space-y-0.5">
            <p className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase ltr-num">
              ARONA BOOST INTERNATIONAL &bull; DIGITAL TOURISM CORP
            </p>
            <p className="text-[10px] text-slate-400">
              جميع المعاملات مؤمّنة عبر عقود USDT الذكية (TRC20 / BEP20) &copy; 2026
            </p>
          </div>
        </div>
      </div>

      {/* ==================== LUXURY COUNTRY DIAL CODE PICKER SHEET ==================== */}
      {countryPickerOpen && (
        <ModalPortal>
        <div
          className="fixed inset-0 z-[95] bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center"
          onClick={() => setCountryPickerOpen(false)}
        >
          <div
            className="w-full max-w-[430px] max-h-[78dvh] flex flex-col rounded-t-3xl bg-white shadow-2xl animate-sheet overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#F5D076] flex items-center justify-center">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-extrabold text-slate-900">
                    اختيار الدولة ومفتاح الاتصال الدولي
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    اختر مفتاح دولتك أو الإدخال المباشر للرقم
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCountryPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {COUNTRY_CODES.map((item) => {
                const active = item.code === countryCode;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setCountryCode(item.code);
                      setCountryPickerOpen(false);
                    }}
                    className={`w-full rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-right transition-all cursor-pointer ${
                      active
                        ? 'bg-[#081E36] text-white shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl leading-none shrink-0">{item.flag}</span>
                      <span className="text-xs font-extrabold truncate">{item.country}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`ltr-num tabular-nums rounded-lg px-2 py-0.5 text-xs font-extrabold ${
                          active
                            ? 'bg-white/15 text-[#F5D076]'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        {item.code === 'LOCAL' ? 'بدون مفتاح' : item.code}
                      </span>
                      {active && <Check className="w-4 h-4 text-[#F5D076]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Official Corporate Charter Modal */}
      <CorporateCharterSheet
        isOpen={charterOpen}
        onClose={() => setCharterOpen(false)}
      />

      {/* About & Terms Modal */}
      <AboutTermsSheet
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        whatsappNumber={whatsappNumber}
      />
    </div>
  );
}
