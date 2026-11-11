import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Share2,
  ShieldCheck,
  Award,
  Crown,
  Briefcase,
  CheckCircle2,
  FileBadge,
  IdCard
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import ModalPortal from './ModalPortal';
import { formatUsdt, formatShortDateAr, buildAppUrl } from '../api';

// Deterministic crisp QR-like matrix SVG from a string seed (100% offline/sandbox safe)
function VerificationQrMatrix({ seed = 'ARONA', size = 68 }) {
  const cells = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const grid = 13;
    const out = [];
    const isFinder = (r, c) =>
      (r < 4 && c < 4) || (r < 4 && c >= grid - 4) || (r >= grid - 4 && c < 4);

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        if (isFinder(r, c)) {
          const rr = r >= grid - 4 ? r - (grid - 4) : r;
          const cc = c >= grid - 4 ? c - (grid - 4) : c;
          const border = rr === 0 || rr === 3 || cc === 0 || cc === 3;
          const center = rr >= 1 && rr <= 2 && cc >= 1 && cc <= 2;
          if (border || center) out.push({ r, c });
        } else {
          hash ^= (r * 31 + c * 17) & 0xff;
          hash = Math.imul(hash, 16777619);
          if ((hash >>> 3) & 1) out.push({ r, c });
        }
      }
    }
    return { grid, out };
  }, [seed]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells.grid} ${cells.grid}`}
      className="rounded-lg bg-white p-1.5 shadow-sm"
    >
      {cells.out.map((pt, idx) => (
        <rect
          key={idx}
          x={pt.c}
          y={pt.r}
          width="0.92"
          height="0.92"
          rx="0.18"
          fill="#061628"
        />
      ))}
    </svg>
  );
}

export default function ExecutiveIdSheet({
  isOpen,
  initialMode = 'id', // 'id' | 'bond'
  onClose,
  user,
  guaranteeDurationDays = 365,
  showToast
}) {
  const [mode, setMode] = useState(initialMode);
  const [downloading, setDownloading] = useState(false);

  React.useEffect(() => {
    if (isOpen) setMode(initialMode);
  }, [isOpen, initialMode]);

  if (!isOpen || !user) return null;

  const serialNo = `AB-EXEC-${1000 + (user.id || 1)}`;
  const bondNo = `BND-${new Date().getFullYear()}-${1000 + (user.id || 1)}`;
  const gradeLabel = `الفئة A${user.vipLevel ?? 0}`;
  const jobTitle = user.jobTitle || ((user.vipLevel ?? 0) > 0 ? 'موظف رسمي' : 'موظف متدرب');
  const guarAmount = Number(user.workGuarantee?.amount || 0);
  const guarStart = user.workGuarantee?.startDate
    ? String(user.workGuarantee.startDate).slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const guarExpires = user.workGuarantee?.expiresDate
    ? String(user.workGuarantee.expiresDate).slice(0, 10)
    : `بعد ${guaranteeDurationDays} يوماً`;

  const referralUrl = buildAppUrl(`?ref=${user.inviteCode || 'ARONA'}`);

  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      if (mode === 'id') {
        canvas.width = 1080;
        canvas.height = 680;
        const ctx = canvas.getContext('2d');

        // Metallic Royal Navy Background
        const bg = ctx.createLinearGradient(0, 0, 1080, 680);
        bg.addColorStop(0, '#04101E');
        bg.addColorStop(0.55, '#0A2440');
        bg.addColorStop(1, '#0C4A56');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1080, 680);

        // Champagne Gold Frame
        ctx.strokeStyle = '#F5D076';
        ctx.lineWidth = 4;
        ctx.strokeRect(28, 28, 1024, 624);

        ctx.strokeStyle = 'rgba(245, 208, 118, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(42, 42, 996, 596);

        // Header Brand & Badge
        ctx.fillStyle = '#F5D076';
        ctx.font = 'bold 38px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ARONA BOOST', 76, 110);

        ctx.fillStyle = '#99F6E4';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('DIGITAL HOSPITALITY EVALUATION AUTHORITY', 76, 144);

        // Grade Pill Right
        ctx.fillStyle = '#F5D076';
        ctx.fillRect(800, 74, 204, 56);
        ctx.fillStyle = '#051322';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(gradeLabel, 902, 111);

        // Divider
        ctx.strokeStyle = 'rgba(245, 208, 118, 0.35)';
        ctx.beginPath();
        ctx.moveTo(76, 182);
        ctx.lineTo(1004, 182);
        ctx.stroke();

        // Arabic Details (Right-aligned)
        ctx.textAlign = 'right';
        ctx.fillStyle = '#94A3B8';
        ctx.font = '22px sans-serif';
        ctx.fillText('البطاقة الوظيفية الرقمية المعتمدة', 1004, 244);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(`${jobTitle} — ${gradeLabel}`, 1004, 304);

        ctx.fillStyle = '#F5D076';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`ID: #${serialNo}`, 1004, 366);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '24px sans-serif';
        ctx.fillText(`رقم الحساب الموثق: ${user.maskedPhone || user.phone}`, 1004, 426);
        ctx.fillText(`رمز الترشيح الرسمي: ${user.inviteCode || 'ARONA'}`, 1004, 474);
        ctx.fillText(`حالة الاعتماد: عضو كادر تقييم ضيافة نشط وموثّق`, 1004, 522);

        // Official Seal Box Left
        ctx.strokeStyle = '#F5D076';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(76, 370, 230, 190);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F5D076';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('VERIFIED MEMBER', 191, 428);
        ctx.fillStyle = '#5EEAD4';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('ARONA HR BOARD', 191, 468);
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '18px monospace';
        ctx.fillText(new Date().toISOString().slice(0, 10), 191, 514);
      } else {
        canvas.width = 1080;
        canvas.height = 760;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FAF8F2';
        ctx.fillRect(0, 0, 1080, 760);

        ctx.strokeStyle = '#081E36';
        ctx.lineWidth = 10;
        ctx.strokeRect(26, 26, 1028, 708);

        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 3;
        ctx.strokeRect(44, 44, 992, 672);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#081E36';
        ctx.font = 'bold 38px sans-serif';
        ctx.fillText('ARONA BOOST — شهادة عقد ضمان العمل الرسمي', 540, 122);

        ctx.fillStyle = '#0D7A72';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(`OFFICIAL WORK GUARANTEE BOND • ${bondNo}`, 540, 166);

        ctx.fillStyle = '#334155';
        ctx.font = '25px sans-serif';
        ctx.fillText(
          'تشهد إدارة الموارد البشرية الرقمية في شركة Arona Boost بتوثيق ضمان العمل التشغيلي لصالح:',
          540,
          242
        );

        ctx.fillStyle = '#081E36';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(
          `الموظف رقم #${1000 + (user.id || 1)} (${jobTitle} • ${gradeLabel})`,
          540,
          306
        );

        ctx.fillStyle = '#061628';
        ctx.fillRect(250, 348, 580, 110);
        ctx.fillStyle = '#F5D076';
        ctx.font = 'bold 44px monospace';
        ctx.fillText(`$${formatUsdt(guarAmount)} USDT`, 540, 418);

        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`تاريخ سريان العقد: ${guarStart}   |   تاريخ الاستحقاق: ${guarExpires}`, 540, 524);
        ctx.font = '21px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(
          `يُحفظ أصل الضمان كاملاً باسم العضو لمدة ${guaranteeDurationDays} يوماً ويُسترد بالكامل إلى محفظة الدخل عند إتمام المدة.`,
          540,
          578
        );

        ctx.fillStyle = '#0D7A72';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('معتمد ومختوم إلكترونياً — مجلس إدارة Arona Boost الدولية', 540, 658);
      }

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download =
        mode === 'id' ? `${serialNo}-Card.png` : `${bondNo}-Work-Guarantee-Certificate.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast?.(
        mode === 'id'
          ? 'تم حفظ البطاقة الوظيفية الرسمية بدقة عالية بنجاح'
          : 'تم حفظ شهادة عقد ضمان العمل الرسمية بنجاح'
      );
    } catch {
      showToast?.('تعذر حفظ الصورة على هذا المتصفح', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareText =
      mode === 'id'
        ? `بطاقة المقيّم الرقمية المعتمدة في Arona Boost — ${jobTitle} (${gradeLabel}) • السجل #${serialNo}`
        : `شهادة عقد ضمان العمل الموثّق في Arona Boost رقم ${bondNo} بقيمة $${formatUsdt(guarAmount)} USDT`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Arona Boost Executive Credential',
          text: shareText,
          url: referralUrl
        });
        return;
      } catch {
        // cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${referralUrl}`);
      showToast?.('تم نسخ بيانات الاعتماد والرابط الرسمي للمشاركة');
    } catch {
      showToast?.('تعذر النسخ التلقائي', 'error');
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[95] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[430px] max-h-[92dvh] flex flex-col rounded-t-[30px] sm:rounded-[30px] bg-[#F4F7FB] shadow-2xl animate-sheet overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Royal Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#F5D076]/25"
          style={{
            background: 'linear-gradient(145deg, #051322 0%, #0A2542 60%, #0D6E68 100%)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#F5D076]/35 flex items-center justify-center">
              <IdCard className="w-5 h-5 text-[#F5D076]" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-white">
                الهوية الوظيفية ووثائق الاعتماد
              </h3>
              <p className="text-[11px] text-teal-100/85">
                وثائق رسمية موثّقة قابلة للحفظ والمشاركة الفورية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/12 hover:bg-white/22 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-4 pt-3.5 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-200/80">
            <button
              type="button"
              onClick={() => setMode('id')}
              className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'id'
                  ? 'bg-[#07192E] text-[#F5D076] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IdCard className="w-3.5 h-3.5" />
              <span>بطاقة المقيّم الرسمية</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('bond')}
              className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'bond'
                  ? 'bg-[#07192E] text-[#F5D076] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileBadge className="w-3.5 h-3.5" />
              <span>شهادة عقد الضمان</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mode === 'id' ? (
            /* Metallic Executive ID Card */
            <div
              className="relative overflow-hidden rounded-[26px] p-5 text-white border border-[#F5D076]/45 shadow-[0_20px_44px_-14px_rgba(5,19,34,0.55)]"
              style={{
                background:
                  'linear-gradient(140deg, #04101E 0%, #0A2540 52%, #0B4A54 100%)'
              }}
            >
              <div className="pointer-events-none absolute inset-0 exec-filigree opacity-80" />
              <div
                className="pointer-events-none absolute -top-16 -left-12 w-44 h-44 rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, #F5D076 0%, transparent 70%)' }}
              />

              {/* Top Crest */}
              <div className="relative z-10 flex items-center justify-between gap-2 pb-3.5 border-b border-white/14">
                <BrandLogo size="sm" variant="light" />
                <span className="gold-crest-pill inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold">
                  <Crown className="w-3.5 h-3.5 text-[#051322]" />
                  <span>{gradeLabel}</span>
                </span>
              </div>

              {/* Middle Identity Row */}
              <div className="relative z-10 py-4 flex items-center justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/15 border border-emerald-300/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>مقيّم ضيافة معتمد وموثّق</span>
                  </span>
                  <h4 className="font-display text-base font-extrabold text-white truncate">
                    {jobTitle}
                  </h4>
                  <p className="ltr-num tabular-nums text-xs font-extrabold text-[#F5D076] tracking-wider">
                    #{serialNo}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    الحساب: <span className="ltr-num font-bold text-white">{user.phone}</span>
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-center gap-1">
                  <VerificationQrMatrix seed={`${serialNo}-${user.inviteCode}`} size={72} />
                  <span className="ltr-num text-[9px] font-bold text-[#F5D076] tracking-widest">
                    {user.inviteCode}
                  </span>
                </div>
              </div>

              {/* Footer Metadata Strip */}
              <div className="relative z-10 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950/40 border border-white/12 p-2.5 text-center">
                <div>
                  <p className="text-[9.5px] text-slate-400">تاريخ الاعتماد</p>
                  <p className="text-[10.5px] font-extrabold text-white mt-0.5">
                    {formatShortDateAr(user.createdAt)}
                  </p>
                </div>
                <div className="border-x border-white/12">
                  <p className="text-[9.5px] text-slate-400">الدرجة التعاقدية</p>
                  <p className="text-[10.5px] font-extrabold text-[#F5D076] mt-0.5">
                    {gradeLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[9.5px] text-slate-400">نطاق الصلاحية</p>
                  <p className="text-[10.5px] font-extrabold text-emerald-300 mt-0.5">
                    دولي • نشط
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Official Parchment & Gold Work Guarantee Bond Certificate */
            <div className="relative overflow-hidden rounded-[26px] bg-[#FCFBF7] border-2 border-[#D4AF37]/65 p-5 shadow-md space-y-3.5">
              <div className="border border-[#081E36]/15 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <p className="text-[10px] font-extrabold tracking-wider text-[#0D7A72] uppercase ltr-num">
                      WORK GUARANTEE BOND
                    </p>
                    <h4 className="font-display text-sm font-extrabold text-[#081E36] mt-0.5">
                      شهادة عقد ضمان العمل الرسمي
                    </h4>
                  </div>
                  <span className="ltr-num rounded-lg bg-[#081E36] text-[#F5D076] px-2.5 py-1 text-[10px] font-extrabold">
                    {bondNo}
                  </span>
                </div>

                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  تُقرّ إدارة الموارد البشرية الرقمية في شركة <strong>Arona Boost</strong> بأن أصل
                  مبلغ ضمان العمل الموضح أدناه محفوظ وموثّق باسم العضو صاحب السجل الوظيفي{' '}
                  <strong className="ltr-num">#{1000 + (user.id || 1)}</strong> ويُسترد كاملاً إلى
                  محفظة الدخل القابلة للسحب فور إتمام مدة العقد الرسمي ({guaranteeDurationDays}{' '}
                  يوماً).
                </p>

                <div className="rounded-2xl bg-[#07192E] text-white p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10.5px] text-slate-300">قيمة أصل الضمان الموثّق</p>
                    <p className="text-xs font-bold text-teal-200 mt-0.5">
                      {jobTitle} • {gradeLabel}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="ltr-num tabular-nums text-lg font-extrabold text-[#F5D076]">
                      ${formatUsdt(guarAmount)}
                    </p>
                    <p className="text-[9.5px] font-bold text-slate-300 ltr-num">USDT PRINCIPAL</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-slate-100/90 p-2.5">
                    <span className="text-slate-500 block text-[10px]">تاريخ سريان العقد</span>
                    <strong className="ltr-num text-slate-900 font-extrabold">{guarStart}</strong>
                  </div>
                  <div className="rounded-xl bg-slate-100/90 p-2.5">
                    <span className="text-slate-500 block text-[10px]">تاريخ الاستحقاق الكامل</span>
                    <strong className="ltr-num text-emerald-700 font-extrabold">
                      {guarExpires}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[10.5px] font-extrabold">
                      ختم الاعتماد الإلكتروني — Arona Boost HR
                    </span>
                  </div>
                  <Award className="w-5 h-5 text-[#D4AF37] shrink-0" />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadPng}
              className="exec-primary-btn rounded-2xl py-3 px-4 text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#F5D076]" />
              <span>{downloading ? 'جاري التصدير...' : 'حفظ كصورة رسمية HD'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 py-3 px-4 text-xs font-extrabold text-[#081E36] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#0D7A72]" />
              <span>مشاركة الوثيقة</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
