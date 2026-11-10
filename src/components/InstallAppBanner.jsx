import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';

export default function InstallAppBanner({ compact = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setInstalled(true);
      }
    } catch {
      // ignore matchMedia quirks
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (installed || (dismissed && !compact)) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">تثبيت تطبيق Arona Boost على الهاتف</p>
              <p className="text-[11px] text-slate-400">أضف أيقونة التطبيق للشاشة الرئيسية لفتح سريع</p>
            </div>
          </div>
          <Download className="w-4 h-4 text-teal-600" />
        </button>
      ) : (
        <div className="rounded-2xl bg-gradient-to-l from-slate-900 to-teal-900 text-white p-3.5 flex items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-teal-300 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold truncate">ثبّت تطبيق Arona Boost على هاتفك</p>
              <p className="text-[10px] text-teal-100/80 truncate">
                تصفح أسرع بملء الشاشة مثل تطبيقات الهواتف الأصلية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 px-3 py-1.5 text-xs font-extrabold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="إغلاق"
              className="p-1 text-white/60 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl bg-white p-5 shadow-2xl animate-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-extrabold text-slate-900">
                تثبيت Arona Boost على شاشة هاتفك
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900">على أجهزة آيفون (Safari):</p>
                  <p className="text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                    اضغط على أيقونة المشاركة <Share className="w-3.5 h-3.5 inline text-sky-600" /> في
                    أسفل المتصفح ثم اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>{' '}
                    <PlusSquare className="w-3.5 h-3.5 inline text-teal-600" />.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900">على أجهزة أندرويد (Chrome):</p>
                  <p className="text-slate-500 mt-0.5">
                    اضغط على قائمة المتصفح <strong>(⋮)</strong> في الأعلى ثم اختر{' '}
                    <strong>«تثبيت التطبيق»</strong> أو <strong>«الإضافة إلى الشاشة الرئيسية»</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
