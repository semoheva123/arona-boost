import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';

const ROTATION_INTERVAL_MS = 10000; // 10 seconds exact

const CORPORATE_REPORTS = [
  {
    id: 'dubai',
    workplace: 'دبي — الإمارات',
    image: '/corporate/arona-field-4.jpg?v=4',
    summary: 'اعتماد وتوجيه الأعضاء الجدد لتوثيق الحسابات وتفعيل التقييم اليومي'
  },
  {
    id: 'amman',
    workplace: 'عمّان — الأردن',
    image: '/corporate/arona-field-2.jpg?v=4',
    summary: 'مراجعة السيولة اليومية ومطابقة عمليات الإيداع والسحب وعقود ضمان العمل'
  },
  {
    id: 'libya',
    workplace: 'طرابلس — ليبيا',
    image: '/corporate/arona-field-5.jpg?v=4',
    summary: 'تأهيل مشرفي المجموعات واعتماد ترقيات سلم المناصب والرواتب الشهرية'
  },
  {
    id: 'iraq-baghdad',
    workplace: 'بغداد — العراق',
    image: '/corporate/arona-field-1.jpg?v=4',
    summary: 'متابعة مستهدفات الترويج السياحي وتوسيع حصة المهام اليومية داخل التطبيق'
  },
  {
    id: 'iraq-erbil',
    workplace: 'أربيل — العراق',
    image: '/corporate/arona-field-3.jpg?v=4',
    summary: 'تكريم قادة الفرق المحققين لمستهدفات النمو الشهري وصرف مكافآت الأداء'
  }
];

export default function CorporateShowcase() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(null);

  // Preload next photograph so every 10-second transition is instant
  useEffect(() => {
    const nextItem = CORPORATE_REPORTS[(sceneIdx + 1) % CORPORATE_REPORTS.length];
    if (nextItem?.image) {
      const pre = new Image();
      pre.src = nextItem.image;
    }
  }, [sceneIdx]);

  // Synchronized 10-second rotation: Photo + Workplace + Summary
  useEffect(() => {
    if (lightboxOpen) return undefined;
    const timer = setTimeout(() => {
      setSceneIdx((prev) => (prev + 1) % CORPORATE_REPORTS.length);
      setCycleKey((k) => k + 1);
    }, ROTATION_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [sceneIdx, lightboxOpen, cycleKey]);

  const selectSlide = (idx) => {
    setSceneIdx(idx);
    setCycleKey((k) => k + 1);
  };

  const goPrev = () => {
    setSceneIdx((prev) => (prev - 1 + CORPORATE_REPORTS.length) % CORPORATE_REPORTS.length);
    setCycleKey((k) => k + 1);
  };

  const goNext = () => {
    setSceneIdx((prev) => (prev + 1) % CORPORATE_REPORTS.length);
    setCycleKey((k) => k + 1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null) {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 40) {
        if (delta > 0) goNext();
        else goPrev();
      }
    }
    touchStartX.current = null;
  };

  const active = CORPORATE_REPORTS[sceneIdx];

  return (
    <>
      <section className="rounded-[22px] overflow-hidden bg-white border border-slate-200/90 shadow-[0_12px_30px_-14px_rgba(7,24,43,0.16)]">
        {/* Clean Unobstructed Top Hero Photo Slider (matching IMG_4532.png proportions) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950"
        >
          <img
            key={`${active.id}-${cycleKey}`}
            src={active.image}
            alt={active.workplace}
            fetchPriority="high"
            decoding="async"
            onClick={() => setLightboxOpen(true)}
            className="w-full h-full object-cover object-center animate-photo-fade cursor-pointer"
          />

          {/* Minimal Bottom Indicator Dots (like IMG_4532.png) */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-1.5 rounded-full bg-black/35 backdrop-blur-xs px-2.5 py-1">
              {CORPORATE_REPORTS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSlide(idx)}
                  aria-label={item.workplace}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === sceneIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/55'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live 10-Second Synchronized Progress Hairline */}
        <div className="h-[2.5px] w-full bg-slate-100 overflow-hidden">
          {!lightboxOpen && (
            <div
              key={`bar-${sceneIdx}-${cycleKey}`}
              className="h-full w-full bg-gradient-to-l from-[#07182B] via-[#0D7A72] to-[#D4A63E] animate-progress-10s"
            />
          )}
        </div>

        {/* Compact Single-Strip Footer: التقارير التنفيذية والمجالس + Workplace + Essential 1-Line Summary */}
        <div className="px-3.5 py-2.5 bg-white space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-[11.5px] font-extrabold text-[#07182B]">
              التقارير التنفيذية والمجالس
            </span>

            <span
              key={`loc-${active.id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-[#07182B] text-[#F5D076] px-2 py-0.5 text-[10.5px] font-extrabold animate-editorial"
            >
              <MapPin className="w-3 h-3 text-[#F5D076] shrink-0" />
              <span>{active.workplace}</span>
            </span>
          </div>

          <p
            key={`sum-${active.id}`}
            className="text-[11px] font-semibold text-slate-600 truncate animate-editorial"
          >
            {active.summary}
          </p>
        </div>
      </section>

      {/* Tap-to-Zoom Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-[#040D18]/90 backdrop-blur-md flex items-center justify-center p-4 animate-tab"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-[24px] overflow-hidden bg-white border border-slate-200 shadow-2xl"
          >
            <div className="bg-[#07182B] text-white px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-4 h-4 text-[#F5D076] shrink-0" />
                <span className="text-xs font-extrabold text-white truncate">
                  التقارير التنفيذية والمجالس — {active.workplace}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black">
              <img
                src={active.image}
                alt={active.workplace}
                className="w-full max-h-[65vh] object-contain"
              />
            </div>

            <div className="px-4 py-3 bg-white">
              <p className="text-xs font-bold text-slate-700 leading-relaxed">{active.summary}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
