import React, { useState, useEffect, useCallback } from 'react';
import {
  Gift,
  CheckCircle2,
  Clock,
  Calculator,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiRequest, formatUsdt } from '../api';
import VipLevelsSection from './VipLevelsSection';
import ProfitCalculator from './ProfitCalculator';

export default function EarningsTab({
  user,
  vipLevels = [],
  platformConfig,
  initialSubTab = 'grades',
  onOpenDeposit,
  onNavigateTab,
  onUserUpdated,
  showToast
}) {
  const normalizeTab = (val) => (val === 'star' || val === 'stars' ? 'stars' : 'grades');
  const [subTab, setSubTab] = useState(() => normalizeTab(initialSubTab));
  const [showCalc, setShowCalc] = useState(false);
  const [teamCareer, setTeamCareer] = useState(null);
  const [loadingCareer, setLoadingCareer] = useState(false);
  const [claimingKey, setClaimingKey] = useState(null);

  useEffect(() => {
    setSubTab(normalizeTab(initialSubTab));
  }, [initialSubTab]);

  const loadCareerData = useCallback(async () => {
    setLoadingCareer(true);
    try {
      const data = await apiRequest('/api/team');
      setTeamCareer(data);
    } catch {
      // silent fallback
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

  const careerRanks =
    teamCareer?.salaryProgram?.ranks || platformConfig?.salaryRanks || [];
  const guaranteeDays = Number(platformConfig?.guaranteeDurationDays || 365);

  return (
    <div className="space-y-3.5 pt-2 animate-tab">
      {/* Clean Top Page Title + 2-Tab Segmented Switch (matches tashare8 pages-index-profit) */}
      <div className="bg-white rounded-2xl p-1.5 shadow-[0_3px_12px_rgba(7,24,43,0.05)] grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setSubTab('grades')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
            subTab === 'grades'
              ? 'bg-[#07182B] text-[#F5D076]'
              : 'text-slate-600 hover:text-[#07182B]'
          }`}
        >
          الأرباح وانضمام الفئات
        </button>

        <button
          type="button"
          onClick={() => setSubTab('stars')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
            subTab === 'stars'
              ? 'bg-[#0D7A72] text-white'
              : 'text-slate-600 hover:text-[#07182B]'
          }`}
        >
          رحلة النجوم والرواتب
        </button>
      </div>

      {subTab === 'grades' ? (
        <div className="space-y-3">
          {/* Clean Grade Cards */}
          <VipLevelsSection
            user={user}
            vipLevels={vipLevels}
            onOpenDepositWithAmount={(amount, tier) => onOpenDeposit(amount, tier)}
            onNavigateTab={onNavigateTab}
            onUserUpdated={onUserUpdated}
            showToast={showToast}
          />

          {/* Collapsible Interactive Profit Calculator (zero visual clutter unless opened) */}
          <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(7,24,43,0.05)] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCalc((s) => !s)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-right cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Calculator className="w-4.5 h-4.5 text-[#0D7A72]" />
                <span className="text-xs font-extrabold text-[#07182B]">
                  حاسبة الأرباح التقديرية
                </span>
              </div>
              {showCalc ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showCalc && (
              <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                <ProfitCalculator
                  vipLevels={vipLevels}
                  onOpenDeposit={(amount, tier) => onOpenDeposit(amount, tier)}
                />
              </div>
            )}
          </div>

          {/* Clean Concise Guarantee Note */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_3px_12px_rgba(7,24,43,0.04)] space-y-1.5 text-xs text-slate-600 leading-relaxed">
            <p className="font-extrabold text-[#07182B]">مبادئ العوائد وضمان العمل</p>
            <p>
              • يُحفظ مبلغ تفعيل الفئة كضمان عمل رسمي باسمك ويُسترد بالكامل بعد إتمام {guaranteeDays} يوماً.
            </p>
            <p>
              • عمولات بناء الفريق: 10% للمستوى A، و5% للمستوى B، و2% للمستوى C مباشرة في محفظة الدخل.
            </p>
          </div>
        </div>
      ) : (
        /* Star Journey 5-Position Promotion Ladder (رحلة النجوم — matches IMG_4506 & IMG_4507) */
        <div className="space-y-3">
          {loadingCareer && careerRanks.length === 0 ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0D7A72]" />
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
                  className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-3"
                >
                  {/* Position Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#07182B] text-[#F5D076] font-display text-xs font-extrabold flex items-center justify-center shrink-0 ltr-num">
                        ★{index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-[#07182B]">{rk.title}</h4>
                        <p className="text-[11px] text-slate-500">
                          الحد الأدنى لعقدك الشخصي: الفئة A{rk.minUserVip}
                        </p>
                      </div>
                    </div>

                    {rk.promotionClaimStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-[#0D7A72]">
                        <CheckCircle2 className="w-3 h-3" />
                        مُعتمد
                      </span>
                    )}
                  </div>

                  {/* Clean 2-Column Bonus + Monthly Salary */}
                  <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-[#F6F9FC] p-3">
                    <div>
                      <p className="text-[10.5px] font-semibold text-slate-500">مكافأة الترقية</p>
                      <p className="ltr-num tabular-nums text-sm font-extrabold text-[#0D7A72] mt-0.5">
                        +${formatUsdt(oneTime)} USDT
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold text-slate-500">الراتب الشهري الثابت</p>
                      <p className="ltr-num tabular-nums text-sm font-extrabold text-[#07182B] mt-0.5">
                        {monthlySal > 0 ? `$${formatUsdt(monthlySal)} / شهر` : 'منصب تأسيسي'}
                      </p>
                    </div>
                  </div>

                  {gift && (
                    <div className="rounded-xl bg-amber-50/80 px-3 py-2 flex items-center gap-2 text-xs font-bold text-amber-900">
                      <Gift className="w-4 h-4 text-[#D49B2A] shrink-0" />
                      <span>هدية المنصب: {gift}</span>
                    </div>
                  )}

                  {/* Conditions Progress */}
                  <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100">
                    {rk.minActiveDirect > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">أعضاء مباشرون نشطون (A):</span>
                        <span className="ltr-num font-extrabold text-[#07182B]">
                          {teamCareer?.salaryProgram?.currentMetrics?.activeDirect ?? 0} / {rk.minActiveDirect}
                        </span>
                      </div>
                    )}
                    {rk.minTotalActiveTeam > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">إجمالي الفريق النشط (A+B+C):</span>
                        <span className="ltr-num font-extrabold text-[#07182B]">
                          {teamCareer?.salaryProgram?.currentMetrics?.totalActiveTeam ?? 0} / {rk.minTotalActiveTeam}
                        </span>
                      </div>
                    )}
                    {qualReq > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">موظفون ضمن الفئة A{qualTier}+:</span>
                        <span className="ltr-num font-extrabold text-[#07182B]">
                          {rk.currentQualifiedVipCount ?? 0} / {qualReq}
                        </span>
                      </div>
                    )}
                    {monthlyNewReq > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">نمو الفريق الشهري الجديد:</span>
                        <span className="ltr-num font-extrabold text-[#07182B]">
                          {teamCareer?.salaryProgram?.currentMetrics?.monthlyNewMembers ?? 0} / {monthlyNewReq}
                        </span>
                      </div>
                    )}
                    {rk.minTeamDepositsUsdt > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">إجمالي ضمانات الفريق:</span>
                        <span className="ltr-num font-extrabold text-[#07182B]">
                          ${formatUsdt(teamCareer?.salaryProgram?.currentMetrics?.teamTotalDeposits ?? 0)} / $
                          {formatUsdt(rk.minTeamDepositsUsdt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Claim Buttons */}
                  {(rk.canClaimPromotion ||
                    rk.promotionClaimStatus === 'pending' ||
                    rk.canClaim ||
                    rk.claimStatus === 'pending') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {rk.promotionClaimStatus === 'pending' ? (
                        <div className="rounded-xl bg-amber-50 py-2 px-3 text-center text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>مكافأة الترقية قيد الاعتماد</span>
                        </div>
                      ) : rk.canClaimPromotion ? (
                        <button
                          type="button"
                          disabled={claimingKey === `promo_${rk.id}`}
                          onClick={() => handleClaimPromotion(rk.id)}
                          className="rounded-xl bg-[#0D7A72] text-white py-2.5 px-3 text-xs font-extrabold cursor-pointer"
                        >
                          {claimingKey === `promo_${rk.id}`
                            ? '...'
                            : `استلام المكافأة +$${formatUsdt(oneTime)}`}
                        </button>
                      ) : null}

                      {monthlySal > 0 &&
                        (rk.claimStatus === 'pending' ? (
                          <div className="rounded-xl bg-slate-100 py-2 px-3 text-center text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>الراتب قيد المراجعة</span>
                          </div>
                        ) : rk.canClaim ? (
                          <button
                            type="button"
                            disabled={claimingKey === `sal_${rk.id}`}
                            onClick={() => handleClaimSalary(rk.id)}
                            className="rounded-xl bg-[#07182B] text-[#F5D076] py-2.5 px-3 text-xs font-extrabold cursor-pointer"
                          >
                            {claimingKey === `sal_${rk.id}`
                              ? '...'
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
