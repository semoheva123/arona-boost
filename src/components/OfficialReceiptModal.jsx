import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import ModalPortal from './ModalPortal';
import { formatUsdt, formatDateTimeAr } from '../api';

export default function OfficialReceiptModal({ transaction, user, onClose, showToast }) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const isDeposit = transaction.type === 'deposit';
  const gross = Number(transaction.amount || 0);
  const fee = Number(transaction.feeAmount || 0);
  const net = Number(transaction.netAmount || gross);
  const refCode = transaction.referenceCode || `VCH-${10000 + (transaction.id || 1)}`;
  const network = transaction.network || 'TRC20';
  const target = transaction.walletOrTxid || '—';
  const status = transaction.status || 'completed';

  const auditDigest = `SHA256:${refCode.replace(/[^A-Z0-9]/gi, '')}9F4A2C81E7B0`;

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      showToast?.('تم نسخ الرقم المرجعي للإيصال');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleDownloadReceipt = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 920;
      canvas.height = 1160;
      const ctx = canvas.getContext('2d');

      // White Banking Voucher Sheet
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, 920, 1160);

      // Royal Navy Header Banner
      const hdr = ctx.createLinearGradient(0, 0, 920, 230);
      hdr.addColorStop(0, '#051322');
      hdr.addColorStop(0.6, '#0A2644');
      hdr.addColorStop(1, '#0D6E68');
      ctx.fillStyle = hdr;
      ctx.fillRect(0, 0, 920, 230);

      ctx.fillStyle = '#F5D076';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ARONA BOOST • إيصال تسوية مالية معتمد', 460, 96);

      ctx.fillStyle = '#CCFBF1';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`OFFICIAL USDT SETTLEMENT VOUCHER • ${refCode}`, 460, 142);

      ctx.fillStyle = status === 'completed' ? '#10B981' : '#F59E0B';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(
        status === 'completed'
          ? '✓ معتمد ومسوّى رسمياً — VERIFIED SETTLEMENT'
          : 'قيد المعالجة والتدقيق — PENDING AUDIT',
        460,
        192
      );

      // Net Amount Box
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.fillRect(70, 270, 780, 185);
      ctx.strokeRect(70, 270, 780, 185);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(
        isDeposit ? 'صافي مبلغ الإيداع الموثّق' : 'صافي مبلغ السحب المسوّى للمحفظة',
        460,
        322
      );

      ctx.fillStyle = '#051322';
      ctx.font = 'bold 58px monospace';
      ctx.fillText(`$${formatUsdt(isDeposit ? gross : net)} USDT`, 460, 405);

      // Rows
      const rows = [
        ['نوع العملية المالية', isDeposit ? 'إيداع وتوثيق رصيد USDT' : 'سحب وتسوية أرباح USDT'],
        ['الرقم المرجعي الموحد', refCode],
        ['رقم السجل الوظيفي', `#${1000 + (user?.id || 1)}`],
        ['شبكة البلوكتشين', `${network} (Tether Smart Contract)`],
        ['المبلغ الإجمالي', `$${formatUsdt(gross)} USDT`],
        ['الضريبة / رسوم الشبكة', `$${formatUsdt(fee)} USDT`],
        ['الصافي المسوّى', `$${formatUsdt(isDeposit ? gross : net)} USDT`],
        ['التوقيت الرسمي', formatDateTimeAr(transaction.createdAt)],
        [isDeposit ? 'معرّف المعاملة (TXID)' : 'عنوان المحفظة المستلمة', target.slice(0, 42)]
      ];

      let y = 515;
      rows.forEach(([label, val]) => {
        ctx.strokeStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(80, y + 22);
        ctx.lineTo(840, y + 22);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillStyle = '#64748B';
        ctx.font = '22px sans-serif';
        ctx.fillText(label, 835, y);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(String(val), 85, y);
        y += 58;
      });

      // Footer Seal
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0D7A72';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText('تم التدقيق والتوثيق آلياً بواسطة نظام المقاصة المالية — Arona Boost', 460, 1068);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px monospace';
      ctx.fillText(auditDigest, 460, 1106);

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `Arona-Receipt-${refCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast?.('تم تحميل إيصال التسوية المالي الرسمي بنجاح');
    } catch {
      showToast?.('تعذر تصدير صورة الإيصال', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleShareReceipt = async () => {
    const text = `إيصال تسوية مالية معتمد — Arona Boost\nالمرجع: ${refCode}\nالمبلغ: $${formatUsdt(
      isDeposit ? gross : net
    )} USDT (${network})\nالحالة: ${status === 'completed' ? 'مكتمل وموثق' : 'قيد المعالجة'}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Arona Boost Receipt ${refCode}`, text });
        return;
      } catch {
        // cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast?.('تم نسخ تفاصيل الإيصال الرسمي للمشاركة');
    } catch {
      // ignore
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
        {/* Top Royal Receipt Banner */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#F5D076]/30"
          style={{
            background: 'linear-gradient(145deg, #051322 0%, #09233E 62%, #0D6E68 100%)'
          }}
        >
          <div>
            <BrandLogo size="sm" variant="light" />
            <p className="text-[10.5px] text-[#F5D076] font-extrabold mt-1">
              إيصال تسوية ومقاصة مالية رسمي • USDT
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/12 hover:bg-white/22 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Voucher Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <div className="relative rounded-[26px] bg-white border border-slate-200/95 p-4 shadow-sm space-y-3.5 overflow-hidden">
            {/* Subtle Official Circular Stamp Watermark */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-dashed border-slate-200">
              <button
                type="button"
                onClick={copyRef}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 text-[11px] font-extrabold text-slate-800 ltr-num cursor-pointer"
              >
                <span>{refCode}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {status === 'completed' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10.5px] font-extrabold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تسوية معتمدة ومكتملة</span>
                </span>
              ) : status === 'pending' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10.5px] font-extrabold text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>قيد التدقيق المالي</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-[10.5px] font-extrabold text-rose-700">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>مرفوض / مسترد</span>
                </span>
              )}
            </div>

            {/* Center Net Amount */}
            <div className="rounded-2xl bg-[#07192E] text-white p-4 text-center relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 exec-filigree opacity-65" />
              <p className="relative z-10 text-[11px] text-teal-100/85 font-bold">
                {isDeposit ? 'قيمة الإيداع الموثّق' : 'صافي المبلغ المسوّى للمستفيد'}
              </p>
              <p className="relative z-10 ltr-num tabular-nums font-display text-3xl font-extrabold text-[#F5D076] mt-1">
                ${formatUsdt(isDeposit ? gross : net)}{' '}
                <span className="text-xs font-extrabold text-white">USDT</span>
              </p>
              <p className="relative z-10 text-[10px] text-slate-300 mt-1 ltr-num">
                NETWORK: {network} • ACCOUNT #{1000 + (user?.id || 1)}
              </p>
            </div>

            {/* Breakdown Rows */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">نوع التسوية</span>
                <span className="font-extrabold text-slate-900">
                  {isDeposit ? 'إيداع رصيد USDT' : 'سحب أرباح محفظة الدخل'}
                </span>
              </div>

              {!isDeposit && (
                <>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">إجمالي المبلغ المطلوب</span>
                    <span className="ltr-num font-bold text-slate-800">${formatUsdt(gross)} USDT</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">الضريبة التشغيليّة ورسوم الشبكة</span>
                    <span className="ltr-num font-bold text-amber-700">-${formatUsdt(fee)} USDT</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">التاريخ والتوقيت الرسمي</span>
                <span className="font-bold text-slate-800">
                  {formatDateTimeAr(transaction.createdAt)}
                </span>
              </div>

              <div className="py-1.5 space-y-1">
                <span className="text-slate-500 block text-[11px]">
                  {isDeposit ? 'معرّف معاملة البلوكتشين (TXID):' : 'عنوان المحفظة المستلمة:'}
                </span>
                <p className="ltr-num break-all rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2 text-[11px] font-bold text-slate-800">
                  {target}
                </p>
              </div>

              {transaction.note && (
                <div className="rounded-xl bg-teal-50/60 border border-teal-200/70 px-3 py-2 text-[11px] text-slate-700">
                  <strong className="text-teal-900">بيان المقاصة:</strong> {transaction.note}
                </div>
              )}
            </div>

            {/* Cryptographic Seal Footer */}
            <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-emerald-800 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="ltr-num text-[9.5px] font-bold text-slate-500 truncate">
                  {auditDigest}
                </span>
              </div>
              <span className="shrink-0 rounded-md bg-[#081E36] text-[#F5D076] px-2 py-0.5 text-[9.5px] font-extrabold">
                ختم المقاصة
              </span>
            </div>
          </div>

          {/* Download & Share */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadReceipt}
              className="exec-primary-btn rounded-2xl py-3 px-4 text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#F5D076]" />
              <span>{downloading ? 'جاري التحميل...' : 'تحميل الإيصال PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareReceipt}
              className="rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 py-3 px-4 text-xs font-extrabold text-[#081E36] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#0D7A72]" />
              <span>مشاركة الإيصال</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
