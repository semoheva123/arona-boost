import React, { useState, useEffect } from 'react';
import ModalPortal from './ModalPortal';
import {
  ArrowRight,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ClipboardPaste
} from 'lucide-react';
import { apiRequest, formatUsdt } from '../api';

const PRESET_AMOUNTS = [20, 60, 150, 400, 1000, 2500];

function extractClientTxHash64(rawInput = '') {
  const s = String(rawInput || '').trim();
  if (!s) return '';
  const match = s.match(/(?:0x)?([0-9a-fA-F]{64})(?![0-9a-fA-F])/);
  return match ? match[1].toLowerCase() : '';
}

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

  const cleanTx64 = extractClientTxHash64(txid);
  const rawTrimmed = txid.trim().replace(/^0x/i, '');
  const isStrictMode = depositInfo?.strictBlockchainTxid !== false;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      showToast(`تم نسخ عنوان الإيداع الرسمي (${network})`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('تعذر النسخ التلقائي', 'error');
    }
  };

  const handleTxidInputChange = (val) => {
    const extracted = extractClientTxHash64(val);
    if (extracted && val.includes('http')) {
      setTxid(network === 'BEP20' ? `0x${extracted}` : extracted);
    } else {
      setTxid(val);
    }
  };

  const handlePasteTxid = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        handleTxidInputChange(clip.trim());
        showToast('تم لصق معرّف العملية TXID');
      }
    } catch {
      showToast('ألصق معرّف العملية يدوياً داخل الحقل', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    const minDep = Number(depositInfo?.minDeposit ?? 10);
    if (!numAmount || numAmount < minDep) {
      showToast(`الحد الأدنى للإيداع هو ${minDep} USDT`, 'error');
      return;
    }
    if (isStrictMode && !cleanTx64) {
      showToast(
        `يرجى لصق معرّف العملية (TXID) المكوّن من 64 محرفاً لشبكة ${network}`,
        'error'
      );
      return;
    }
    if (!txid.trim() || txid.trim().length < 6) {
      showToast('يرجى إدخال معرّف المعاملة (TXID)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const finalTxid = cleanTx64
        ? network === 'BEP20'
          ? `0x${cleanTx64}`
          : cleanTx64
        : txid.trim();

      const res = await apiRequest('/api/transactions/deposit', {
        method: 'POST',
        body: {
          amount: numAmount,
          network,
          txid: finalTxid
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

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[92] bg-[#EEF4F8] flex justify-center overflow-y-auto animate-tab">
        <div className="w-full max-w-[430px] min-h-dvh flex flex-col">
          {/* Clean Top Bar (matches tashare8 recharge page) */}
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200/70 px-4 py-3 grid grid-cols-3 items-center">
            <div className="flex items-center justify-start">
              <button
                type="button"
                onClick={onClose}
                aria-label="رجوع"
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#07182B] cursor-pointer"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-display text-[15px] font-extrabold text-[#07182B] text-center">
              إيداع
            </h3>

            <div className="w-8" />
          </header>

          <div className="p-3.5 space-y-3.5 pb-10">
            {targetTier && (
              <div className="bg-white rounded-2xl px-4 py-3 shadow-[0_2px_10px_rgba(7,24,43,0.04)] flex items-center justify-between text-xs">
                <span className="font-bold text-[#07182B]">ترقية الفئة المستهدفة:</span>
                <span className="font-extrabold text-[#0D7A72]">
                  {targetTier.name} (${formatUsdt(targetTier.dailyProfit)}/يوم)
                </span>
              </div>
            )}

            {/* Clean White QR & Unified Address Card */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-4">
              {/* Network Switcher */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[13.5px] font-bold text-[#07182B]">شبكة الإيداع</span>
                <div className="flex items-center gap-1.5">
                  {['TRC20', 'BEP20'].map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setNetwork(net)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                        network === net
                          ? 'bg-[#07182B] text-[#F5D076]'
                          : 'bg-[#F1F5F9] text-slate-600'
                      }`}
                    >
                      USDT-{net}
                    </button>
                  ))}
                </div>
              </div>

              {/* Centered QR + Unified Address */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-36 h-36 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 p-2.5 flex items-center justify-center">
                  {loadingInfo ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#0D7A72]" />
                  ) : activeQr ? (
                    <img
                      src={activeQr}
                      alt={`QR ${network}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">QR</span>
                  )}
                </div>

                <div className="w-full rounded-xl bg-[#F4F7FA] px-3 py-2.5">
                  <p className="text-[10.5px] text-slate-400 font-semibold mb-1">
                    عنوان محفظة الإيداع الموحّد ({network})
                  </p>
                  <p className="ltr-num text-xs font-mono font-bold text-[#07182B] break-all select-all">
                    {activeAddress}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#07182B] hover:bg-slate-800 text-[#F5D076] px-5 py-2 text-xs font-extrabold cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تم نسخ العنوان</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ عنوان الإيداع</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Clean White Amount + TXID Verification Form Card */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-4"
            >
              {/* Preset Amounts */}
              <div className="space-y-2.5 pb-3 border-b border-slate-100">
                <span className="block text-[13.5px] font-bold text-[#07182B]">مبلغ الشحن (USDT)</span>

                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((preset) => {
                    const isSelected = Number(amount) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(String(preset))}
                        className={`ltr-num tabular-nums rounded-lg py-2 text-[13px] font-extrabold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0D7A72] text-white'
                            : 'bg-[#DDF1EC] text-[#07182B] hover:bg-[#CBE9E1]'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="أو أدخل المبلغ المحوّل"
                  className="w-full rounded-xl bg-[#F4F7FA] border border-slate-200/80 px-3.5 py-2.5 text-sm font-extrabold text-[#07182B] outline-none focus:border-[#0D7A72] ltr-num"
                />
              </div>

              {/* TXID Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13.5px] font-bold text-[#07182B]">
                    معرّف العملية (TXID) *
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteTxid}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#F1F5F9] text-[#07182B] px-2.5 py-1 text-[10.5px] font-bold cursor-pointer"
                  >
                    <ClipboardPaste className="w-3 h-3 text-[#0D7A72]" />
                    <span>لصق</span>
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={txid}
                  onChange={(e) => handleTxidInputChange(e.target.value)}
                  placeholder={
                    network === 'BEP20'
                      ? 'ألصق معرّف TXID (0x...) أو رابط BscScan'
                      : 'ألصق معرّف TXID (64 محرفاً) أو رابط TronScan'
                  }
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono font-semibold text-[#07182B] outline-none ltr-num ${
                    cleanTx64
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : txid.trim()
                      ? 'border-amber-400 bg-amber-50/20'
                      : 'border-slate-200/80 bg-[#F4F7FA] focus:border-[#0D7A72]'
                  }`}
                />

                {txid.trim() && (
                  <div className="text-[11px] font-bold">
                    {cleanTx64 ? (
                      <span className="inline-flex items-center gap-1 text-[#0D7A72]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>صيغة TXID صحيحة وجاهزة للتحقق الآلي (64/64)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>معرّف TXID يجب أن يتكون من 64 محرفاً ({rawTrimmed.length}/64)</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#0D7A72] hover:bg-[#0A645D] disabled:opacity-60 text-white py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق من الـ TXID على البلوكشين...</span>
                  </>
                ) : (
                  <span>تأكيد الإيداع والتحقق من TXID</span>
                )}
              </button>
            </form>

            <div className="px-1 text-[11.5px] text-slate-500 space-y-1 leading-relaxed">
              <p>
                • الحد الأدنى للإيداع {depositInfo?.minDeposit ?? 10} USDT عبر شبكة {network} حصراً.
              </p>
              <p>
                • يتحقق النظام آلياً من معرّف TXID على البلوكشين ويضيف الرصيد تلقائياً فور التوثيق مع لفة مجانية في السحب المحظوظ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
