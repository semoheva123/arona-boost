import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Award,
  Coins,
  UserCheck,
  Loader2,
  Crown,
  Gift,
  CheckCircle2,
  Briefcase,
  Clock,
  BarChart3,
  Eye,
  X
} from 'lucide-react';
import { apiRequest, formatUsdt, formatShortDateAr, formatDateTimeAr } from '../api';

export default function TeamTab({ user, onUserUpdated, showToast }) {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('members'); // 'members' | 'commissions'
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | 1 | 2 | 3
  const [copiedKey, setCopiedKey] = useState(null);
  const [claimingKey, setClaimingKey] = useState(null);
  const [claimingSalaryId, setClaimingSalaryId] = useState(null);
  const [invitePreviewOpen, setInvitePreviewOpen] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      const data = await apiRequest('/api/team');
      setTeamData(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const inviteCode = teamData?.inviteCode || user?.inviteCode || '';
  const referralUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${inviteCode}`
      : `/?ref=${inviteCode}`;

  const copyText = async (text, key, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(msg);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      showToast('تعذر النسخ التلقائي، يرجى النسخ يدوياً', 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Arona Boost',
          text: `انضم إلى فريقي في Arona Boost عبر رمز الدعوة ${inviteCode}`,
          url: referralUrl
        });
        return;
      } catch {
        // user cancelled share
      }
    }
    copyText(referralUrl, 'link', 'تم نسخ رابط الدعوة لمشاركته مع فريقك!');
  };

  const handleClaimMilestone = async (key) => {
    setClaimingKey(key);
    try {
      const res = await apiRequest('/api/team/claim-milestone', {
        method: 'POST',
        body: { key }
      });
      if (onUserUpdated && res.user) onUserUpdated(res.user);
      showToast(res.message);
      await loadTeam();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaimingKey(null);
    }
  };

  const handleClaimSalary = async (rankId) => {
    setClaimingSalaryId(rankId);
    try {
      const res = await apiRequest('/api/team/claim-salary', {
        method: 'POST',
        body: { rankId }
      });
      if (onUserUpdated && res.user) onUserUpdated(res.user);
      showToast(res.message);
      await loadTeam();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaimingSalaryId(null);
    }
  };

  const [claimingPromoId, setClaimingPromoId] = useState(null);

  const handleClaimPromotionBonus = async (rankId) => {
    setClaimingPromoId(rankId);
    try {
      const res = await apiRequest('/api/team/claim-promotion-bonus', {
        method: 'POST',
        body: { rankId }
      });
      if (onUserUpdated && res.user) onUserUpdated(res.user);
      showToast(res.message);
      await loadTeam();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaimingPromoId(null);
    }
  };

  const filteredMembers = (teamData?.members || []).filter((m) =>
    tierFilter === 'all' ? true : m.tier === tierFilter
  );

  return (
    <div className="space-y-4 animate-tab">
      {/* Sovereign Referral & Team Hero Card */}
      <div className="exec-royal-surface rounded-[28px] p-5 text-white relative overflow-hidden border border-[#F5D076]/25">
        <div className="pointer-events-none absolute inset-0 exec-filigree opacity-65" />
        <div className="pointer-events-none absolute -top-16 -left-14 w-44 h-44 rounded-full bg-[#F5D076]/15 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-[#F5D076]/35 px-3 py-1 text-xs font-extrabold text-[#F5D076]">
              <Award className="w-3.5 h-3.5 text-[#F5D076]" />
              <span>إدارة الكوادر وشركاء Arona Boost</span>
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-xl bg-[#F5D076] hover:bg-amber-300 px-3 py-1.5 text-xs font-extrabold text-[#051322] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة الدعوة</span>
            </button>
          </div>

          <h2 className="font-display text-lg font-extrabold leading-snug text-white">
            كوّن فريقك الرسمي واستلم عمولات فورية حتى 17%
          </h2>
          <p className="text-xs text-slate-200/90 mt-1 leading-relaxed">
            تُودع عمولات الإحالة ومكافآت الترقية والرواتب الشهرية تلقائياً في محفظة الدخل القابلة للسحب.
          </p>

          {/* Invite Code & Link Boxes */}
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/12 backdrop-blur-xs border border-white/15 px-3.5 py-2.5">
              <div>
                <p className="text-[10px] text-teal-100/80">رمز الدعوة الخاص بك</p>
                <p className="ltr-num tabular-nums text-sm font-extrabold tracking-wider text-white">
                  {inviteCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(inviteCode, 'code', 'تم نسخ رمز الدعوة بنجاح!')}
                className="inline-flex items-center gap-1 rounded-xl bg-white text-slate-900 px-3 py-1.5 text-xs font-bold shadow-2xs cursor-pointer"
              >
                {copiedKey === 'code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-teal-700" />
                    <span>نسخ الرمز</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/12 backdrop-blur-xs border border-white/15 px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-teal-100/80">رابط الإحالة المباشر</p>
                <p className="ltr-num text-xs font-medium text-white/95 truncate">
                  {referralUrl}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText(referralUrl, 'link', 'تم نسخ رابط الدعوة المباشر!')}
                className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 px-3 py-1.5 text-xs font-extrabold cursor-pointer"
              >
                {copiedKey === 'link' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرابط</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stats Overview Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">إجمالي الفريق</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="tabular-nums text-lg font-extrabold text-slate-900">
            {teamData?.stats?.totalMembers ?? 0}{' '}
            <span className="text-xs font-semibold text-slate-400">عضو</span>
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">عمولات الفريق</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="ltr-num tabular-nums text-lg font-extrabold text-emerald-600">
            +${formatUsdt(teamData?.stats?.totalTeamEarnings ?? user?.totalTeamEarnings)}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">إيداعات الفريق</span>
            <Award className="w-4 h-4 text-sky-600" />
          </div>
          <p className="ltr-num tabular-nums text-lg font-extrabold text-slate-900">
            ${formatUsdt(teamData?.stats?.teamTotalDeposits)}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-500">الأعضاء النشطون</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="tabular-nums text-lg font-extrabold text-slate-900">
            {teamData?.stats?.activeMembers ?? 0}{' '}
            <span className="text-xs font-semibold text-slate-400">نشط</span>
          </p>
        </div>
      </div>

      {/* Executive Team Leader Analytics Studio & Invite Pass Preview */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#081E36] text-[#F5D076] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-slate-900">
                استوديو تحليلات القادة
              </h3>
              <p className="text-[11px] text-slate-500">
                مؤشرات النشاط اليومي والتقدم نحو الراتب الشهري القادم
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setInvitePreviewOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 text-[10.5px] font-extrabold text-amber-900 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-700" />
            <span>بطاقة الدعوة</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/75 p-2.5 text-center">
            <span className="block text-[10px] text-slate-500">أنجزوا التقييم اليوم</span>
            <strong className="ltr-num tabular-nums text-sm font-extrabold text-emerald-700 mt-0.5 block">
              {teamData?.analytics?.activeTodayCount ?? 0} عضو
            </strong>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200/75 p-2.5 text-center">
            <span className="block text-[10px] text-slate-500">نسبة التفعيل الموثّق</span>
            <strong className="ltr-num tabular-nums text-sm font-extrabold text-[#081E36] mt-0.5 block">
              {teamData?.analytics?.fundedRatioPct ?? 0}%
            </strong>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200/75 p-2.5 text-center">
            <span className="block text-[10px] text-slate-500">توزيع A / B / C</span>
            <strong className="ltr-num tabular-nums text-xs font-extrabold text-teal-800 mt-1 block">
              {teamData?.stats?.tier1Count ?? 0} / {teamData?.stats?.tier2Count ?? 0} /{' '}
              {teamData?.stats?.tier3Count ?? 0}
            </strong>
          </div>
        </div>

        {teamData?.analytics?.nextSalaryProgress && (
          <div className="rounded-2xl bg-[#07192E] text-white p-3.5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-extrabold text-[#F5D076] truncate">
                الهدف القادم: {teamData.analytics.nextSalaryProgress.rankTitle}
              </span>
              <span className="ltr-num tabular-nums rounded-lg bg-white/12 px-2 py-0.5 text-[10.5px] font-extrabold text-emerald-300 shrink-0">
                {teamData.analytics.nextSalaryProgress.progressPct}% مكتمل
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#F5D076] to-emerald-400 transition-all"
                style={{ width: `${teamData.analytics.nextSalaryProgress.progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-300">
              <span>
                متبقي مباشر: <strong className="text-white ltr-num">{teamData.analytics.nextSalaryProgress.remainingDirect}</strong> • إجمالي نشط:{' '}
                <strong className="text-white ltr-num">{teamData.analytics.nextSalaryProgress.remainingTotalActive}</strong>
              </span>
              {teamData.analytics.nextSalaryProgress.monthlySalaryUsdt > 0 && (
                <span className="ltr-num font-extrabold text-[#F5D076]">
                  ${formatUsdt(teamData.analytics.nextSalaryProgress.monthlySalaryUsdt)}/شهرياً
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Career Promotion Ladder, One-Time Bonuses, Physical Gifts & Monthly Fixed Salaries */}
      {teamData?.salaryProgram?.enabled && teamData?.salaryProgram?.ranks?.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-extrabold text-slate-900">
                  رحلة النجوم — المناصب والمكافآت والرواتب الشهرية
                </h3>
                <p className="text-[11px] text-slate-500">
                  منصبك الحالي: <strong className="text-teal-700">{user?.jobTitle || 'موظف رسمي'}</strong>
                </p>
              </div>
            </div>
            <span className="ltr-num rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
              {teamData.salaryProgram.periodMonth}
            </span>
          </div>

          <div className="space-y-3">
            {teamData.salaryProgram.ranks.map((rk) => {
              const cur = teamData.salaryProgram.currentMetrics || {};
              const oneTime = Number(rk.oneTimeBonusUsdt || 0);
              const monthlySal = Number(rk.monthlySalaryUsdt || 0);
              const gift = rk.physicalGift || '';

              return (
                <div
                  key={rk.id}
                  className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                    rk.allConditionsMet
                      ? 'bg-emerald-50/40 border-emerald-300/90'
                      : 'bg-slate-50/80 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900">{rk.title}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {oneTime > 0 ? `مكافأة ترقية +$${formatUsdt(oneTime)}` : ''}
                        {oneTime > 0 && monthlySal > 0 ? ' • ' : ''}
                        {monthlySal > 0 ? `راتب شهري $${formatUsdt(monthlySal)}` : ''}
                      </p>
                    </div>
                    <div className="text-left rounded-xl bg-slate-900 text-amber-300 px-3 py-1.5 shrink-0">
                      <span className="block text-[9px] text-slate-300">
                        {monthlySal > 0 ? 'الراتب الشهري' : 'مكافأة الترقية'}
                      </span>
                      <span className="ltr-num tabular-nums text-xs font-extrabold">
                        ${formatUsdt(monthlySal > 0 ? monthlySal : oneTime)}
                        {monthlySal > 0 ? ' / شهر' : ' USDT'}
                      </span>
                    </div>
                  </div>

                  {gift && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200/90 px-3 py-1.5 flex items-center gap-2 text-[11px] font-extrabold text-amber-900">
                      <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>هدية عينية للمنصب: {gift}</span>
                    </div>
                  )}

                  {/* Dynamic Admin-Defined Conditions Checklist */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                    <div
                      className={`rounded-xl px-2.5 py-1.5 border flex items-center justify-between ${
                        rk.checks?.meetsVip
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>عقدك الشخصي</span>
                      <strong className="ltr-num">
                        A{cur.userVip ?? 0}/A{rk.minUserVip}
                      </strong>
                    </div>

                    <div
                      className={`rounded-xl px-2.5 py-1.5 border flex items-center justify-between ${
                        rk.checks?.meetsDirect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>مباشر نشط (A)</span>
                      <strong className="ltr-num">
                        {cur.activeDirect ?? 0}/{rk.minActiveDirect}
                      </strong>
                    </div>

                    <div
                      className={`rounded-xl px-2.5 py-1.5 border flex items-center justify-between ${
                        rk.checks?.meetsTotalActive
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>إجمالي النشطين</span>
                      <strong className="ltr-num">
                        {cur.totalActiveTeam ?? 0}/{rk.minTotalActiveTeam}
                      </strong>
                    </div>

                    {Number(rk.minQualifiedVipCount || 0) > 0 ? (
                      <div
                        className={`rounded-xl px-2.5 py-1.5 border flex items-center justify-between ${
                          rk.checks?.meetsQualVip
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>عقود الفئة A{rk.qualifiedVipTier || 1}+</span>
                        <strong className="ltr-num">
                          {rk.currentQualifiedVipCount ?? 0}/{rk.minQualifiedVipCount}
                        </strong>
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl px-2.5 py-1.5 border flex items-center justify-between ${
                          rk.checks?.meetsTeamDep
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>ضمانات الفريق</span>
                        <strong className="ltr-num">
                          ${Math.round(cur.teamTotalDeposits || 0)}/${rk.minTeamDepositsUsdt}
                        </strong>
                      </div>
                    )}

                    {Number(rk.minMonthlyNewMembers || 0) > 0 && (
                      <div
                        className={`col-span-2 rounded-xl px-2.5 py-1.5 border flex items-center justify-between ${
                          rk.checks?.meetsMonthlyNew
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>نمو الفريق الشهري الجديد ({teamData.salaryProgram.periodMonth})</span>
                        <strong className="ltr-num">
                          {cur.monthlyNewMembers ?? 0}/{rk.minMonthlyNewMembers}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* One-Time Promotion Bonus Claim */}
                  {oneTime > 0 && (
                    <div>
                      {rk.promotionClaimStatus === 'approved' ? (
                        <div className="w-full rounded-xl bg-teal-50 border border-teal-200 text-teal-800 py-1.5 text-center text-[11px] font-extrabold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم استلام مكافأة الترقية (+${formatUsdt(oneTime)} USDT)</span>
                        </div>
                      ) : rk.promotionClaimStatus === 'pending' ? (
                        <div className="w-full rounded-xl bg-amber-100 text-amber-900 py-1.5 text-center text-[11px] font-extrabold flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>مكافأة الترقية قيد اعتماد الإدارة</span>
                        </div>
                      ) : rk.canClaimPromotion ? (
                        <button
                          type="button"
                          disabled={claimingPromoId === rk.id}
                          onClick={() => handleClaimPromotionBonus(rk.id)}
                          className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-2 text-xs font-extrabold shadow-xs cursor-pointer"
                        >
                          {claimingPromoId === rk.id
                            ? 'جاري الطلب...'
                            : `استلم مكافأة الترقية الفورية (+$${formatUsdt(oneTime)} USDT)`}
                        </button>
                      ) : null}
                    </div>
                  )}

                  {/* Monthly Salary Action / Claim Status */}
                  {monthlySal > 0 ? (
                    rk.claimStatus === 'approved' ? (
                      <div className="w-full rounded-xl bg-emerald-100 text-emerald-800 py-2 text-center text-xs font-extrabold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تم صرف راتب هذا الشهر بنجاح</span>
                      </div>
                    ) : rk.claimStatus === 'pending' ? (
                      <div className="w-full rounded-xl bg-amber-100 text-amber-900 py-2 text-center text-xs font-extrabold flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>طلب صرف الراتب قيد مراجعة الإدارة</span>
                      </div>
                    ) : rk.canClaim ? (
                      <button
                        type="button"
                        disabled={claimingSalaryId === rk.id}
                        onClick={() => handleClaimSalary(rk.id)}
                        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-extrabold shadow-xs cursor-pointer"
                      >
                        {claimingSalaryId === rk.id
                          ? 'جاري تقديم الطلب...'
                          : `اطلب صرف الراتب الشهري (+$${formatUsdt(monthlySal)} USDT)`}
                      </button>
                    ) : !rk.allConditionsMet ? (
                      <p className="text-[10.5px] text-center text-slate-400 font-semibold">
                        أكمل متطلبات المنصب لتفعيل مكافأة الترقية والراتب الشهري
                      </p>
                    ) : null
                  ) : !rk.allConditionsMet ? (
                    <p className="text-[10.5px] text-center text-slate-400 font-semibold">
                      أكمل متطلبات المنصب لتفعيل مكافأة الترقية الفورية (+${formatUsdt(oneTime)} USDT)
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Milestone Bonuses Card */}
      {teamData?.milestones?.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-slate-900">
                مكافآت إنجازات الفريق التحفيزية
              </h3>
              <p className="text-[11px] text-slate-500">
                مكافآت إضافية عند دعوة أعضاء مباشرين نشطين (مستوى A)
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {teamData.milestones.map((ms) => {
              const pct = Math.min(
                100,
                Math.round((ms.currentProgress / ms.requiredActive) * 100)
              );
              return (
                <div
                  key={ms.key}
                  className="rounded-2xl bg-slate-50 border border-slate-200/75 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{ms.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                        الإنجاز: {ms.currentProgress} / {ms.requiredActive} أعضاء مباشرين نشطين
                      </p>
                    </div>

                    {ms.claimed ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>مستلمة</span>
                      </span>
                    ) : ms.canClaim ? (
                      <button
                        type="button"
                        disabled={claimingKey === ms.key}
                        onClick={() => handleClaimMilestone(ms.key)}
                        className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs font-extrabold shadow-2xs cursor-pointer"
                      >
                        {claimingKey === ms.key
                          ? 'جاري...'
                          : `استلم +$${formatUsdt(ms.reward)}`}
                      </button>
                    ) : (
                      <span className="ltr-num tabular-nums shrink-0 rounded-xl bg-white border border-slate-200 px-2.5 py-1 text-xs font-extrabold text-teal-700">
                        +${formatUsdt(ms.reward)}
                      </span>
                    )}
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3-Tier Commission Breakdown */}
      <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs">
        <p className="text-xs font-extrabold text-slate-800 mb-3">
          نسب عمولات الإحالة حسب المستوى
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-teal-50/80 border border-teal-200/70 p-2.5 text-center">
            <span className="text-[11px] font-bold text-teal-800">المستوى A</span>
            <p className="ltr-num tabular-nums text-base font-extrabold text-teal-700 mt-0.5">
              10%
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {teamData?.stats?.tier1Count ?? 0} أعضاء
            </p>
          </div>
          <div className="rounded-2xl bg-sky-50/80 border border-sky-200/70 p-2.5 text-center">
            <span className="text-[11px] font-bold text-sky-800">المستوى B</span>
            <p className="ltr-num tabular-nums text-base font-extrabold text-sky-700 mt-0.5">
              5%
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {teamData?.stats?.tier2Count ?? 0} أعضاء
            </p>
          </div>
          <div className="rounded-2xl bg-indigo-50/80 border border-indigo-200/70 p-2.5 text-center">
            <span className="text-[11px] font-bold text-indigo-800">المستوى C</span>
            <p className="ltr-num tabular-nums text-base font-extrabold text-indigo-700 mt-0.5">
              2%
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {teamData?.stats?.tier3Count ?? 0} أعضاء
            </p>
          </div>
        </div>
      </div>

      {/* Members vs Commissions Sub-tabs */}
      <div className="grid grid-cols-2 p-1 bg-white rounded-2xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => setSubTab('members')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'members'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          قائمة أعضاء الفريق
        </button>
        <button
          type="button"
          onClick={() => setSubTab('commissions')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'commissions'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          سجل العمولات
        </button>
      </div>

      {loading ? (
        <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          <span className="text-xs font-medium">جاري تحميل بيانات الفريق...</span>
        </div>
      ) : subTab === 'members' ? (
        <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'الكل' },
              { id: 1, label: 'مستوى A' },
              { id: 2, label: 'مستوى B' },
              { id: 3, label: 'مستوى C' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTierFilter(f.id)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  tierFilter === f.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {!filteredMembers.length ? (
            <div className="py-8 text-center">
              <p className="text-sm font-bold text-slate-700">لا يوجد أعضاء في هذا المستوى حالياً</p>
              <p className="text-xs text-slate-500 mt-1">
                انسخ رابط الإحالة وشاركه مع أصدقائك لبدء بناء فريقك
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredMembers.map((m) => (
                <div key={m.id} className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {m.tier === 1 ? 'A' : m.tier === 2 ? 'B' : 'C'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="ltr-num tabular-nums text-xs font-bold text-slate-900">
                          {m.maskedPhone}
                        </span>
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          <Crown className="w-2.5 h-2.5" />
                          الفئة A{m.vipLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        انضم في {formatShortDateAr(m.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <p className="text-[10px] text-slate-400">إجمالي الإيداع</p>
                    <p className="ltr-num tabular-nums text-xs font-extrabold text-slate-900">
                      ${formatUsdt(m.totalDeposits)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs">
          {!teamData?.commissions?.length ? (
            <div className="py-8 text-center">
              <p className="text-sm font-bold text-slate-700">لا توجد عمولات مسجلة بعد</p>
              <p className="text-xs text-slate-500 mt-1">
                ستظهر هنا كافة العمولات المضافة لرصيدك فور إيداع أعضاء فريقك
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {teamData.commissions.map((c) => (
                <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{c.reason}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      من العضو <span className="ltr-num">{c.sourcePhone}</span> •{' '}
                      {formatDateTimeAr(c.createdAt)}
                    </p>
                  </div>
                  <span className="ltr-num tabular-nums shrink-0 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                    +${formatUsdt(c.commissionAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Official Personal Invitation Landing Preview Modal */}
      {invitePreviewOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setInvitePreviewOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-[30px] bg-[#F4F7FB] p-5 space-y-4 shadow-2xl animate-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-extrabold text-slate-900">
                معاينة بطاقة الترشيح التي تظهر لمدعويك
              </h4>
              <button
                type="button"
                onClick={() => setInvitePreviewOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="rounded-[24px] p-4 text-white border border-[#F5D076]/45 space-y-2"
              style={{
                background: 'linear-gradient(140deg, #051322 0%, #0A2542 58%, #0D6E68 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5D076]/20 border border-[#F5D076]/45 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#F5D076]">
                  <Crown className="w-3 h-3" />
                  <span>بطاقة ترشيح رسمية معتمدة</span>
                </span>
                <span className="ltr-num text-[10.5px] font-bold text-teal-200">
                  #{1000 + (user?.id || 1)}
                </span>
              </div>
              <p className="text-xs font-extrabold leading-relaxed">
                تم ترشيحك للانضمام إلى كادر تقييم الضيافة في Arona Boost عبر{' '}
                <span className="text-[#F5D076]">
                  {user?.jobTitle || 'موظف رسمي'} (الفئة A{user?.vipLevel ?? 0})
                </span>
              </p>
              <p className="text-[11px] text-teal-100/90">
                كود الإحالة المباشر:{' '}
                <span className="ltr-num font-extrabold text-[#F5D076]">{inviteCode}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setInvitePreviewOpen(false);
                handleShare();
              }}
              className="w-full exec-primary-btn rounded-2xl py-3 text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#F5D076]" />
              <span>مشاركة رابط الترشيح الشخصي الآن</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
