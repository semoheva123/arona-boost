import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, X } from 'lucide-react';
import { useI18n } from '../i18n';

export default function InstallAppBanner({ pwaPrompt, onTriggerPwaInstall }) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
  }, []);

  if (dismissed || isStandalone) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '');

  const handleInstallClick = async () => {
    if (pwaPrompt) {
      await onTriggerPwaInstall();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-l from-slate-900 to-teal-950 text-white p-3.5 flex items-center justify-between gap-3 shadow-sm border border-teal-800/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white truncate">
              {t('install_title', 'ثبّت تطبيق Arona Boost على هاتفك')}
            </p>
            <p className="text-[10.5px] text-slate-300 truncate">
              {t('install_sub', 'تصفح أسرع بملء الشاشة مثل تطبيقات الهواتف الأصلية')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-[11px] px-3 py-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('install_btn', 'تثبيت')}</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="إخفاء"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="font-display text-sm font-extrabold text-slate-900">
                  تثبيت التطبيق على الشاشة الرئيسية
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs text-slate-600 leading-relaxed list-decimal pr-4">
                <li>
                  اضغط على زر <strong>المشاركة (Share)</strong>{' '}
                  <Share className="inline w-3.5 h-3.5 text-sky-600" /> في شريط متصفح Safari السفلي.
                </li>
                <li>
                  اختر <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong>.
                </li>
                <li>اضغط على <strong>إضافة (Add)</strong> ليظهر شعار Arona Boost كتطبيق مستقل.</li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-slate-600 leading-relaxed list-decimal pr-4">
                <li>افتح قائمة المتصفح العلوية <strong>(⋮)</strong> في Chrome أو المتصفح لديك.</li>
                <li>
                  اختر <strong>«تثبيت التطبيق» (Install App)</strong> أو{' '}
                  <strong>«الإضافة إلى الشاشة الرئيسية»</strong>.
                </li>
                <li>أكّد التثبيت ليعمل التطبيق بملء الشاشة وبسرعة فائقة.</li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-2xl bg-slate-900 text-white font-bold py-3 text-xs cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}
