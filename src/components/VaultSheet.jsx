import React, { useState, useEffect, useCallback } from 'react';
import ModalPortal from './ModalPortal';
import {
  X,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Coins,
  Briefcase
} from 'lucide-react';
import { apiRequest, formatUsdt, formatDateTimeAr } from '../api';

const QUICK_AMOUNTS = [20, 50, 100, 250, 500];

export default function VaultSheet({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  showToast
}) {
  const [vaultData, setVaultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState('plans'); // 'plans' | 'positions'
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [staking, setStaking] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

  const loadVault = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/vault');
      setVaultData(res);
      if (res.plans?.length && !selectedPlanId) {
        setSelectedPlanId(res.plans[0].id);
        setAmount(String(res.plans[0].minAmount || 20));
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedPlanId, showToast]);

  useEffect(() => {
    if (isOpen) {
      loadVault();
    }
  }, [isOpen, loadVault]);

  if (!isOpen) return null;

  const plans = vaultData?.plans || [];
  const positions = vaultData?.positions || [];
  const activePositionsCount = positions.filter((p) => p.status === 'active').length;
  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || null;
  const numericAmt = Math.max(0, Number(amount || 0));
  const estProfit = activePlan
    ? Math.round(numericAmt * (Number(activePlan.totalReturnPct || 0) / 100) * 100) / 100
    : 0;
  const estTotal = Math.round((numericAmt + estProfit) * 100) / 100;
  const totalAvailable = Number(user?.rechargeBalance || 0) + Number(user?.balance || 0);

  const handleStake = async (e) => {
    e.preventDefault();
    if (!activePlan) return;
    if (!numericAmt || numericAmt < Number(activePlan.minAmount || 10)) {
      showToast(`الحد الأدنى لهذه المحفظة هو ${activePlan.minAmount} USDT`, 'error');
      return;
    }
    if (numericAmt > totalAvailable) {
      showToast('رصيدك المتاح حالياً غير كافٍ، يرجى إيداع رصيد أولاً', 'error');
      return;
    }

    setStaking(true);
    try {
      const res = await apiRequest('/api/vault/stake', {
        method: 'POST',
        body: { planId: activePlan.id, amount: numericAmt }
      });
      if (res.user && onUserUpdated) onUserUpdated(res.user);
      showToast(res.message);
      await loadVault();
      setSubTab('positions');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setStaking(false);
    }
  };

  const handleClaim = async (posId) => {
    setClaimingId(posId);
    try {
      const res = await apiRequest(`/api/vault/claim/${posId}`, { method: 'POST' });
      if (res.user && onUserUpdated) onUserUpdated(res.user);
      showToast(res.message);
      await loadVault();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[92] bg-[#040D18]/65 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[92dvh] flex flex-col rounded-t-[28px] bg-[#EEF2F7] shadow-2xl animate-sheet overflow-hidden border-t border-[#F5D076]/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sovereign Header: استثمر مع أرونا */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between shrink-0 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #051322 0%, #0A2742 54%, #0D6E65 100%)'
          }}
        >
          <div className="pointer-events-none absolute inset-0 exec-filigree opacity-55" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5D076]/16 border border-[#F5D076]/45 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5 text-[#F5D076]" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold text-white">
                استثمر مع أرونا
              </h3>
              <p className="text-[11px] text-teal-100/85">
                محافظ استثمار الضيافة والسياحة بعائد تعاقدي مضمون
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 w-8 h-8 rounded-xl bg-white/12 hover:bg-white/22 border border-white/15 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Metrics Strip */}
        <div className="bg-white border-b border-slate-200/85 px-4 py-3 grid grid-cols-3 gap-2 text-center shrink-0">
          <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2">
            <p className="text-[10px] font-semibold text-slate-500">الرصيد المتاح</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-[#07182B] mt-0.5">
              ${formatUsdt(totalAvailable)}
            </p>
          </div>
          <div className="rounded-xl bg-teal-50/75 border border-teal-200/60 p-2">
            <p className="text-[10px] font-semibold text-teal-900">رأس المال المستثمر</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-[#0D7A72] mt-0.5">
              ${formatUsdt(vaultData?.summary?.activeLockedTotal)}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50/75 border border-amber-200/70 p-2">
            <p className="text-[10px] font-semibold text-amber-900">العوائد المتوقعة</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-emerald-700 mt-0.5">
              +${formatUsdt(vaultData?.summary?.activeExpectedProfit)}
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="px-4 pt-3 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-white border border-slate-200/85 rounded-2xl shadow-2xs">
            <button
              type="button"
              onClick={() => setSubTab('plans')}
              className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                subTab === 'plans'
                  ? 'bg-[#07182B] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              محافظ الاستثمار
            </button>
            <button
              type="button"
              onClick={() => setSubTab('positions')}
              className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                subTab === 'positions'
                  ? 'bg-[#07182B] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              عقودي الاستثمارية ({activePositionsCount})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {loading && !vaultData ? (
            <div className="py-14 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0D7A72]" />
            </div>
          ) : subTab === 'plans' ? (
            <form onSubmit={handleStake} className="space-y-3.5">
              {/* Portfolio Cards */}
              <div className="space-y-2.5">
                {plans.map((pl) => {
                  const selected = pl.id === activePlan?.id;
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlanId(pl.id);
                        if (Number(amount || 0) < pl.minAmount) {
                          setAmount(String(pl.minAmount));
                        }
                      }}
                      className={`w-full text-right rounded-2xl p-3.5 border transition-all cursor-pointer ${
                        selected
                          ? 'bg-white border-[#07182B] ring-2 ring-[#F5D076]/55 shadow-sm'
                          : 'bg-white border-slate-200/85 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Briefcase className="w-3.5 h-3.5 text-[#0D7A72] shrink-0" />
                            <span className="font-display text-xs font-extrabold text-[#07182B]">
                              {pl.title}
                            </span>
                            {pl.badge && (
                              <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9.5px] font-extrabold text-amber-900">
                                {pl.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            مدة العقد: <strong>{pl.durationDays} يوم</strong> • الحد الأدنى:{' '}
                            <span className="ltr-num font-extrabold text-slate-800">
                              ${pl.minAmount} USDT
                            </span>
                          </p>
                        </div>

                        <div className="text-left shrink-0 rounded-xl bg-[#07182B] border border-[#F5D076]/35 px-2.5 py-1.5">
                          <span className="block text-[9px] font-bold text-slate-300">
                            صافي العائد
                          </span>
                          <span className="ltr-num tabular-nums text-sm font-extrabold text-[#F5D076]">
                            +{pl.totalReturnPct}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Amount Input & Yield Preview */}
              {activePlan && (
                <div className="exec-card rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-[#07182B]">
                      مبلغ الاستثمار (USDT)
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmount(String(totalAvailable))}
                      className="text-[11px] font-bold text-[#0D7A72] hover:underline cursor-pointer"
                    >
                      كامل الرصيد (${formatUsdt(totalAvailable)})
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    min={activePlan.minAmount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`الحد الأدنى ${activePlan.minAmount} USDT`}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-extrabold text-[#07182B] ltr-num text-right outline-none focus:border-[#07182B] focus:bg-white"
                  />

                  {/* Quick Amount Chips */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {QUICK_AMOUNTS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(String(Math.max(activePlan.minAmount, preset)))}
                        className="ltr-num rounded-lg bg-slate-100 hover:bg-slate-200 py-1 text-[11px] font-extrabold text-slate-700 cursor-pointer"
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl bg-[#F4FBF9] border border-teal-200/80 p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">مدة العقد الاستثماري</span>
                      <span className="font-extrabold text-[#07182B]">
                        {activePlan.durationDays} يوماً
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">العائد الصافي المضمون</span>
                      <span className="ltr-num tabular-nums font-extrabold text-emerald-700">
                        +${formatUsdt(estProfit)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-teal-200/60">
                      <span className="font-bold text-[#07182B]">إجمالي المستحق مع رأس المال</span>
                      <span className="ltr-num tabular-nums font-extrabold text-[#0D7A72]">
                        ${formatUsdt(estTotal)} USDT
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={staking}
                    className="exec-primary-btn w-full flex items-center justify-center gap-2 rounded-2xl text-white py-3.5 text-xs font-extrabold cursor-pointer"
                  >
                    {staking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#F5D076]" />
                    )}
                    <span>
                      {staking
                        ? 'جاري توثيق العقد...'
                        : `بدء الاستثمار في ${activePlan.title}`}
                    </span>
                  </button>
                </div>
              )}
            </form>
          ) : !positions.length ? (
            <div className="exec-card rounded-2xl p-8 text-center space-y-2">
              <Coins className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-display text-sm font-extrabold text-[#07182B]">
                لا توجد عقود استثمارية نشطة حالياً
              </p>
              <p className="text-xs text-slate-500">
                اختر إحدى محافظ «استثمر مع أرونا» لتنمية رأس مالك بعائد دوري مضمون
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {positions.map((pos) => (
                <div
                  key={pos.id}
                  className="exec-card rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-xs font-extrabold text-[#07182B]">
                        {pos.planTitle}
                      </p>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        موعد الاستحقاق: {formatDateTimeAr(pos.maturesAt)}
                      </p>
                    </div>
                    {pos.status === 'claimed' ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        تمت التسوية
                      </span>
                    ) : pos.canClaim ? (
                      <button
                        type="button"
                        disabled={claimingId === pos.id}
                        onClick={() => handleClaim(pos.id)}
                        className="rounded-xl bg-[#0D7A72] hover:bg-teal-800 text-white px-3 py-1.5 text-xs font-extrabold shadow-xs cursor-pointer"
                      >
                        {claimingId === pos.id
                          ? 'جاري...'
                          : `استلم $${formatUsdt(pos.totalPayout)}`}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <Clock className="w-3 h-3" />
                        متبقي {pos.remainingHours} ساعة
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2 text-center text-[11px]">
                    <div>
                      <span className="block text-[9.5px] text-slate-400">رأس المال</span>
                      <strong className="ltr-num text-[#07182B]">${formatUsdt(pos.amount)}</strong>
                    </div>
                    <div>
                      <span className="block text-[9.5px] text-slate-400">
                        العائد (+{pos.totalReturnPct}%)
                      </span>
                      <strong className="ltr-num text-emerald-600">
                        +${formatUsdt(pos.expectedProfit)}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[9.5px] text-slate-400">الإجمالي</span>
                      <strong className="ltr-num text-[#0D7A72]">
                        ${formatUsdt(pos.totalPayout)}
                      </strong>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0D7A72] transition-all"
                      style={{ width: `${pos.progressPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
