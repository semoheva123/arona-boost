import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Check,
  Share2,
  Loader2,
  Crown,
  Gift,
  CheckCircle2,
  Clock,
  Volume2
} from 'lucide-react';
import { apiRequest, buildAppUrl, formatUsdt, formatShortDateAr, formatDateTimeAr } from '../api';

export default function TeamTab({ user, onUserUpdated, showToast }) {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('members'); // 'members' | 'commissions'
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | 1 | 2 | 3
  const [copiedKey, setCopiedKey] = useState(null);
  const [claimingKey, setClaimingKey] = useState(null);
  const [claimingSalaryId, setClaimingSalaryId] = useState(null);
  const [claimingPromoId, setClaimingPromoId] = useState(null);

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
  const referralUrl = buildAppUrl(`?ref=${inviteCode}`);
  const jobTitle = user?.jobTitle || ((user?.vipLevel ?? 0) > 0 ? 'موظف رسمي' : 'موظف متدرب');

  const copyText = async (text, key, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(msg);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      showToast('تعذر النسخ التلقائي', 'error');
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
    copyText(referralUrl, 'link', 'تم نسخ رابط الدعوة!');
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

  const actionableRanks = (teamData?.salaryProgram?.ranks || []).filter(
    (rk) =>
      rk.canClaim ||
      rk.canClaimPromotion ||
      rk.claimStatus === 'pending' ||
      rk.promotionClaimStatus === 'pending'
  );

  return (
    <div className="space-y-3.5 pt-2 animate-tab">
      {/* Clean Top Page Title (matches tashare8 pages-team-teamReport) */}
      <h1 className="font-display text-base font-extrabold text-[#07182B] text-center py-1">
        فريقي
      </h1>

      {/* 1. Clean White Identity Card (EXACT tashare8 pages-team-teamReport tab-a / tab-b) */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white shadow-xs"
            style={{
              background: 'linear-gradient(135deg, #07182B 0%, #0D7A72 100%)'
            }}
          >
            <span className="text-[9px] text-white/75 font-bold">المستوى</span>
            <span className="ltr-num font-display text-base font-extrabold text-[#F5D076]">
              A{user?.vipLevel ?? 0}
            </span>
          </div>

          <div className="min-w-0 space-y-1 text-xs">
            <p className="font-bold text-slate-600">
              الحساب:{' '}
              <span className="ltr-num font-extrabold text-[#07182B]">
                {user?.maskedPhone || user?.phone}
              </span>
            </p>
            <p className="font-bold text-slate-600">
              المنصب: <span className="font-extrabold text-[#0D7A72]">{jobTitle}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="rounded-full bg-[#EEF4F8] hover:bg-slate-200/80 text-[#07182B] p-2.5 shrink-0 cursor-pointer"
          title="مشاركة رابط الدعوة"
        >
          <Share2 className="w-4 h-4 text-[#0D7A72]" />
        </button>
      </div>

      {/* 2. Single-Line White Speaker Notice (tashare8 notice-box) */}
      <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-[0_2px_10px_rgba(7,24,43,0.04)] flex items-center gap-2.5">
        <Volume2 className="w-4 h-4 text-[#0D7A72] shrink-0" />
        <p className="text-xs font-semibold text-slate-600 truncate">
          عمولات الفريق الفورية: المستوى A (10%) • المستوى B (5%) • المستوى C (2%)
        </p>
      </div>

      {/* 3. Clean White Referral Code & Link Card (EXACT tashare8 refer card!) */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-3 divide-y divide-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs text-slate-500 font-semibold">رمز الدعوة: </span>
            <strong className="ltr-num text-sm font-extrabold text-[#07182B] tracking-wider">
              {inviteCode}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => copyText(inviteCode, 'code', 'تم نسخ رمز الدعوة')}
            className="rounded-lg bg-[#0D7A72] hover:bg-[#0A645D] text-white px-3.5 py-1.5 text-xs font-extrabold shrink-0 cursor-pointer inline-flex items-center gap-1"
          >
            {copiedKey === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>نسخ</span>
          </button>
        </div>

        <div className="pt-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-400 font-semibold">رابط الدعوة المباشر</p>
            <p className="ltr-num text-xs font-bold text-[#07182B] truncate mt-0.5">
              {referralUrl}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyText(referralUrl, 'link', 'تم نسخ رابط الدعوة')}
            className="rounded-lg bg-[#07182B] hover:bg-slate-800 text-[#F5D076] px-3.5 py-1.5 text-xs font-extrabold shrink-0 cursor-pointer inline-flex items-center gap-1"
          >
            {copiedKey === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>نسخ</span>
          </button>
        </div>
      </div>

      {/* 4. Clean White Team Data Overview Card (EXACT tashare8 نظرة عامة على بيانات الفريق) */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[13.5px] font-extrabold text-[#07182B]">
            نظرة عامة على بيانات الفريق
          </h2>
          <span className="text-[11px] font-bold text-[#0D7A72]">
            نشط: {teamData?.stats?.activeMembers ?? 0}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-[#F6F9FC] p-3 text-center">
            <p className="text-[11px] text-slate-500 font-semibold">تسجيل الفريق</p>
            <p className="ltr-num tabular-nums text-base font-extrabold text-[#07182B] mt-1">
              {teamData?.stats?.totalMembers ?? 0}
            </p>
          </div>

          <div className="rounded-xl bg-[#F6F9FC] p-3 text-center">
            <p className="text-[11px] text-slate-500 font-semibold">إجمالي عمولات الفريق</p>
            <p className="ltr-num tabular-nums text-base font-extrabold text-[#0D7A72] mt-1">
              +${formatUsdt(teamData?.stats?.totalTeamEarnings ?? user?.totalTeamEarnings)}
            </p>
          </div>
        </div>

        {/* 3-Tier Cards (A / B / C) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { id: 1, code: 'A', rate: '10%', count: teamData?.stats?.tier1Count ?? 0 },
            { id: 2, code: 'B', rate: '5%', count: teamData?.stats?.tier2Count ?? 0 },
            { id: 3, code: 'C', rate: '2%', count: teamData?.stats?.tier3Count ?? 0 }
          ].map((tItem) => {
            const active = tierFilter === tItem.id;
            return (
              <button
                key={tItem.id}
                type="button"
                onClick={() => {
                  setSubTab('members');
                  setTierFilter(active ? 'all' : tItem.id);
                }}
                className={`rounded-xl p-2.5 text-center transition-colors cursor-pointer border ${
                  active
                    ? 'bg-[#07182B] text-white border-[#07182B]'
                    : 'bg-[#F6F9FC] text-[#07182B] border-transparent hover:border-slate-200'
                }`}
              >
                <span
                  className={`text-xs font-extrabold ${
                    active ? 'text-[#F5D076]' : 'text-[#0D7A72]'
                  }`}
                >
                  الفريق {tItem.code} ({tItem.rate})
                </span>
                <p className="ltr-num tabular-nums text-xs font-bold mt-1 opacity-90">
                  {tItem.count} عضو
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Compact Next Salary Progress + Claimable Rewards (only shown cleanly without clutter) */}
      {(teamData?.analytics?.nextSalaryProgress || actionableRanks.length > 0) && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-3">
          {teamData?.analytics?.nextSalaryProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#07182B]">
                  الهدف القادم: {teamData.analytics.nextSalaryProgress.rankTitle}
                </span>
                <span className="ltr-num font-extrabold text-[#0D7A72]">
                  {teamData.analytics.nextSalaryProgress.progressPct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0D7A72] transition-all"
                  style={{ width: `${teamData.analytics.nextSalaryProgress.progressPct}%` }}
                />
              </div>
            </div>
          )}

          {actionableRanks.map((rk) => (
            <div
              key={rk.id}
              className="rounded-xl bg-[#F6F9FC] p-3 flex items-center justify-between gap-2 text-xs"
            >
              <span className="font-extrabold text-[#07182B]">{rk.title}</span>
              <div className="flex items-center gap-1.5">
                {rk.canClaimPromotion && (
                  <button
                    type="button"
                    disabled={claimingPromoId === rk.id}
                    onClick={() => handleClaimPromotionBonus(rk.id)}
                    className="rounded-lg bg-[#0D7A72] text-white px-3 py-1.5 font-extrabold cursor-pointer"
                  >
                    {claimingPromoId === rk.id
                      ? '...'
                      : `مكافأة +$${formatUsdt(rk.oneTimeBonusUsdt)}`}
                  </button>
                )}
                {rk.canClaim && (
                  <button
                    type="button"
                    disabled={claimingSalaryId === rk.id}
                    onClick={() => handleClaimSalary(rk.id)}
                    className="rounded-lg bg-[#07182B] text-[#F5D076] px-3 py-1.5 font-extrabold cursor-pointer"
                  >
                    {claimingSalaryId === rk.id
                      ? '...'
                      : `راتب +$${formatUsdt(rk.monthlySalaryUsdt)}`}
                  </button>
                )}
                {(rk.claimStatus === 'pending' || rk.promotionClaimStatus === 'pending') && (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    قيد المراجعة
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Claimable Milestones (if any exist) */}
      {teamData?.milestones?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-2.5">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#D49B2A]" />
            <h3 className="font-display text-[13px] font-extrabold text-[#07182B]">
              مكافآت نشاط الدعوة المباشرة
            </h3>
          </div>

          <div className="space-y-2">
            {teamData.milestones.map((ms) => (
              <div
                key={ms.key}
                className="rounded-xl bg-[#F6F9FC] px-3 py-2.5 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <p className="font-bold text-[#07182B]">{ms.title}</p>
                  <p className="text-[10.5px] text-slate-500 ltr-num">
                    {ms.currentProgress} / {ms.requiredActive} نشط
                  </p>
                </div>

                {ms.claimed ? (
                  <span className="inline-flex items-center gap-1 text-[#0D7A72] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    مستلمة
                  </span>
                ) : ms.canClaim ? (
                  <button
                    type="button"
                    disabled={claimingKey === ms.key}
                    onClick={() => handleClaimMilestone(ms.key)}
                    className="rounded-lg bg-[#0D7A72] text-white px-3 py-1.5 font-extrabold cursor-pointer"
                  >
                    استلام +${formatUsdt(ms.reward)}
                  </button>
                ) : (
                  <span className="ltr-num font-extrabold text-[#0D7A72]">
                    +${formatUsdt(ms.reward)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Clean Team List & Commissions Switch (tashare8 قائمة الفريق) */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-3">
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F1F5F9] p-1">
          <button
            type="button"
            onClick={() => setSubTab('members')}
            className={`py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
              subTab === 'members' ? 'bg-white text-[#07182B] shadow-2xs' : 'text-slate-500'
            }`}
          >
            قائمة الفريق ({filteredMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('commissions')}
            className={`py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
              subTab === 'commissions' ? 'bg-white text-[#07182B] shadow-2xs' : 'text-slate-500'
            }`}
          >
            سجل العمولات
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-[#0D7A72]" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : subTab === 'members' ? (
          !filteredMembers.length ? (
            <p className="py-8 text-center text-xs font-semibold text-slate-400">
              لا توجد بيانات في هذا القسم حالياً
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF4F8] text-[#07182B] font-extrabold text-xs flex items-center justify-center shrink-0">
                      {m.tier === 1 ? 'A' : m.tier === 2 ? 'B' : 'C'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="ltr-num text-xs font-extrabold text-[#07182B]">
                          {m.maskedPhone}
                        </span>
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          <Crown className="w-2.5 h-2.5" />
                          A{m.vipLevel}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        {formatShortDateAr(m.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <p className="ltr-num text-xs font-extrabold text-[#0D7A72]">
                      ${formatUsdt(m.totalDeposits)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : !teamData?.commissions?.length ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-400">
            لا توجد عمولات مسجلة بعد
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {teamData.commissions.map((c) => (
              <div
                key={c.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#07182B] truncate">{c.reason}</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    {formatDateTimeAr(c.createdAt)}
                  </p>
                </div>
                <span className="ltr-num text-xs font-extrabold text-[#0D7A72] shrink-0">
                  +${formatUsdt(c.commissionAmount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
