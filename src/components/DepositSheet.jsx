import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ArrowDownToLine,
  ShieldCheck,
  Loader2,
  Crown,
  Hash
} from 'lucide-react';
import { apiRequest, formatUsdt } from '../api';

const PRESET_AMOUNTS = [20, 60, 150, 400, 1000];

export default function DepositSheet({
  isOpen,
  initialAmount,
  targetTier,
  onClose,
  onSuccess,
  showToast
}) {
  const [network, setNetwork] = useState('TRC20');
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '60');
  const [txid, setTxid] = useState('');
  const [depositInfo, setDepositInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialAmount) {
        setAmount(String(initialAmount));
      }
      setLoadingInfo(true);
      apiRequest('/api/deposit-info')
        .then((data) => setDepositInfo(data))
        .catch(() => {})
        .finally(() => setLoadingInfo(false));
    }
  }, [isOpen, initialAmount]);

  if (!isOpen) return null;

  const activeAddress =
    network === 'TRC20'
      ? depositInfo?.trc20Address || 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'
      : depositInfo?.bep20Address || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

  const activeQr =
    network === 'TRC20' ? depositInfo?.trc20Qr : depositInfo?.bep20Qr;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      showToast(`تم نسخ عنوان محفظة ${network}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('تعذر النسخ التلقائي', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('يرجى إدخال مبلغ إيداع صحيح', 'error');
      return;
    }
    if (!txid.trim() || txid.trim().length < 6) {
      showToast('يرجى إدخال معرّف المعاملة (TXID) لتوثيق الإيداع', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/api/transactions/deposit', {
        method: 'POST',
        body: {
          amount: numAmount,
          network,
          txid: txid.trim()
        }
      });
      setTxid('');
      onSuccess(res);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isAutoApprove = depositInfo?.autoApproveDeposits;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#081E36] text-[#F5D076] border border-[#F5D076]/35 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-900">
                بوابة الإيداع والتوثيق الرسمي
              </h3>
              <p className="text-[11px] text-slate-500">حوّل المبلغ ثم أدخل معرّف العملية TXID</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {targetTier && (
          <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200/80 px-3.5 py-2.5 flex items-center gap-2 text-xs text-amber-900">
            <Crown className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              ترقية إلى <strong>{targetTier.name}</strong> • عائد يومي{' '}
              <strong>${formatUsdt(targetTier.dailyProfit)} USDT</strong>
            </span>
          </div>
        )}

        {/* Network Selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1. اختر شبكة التحويل
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'TRC20', sub: 'TRON Network • موصى بها' },
              { id: 'BEP20', sub: 'BNB Smart Chain' }
            ].map((net) => (
              <button
                key={net.id}
                type="button"
                onClick={() => setNetwork(net.id)}
                className={`rounded-2xl p-3 text-right border transition-all cursor-pointer ${
                  network === net.id
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/15'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-extrabold text-slate-900">USDT ({net.id})</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{net.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* QR Code & Wallet Address Box */}
        <div className="mb-4 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
              {loadingInfo ? (
                <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              ) : activeQr ? (
                <img
                  src={activeQr}
                  alt={`QR ${network}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-slate-400">QR</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-700 mb-1">
                عنوان محفظة الإيداع ({network})
              </p>
              <p className="ltr-num text-[11px] font-mono bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 break-all">
                {activeAddress}
              </p>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم نسخ العنوان</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ عنوان المحفظة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Amount & Required TXID Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. حدد مبلغ الإيداع المحوّل (USDT)
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-2 pb-0.5">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer tabular-nums ${
                    Number(amount) === preset
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <div className="relative flex items-center">
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="أدخل المبلغ بعملة USDT"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-extrabold text-slate-900 focus:bg-white focus:border-teal-600 outline-none tabular-nums"
              />
              <span className="absolute left-3.5 text-xs font-extrabold text-teal-700">
                USDT
              </span>
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span className="inline-flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-teal-600" />
                <span>3. معرّف عملية التحويل (TXID / Hash) *</span>
              </span>
              <span className="text-[10px] font-semibold text-rose-600">مطلوب للتوثيق</span>
            </label>
            <input
              type="text"
              required
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              placeholder="ألصق معرّف المعاملة TXID من محفظتك هنا..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-600 outline-none ltr-num"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200/70 px-3 py-2.5 text-[11px] text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              الحد الأدنى للإيداع <strong>{depositInfo?.minDeposit ?? 10} USDT</strong> • يتم فحص معرّف{' '}
              <strong>TXID</strong> آلياً عبر بلوكتشين <strong>{network}</strong>، كما تحصل على{' '}
              <strong>+1 لفة مجانية في عجلة الحظ</strong> عند اعتماد إيداع مؤهل!
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] disabled:opacity-60 text-white py-3.5 text-sm font-bold shadow-md shadow-teal-700/20 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري توثيق طلب الإيداع...</span>
              </>
            ) : (
              <span>إرسال وتوثيق إيداع {amount ? `${amount} USDT` : ''}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
