import React, { useState, useEffect } from 'react';
import ModalPortal from './ModalPortal';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
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
  const [amount, setAmount] = useState('20');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [newPinSetup, setNewPinSetup] = useState('');
  const [settingUpPin, setSettingUpPin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNetwork(user?.savedWalletNetwork || 'TRC20');
      setWalletAddress(user?.savedWalletAddress || '');
      setAmount('20');
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

  const handleSetupPinFirst = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(newPinSetup.trim())) {
      showToast('يجب أن يتكون رمز الدفع من 4 إلى 6 أرقام', 'error');
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
      showToast('تم تفعيل كلمة مرور الدفع بنجاح');
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
      showToast('المبلغ المطلوب يتجاوز رصيد محفظة الدخل', 'error');
      return;
    }
    if (!pin.trim()) {
      showToast('يرجى إدخال كلمة مرور الدفع (PIN)', 'error');
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
    <ModalPortal>
      <div className="fixed inset-0 z-[92] bg-[#EEF4F8] flex justify-center overflow-y-auto animate-tab">
        <div className="w-full max-w-[430px] min-h-dvh flex flex-col">
          {/* Clean Top Bar (EXACT IMG_4502.png: Back Arrow | سحب | السجل) */}
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
              سحب
            </h3>

            <div className="flex items-center justify-end">
              {onOpenRecords && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecords('ledger');
                  }}
                  className="text-xs font-bold text-[#07182B] hover:text-[#0D7A72] cursor-pointer"
                >
                  السجل
                </button>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div className="p-3.5 space-y-4 pb-10">
            {!user?.hasWithdrawPin ? (
              <form
                onSubmit={handleSetupPinFirst}
                className="bg-white rounded-2xl p-5 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-4"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#0D7A72] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#07182B]">
                      تعيين كلمة مرور الدفع (PIN) لأول مرة
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      يرجى اختيار رمز مكون من 4 إلى 6 أرقام لتأمين عمليات السحب من محفظتك.
                    </p>
                  </div>
                </div>

                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPinSetup}
                  onChange={(e) => setNewPinSetup(e.target.value)}
                  placeholder="أدخل رمز PIN من 4 إلى 6 أرقام"
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-center text-base font-extrabold tracking-widest text-[#07182B] outline-none focus:border-[#0D7A72] ltr-num"
                />

                <button
                  type="submit"
                  disabled={settingUpPin}
                  className="w-full rounded-xl bg-[#0D7A72] hover:bg-[#0A645D] text-white py-3 text-xs font-extrabold cursor-pointer"
                >
                  {settingUpPin ? 'جاري التفعيل...' : 'حفظ والمتابعة للسحب'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Clean White Form Container (EXACT IMG_4502.png structure!) */}
                <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-4">
                  {/* Row 1 & 2: محفظة الدخل & رصيد الشحن */}
                  <div className="space-y-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between text-[13.5px]">
                      <span className="font-bold text-[#07182B]">محفظة الدخل</span>
                      <span className="ltr-num tabular-nums font-extrabold text-slate-700">
                        {formatUsdt(availableBalance)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[13.5px]">
                      <span className="font-bold text-[#07182B]">رصيد الشحن</span>
                      <span className="ltr-num tabular-nums font-extrabold text-slate-700">
                        {formatUsdt(rechargeBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: محفظة السحب */}
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between text-[13px]">
                    <span className="font-bold text-[#07182B]">محفظة السحب</span>
                    <span className="font-extrabold text-[#0D7A72]">محفظة الدخل (USDT)</span>
                  </div>

                  {/* Row 4: الضريبة */}
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between text-[13px]">
                    <span className="font-bold text-[#07182B]">
                      الضريبة ({feePct}%)
                    </span>
                    <span className="ltr-num tabular-nums font-extrabold text-slate-700">
                      {formatUsdt(feeAmount)}
                    </span>
                  </div>

                  {/* Row 5: المبلغ + 4-Column Preset Grid (20 / 80 / 200 / 800 / 2000 / 5000) */}
                  <div className="space-y-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-bold text-[#07182B]">المبلغ</span>
                      <button
                        type="button"
                        onClick={() => availableBalance > 0 && setAmount(String(availableBalance))}
                        className="text-[11px] font-extrabold text-[#0D7A72] cursor-pointer"
                      >
                        سحب الكل
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {withdrawPresets.map((preset) => {
                        const isSelected = Number(amount) === Number(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAmount(String(preset))}
                            className={`ltr-num tabular-nums rounded-lg py-2.5 text-[13px] font-extrabold transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#0D7A72] text-white shadow-2xs'
                                : 'bg-[#DDF1EC] text-[#07182B] hover:bg-[#CBE9E1]'
                            }`}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <input
                        type="number"
                        step="0.01"
                        min={minWithdraw}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`أدخل المبلغ (الحد الأدنى ${minWithdraw})`}
                        className="flex-1 rounded-xl bg-[#F4F7FA] border border-slate-200/80 px-3.5 py-2.5 text-sm font-extrabold text-[#07182B] outline-none focus:border-[#0D7A72] ltr-num"
                      />
                      <div className="text-left shrink-0">
                        <p className="text-[10px] text-slate-400 font-semibold">الصافي الواصل</p>
                        <p className="ltr-num tabular-nums text-xs font-extrabold text-[#0D7A72]">
                          ${formatUsdt(netReceivable)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Row 6: طريقة السحب + عنوان المحفظة */}
                  <div className="space-y-2.5 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-bold text-[#07182B]">طريقة السحب</span>
                      <div className="flex items-center gap-1.5">
                        {['TRC20', 'BEP20'].map((net) => (
                          <button
                            key={net}
                            type="button"
                            onClick={() => setNetwork(net)}
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
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

                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder={
                        network === 'TRC20'
                          ? 'يرجى إدخال عنوان محفظة TRC20 (يبدأ بـ T...)'
                          : 'يرجى إدخال عنوان محفظة BEP20 (يبدأ بـ 0x...)'
                      }
                      className="w-full rounded-xl bg-[#F4F7FA] border border-slate-200/80 px-3.5 py-2.5 text-xs font-mono text-[#07182B] outline-none focus:border-[#0D7A72] ltr-num"
                    />
                  </div>

                  {/* Row 7: كلمة مرور الدفع */}
                  <div className="space-y-2">
                    <label className="block text-[13.5px] font-bold text-[#07182B]">
                      كلمة مرور الدفع
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="يرجى إدخال كلمة مرور الدفع"
                      className="w-full rounded-xl bg-[#F4F7FA] border border-slate-200/80 px-3.5 py-2.5 text-sm font-bold text-[#07182B] outline-none focus:border-[#0D7A72] text-right"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#0D7A72] hover:bg-[#0A645D] disabled:opacity-60 text-white py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال طلب السحب...</span>
                    </>
                  ) : (
                    <span>تأكيد السحب</span>
                  )}
                </button>

                {/* Clean Concise Withdraw Rules */}
                <div className="px-1 text-[11.5px] text-slate-500 space-y-1 leading-relaxed">
                  <p>• الحد الأدنى للسحب {minWithdraw} USDT وبحد أقصى {dailyLimit} طلبات يومياً.</p>
                  <p>• يرجى التأكد من مطابقة عنوان المحفظة لشبكة {network} المختارة.</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
