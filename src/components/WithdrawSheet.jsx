import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpFromLine,
  Wallet,
  Loader2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ScrollText
} from 'lucide-react';
import { apiRequest, formatUsdt } from '../api';

const FALLBACK_PRESETS = [20, 80, 200, 800, 2000, 5000];

export default function WithdrawSheet({
  isOpen,
  user,
  platformConfig,
  onClose,
  onOpenRecords,
  onSuccess,
  onUserUpdated,
  showToast
}) {
  const [network, setNetwork] = useState(user?.savedWalletNetwork || 'TRC20');
  const [walletAddress, setWalletAddress] = useState(user?.savedWalletAddress || '');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick inline PIN setup when user doesn't have a PIN yet
  const [newPinSetup, setNewPinSetup] = useState('');
  const [settingUpPin, setSettingUpPin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNetwork(user?.savedWalletNetwork || 'TRC20');
      setWalletAddress(user?.savedWalletAddress || '');
      setAmount('');
      setPin('');
      setNewPinSetup('');
    }
  }, [isOpen, user?.savedWalletAddress, user?.savedWalletNetwork]);

  if (!isOpen) return null;

  const availableBalance = Number(user?.balance || 0);
  const rechargeBalance = Number(user?.rechargeBalance || 0);
  const minWithdraw = Number(platformConfig?.minWithdraw ?? 5);
  const feePct = Number(platformConfig?.withdrawFeePercent ?? 10);
  const dailyLimit = Number(platformConfig?.dailyWithdrawLimit ?? 2);
  const withdrawPresets =
    Array.isArray(platformConfig?.withdrawPresets) && platformConfig.withdrawPresets.length > 0
      ? platformConfig.withdrawPresets
      : FALLBACK_PRESETS;

  const numericAmount = Math.max(0, Number(amount || 0));
  const feeAmount = Math.round(numericAmount * (feePct / 100) * 100) / 100;
  const netReceivable = Math.max(0, Math.round((numericAmount - feeAmount) * 100) / 100);

  const handleSelectMax = () => {
    if (availableBalance > 0) {
      setAmount(String(availableBalance));
    }
  };

  const handleSetupPinFirst = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(newPinSetup.trim())) {
      showToast('يجب أن يتكون رمز الحماية المالي من 4 إلى 6 أرقام', 'error');
      return;
    }
    setSettingUpPin(true);
    try {
      const res = await apiRequest('/api/account/pin', {
        method: 'PUT',
        body: { newPin: newPinSetup.trim() }
      });
      onUserUpdated(res.user);
      setPin(newPinSetup.trim());
      showToast('تم تفعيل رمز السحب المالي بنجاح! يمكنك إتمام السحب الآن');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSettingUpPin(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!walletAddress.trim() || walletAddress.trim().length < 12) {
      showToast('يرجى إدخال عنوان محفظة USDT صحيح', 'error');
      return;
    }
    if (!numAmount || numAmount < minWithdraw) {
      showToast(`الحد الأدنى للسحب هو ${minWithdraw} USDT`, 'error');
      return;
    }
    if (numAmount > availableBalance) {
      showToast('المبلغ المطلوب يتجاوز رصيد محفظة الدخل القابل للسحب', 'error');
      return;
    }
    if (!pin.trim()) {
      showToast('يرجى إدخال رمز الحماية المالي (PIN)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/api/transactions/withdraw', {
        method: 'POST',
        body: {
          amount: numAmount,
          network,
          walletAddress: walletAddress.trim(),
          pin: pin.trim()
        }
      });
      onSuccess(res);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with السجل Shortcut */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#081E36] text-[#F5D076] border border-[#F5D076]/35 flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-900">
                بوابة تسوية وسحب الأرباح
              </h3>
              <p className="text-[11px] text-slate-500">مؤمّنة برمز الحماية المالي (PIN)</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenRecords && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecords('ledger');
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-[#081E36] text-[#F5D076] px-2.5 py-1.5 text-[11px] font-extrabold cursor-pointer"
              >
                <ScrollText className="w-3.5 h-3.5 text-[#F5D076]" />
                <span>السجل</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dual Wallet Banner: Income Wallet vs Recharge Balance */}
        <div className="mb-4 exec-royal-surface relative overflow-hidden rounded-2xl text-white p-4 border border-[#F5D076]/25">
          <div className="pointer-events-none absolute inset-0 exec-filigree opacity-60" />
          <div className="relative z-10 grid grid-cols-2 gap-3 divide-x divide-x-reverse divide-white/15">
            <div>
              <p className="text-[11px] text-[#F5D076] font-semibold">محفظة الدخل (متاح للسحب)</p>
              <p className="ltr-num tabular-nums text-lg font-extrabold text-white mt-0.5">
                ${formatUsdt(availableBalance)}{' '}
                <span className="text-[10px] text-teal-200">USDT</span>
              </p>
            </div>
            <div className="pr-3">
              <p className="text-[11px] text-slate-300 font-medium">رصيد الشحن</p>
              <p className="ltr-num tabular-nums text-base font-extrabold text-emerald-300 mt-0.5">
                ${formatUsdt(rechargeBalance)}{' '}
                <span className="text-[10px] text-slate-300">USDT</span>
              </p>
            </div>
          </div>
        </div>

        {!user?.hasWithdrawPin ? (
          /* First-time Financial PIN Setup */
          <form
            onSubmit={handleSetupPinFirst}
            className="rounded-2xl bg-teal-50/80 border border-teal-200 p-4 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  تفعيل رمز الحماية المالي للسحب (لمرة واحدة)
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  لحماية أموالك، يرجى اختيار رمز سري مكون من <strong>4 إلى 6 أرقام</strong> يُستخدم
                  عند طلب أي عملية سحب.
                </p>
              </div>
            </div>

            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPinSetup}
              onChange={(e) => setNewPinSetup(e.target.value)}
              placeholder="مثال: 2580"
              className="w-full rounded-xl border border-teal-300 bg-white px-4 py-3 text-center text-base font-extrabold tracking-widest text-slate-900 outline-none focus:border-teal-600 tabular-nums ltr-num"
            />

            <button
              type="submit"
              disabled={settingUpPin}
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-3 text-xs font-bold cursor-pointer"
            >
              {settingUpPin ? 'جاري حفظ الرمز المالي...' : 'حفظ الرمز والمتابعة للسحب'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Preset Withdrawal Amount Tiers (20 / 80 / 200 / 800 / 2000 / 5000) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اختر باقة مبلغ السحب السريع (USDT)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {withdrawPresets.map((preset) => {
                  const isSelected = Number(amount) === Number(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className={`ltr-num tabular-nums rounded-xl py-2.5 px-2 text-xs font-extrabold border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50/80 text-slate-800 hover:border-teal-300 hover:bg-white'
                      }`}
                    >
                      {preset} USDT
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom / Exact Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  أو أدخل مبلغ السحب (الحد الأدنى {minWithdraw} USDT)
                </label>
                <button
                  type="button"
                  onClick={handleSelectMax}
                  className="text-[11px] font-extrabold text-teal-600 hover:text-teal-700 cursor-pointer"
                >
                  سحب كامل الدخل
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min={minWithdraw}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`مثال: 20`}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-600 px-4 py-2.5 text-base font-extrabold text-slate-900 outline-none transition-all tabular-nums ltr-num"
              />
            </div>

            {/* Explicit Tax & Net Receivable Breakdown */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/85 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>المبلغ المطلوب سحبه:</span>
                <span className="ltr-num tabular-nums font-bold text-slate-900">
                  ${formatUsdt(numericAmount)} USDT
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>الضريبة ورسوم الشبكة ({feePct}%):</span>
                <span className="ltr-num tabular-nums font-bold text-rose-600">
                  -${formatUsdt(feeAmount)} USDT
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-extrabold">
                <span className="text-slate-900">صافي المبلغ الواصل لمحفظتك:</span>
                <span className="ltr-num tabular-nums text-sm text-emerald-600">
                  ${formatUsdt(netReceivable)} USDT
                </span>
              </div>
            </div>

            {/* Network Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شبكة استلام السحب
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {['TRC20', 'BEP20'].map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setNetwork(net)}
                    className={`rounded-2xl py-2.5 px-3 text-xs font-extrabold border transition-all cursor-pointer ${
                      network === net
                        ? 'border-teal-600 bg-teal-50/80 text-teal-900 ring-2 ring-teal-500/15'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    USDT ({net})
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان محفظة USDT المستلمة ({network})
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder={
                  network === 'TRC20'
                    ? 'مثال: TX8kP9wLmN4vQr2sYz7bHj5c...'
                    : 'مثال: 0x742d35Cc6634C0532925a...'
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-600 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none transition-all ltr-num"
              />
            </div>

            {/* Financial Security PIN */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                <span>رمز الحماية المالي (PIN)</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="أدخل رمز PIN المكون من 4-6 أرقام"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-600 px-4 py-2.5 text-center text-base font-extrabold tracking-widest text-slate-900 outline-none transition-all tabular-nums ltr-num"
              />
            </div>

            <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-2.5 flex items-start gap-2 text-[11px] text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                يُتاح السحب حتى <strong>{dailyLimit} مرات</strong> خلال 24 ساعة من محفظة الدخل،
                وتُحوّل المبالغ مباشرة إلى عنوان محفظتك على شبكة {network}.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تأكيد طلب السحب...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 text-teal-400" />
                  <span>تأكيد سحب ${formatUsdt(netReceivable)} USDT صافي</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
