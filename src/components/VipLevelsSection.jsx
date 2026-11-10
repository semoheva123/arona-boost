import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowUpLeft,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { apiRequest, formatUsdt } from '../api';

export default function VipLevelsSection({
  user,
  vipLevels = [],
  onOpenDepositWithAmount,
  onNavigateTab,
  onUserUpdated,
  showToast
}) {
  const [activatingLevel, setActivatingLevel] = useState(null);

  const paidLevels = vipLevels.filter((v) => v.level >= 1);
  const userVip = user?.vipLevel ?? 0;

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
        onUserUpdated(res.user, res.todayStats);
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setActivatingLevel(null);
      }
    } else {
      const remaining = Math.max(10, Math.ceil(tier.minDeposit - (user?.totalDeposits || 0)));
      onOpenDepositWithAmount(remaining, tier);
    }
  };

  return (
    <section id="vip-levels-section" className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-extrabold text-[#07182B] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            <span>درجات التوظيف المعتمدة — أرونا</span>
          </h2>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            يُحفظ مبلغ التوثيق كضمان عقد عمل مسترد بالكامل بعد إتمام 365 يوماً
          </p>
        </div>

        <span className="gold-crest-pill rounded-xl px-2.5 py-1 text-xs font-extrabold shrink-0">
          الفئة A{userVip}
        </span>
      </div>

      {/* Starter Grade A0 Banner when user is on grade 0 */}
      {userVip === 0 && (
        <div className="exec-card rounded-2xl p-3.5 flex items-center justify-between gap-3 border-teal-300/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#07182B] text-[#F5D076] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#07182B]">
                عقد التدريب التمهيدي (الفئة A0) مفعّل على حسابك
              </p>
              <p className="text-[11px] text-slate-600">
                لديك مهمة تقييم يومية بقيمة 0.25 USDT، أو قم بتوثيق درجة وظيفية أعلى
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('tasks')}
            className="shrink-0 rounded-xl bg-[#07182B] text-[#F5D076] text-xs font-extrabold px-3 py-2 cursor-pointer"
          >
            التقييم
          </button>
        </div>
      )}

      {/* Official Arona Corporate Grade Cards (A1 - A6) */}
      <div className="space-y-3">
        {paidLevels.map((tier) => {
          const isCurrent = userVip === tier.level;
          const isUnlockedLower = userVip > tier.level;
          const spendable = (user?.rechargeBalance || 0) + (user?.balance || 0);
          const maxQual = Math.max(user?.totalDeposits || 0, spendable);
          const canActivateNow = !isCurrent && !isUnlockedLower && maxQual >= tier.minDeposit;
          const remainingDeposit = Math.max(0, tier.minDeposit - (user?.totalDeposits || 0));
          const codeLabel = `A${tier.level}`;

          return (
            <div
              key={tier.level}
              className={`relative rounded-[26px] bg-white p-4 transition-all border ${
                isCurrent
                  ? 'border-[#07182B] ring-2 ring-[#F5D076]/50 shadow-[0_16px_34px_-14px_rgba(7,24,43,0.20)]'
                  : 'border-slate-200/90 shadow-[0_10px_26px_-14px_rgba(6,21,38,0.08)]'
              }`}
            >
              {/* Top Row: Engraved Grade Monogram & Work Guarantee Bond */}
              <div className="flex items-start justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#07182B] border border-[#F5D076]/45 flex flex-col items-center justify-center shrink-0 shadow-xs">
                    <span className="text-[8px] font-bold text-slate-300 leading-none">فئة</span>
                    <span className="ltr-num font-display text-sm font-extrabold text-[#F5D076] leading-tight">
                      {codeLabel}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-extrabold text-[#07182B] truncate">
                      {tier.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{tier.subtitle}</p>
                  </div>
                </div>

                <div className="text-left shrink-0 rounded-xl bg-[#F8FAFC] border border-slate-200/85 px-2.5 py-1">
                  <p className="text-[9.5px] font-bold text-slate-500">ضمان العقد</p>
                  <p className="ltr-num tabular-nums text-sm font-extrabold text-[#07182B]">
                    ${formatUsdt(tier.minDeposit)}
                  </p>
                </div>
              </div>

              {/* 3 Financial & Operational Metrics */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#F6F8FB] border border-slate-200/75 p-2.5 mb-3">
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-slate-500">العائد اليومي</p>
                  <p className="ltr-num tabular-nums text-xs font-extrabold text-emerald-700 mt-0.5">
                    +${formatUsdt(tier.dailyProfit)}
                  </p>
                </div>
                <div className="text-center border-x border-slate-200/80">
                  <p className="text-[10px] font-semibold text-slate-500">حصة التقييم</p>
                  <p className="text-xs font-extrabold text-[#07182B] mt-0.5">
                    {tier.dailyTasks} وجهات
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-slate-500">الدخل الشهري</p>
                  <p className="ltr-num tabular-nums text-xs font-extrabold text-[#07182B] mt-0.5">
                    ${formatUsdt(tier.monthlyProfit)}
                  </p>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0D7A72]" />
                  <span>نسبة العائد:</span>
                  <strong className="text-[#07182B] tabular-nums">{tier.dailyRate}</strong>
                </span>

                {isCurrent ? (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('tasks')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-extrabold text-emerald-800 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>درجتك الحالية • نفّذ التقييم</span>
                  </button>
                ) : isUnlockedLower ? (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D7A72]" />
                    <span>مشمولة ضمن عقدك</span>
                  </span>
                ) : canActivateNow ? (
                  <button
                    type="button"
                    disabled={activatingLevel === tier.level}
                    onClick={() => handleActivateOrDeposit(tier)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D7A72] hover:bg-teal-800 text-white px-3.5 py-2 text-xs font-extrabold shadow-2xs cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#F5D076]" />
                    <span>
                      {activatingLevel === tier.level ? 'جاري التوثيق...' : `تفعيل ${tier.name}`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleActivateOrDeposit(tier)}
                    className="exec-primary-btn inline-flex items-center gap-1.5 rounded-xl text-white px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer"
                  >
                    <Lock className="w-3 h-3 text-[#F5D076]" />
                    <span>
                      توثيق العقد (
                      {remainingDeposit > 0 ? `${formatUsdt(remainingDeposit)}$` : `${tier.minDeposit}$`}
                      )
                    </span>
                    <ArrowUpLeft className="w-3.5 h-3.5 text-[#F5D076]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
