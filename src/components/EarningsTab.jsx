import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Star,
  Briefcase,
  ShieldCheck,
  Gift,
  Award,
  Crown,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Sparkles,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { apiRequest, formatUsdt } from '../api';
import VipLevelsSection from './VipLevelsSection';
import ProfitCalculator from './ProfitCalculator';

export default function EarningsTab({
  user,
  vipLevels = [],
  platformConfig,
  initialSubTab = 'guide', // 'guide' | 'stars'
  onOpenDeposit,
  onOpenCharter,
  onNavigateTab,
  onUserUpdated,
  showToast
}) {
  const [subTab, setSubTab] = useState(initialSubTab);
  const [teamCareer, setTeamCareer] = useState(null);
  const [loadingCareer, setLoadingCareer] = useState(false);
  const [claimingKey, setClaimingKey] = useState(null);

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  const loadCareerData = useCallback(async () => {
    setLoadingCareer(true);
    try {
      const data = await apiRequest('/api/team');
      setTeamCareer(data);
    } catch {
      // fallback to public salaryRanks
    } finally {
      setLoadingCareer(false);
    }
  }, []);

  useEffect(() => {
    loadCareerData();
  }, [loadCareerData, user?.vipLevel, user?.jobTitle]);

  const handleClaimPromotion = async (rankId) => {
    setClaimingKey(`promo_${rankId}`);
    try {
      const res = await apiRequest('/api/team/claim-promotion-bonus', {
        method: 'POST',
        body: { rankId }
      });
      showToast(res.message);
      if (res.user) onUserUpdated?.(res.user);
      loadCareerData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaimingKey(null);
    }
  };

  const handleClaimSalary = async (rankId) => {
    setClaimingKey(`sal_${rankId}`);
    try {
      const res = await apiRequest('/api/team/claim-salary', {
        method: 'POST',
        body: { rankId }
      });
      showToast(res.message);
      if (res.user) onUserUpdated?.(res.user);
      loadCareerData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaimingKey(null);
    }
  };

  const handleDirectJoinGrade = async (lvl) => {
    const currentGuar = Number(user?.workGuarantee?.amount || 0);
    const needed = Math.max(0, Number(lvl.minDeposit || 0) - currentGuar);
    const spendable = Number(user?.rechargeBalance || 0) + Number(user?.balance || 0);

    if (spendable >= needed || Number(user?.totalDeposits || 0) >= Number(lvl.minDeposit || 0)) {
      setClaimingKey(`join_${lvl.level}`);
      try {
        const res = await apiRequest('/api/vip/activate', {
          method: 'POST',
          body: { level: lvl.level }
        });
        if (res.user) onUserUpdated?.(res.user);
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setClaimingKey(null);
      }
    } else {
      const shortfall = Math.max(10, Math.ceil(needed - spendable));
      onOpenDeposit(shortfall, lvl);
    }
  };

  const careerRanks =
    teamCareer?.salaryProgram?.ranks || platformConfig?.salaryRanks || [];
  const guaranteeDays = Number(platformConfig?.guaranteeDurationDays || 365);

  return (
    <div className="space-y-4 animate-tab">
      {/* Sovereign Executive Header Banner */}
      <div className="exec-royal-surface relative overflow-hidden rounded-[28px] p-5 text-white border border-[#F5D076]/25">
        <div className="pointer-events-none absolute inset-0 exec-filigree opacity-65" />
        <div className="pointer-events-none absolute -top-12 -left-12 w-40 h-40 rounded-full bg-[#F5D076]/15 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-[#F5D076]/35 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#F5D076] mb-2">
              <Briefcase className="w-3.5 h-3.5 text-[#F5D076]" />
              <span>المنصب المعتمد: {user?.jobTitle || 'موظف رسمي'}</span>
            </div>
            <h2 className="font-display text-lg font-extrabold leading-snug text-white">
              نظام العوائد ورحلة النجوم المهنية
            </h2>
            <p className="text-xs text-slate-200/90 mt-1 leading-relaxed">
              الدليل التنظيمي لدخل المهام اليومية، وثيقة ضمان العمل المسترد ({guaranteeDays} يوم)،
              وسلم المناصب والرواتب الشهرية الثابتة.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCharter}
            className="shrink-0 rounded-2xl bg-[#F5D076]/14 hover:bg-[#F5D076]/22 border border-[#F5D076]/38 px-3 py-2 text-[11px] font-extrabold text-[#F5D076] flex flex-col items-center gap-1 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#F5D076]" />
            <span>بيان الشركة</span>
          </button>
        </div>

        {/* Sub-Tab Segmented Switch */}
        <div className="relative z-10 mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-slate-950/40 p-1 border border-white/14">
          <button
            type="button"
            onClick={() => setSubTab('grades')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-extrabold transition-all cursor-pointer ${
              subTab === 'grades'
                ? 'bg-[#F5D076] text-[#051322] shadow-xs'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>انضمام الفئات</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('guide')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-extrabold transition-all cursor-pointer ${
              subTab === 'guide'
                ? 'bg-white text-[#081E36] shadow-xs'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#0D7A72]" />
            <span>دليل الربح</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('stars')}
            className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-extrabold transition-all cursor-pointer ${
              subTab === 'stars'
                ? 'bg-[#F5D076] text-[#051322] shadow-xs'
                : 'text-[#F5D076] hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>رحلة النجوم</span>
          </button>
        </div>
      </div>

      {subTab === 'grades' ? (
        <div className="space-y-4">
          <ProfitCalculator
            vipLevels={vipLevels}
            onOpenDeposit={(amount, tier) => onOpenDeposit(amount, tier)}
          />
          <VipLevelsSection
            user={user}
            vipLevels={vipLevels}
            onOpenDepositWithAmount={(amount, tier) => onOpenDeposit(amount, tier)}
            onNavigateTab={onNavigateTab}
            onUserUpdated={onUserUpdated}
            showToast={showToast}
          />
        </div>
      ) : subTab === 'guide' ? (
        <>
          {/* Part-Time Online Employee Job Description */}
          <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    وصف وظيفة الموظف الجزئي عبر الإنترنت
                  </h3>
                  <p className="text-[11px] text-slate-500">ثلاث قنوات دخل متوازية ومستقرة</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3">
                <p className="text-xs font-extrabold text-teal-800">
                  1. دخل تقييم الوجهات السياحية اليومي (ثابت ومضمون)
                </p>
                <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                  يقوم الموظف يومياً بتقييم المعالم والفنادق السياحية المتجددة خلال دقائق معدودة،
                  وينزل الربح فوراً في <strong>محفظة الدخل</strong> القابلة للسحب.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3">
                <p className="text-xs font-extrabold text-indigo-800">
                  2. عمولات بناء الفريق من 3 مستويات (10% • 5% • 2%)
                </p>
                <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                  عند دعوة موظفين جدد لتفعيل مستوياتهم الرسمية، تحصل على عمولة فورية 10% للمستوى A،
                  و5% للمستوى B، و2% للمستوى C مباشرة في محفظة الدخل.
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-3 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-emerald-900">
                    3. نظام ضمان العمل المسترد بالكامل ({guaranteeDays} يوم)
                  </p>
                  <p className="text-[11.5px] text-emerald-800/90 mt-0.5 leading-relaxed">
                    مبلغ توثيق درجة العقد يُحفظ كـ <strong>ضمان عمل رسمي</strong> باسمك مع عدّاد
                    تنازلي حي في صفحة حسابي، ويُسترد بالكامل إلى محفظة الدخل فور انتهاء مدة العقد.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Official Arona Guarantee & Income Table */}
          <div className="exec-card rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-extrabold text-[#07182B]">
                  جدول درجات أرونا وضمان العقد الرسمي
                </h3>
                <p className="text-[11px] text-slate-500">
                  جميع الأرقام محدّثة تلقائياً بالدولار الرقمي (USDT)
                </p>
              </div>
              <span className="gold-crest-pill rounded-full px-2.5 py-1 text-[10px] font-extrabold">
                عقدك: الفئة A{user?.vipLevel ?? 0}
              </span>
            </div>

            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10.5px] font-extrabold text-slate-500">
                    <th className="py-2 px-2">الفئة</th>
                    <th className="py-2 px-2">ضمان العمل</th>
                    <th className="py-2 px-2">المهام</th>
                    <th className="py-2 px-2">الدخل اليومي</th>
                    <th className="py-2 px-2">الدخل الشهري</th>
                    <th className="py-2 px-1 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {vipLevels.map((lvl) => {
                    const isCurrent = (user?.vipLevel ?? 0) === lvl.level;
                    const isUnlocked = (user?.vipLevel ?? 0) >= lvl.level;
                    return (
                      <tr
                        key={lvl.level}
                        className={isCurrent ? 'bg-teal-50/70 font-bold' : 'hover:bg-slate-50/70'}
                      >
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-extrabold text-slate-900">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            {lvl.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 ltr-num tabular-nums font-bold text-slate-700">
                          ${formatUsdt(lvl.minDeposit)}
                        </td>
                        <td className="py-2.5 px-2 ltr-num tabular-nums text-slate-600">
                          {lvl.dailyTasks}
                        </td>
                        <td className="py-2.5 px-2 ltr-num tabular-nums font-extrabold text-emerald-600">
                          +${formatUsdt(lvl.dailyProfit)}
                        </td>
                        <td className="py-2.5 px-2 ltr-num tabular-nums font-extrabold text-teal-700">
                          ${formatUsdt(lvl.monthlyProfit)}
                        </td>
                        <td className="py-2.5 px-1 text-center">
                          {isCurrent ? (
                            <span className="inline-block rounded-lg bg-teal-600 text-white px-2 py-1 text-[10px] font-extrabold">
                              حالي
                            </span>
                          ) : isUnlocked ? (
                            <span className="text-[10px] font-bold text-emerald-600">مفعّل</span>
                          ) : (
                            <button
                              type="button"
                              disabled={claimingKey === `join_${lvl.level}`}
                              onClick={() => handleDirectJoinGrade(lvl)}
                              className="rounded-lg bg-[#07182B] hover:bg-slate-800 text-[#F5D076] border border-[#F5D076]/40 px-2.5 py-1 text-[10px] font-extrabold cursor-pointer"
                            >
                              {claimingKey === `join_${lvl.level}` ? '...' : 'انضمام'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Star Journey 5-Position Promotion Ladder (رحلة النجوم) */
        <div className="space-y-3">
          {/* Career Summary Strip */}
          <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/25 text-amber-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  مسار الترقيات الإدارية والمكافآت الكبرى
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  مكافآت ترقية نقدية فورية + هدايا عينية فاخرة + راتب شهري ثابت
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab?.('team')}
              className="shrink-0 rounded-xl bg-slate-900 text-white px-2.5 py-1.5 text-[10.5px] font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <span>فريقي</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {loadingCareer && careerRanks.length === 0 ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : (
            careerRanks.map((rk, index) => {
              const oneTime = Number(rk.oneTimeBonusUsdt || 0);
              const monthlySal = Number(rk.monthlySalaryUsdt || 0);
              const gift = rk.physicalGift || '';
              const qualTier = Number(rk.qualifiedVipTier || 1);
              const qualReq = Number(rk.minQualifiedVipCount || 0);
              const monthlyNewReq = Number(rk.minMonthlyNewMembers || 0);

              return (
                <div
                  key={rk.id}
                  className={`rounded-3xl border p-4 shadow-2xs space-y-3 transition-all ${
                    rk.allConditionsMet
                      ? 'bg-gradient-to-br from-white to-emerald-50/60 border-emerald-300'
                      : 'bg-white border-slate-200/90'
                  }`}
                >
                  {/* Position Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-700 text-amber-300 font-display text-sm font-extrabold flex items-center justify-center shrink-0 ltr-num">
                        ★{index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{rk.title}</h4>
                        <p className="text-[11px] text-slate-500">
                          يتطلب عقدك الشخصي الفئة A{rk.minUserVip} أو أعلى
                        </p>
                      </div>
                    </div>

                    {rk.promotionClaimStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        تمت الترقية
                      </span>
                    )}
                  </div>

                  {/* Rewards Trio Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-teal-50/80 border border-teal-200/70 p-2.5">
                      <p className="text-[10px] font-bold text-teal-700">مكافأة الترقية الفورية</p>
                      <p className="ltr-num tabular-nums text-base font-extrabold text-slate-900 mt-0.5">
                        +${formatUsdt(oneTime)} <span className="text-[10px] text-teal-700">USDT</span>
                      </p>
                    </div>

                    <div className="rounded-2xl bg-indigo-50/80 border border-indigo-200/70 p-2.5">
                      <p className="text-[10px] font-bold text-indigo-700">الراتب الشهري الثابت</p>
                      <p className="ltr-num tabular-nums text-base font-extrabold text-slate-900 mt-0.5">
                        {monthlySal > 0 ? (
                          <>
                            ${formatUsdt(monthlySal)}{' '}
                            <span className="text-[10px] text-indigo-700">/ شهرياً</span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-slate-500">ترقية تأسيسية</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Physical Gift Highlight (iPhone 17 Pro Max / Sedan Car) */}
                  {gift && (
                    <div className="rounded-2xl bg-gradient-to-l from-amber-500/15 via-amber-400/10 to-orange-500/15 border border-amber-300/80 px-3.5 py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-extrabold text-amber-950">
                          جائزة عينية إضافية: {gift}
                        </span>
                      </div>
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    </div>
                  )}

                  {/* Eligibility Conditions */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/75 p-3 space-y-1.5 text-[11px]">
                    <p className="font-extrabold text-slate-700 mb-1">شروط استحقاق المنصب:</p>
                    {rk.minActiveDirect > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">أعضاء مباشرون نشطون (المستوى A):</span>
                        <span
                          className={`ltr-num font-extrabold ${
                            rk.checks?.meetsDirect ? 'text-emerald-600' : 'text-slate-800'
                          }`}
                        >
                          {teamCareer?.salaryProgram?.currentMetrics?.activeDirect ?? 0} /{' '}
                          {rk.minActiveDirect}
                        </span>
                      </div>
                    )}
                    {rk.minTotalActiveTeam > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">إجمالي حجم الفريق النشط (A+B+C):</span>
                        <span
                          className={`ltr-num font-extrabold ${
                            rk.checks?.meetsTotalActive ? 'text-emerald-600' : 'text-slate-800'
                          }`}
                        >
                          {teamCareer?.salaryProgram?.currentMetrics?.totalActiveTeam ?? 0} /{' '}
                          {rk.minTotalActiveTeam}
                        </span>
                      </div>
                    )}
                    {qualReq > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                          موظفون رسميون ضمن الفئة A{qualTier}+:
                        </span>
                        <span
                          className={`ltr-num font-extrabold ${
                            rk.checks?.meetsQualVip ? 'text-emerald-600' : 'text-slate-800'
                          }`}
                        >
                          {rk.currentQualifiedVipCount ?? 0} / {qualReq}
                        </span>
                      </div>
                    )}
                    {monthlyNewReq > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">نمو الفريق الشهري الجديد:</span>
                        <span
                          className={`ltr-num font-extrabold ${
                            rk.checks?.meetsMonthlyNew ? 'text-emerald-600' : 'text-slate-800'
                          }`}
                        >
                          {teamCareer?.salaryProgram?.currentMetrics?.monthlyNewMembers ?? 0} /{' '}
                          {monthlyNewReq}
                        </span>
                      </div>
                    )}
                    {rk.minTeamDepositsUsdt > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">إجمالي ضمانات الفريق (USDT):</span>
                        <span
                          className={`ltr-num font-extrabold ${
                            rk.checks?.meetsTeamDep ? 'text-emerald-600' : 'text-slate-800'
                          }`}
                        >
                          ${formatUsdt(teamCareer?.salaryProgram?.currentMetrics?.teamTotalDeposits ?? 0)} / $
                          {formatUsdt(rk.minTeamDepositsUsdt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Claim Buttons when eligible */}
                  {(rk.canClaimPromotion ||
                    rk.promotionClaimStatus === 'pending' ||
                    rk.canClaim ||
                    rk.claimStatus === 'pending') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {rk.promotionClaimStatus === 'pending' ? (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 py-2 px-3 text-center text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>طلب مكافأة الترقية قيد الاعتماد</span>
                        </div>
                      ) : rk.canClaimPromotion ? (
                        <button
                          type="button"
                          disabled={claimingKey === `promo_${rk.id}`}
                          onClick={() => handleClaimPromotion(rk.id)}
                          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-3 text-xs font-extrabold cursor-pointer"
                        >
                          {claimingKey === `promo_${rk.id}`
                            ? 'جاري الإرسال...'
                            : `استلام مكافأة الترقية +$${formatUsdt(oneTime)}`}
                        </button>
                      ) : null}

                      {monthlySal > 0 &&
                        (rk.claimStatus === 'pending' ? (
                          <div className="rounded-xl bg-indigo-50 border border-indigo-200 py-2 px-3 text-center text-[11px] font-bold text-indigo-800 flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>راتب هذا الشهر قيد المراجعة</span>
                          </div>
                        ) : rk.canClaim ? (
                          <button
                            type="button"
                            disabled={claimingKey === `sal_${rk.id}`}
                            onClick={() => handleClaimSalary(rk.id)}
                            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-3 text-xs font-extrabold cursor-pointer"
                          >
                            {claimingKey === `sal_${rk.id}`
                              ? 'جاري الطلب...'
                              : `صرف راتب الشهر +$${formatUsdt(monthlySal)}`}
                          </button>
                        ) : null)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
