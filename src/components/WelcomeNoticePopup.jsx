import React, { useState, useEffect } from 'react';
import { BellRing, Gift, ShieldCheck, X, Check } from 'lucide-react';

function getTodayKey() {
  return `arona_hide_welcome_${new Date().toISOString().slice(0, 10)}`;
}

export default function WelcomeNoticePopup({ welcomePopup, userId, onOpenRedEnvelope }) {
  const [open, setOpen] = useState(false);
  const [dontRemindToday, setDontRemindToday] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (welcomePopup && welcomePopup.enabled === false) return;
    try {
      const dismissedToday = localStorage.getItem(getTodayKey()) === '1';
      const shownSession = sessionStorage.getItem(`arona_welcome_shown_${userId}`) === '1';
      if (!dismissedToday && !shownSession) {
        setOpen(true);
        sessionStorage.setItem(`arona_welcome_shown_${userId}`, '1');
      }
    } catch {
      setOpen(true);
    }
  }, [userId, welcomePopup]);

  if (!open) return null;

  const handleClose = () => {
    try {
      if (dontRemindToday) {
        localStorage.setItem(getTodayKey(), '1');
      }
    } catch {
      // ignore storage restrictions
    }
    setOpen(false);
  };

  const title = welcomePopup?.title || 'إشعار الموظفين الرسمي — Arona Boost';
  const body =
    welcomePopup?.body ||
    'مرحباً بجميع موظفي التقييم المعتمدين في منظومة Arona Boost.\n• عقود المنتجعات العالمية والفنادق والمعالم السياحية متاحة يومياً بتسوية فورية عبر USDT.\n• فعالية «الظرف الأحمر» نشطة الآن! استخدم رمز الهدية الرسمي للحصول على مكافأة نقدية فورية.\n• يُحفظ مبلغ ضمان العمل في عقد رسمي مسترد بالكامل بعد إتمام 365 يوماً.';

  const lines = String(body)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[65] bg-[#040E1B]/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[385px] rounded-[28px] overflow-hidden bg-white shadow-[0_24px_60px_rgba(4,14,27,0.55)] border border-[#F5D076]/45 animate-tab"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Royal Header */}
        <div
          className="relative px-5 pt-5 pb-4 text-white border-b border-[#F5D076]/30"
          style={{
            background: 'linear-gradient(145deg, #051322 0%, #0A2745 58%, #0D6E66 100%)'
          }}
        >
          <div className="pointer-events-none absolute inset-0 exec-filigree opacity-55" />
          <div className="relative z-10 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#F5D076]/18 border border-[#F5D076]/45 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-[#F5D076]" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-[#F5D076]/20 border border-[#F5D076]/40 px-2 py-0.5 text-[9.5px] font-extrabold text-[#F5D076] mb-1">
                  تعميم إداري رسمي
                </span>
                <h3 className="font-display text-sm font-extrabold leading-snug text-white">
                  {title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="إغلاق"
              className="w-7 h-7 rounded-full bg-white/12 hover:bg-white/22 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Body */}
        <div className="p-4 space-y-3">
          <div className="rounded-2xl bg-[#F6F8FB] border border-slate-200/85 p-3.5 space-y-2 max-h-56 overflow-y-auto">
            {lines.map((line, idx) => (
              <p key={idx} className="text-xs font-semibold text-[#07182B] leading-relaxed">
                {line}
              </p>
            ))}
          </div>

          {/* Red Envelope Shortcut Highlight */}
          {onOpenRedEnvelope && (
            <button
              type="button"
              onClick={() => {
                handleClose();
                onOpenRedEnvelope();
              }}
              className="w-full rounded-2xl bg-gradient-to-l from-[#07182B] via-[#102B48] to-[#0D6A62] border border-[#F5D076]/45 p-3 flex items-center justify-between gap-2 text-white cursor-pointer hover:opacity-95 transition-opacity"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F5D076]/20 border border-[#F5D076]/45 flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4 text-[#F5D076]" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-[#F5D076]">فعالية الظرف الأحمر النقدي</p>
                  <p className="text-[10.5px] text-slate-200">أدخل رمز الهدية واستلم USDT فوراً</p>
                </div>
              </div>
              <span className="rounded-lg bg-[#F5D076] text-[#07182B] px-2.5 py-1 text-[10.5px] font-extrabold shrink-0">
                فتح الآن
              </span>
            </button>
          )}

          {/* Don't Remind Today Checkbox + Close CTA */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setDontRemindToday((v) => !v)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"
            >
              <span
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                  dontRemindToday
                    ? 'bg-[#07182B] border-[#07182B] text-[#F5D076]'
                    : 'bg-white border-slate-300'
                }`}
              >
                {dontRemindToday && <Check className="w-3 h-3" />}
              </span>
              <span>عدم التذكير اليوم</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#07182B] hover:bg-[#0D2744] text-[#F5D076] border border-[#F5D076]/40 px-5 py-2 text-xs font-extrabold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
