import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiRequest, formatUsdt } from '../api';

export default function VipLevelsSection({
  user,
  vipLevels = [],
  onBack,
  onOpenDeposit,
  onOpenDepositWithAmount,
  onNavigateTab,
  onUserUpdated,
  showToast
}) {
  const [activatingLevel, setActivatingLevel] = useState(null);

  const paidLevels = vipLevels.filter((v) => v.level >= 1);
  const userVip = user?.vipLevel ?? 0;
  const currentTier =
    vipLevels.find((v) => v.level === userVip) || {
      level: 0,
      name: 'الفئة A0',
      dailyTasks: 1,
      dailyProfit: 0.25,
      monthlyProfit: 7.5
    };

  const handleActivateOrDeposit = async (tier) => {
    const spendable = (user?.rechargeBalance || 0) + (user?.balance || 0);
    const maxQualification = Math.max(user?.totalDeposits || 0, spendable);
    if (maxQualification >= tier.minDeposit) {
      setActivatingLevel(tier.level);
      try {
        const res = await apiRequest('/api/vip/activate', {
          method: 'POST',
          body: { level: tier.level }
        });
        if (onUserUpdated) onUserUpdated(res.user, res.todayStats);
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setActivatingLevel(null);
      }
    } else {
      const remaining = Math.max(10, Math.ceil(tier.minDeposit - (user?.totalDeposits || 0)));
      const openDep = onOpenDepositWithAmount || onOpenDeposit;
      if (openDep) openDep(remaining, tier);
    }
  };

  const currentPerOrder =
    currentTier.dailyTasks > 0 ? currentTier.dailyProfit / currentTier.dailyTasks : 0;

  return (
    <section id="vip-levels-section" className="space-y-3">
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#07182B] shadow-[0_2px_8px_rgba(7,24,43,0.06)] cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
          <span className="font-display text-sm font-extrabold text-[#07182B]">
            درجات أرونا الوظيفية
          </span>
          <div className="w-16" />
        </div>
      )}

      {/* Clean Current Grade Banner (EXACT tashare8 pages-vip-index top card) */}
      <div
        className="rounded-2xl p-4 text-white shadow-[0_8px_24px_-6px_rgba(7,24,43,0.22)] space-y-3"
        style={{
          background: 'linear-gradient(132deg, #07182B 0%, #0B3650 55%, #0D7A72 100%)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/75 font-semibold">المستوى الحالي</p>
            <p className="font-display text-lg font-extrabold text-[#F5D076] mt-0.5">
              الفئة A{userVip}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.('tasks')}
            className="rounded-full bg-white/15 hover:bg-white/25 px-3.5 py-1.5 text-xs font-extrabold text-white cursor-pointer"
          >
            بدء مهام اليوم
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2.5 border-t border-white/15 text-center">
          <div>
            <p className="text-[10px] text-white/70">المهام اليومية</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-white mt-0.5">
              {currentTier.dailyTasks}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/70">لكل طلب</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-white mt-0.5">
              ${formatUsdt(currentPerOrder)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/70">الربح اليومي</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-[#F5D076] mt-0.5">
              ${formatUsdt(currentTier.dailyProfit)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/70">ربح 30 يوم</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-white mt-0.5">
              ${formatUsdt(currentTier.monthlyProfit || currentTier.dailyProfit * 30)}
            </p>
          </div>
        </div>
      </div>

      {/* Clean White Grade Cards (EXACT tashare8 pages-index-grade / pages-vip-index box-a!) */}
      <div className="space-y-3">
        {paidLevels.map((tier) => {
          const isCurrent = userVip === tier.level;
          const isUnlockedLower = userVip > tier.level;
          const perOrder = tier.dailyTasks > 0 ? tier.dailyProfit / tier.dailyTasks : 0;
          const monthly = tier.monthlyProfit || tier.dailyProfit * 30;

          return (
            <div
              key={tier.level}
              className={`bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-3 ${
                isCurrent ? 'ring-2 ring-[#0D7A72]' : ''
              }`}
            >
              {/* Top Row: Royal Crest Emblem + Title + Action Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white shadow-xs"
                    style={{
                      background: 'linear-gradient(140deg, #07182B 0%, #0D7A72 100%)'
                    }}
                  >
                    <span className="ltr-num font-display text-sm font-extrabold text-[#F5D076]">
                      A{tier.level}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-extrabold text-[#07182B] truncate">
                      الفئة A{tier.level}
                    </h3>
                    <p className="text-xs font-bold text-[#0D7A72] mt-0.5 ltr-num tabular-nums">
                      ضمان العمل: {formatUsdt(tier.minDeposit)} USDT
                    </p>
                  </div>
                </div>

                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-[#0D7A72] shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مفعّل</span>
                  </span>
                ) : isUnlockedLower ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500 shrink-0">
                    مشمول
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={activatingLevel === tier.level}
                    onClick={() => handleActivateOrDeposit(tier)}
                    className="rounded-full bg-[#0D7A72] hover:bg-[#0A645D] text-white px-4 py-2 text-xs font-extrabold shrink-0 transition-colors cursor-pointer shadow-2xs"
                  >
                    {activatingLevel === tier.level ? '...' : 'انضم الآن'}
                  </button>
                )}
              </div>

              {/* Clean 2x2 Metrics Grid (المهام اليومية / لكل طلب / الربح اليومي / ربح 30 يوم) */}
              <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-[#F6F9FC] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">المهام اليومية</span>
                  <span className="ltr-num tabular-nums font-extrabold text-[#07182B]">
                    {tier.dailyTasks}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">لكل طلب</span>
                  <span className="ltr-num tabular-nums font-extrabold text-[#07182B]">
                    {formatUsdt(perOrder)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">الربح اليومي</span>
                  <span className="ltr-num tabular-nums font-extrabold text-[#0D7A72]">
                    {formatUsdt(tier.dailyProfit)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">ربح 30 يوم</span>
                  <span className="ltr-num tabular-nums font-extrabold text-[#0D7A72]">
                    {formatUsdt(monthly)} USDT
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
