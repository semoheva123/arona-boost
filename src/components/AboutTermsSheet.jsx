import React from 'react';
import { X, ShieldCheck, Compass, FileCheck2 } from 'lucide-react';
import BrandLogo from './BrandLogo';
import ModalPortal from './ModalPortal';

export default function AboutTermsSheet({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[95] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[430px] max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl animate-sheet"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <BrandLogo size="sm" showTagline={true} />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="rounded-2xl bg-gradient-to-l from-teal-50 to-slate-50 border border-teal-200/80 p-4">
              <h3 className="font-display text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mb-1.5">
                <Compass className="w-4 h-4 text-teal-600" />
                <span>نبذة عن منصة Arona Boost</span>
              </h3>
              <p>
                منصة <strong>Arona Boost</strong> هي منصة رقمية متخصصة في تعزيز التقييمات والانطباعات
                السياحية لأشهر المنتجعات والفنادق والمعالم السياحية حول العالم، وتمنح أعضاءها مكافآت
                يومية منتظمة بعملة <strong>USDT</strong> وفق مستوى الفئة الوظيفية المفعّل.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/85 p-4 space-y-2">
              <h4 className="font-display text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ضوابط الأمان والإيداع والسحب</span>
              </h4>
              <ul className="space-y-1.5 list-disc pr-4">
                <li>
                  تتم عمليات الإيداع عبر العنوان الموحّد المعتمد لشبكتي{' '}
                  <strong>USDT (TRC20 / BEP20)</strong> مع التحقق الآلي عبر البلوكشين بمعرّف المعاملة
                  (TXID).
                </li>
                <li>
                  تتم معالجة طلبات السحب من محفظة الدخل إلى عنوان محفظة العضو المحفوظة والمحمية برمز
                  الدفع المالي (PIN).
                </li>
                <li>
                  تتجدد حصة المهام اليومية كل 24 ساعة، وتُضاف المكافأة فوراً إلى محفظة الدخل بعد إرسال
                  التقييم بنجاح.
                </li>
                <li>
                  يُمنح أعضاء برنامج الشركاء عمولات تلقائية على 3 مستويات إحالة (10% للمستوى A، 5%
                  للمستوى B، و2% للمستوى C) بالإضافة إلى مكافآت الإنجاز والرواتب الشهرية.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-start gap-2.5">
              <FileCheck2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500">
                باستخدامك لمنصة Arona Boost فإنك توافق على الالتزام بحساب واحد لكل مستخدم وعدم تكرار
                معرّفات المعاملات (TXID). فريق الدعم عبر واتساب ومكتب المساندة متاح لخدمتك على مدار
                الساعة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
