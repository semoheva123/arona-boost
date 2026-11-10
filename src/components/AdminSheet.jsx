import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Shield,
  Check,
  Ban,
  Loader2,
  Save,
  Search,
  Copy,
  UserCog,
  TrendingUp,
  Clock,
  Lock,
  Unlock,
  Bell,
  Send,
  Users,
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  Zap,
  Briefcase,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiRequest, formatUsdt, formatDateTimeAr } from '../api';
import { validatePhoneNumber } from '../phoneValidator';
import AdminRedEnvelopePanel from './AdminRedEnvelopePanel';

export default function AdminSheet({
  isOpen,
  onClose,
  showToast,
  onRefreshUser
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('summary'); // 'summary' | 'transactions' | 'users' | 'settings'

  // Filters & search
  const [txFilter, setTxFilter] = useState('pending');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // User management inputs
  const [balanceDelta, setBalanceDelta] = useState('');
  const [balanceNote, setBalanceNote] = useState('');
  const [targetVip, setTargetVip] = useState(0);
  const [spinsDelta, setSpinsDelta] = useState('1');
  const [resetPassVal, setResetPassVal] = useState('');
  const [resetPinVal, setResetPinVal] = useState('');
  const [managingUser, setManagingUser] = useState(false);
  const [verifyingChainId, setVerifyingChainId] = useState(null);

  // Platform settings & dynamic VIP editor
  const [form, setForm] = useState({
    trc20_address: '',
    bep20_address: '',
    whatsapp_number: '',
    live_ticker_enabled: 'true',
    blockchain_auto_approve_verified: 'true',
    strict_blockchain_txid: 'true',
    auto_approve_deposits: 'false',
    auto_approve_withdrawals: 'false',
    min_deposit: '10',
    min_withdraw: '5',
    daily_withdraw_limit: '2',
    withdraw_fee_percent: '10',
    guarantee_duration_days: '365',
    wheel_min_deposit: '20',
    wheel_referrer_spin: 'true',
    salary_system_enabled: 'true',
    salary_require_approval: 'true'
  });
  const [editableVips, setEditableVips] = useState([]);
  const [editableVaultPlans, setEditableVaultPlans] = useState([]);
  const [editableWheelSegments, setEditableWheelSegments] = useState([]);
  const [editableSalaryRanks, setEditableSalaryRanks] = useState([]);
  const [withdrawPresetsText, setWithdrawPresetsText] = useState('20, 80, 200, 800, 2000, 5000');
  const [announcementsText, setAnnouncementsText] = useState('');

  // New Flash Mission Creator Form
  const [fmTitle, setFmTitle] = useState('');
  const [fmLocation, setFmLocation] = useState('');
  const [fmReward, setFmReward] = useState('2.50');
  const [fmMinVip, setFmMinVip] = useState('2');
  const [fmMaxClaims, setFmMaxClaims] = useState('20');
  const [fmHours, setFmHours] = useState('48');
  const [creatingFm, setCreatingFm] = useState(false);

  // Broadcast & Private Notifications composer state
  const [notifScope, setNotifScope] = useState('broadcast'); // 'broadcast' | 'private'
  const [notifTarget, setNotifTarget] = useState('');
  const [notifType, setNotifType] = useState('info'); // 'info' | 'reward' | 'success' | 'warning'
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Executive Concierge Admin Support Desk state
  const [supportTickets, setSupportTickets] = useState([]);
  const [activeSupportId, setActiveSupportId] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingSupportReply, setSendingSupportReply] = useState(false);

  // Admin Smart Phone Inspector state
  const [probePhone, setProbePhone] = useState('');
  const [probeResult, setProbeResult] = useState(null);
  const [probingPhone, setProbingPhone] = useState(false);

  const handleAdminProbePhone = async (e) => {
    e.preventDefault();
    if (!probePhone.trim()) return;
    setProbingPhone(true);
    try {
      const res = await apiRequest('/api/admin/validate-phone', {
        method: 'POST',
        body: { phone: probePhone.trim(), countryCode: 'LOCAL' }
      });
      setProbeResult(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProbingPhone(false);
    }
  };

  const loadSupportTickets = useCallback(async () => {
    try {
      const res = await apiRequest('/api/admin/support');
      setSupportTickets(res.tickets || []);
    } catch {
      // ignore
    }
  }, []);

  const loadOverview = useCallback(
    async (searchTerm = userSearch, filterVal = txFilter) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          search: searchTerm,
          txFilter: filterVal
        }).toString();
        const res = await apiRequest(`/api/admin/overview?${qs}`);
        setData(res);
        if (res.settings) {
          setForm({
            trc20_address: res.settings.trc20_address || '',
            bep20_address: res.settings.bep20_address || '',
            whatsapp_number: res.settings.whatsapp_number || '963990000000',
            live_ticker_enabled: res.settings.live_ticker_enabled ?? 'true',
            blockchain_auto_approve_verified:
              res.settings.blockchain_auto_approve_verified ?? 'true',
            strict_blockchain_txid:
              res.settings.strict_blockchain_txid ?? 'true',
            auto_approve_deposits: res.settings.auto_approve_deposits || 'false',
            auto_approve_withdrawals: res.settings.auto_approve_withdrawals || 'false',
            min_deposit: res.settings.min_deposit || '10',
            min_withdraw: res.settings.min_withdraw || '5',
            daily_withdraw_limit: res.settings.daily_withdraw_limit || '2',
            withdraw_fee_percent: res.settings.withdraw_fee_percent || '10',
            guarantee_duration_days: res.settings.guarantee_duration_days || '365',
            wheel_min_deposit: res.settings.wheel_min_deposit || '20',
            wheel_referrer_spin: res.settings.wheel_referrer_spin ?? 'true',
            salary_system_enabled: res.settings.salary_system_enabled ?? 'true',
            salary_require_approval: res.settings.salary_require_approval ?? 'true'
          });
        }
        if (res.withdrawPresets) {
          setWithdrawPresetsText(res.withdrawPresets.join(', '));
        }
        if (res.vipLevels) {
          setEditableVips(res.vipLevels);
        }
        if (res.vaultPlans) {
          setEditableVaultPlans(res.vaultPlans);
        }
        if (res.wheelSegments) {
          setEditableWheelSegments(res.wheelSegments);
        }
        if (res.salaryRanks) {
          setEditableSalaryRanks(res.salaryRanks);
        }
        if (res.announcements) {
          setAnnouncementsText(res.announcements.join('\n'));
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast, txFilter, userSearch]
  );

  useEffect(() => {
    if (isOpen) {
      loadOverview(userSearch, txFilter);
      loadSupportTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, txFilter]);

  if (!isOpen) return null;

  const handleCopy = async (txt, label) => {
    try {
      await navigator.clipboard.writeText(txt);
      showToast(`تم نسخ ${label}`);
    } catch {
      showToast('تعذر النسخ التلقائي', 'error');
    }
  };

  const handleSearchUsers = (e) => {
    e.preventDefault();
    loadOverview(userSearch, txFilter);
  };

  const handleDecision = async (id, decision) => {
    try {
      const res = await apiRequest(`/api/admin/transactions/${id}/decision`, {
        method: 'POST',
        body: { decision }
      });
      showToast(res.message);
      await loadOverview(userSearch, txFilter);
      onRefreshUser();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openManageUser = (u) => {
    setSelectedUser(u);
    setTargetVip(u.vipLevel);
    setBalanceDelta('');
    setBalanceNote('');
    setResetPassVal('');
    setResetPinVal('');
  };

  const runUserAction = async (action, extraBody = {}) => {
    if (!selectedUser) return;
    setManagingUser(true);
    try {
      const res = await apiRequest(`/api/admin/users/${selectedUser.id}/manage`, {
        method: 'POST',
        body: { action, ...extraBody }
      });
      showToast(res.message);
      setSelectedUser(null);
      await loadOverview(userSearch, txFilter);
      onRefreshUser();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setManagingUser(false);
    }
  };

  const updateVipField = (idx, field, value) => {
    setEditableVips((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const announcementsArr = announcementsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: {
          ...form,
          vipLevels: editableVips,
          vaultPlans: editableVaultPlans,
          wheelSegments: editableWheelSegments,
          salaryRanks: editableSalaryRanks,
          withdrawPresets: withdrawPresetsText
            .split(/[,،\s]+/)
            .map((v) => Number(v.trim()))
            .filter((n) => !isNaN(n) && n > 0),
          announcements: announcementsArr
        }
      });
      showToast(res.message);
      await loadOverview(userSearch, txFilter);
      onRefreshUser();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) {
      showToast('يرجى إدخال عنوان الإشعار ونص الرسالة', 'error');
      return;
    }
    if (notifScope === 'private' && !notifTarget.trim()) {
      showToast('يرجى إدخال رقم هاتف العضو أو اختياره من القائمة', 'error');
      return;
    }
    setSendingNotif(true);
    try {
      const res = await apiRequest('/api/admin/notifications/send', {
        method: 'POST',
        body: {
          scope: notifScope,
          target: notifTarget.trim(),
          type: notifType,
          title: notifTitle.trim(),
          body: notifBody.trim()
        }
      });
      showToast(res.message);
      setNotifTitle('');
      setNotifBody('');
      await loadOverview(userSearch, txFilter);
      onRefreshUser();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSendingNotif(false);
    }
  };

  const openPrivateMessageForUser = (u) => {
    setNotifScope('private');
    setNotifTarget(u.phone);
    setSelectedUser(null);
    setTab('notifications');
  };

  const handleVerifyBlockchain = async (txId) => {
    setVerifyingChainId(txId);
    try {
      const res = await apiRequest(`/api/admin/transactions/${txId}/verify-chain`, {
        method: 'POST'
      });
      showToast(res.message);
      await loadOverview(userSearch, txFilter);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setVerifyingChainId(null);
    }
  };

  const handleSalaryDecision = async (claimId, decision) => {
    try {
      const res = await apiRequest(`/api/admin/salaries/${claimId}/decision`, {
        method: 'POST',
        body: { decision }
      });
      showToast(res.message);
      await loadOverview(userSearch, txFilter);
      onRefreshUser();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handlePromotionDecision = async (claimId, decision) => {
    try {
      const res = await apiRequest(`/api/admin/promotions/${claimId}/decision`, {
        method: 'POST',
        body: { decision }
      });
      showToast(res.message);
      await loadOverview(userSearch, txFilter);
      onRefreshUser();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateFlashMission = async (e) => {
    e.preventDefault();
    if (!fmTitle.trim()) {
      showToast('يرجى إدخال عنوان المهمة المميزة', 'error');
      return;
    }
    setCreatingFm(true);
    try {
      const res = await apiRequest('/api/admin/flash-missions', {
        method: 'POST',
        body: {
          title: fmTitle.trim(),
          location: fmLocation.trim(),
          reward: Number(fmReward || 2),
          minVipLevel: Number(fmMinVip || 1),
          maxClaims: Number(fmMaxClaims || 20),
          durationHours: Number(fmHours || 48)
        }
      });
      showToast(res.message);
      setFmTitle('');
      setFmLocation('');
      await loadOverview(userSearch, txFilter);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreatingFm(false);
    }
  };

  const handleDeleteFlashMission = async (id) => {
    try {
      const res = await apiRequest(`/api/admin/flash-missions/${id}`, {
        method: 'DELETE'
      });
      showToast(res.message);
      await loadOverview(userSearch, txFilter);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateSalaryRankField = (idx, field, val) => {
    setEditableSalaryRanks((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const addSalaryRank = () => {
    setEditableSalaryRanks((prev) => [
      ...prev,
      {
        id: `rank_custom_${Date.now()}`,
        title: `رتبة قيادية #${prev.length + 1}`,
        monthlySalaryUsdt: 100,
        minUserVip: 2,
        minActiveDirect: 15,
        minTotalActiveTeam: 40,
        minTeamDepositsUsdt: 1200
      }
    ]);
  };

  const removeSalaryRank = (idx) => {
    if (editableSalaryRanks.length <= 1) return;
    setEditableSalaryRanks((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateVaultField = (idx, field, val) => {
    setEditableVaultPlans((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const updateWheelField = (idx, field, val) => {
    setEditableWheelSegments((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const totals = data?.totals || {};
  const pendingTotal =
    (totals.pendingDepositsCount || 0) +
    (totals.pendingWithdrawalsCount || 0) +
    (totals.pendingSalariesCount || 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] h-[94dvh] flex flex-col rounded-t-3xl bg-[#F5F8FC] shadow-2xl animate-sheet overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Fixed Header */}
        <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-900">
                لوحة الإدارة الشاملة
              </h3>
              <p className="text-[11px] text-slate-500">
                تحكم كامل بالسيولة والأعضاء والخطط
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-slate-200 px-2 py-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            {[
              { id: 'summary', label: 'السيولة' },
              {
                id: 'transactions',
                label: pendingTotal > 0 ? `المعاملات (${pendingTotal})` : 'المعاملات'
              },
              { id: 'users', label: 'الأعضاء' },
              {
                id: 'support',
                label:
                  supportTickets.filter((s) => s.status === 'open').length > 0
                    ? `المساندة (${supportTickets.filter((s) => s.status === 'open').length})`
                    : 'المساندة'
              },
              { id: 'growth', label: 'الرواتب والمزايا' },
              { id: 'notifications', label: 'الإشعارات' },
              { id: 'settings', label: 'الإعدادات' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 py-2 px-2.5 rounded-xl text-[10.5px] font-extrabold transition-all cursor-pointer ${
                  tab === t.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && !data ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : tab === 'summary' ? (
            /* TAB 1: DAILY & TOTAL LIQUIDITY OVERVIEW */
            <div className="space-y-3.5">
              {/* Today's Net Liquidity Card */}
              <div className="rounded-3xl bg-slate-900 text-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>صافي السيولة اليومي (اليوم)</span>
                  </span>
                  <span
                    className={`ltr-num tabular-nums text-base font-extrabold ${
                      (totals.todayNetLiquidity || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(totals.todayNetLiquidity || 0) >= 0 ? '+' : ''}$
                    {formatUsdt(totals.todayNetLiquidity)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs">
                  <div className="rounded-2xl bg-white/8 p-2.5">
                    <p className="text-[10px] text-slate-300">إيداعات اليوم المعتمدة</p>
                    <p className="ltr-num tabular-nums text-sm font-extrabold text-emerald-400 mt-0.5">
                      +${formatUsdt(totals.todayDeposits)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-2.5">
                    <p className="text-[10px] text-slate-300">مسحوبات اليوم المحولة</p>
                    <p className="ltr-num tabular-nums text-sm font-extrabold text-amber-300 mt-0.5">
                      -${formatUsdt(totals.todayWithdrawals)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pending Requests Action Alert */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTxFilter('pending');
                    setTab('transactions');
                  }}
                  className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-right cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="tabular-nums text-lg font-extrabold text-amber-800">
                      {totals.pendingDepositsCount ?? 0}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-amber-900 mt-1">إيداعات قيد المراجعة</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTxFilter('pending');
                    setTab('transactions');
                  }}
                  className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-right cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <Clock className="w-4 h-4 text-rose-600" />
                    <span className="tabular-nums text-lg font-extrabold text-rose-800">
                      {totals.pendingWithdrawalsCount ?? 0}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-rose-900 mt-1">مسحوبات قيد التحويل</p>
                </button>
              </div>

              {/* Cumulative Platform KPIs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5">
                  <p className="text-[11px] text-slate-500">إجمالي الأعضاء / العقود الموثقة</p>
                  <p className="tabular-nums text-base font-extrabold text-slate-900 mt-0.5">
                    {totals.totalUsers ?? 0}{' '}
                    <span className="text-xs text-teal-600">({totals.paidVipUsers ?? 0} موثق)</span>
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5">
                  <p className="text-[11px] text-slate-500">مجموع أرصدة الأعضاء</p>
                  <p className="ltr-num tabular-nums text-base font-extrabold text-slate-900 mt-0.5">
                    ${formatUsdt(totals.totalBalances)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5">
                  <p className="text-[11px] text-slate-500">إجمالي الإيداعات الكلي</p>
                  <p className="ltr-num tabular-nums text-base font-extrabold text-emerald-600 mt-0.5">
                    ${formatUsdt(totals.totalDeposits)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5">
                  <p className="text-[11px] text-slate-500">إجمالي المسحوبات الكلي</p>
                  <p className="ltr-num tabular-nums text-base font-extrabold text-amber-600 mt-0.5">
                    ${formatUsdt(totals.totalWithdrawals)}
                  </p>
                </div>
              </div>
            </div>
          ) : tab === 'transactions' ? (
            /* TAB 2: TRANSACTIONS REVIEW, REAL BLOCKCHAIN VERIFIER & SALARY CLAIMS */
            <div className="space-y-3">
              {/* Pending Promotion Bonus Claims Queue */}
              {data?.promotionClaims?.some((p) => p.status === 'pending') && (
                <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-3 space-y-2">
                  <p className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>طلبات مكافآت ترقية المناصب (رحلة النجوم)</span>
                  </p>
                  {data.promotionClaims
                    .filter((p) => p.status === 'pending')
                    .map((pc) => (
                      <div
                        key={pc.id}
                        className="rounded-xl bg-white border border-amber-200/80 p-2.5 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">
                            {pc.rankTitle} •{' '}
                            <span className="ltr-num text-emerald-700">
                              +${formatUsdt(pc.bonusAmount)}
                            </span>
                            {pc.physicalGift ? ` + 🎁 ${pc.physicalGift}` : ''}
                          </p>
                          <p className="text-[10.5px] text-slate-500">
                            العضو: <strong className="ltr-num">{pc.userPhone}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePromotionDecision(pc.id, 'approve')}
                            className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-[10.5px] font-bold cursor-pointer"
                          >
                            اعتماد وصرف
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromotionDecision(pc.id, 'reject')}
                            className="rounded-lg bg-rose-600 text-white px-2.5 py-1 text-[10.5px] font-bold cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Pending Monthly Salary Claims Queue */}
              {data?.salaryClaims?.some((s) => s.status === 'pending') && (
                <div className="rounded-2xl bg-indigo-50/80 border border-indigo-200 p-3 space-y-2">
                  <p className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    <span>طلبات صرف الرواتب الشهرية قيد المراجعة</span>
                  </p>
                  {data.salaryClaims
                    .filter((s) => s.status === 'pending')
                    .map((sc) => (
                      <div
                        key={sc.id}
                        className="rounded-xl bg-white border border-indigo-200/80 p-2.5 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">
                            {sc.rankTitle} •{' '}
                            <span className="ltr-num text-emerald-700">
                              ${formatUsdt(sc.amount)}
                            </span>
                          </p>
                          <p className="text-[10.5px] text-slate-500">
                            العضو: <strong className="ltr-num">{sc.userPhone}</strong> • شهر{' '}
                            {sc.periodMonth}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSalaryDecision(sc.id, 'approve')}
                            className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-[10.5px] font-bold cursor-pointer"
                          >
                            صرف
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSalaryDecision(sc.id, 'reject')}
                            className="rounded-lg bg-rose-600 text-white px-2.5 py-1 text-[10.5px] font-bold cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'pending', label: 'قيد المراجعة' },
                  { id: 'all', label: 'الكل' },
                  { id: 'deposit', label: 'الإيداعات' },
                  { id: 'withdraw', label: 'المسحوبات' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTxFilter(f.id)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      txFilter === f.id
                        ? 'bg-teal-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {!data?.transactions?.length ? (
                <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-xs text-slate-500">
                  لا توجد معاملات مطابقة لهذا الفلتر حالياً
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.transactions.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl bg-white border border-slate-200/90 p-3.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                                t.type === 'deposit'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {t.type === 'deposit' ? 'إيداع' : 'سحب'} • {t.network}
                            </span>
                            <span className="ltr-num text-xs font-extrabold text-slate-900">
                              ${formatUsdt(t.amount)} USDT
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            العضو: <strong className="ltr-num text-slate-800">{t.userPhone}</strong>{' '}
                            • {formatDateTimeAr(t.createdAt)}
                          </p>
                        </div>

                        {t.status === 'pending' ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDecision(t.id, 'approve')}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>اعتماد</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(t.id, 'reject')}
                              className="inline-flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                              t.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {t.status === 'completed' ? 'مكتمل' : 'مرفوض'}
                          </span>
                        )}
                      </div>

                      {/* Copyable TXID or Withdrawal Wallet */}
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/70 px-2.5 py-1.5 text-[11px]">
                        <span className="truncate ltr-num font-mono text-slate-700">
                          {t.type === 'deposit' ? `TXID: ${t.walletOrTxid}` : `Wallet: ${t.walletOrTxid}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              t.walletOrTxid,
                              t.type === 'deposit' ? 'معرّف TXID' : 'عنوان المحفظة'
                            )
                          }
                          className="shrink-0 text-teal-700 hover:text-teal-900 p-1 cursor-pointer"
                          title="نسخ"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Real Automated Blockchain Verifier Panel (for Deposits) */}
                      {t.type === 'deposit' && (
                        <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 p-2.5 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                                t.chainStatus === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.chainStatus === 'mismatch'
                                  ? 'bg-amber-100 text-amber-900'
                                  : t.chainStatus === 'not_found' ||
                                    t.chainStatus === 'invalid_format'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {t.chainStatus === 'verified'
                                ? '✅ مؤكد ومطابق على البلوكتشين'
                                : t.chainStatus === 'mismatch'
                                ? '⚠️ تنبيه اختلاف بيانات على الشبكة'
                                : t.chainStatus === 'not_found'
                                ? '❌ غير موجود على الشبكة'
                                : t.chainStatus === 'invalid_format'
                                ? '⚠️ صيغة Hash غير مطابقة'
                                : 'لم يُفحص بعد'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {t.chainDetails?.explorerUrl && (
                                <a
                                  href={t.chainDetails.explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-700 hover:underline"
                                >
                                  <span>{t.network === 'BEP20' ? 'BscScan' : 'TronScan'}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                disabled={verifyingChainId === t.id}
                                onClick={() => handleVerifyBlockchain(t.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-2 py-1 text-[10px] font-bold cursor-pointer"
                              >
                                <RefreshCw
                                  className={`w-2.5 h-2.5 ${
                                    verifyingChainId === t.id ? 'animate-spin' : ''
                                  }`}
                                />
                                <span>فحص البلوكتشين</span>
                              </button>
                            </div>
                          </div>

                          {t.chainDetails?.summaryAr && (
                            <p className="text-[10.5px] text-slate-600 leading-relaxed">
                              {t.chainDetails.summaryAr}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === 'users' ? (
            /* TAB 3: USER SEARCH, SMART PHONE VALIDATOR & FULL ACCOUNT MANAGEMENT */
            <div className="space-y-3">
              {/* Smart Telecom & Fake-Phone Inspector Tool */}
              <form
                onSubmit={handleAdminProbePhone}
                className="rounded-2xl bg-white border border-slate-200 p-3 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                    <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                    <span>فاحص صحة أرقام الهواتف والشبكات الذكي</span>
                  </span>
                  {probeResult && (
                    <button
                      type="button"
                      onClick={() => {
                        setProbePhone('');
                        setProbeResult(null);
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      مسح
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={probePhone}
                    onChange={(e) => setProbePhone(e.target.value)}
                    placeholder="أدخل أي رقم للفحص (مثال: +963991234567 أو 099...)"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-teal-600 ltr-num"
                  />
                  <button
                    type="submit"
                    disabled={probingPhone}
                    className="shrink-0 rounded-xl bg-[#081E36] hover:bg-slate-800 text-[#F5D076] px-3 py-2 text-xs font-extrabold cursor-pointer"
                  >
                    {probingPhone ? 'فحص...' : 'فحص الرقم'}
                  </button>
                </div>

                {probeResult && (
                  <div
                    className={`rounded-xl p-2.5 text-[11px] space-y-1 ${
                      probeResult.valid
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-extrabold">
                      <span className="inline-flex items-center gap-1">
                        {probeResult.valid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        <span>
                          {probeResult.valid ? probeResult.summaryAr : 'رقم غير صحيح / مرفوض'}
                        </span>
                      </span>
                      {probeResult.e164 && (
                        <span className="ltr-num text-[10.5px]">{probeResult.e164}</span>
                      )}
                    </div>
                    {!probeResult.valid && <p className="font-semibold">{probeResult.error}</p>}
                    {probeResult.registeredAccount && (
                      <p className="text-[10.5px] font-bold text-slate-700 pt-1 border-t border-black/10">
                        مسجل في المنصة: حساب #{1000 + probeResult.registeredAccount.id} (الفئة A
                        {probeResult.registeredAccount.vipLevel}) • رصيد $
                        {formatUsdt(probeResult.registeredAccount.balance)}
                      </p>
                    )}
                  </div>
                )}
              </form>

              <form onSubmit={handleSearchUsers} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="ابحث برقم الهاتف أو رمز الدعوة..."
                    className="w-full rounded-2xl border border-slate-200 bg-white pr-9 pl-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 text-white px-4 py-2.5 text-xs font-bold cursor-pointer"
                >
                  بحث
                </button>
              </form>

              {/* Selected User Management Drawer */}
              {selectedUser && (
                <div className="rounded-3xl bg-white border-2 border-teal-600 p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 ltr-num">
                        {selectedUser.phone}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        الرصيد: <strong>${formatUsdt(selectedUser.balance)}</strong> • VIP{' '}
                        {selectedUser.vipLevel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      إغلاق ✕
                    </button>
                  </div>

                  {/* 1. Manual Credit / Deduct Balance */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">
                      شحن أو خصم رصيد يدوياً (مثال: 50 للشحن أو -25 للخصم)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={balanceDelta}
                        onChange={(e) => setBalanceDelta(e.target.value)}
                        placeholder="+50 أو -20"
                        className="w-28 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold ltr-num"
                      />
                      <input
                        type="text"
                        value={balanceNote}
                        onChange={(e) => setBalanceNote(e.target.value)}
                        placeholder="سبب التعديل (اختياري)"
                        className="flex-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs"
                      />
                      <button
                        type="button"
                        disabled={managingUser || !balanceDelta}
                        onClick={() =>
                          runUserAction('adjust_balance', {
                            delta: Number(balanceDelta),
                            note: balanceNote
                          })
                        }
                        className="rounded-xl bg-teal-600 text-white px-3 py-2 text-xs font-bold cursor-pointer"
                      >
                        تنفيذ
                      </button>
                    </div>
                  </div>

                  {/* 2. Change Corporate Grade */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-700">تغيير درجة العقد:</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={targetVip}
                        onChange={(e) => setTargetVip(Number(e.target.value))}
                        className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold"
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            الفئة A{lvl}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={managingUser}
                        onClick={() => runUserAction('set_vip', { vipLevel: targetVip })}
                        className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-bold cursor-pointer"
                      >
                        حفظ الدرجة
                      </button>
                    </div>
                  </div>

                  {/* 2b. Gift / Adjust Lucky Wheel Spins */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-700">
                      منح لفات عجلة الحظ (رصيده: {selectedUser.spinCredits ?? 0})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={spinsDelta}
                        onChange={(e) => setSpinsDelta(e.target.value)}
                        className="w-16 rounded-xl border border-slate-200 px-2 py-1 text-xs font-bold ltr-num text-center"
                      />
                      <button
                        type="button"
                        disabled={managingUser || !Number(spinsDelta)}
                        onClick={() =>
                          runUserAction('adjust_spins', { spins: Number(spinsDelta) })
                        }
                        className="rounded-xl bg-amber-500 text-slate-950 px-2.5 py-1.5 text-[11px] font-extrabold cursor-pointer"
                      >
                        منح 🎡
                      </button>
                    </div>
                  </div>

                  {/* 3. Reset Password / Reset PIN */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={resetPassVal}
                        onChange={(e) => setResetPassVal(e.target.value)}
                        placeholder="كلمة مرور جديدة"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-2 py-1.5 text-[11px]"
                      />
                      <button
                        type="button"
                        disabled={managingUser || resetPassVal.length < 4}
                        onClick={() =>
                          runUserAction('reset_password', { newPassword: resetPassVal })
                        }
                        className="rounded-xl bg-indigo-600 text-white px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
                      >
                        تعيين
                      </button>
                    </div>

                    <div className="flex gap-1">
                      <input
                        type="text"
                        maxLength={6}
                        value={resetPinVal}
                        onChange={(e) => setResetPinVal(e.target.value)}
                        placeholder="PIN جديد (4 أرقام)"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-2 py-1.5 text-[11px] ltr-num"
                      />
                      <button
                        type="button"
                        disabled={managingUser || resetPinVal.length < 4}
                        onClick={() => runUserAction('reset_pin', { newPin: resetPinVal })}
                        className="rounded-xl bg-amber-600 text-white px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
                      >
                        PIN
                      </button>
                    </div>
                  </div>

                  {/* Direct Private Notification Shortcut */}
                  <button
                    type="button"
                    onClick={() => openPrivateMessageForUser(selectedUser)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 py-2 text-xs font-extrabold hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-teal-600" />
                    <span>إرسال إشعار خاص مباشر لهذا العضو</span>
                  </button>

                  {/* 4. Ban / Unban Account */}
                  {!selectedUser.isAdmin && (
                    <button
                      type="button"
                      disabled={managingUser}
                      onClick={() => runUserAction('toggle_ban')}
                      className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold cursor-pointer ${
                        selectedUser.isBanned
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {selectedUser.isBanned ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>إلغاء تجميد الحساب</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>تجميد / إيقاف هذا الحساب</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Users List */}
              <div className="space-y-2">
                {data?.users?.map((u) => {
                  const pCheck = validatePhoneNumber(u.phone, 'LOCAL');
                  return (
                    <div
                      key={u.id}
                      className="rounded-2xl bg-white border border-slate-200/85 p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="ltr-num text-xs font-extrabold text-slate-900">
                            {u.phone}
                          </span>
                          <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            الفئة A{u.vipLevel}
                          </span>
                          {u.isAdmin ? (
                            <span className="rounded-md bg-slate-900 text-amber-300 px-1.5 py-0.5 text-[9.5px] font-bold">
                              حساب إداري
                            </span>
                          ) : pCheck.valid ? (
                            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                              ✓ {pCheck.carrier}
                            </span>
                          ) : (
                            <span className="rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700">
                              رقم غير قياسي
                            </span>
                          )}
                          {u.isBanned && (
                            <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                              مجمّد
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          رصيد:{' '}
                          <strong className="ltr-num text-teal-700">${formatUsdt(u.balance)}</strong>{' '}
                          • إيداع: ${formatUsdt(u.totalDeposits)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openPrivateMessageForUser(u)}
                          title="إرسال إشعار خاص لهذا العضو"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/70 cursor-pointer"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openManageUser(u)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <UserCog className="w-3.5 h-3.5 text-teal-600" />
                          <span>إدارة</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : tab === 'growth' ? (
            /* TAB 4: SALARIES CONDITIONS, FLASH MISSIONS, VAULT & LUCKY WHEEL */
            <div className="space-y-4">
              {/* SECTION A: Flash VIP Missions Creator & Active List */}
              <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      المهام السياحية المميزة المحدودة (Flash VIP)
                    </h4>
                    <p className="text-[10.5px] text-slate-500">
                      أطلق مهام ذات مقاعد محدودة ومكافأة خاصة لتحفيز الترقيات
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateFlashMission} className="space-y-2 rounded-2xl bg-slate-50 p-3 border border-slate-200/75">
                  <input
                    type="text"
                    value={fmTitle}
                    onChange={(e) => setFmTitle(e.target.value)}
                    placeholder="اسم المهمة (مثال: تقييم منتجع جزيرة النخلة الملكي)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={fmLocation}
                    onChange={(e) => setFmLocation(e.target.value)}
                    placeholder="الموقع السياحي (مثال: دبي، الإمارات)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  />
                  <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                    <div>
                      <span className="block text-slate-500 mb-0.5">المكافأة $</span>
                      <input
                        type="number"
                        step="0.05"
                        value={fmReward}
                        onChange={(e) => setFmReward(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold ltr-num"
                      />
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">أدنى VIP</span>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        value={fmMinVip}
                        onChange={(e) => setFmMinVip(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold ltr-num"
                      />
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">المقاعد</span>
                      <input
                        type="number"
                        min="1"
                        value={fmMaxClaims}
                        onChange={(e) => setFmMaxClaims(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold ltr-num"
                      />
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-0.5">المدة (ساعة)</span>
                      <input
                        type="number"
                        min="1"
                        value={fmHours}
                        onChange={(e) => setFmHours(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold ltr-num"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingFm}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 text-xs font-extrabold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{creatingFm ? 'جاري النشر...' : 'إطلاق مهمة سياحية مميزة الآن'}</span>
                  </button>
                </form>

                {/* Active Flash Missions List */}
                <div className="space-y-2">
                  {(data?.flashMissions || [])
                    .filter((m) => m.isActive)
                    .map((fm) => (
                      <div
                        key={fm.id}
                        className="rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 truncate">{fm.title}</p>
                          <p className="text-[10.5px] text-slate-500">
                            VIP {fm.minVipLevel}+ • مكافأة{' '}
                            <strong className="ltr-num text-emerald-700">${fm.reward}</strong> •
                            حُجز {fm.claimedCount}/{fm.maxClaims}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteFlashMission(fm.id)}
                          className="shrink-0 p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          title="إيقاف المهمة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Combined Save Form for Salary Conditions, Vault Plans & Lucky Wheel */}
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* SECTION B: 100% Admin-Configurable Monthly Salaries Conditions */}
                <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">
                          تحديد شروط الرواتب الشهرية الثابتة
                        </h4>
                        <p className="text-[10.5px] text-slate-500">
                          تحكم كامل بقيمة الراتب والشروط الأربعة لكل رتبة
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addSalaryRank}
                      className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 text-indigo-700 px-2.5 py-1 text-[10.5px] font-extrabold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>رتبة جديدة</span>
                    </button>
                  </div>

                  <label className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 cursor-pointer">
                    <span className="text-[11px] font-bold text-slate-800">
                      تفعيل نظام الرواتب الشهرية لقادة الفرق
                    </span>
                    <input
                      type="checkbox"
                      checked={form.salary_system_enabled !== 'false'}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          salary_system_enabled: e.target.checked ? 'true' : 'false'
                        })
                      }
                      className="w-4 h-4 accent-teal-600"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 cursor-pointer">
                    <span className="text-[11px] font-bold text-slate-800">
                      مراجعة واعتماد يدوي من الإدارة قبل نزول الراتب للرصيد
                    </span>
                    <input
                      type="checkbox"
                      checked={form.salary_require_approval !== 'false'}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          salary_require_approval: e.target.checked ? 'true' : 'false'
                        })
                      }
                      className="w-4 h-4 accent-teal-600"
                    />
                  </label>

                  <div className="space-y-2.5">
                    {editableSalaryRanks.map((rk, idx) => (
                      <div
                        key={rk.id || idx}
                        className="rounded-2xl bg-slate-50 border border-slate-200/85 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={rk.title}
                            onChange={(e) => updateSalaryRankField(idx, 'title', e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-900"
                          />
                          {editableSalaryRanks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSalaryRank(idx)}
                              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-[9.5px]">
                          <div>
                            <span className="block text-slate-500 mb-0.5">مكافأة الترقية $</span>
                            <input
                              type="number"
                              min="0"
                              value={rk.oneTimeBonusUsdt ?? 0}
                              onChange={(e) =>
                                updateSalaryRankField(idx, 'oneTimeBonusUsdt', e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-extrabold text-teal-700 ltr-num"
                            />
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-0.5">الراتب الشهري $</span>
                            <input
                              type="number"
                              min="0"
                              value={rk.monthlySalaryUsdt ?? 0}
                              onChange={(e) =>
                                updateSalaryRankField(idx, 'monthlySalaryUsdt', e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-extrabold text-emerald-700 ltr-num"
                            />
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-0.5">الهدية العينية</span>
                            <input
                              type="text"
                              placeholder="مثال: iPhone 17"
                              value={rk.physicalGift ?? ''}
                              onChange={(e) =>
                                updateSalaryRankField(idx, 'physicalGift', e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[10.5px] font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 text-[9.5px]">
                          <div>
                            <span className="block text-slate-500 mb-0.5">VIP القائد</span>
                            <input
                              type="number"
                              min="0"
                              max="6"
                              value={rk.minUserVip}
                              onChange={(e) =>
                                updateSalaryRankField(idx, 'minUserVip', e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-bold ltr-num"
                            />
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-0.5">مباشر A</span>
                            <input
                              type="number"
                              min="0"
                              value={rk.minActiveDirect}
                              onChange={(e) =>
                                updateSalaryRankField(idx, 'minActiveDirect', e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-bold ltr-num"
                            />
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-0.5">نشط كلي</span>
                            <input
                              type="number"
                              min="0"
                              value={rk.minTotalActiveTeam}
                              onChange={(e) =>
                                updateSalaryRankField(idx, 'minTotalActiveTeam', e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-bold ltr-num"
                            />
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-0.5">نمو شهري</span>
                            <input
                              type="number"
                              min="0"
                              value={rk.minMonthlyNewMembers ?? 0}
                              onChange={(e) =>
                                updateSalaryRankField(idx, 'minMonthlyNewMembers', e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-xs font-bold ltr-num"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION C: Arona Smart Vault Plans Editor */}
                <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        خطط خزنة أرونا الذكية (Staking)
                      </h4>
                      <p className="text-[10.5px] text-slate-500">
                        تعديل مدد التجميد والحد الأدنى وإجمالي نسبة الربح %
                      </p>
                    </div>
                  </div>

                  {editableVaultPlans.map((vp, idx) => (
                    <div
                      key={vp.id || idx}
                      className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 grid grid-cols-4 gap-2 items-center text-xs"
                    >
                      <input
                        type="text"
                        value={vp.title}
                        onChange={(e) => updateVaultField(idx, 'title', e.target.value)}
                        className="col-span-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold"
                      />
                      <div>
                        <span className="block text-[9px] text-slate-400">الأيام</span>
                        <input
                          type="number"
                          min="1"
                          value={vp.durationDays}
                          onChange={(e) => updateVaultField(idx, 'durationDays', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold ltr-num"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">أدنى $</span>
                        <input
                          type="number"
                          min="1"
                          value={vp.minAmount}
                          onChange={(e) => updateVaultField(idx, 'minAmount', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold ltr-num"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">ربح كلي %</span>
                        <input
                          type="number"
                          step="0.1"
                          value={vp.totalReturnPct}
                          onChange={(e) => updateVaultField(idx, 'totalReturnPct', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-extrabold text-emerald-700 ltr-num"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* SECTION D: Deposit Lucky Wheel Prizes & Probabilities */}
                <AdminRedEnvelopePanel
                  welcomePopup={null}
                  showToast={showToast}
                  onRefresh={onRefreshUser}
                />

                <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        عجلة الحظ المربوطة بالإيداع ونسب الظهور
                      </h4>
                      <p className="text-[10.5px] text-slate-500">
                        الوزن (0) يعني أن الجائزة تظهر شكلياً على العجلة دون ربحها
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                        أدنى إيداع لمنح لفة ($)
                      </label>
                      <input
                        type="number"
                        value={form.wheel_min_deposit}
                        onChange={(e) => setForm({ ...form, wheel_min_deposit: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold ltr-num"
                      />
                    </div>
                    <label className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-1.5 cursor-pointer self-end">
                      <span className="text-[10.5px] font-bold text-slate-800">
                        +1 لفة للداعي المباشر
                      </span>
                      <input
                        type="checkbox"
                        checked={form.wheel_referrer_spin !== 'false'}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            wheel_referrer_spin: e.target.checked ? 'true' : 'false'
                          })
                        }
                        className="w-4 h-4 accent-teal-600"
                      />
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    {editableWheelSegments.map((seg, idx) => (
                      <div
                        key={seg.id || idx}
                        className="rounded-xl bg-slate-50 border border-slate-200 p-2 grid grid-cols-3 gap-2 items-center text-xs"
                      >
                        <input
                          type="text"
                          value={seg.label}
                          onChange={(e) => updateWheelField(idx, 'label', e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold ltr-num"
                        />
                        <div>
                          <span className="block text-[9px] text-slate-400">الجائزة $</span>
                          <input
                            type="number"
                            step="0.1"
                            value={seg.reward}
                            onChange={(e) => updateWheelField(idx, 'reward', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-emerald-700 ltr-num"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400">وزن الاحتمال</span>
                          <input
                            type="number"
                            min="0"
                            value={seg.weight}
                            onChange={(e) => updateWheelField(idx, 'weight', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold ltr-num"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white py-3.5 text-xs font-extrabold shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4 text-teal-400" />
                  <span>
                    {saving
                      ? 'جاري حفظ الشروط والمزايا...'
                      : 'حفظ شروط الرواتب ومحافظ استثمر مع أرونا وعجلة المكافآت'}
                  </span>
                </button>
              </form>
            </div>
          ) : tab === 'notifications' ? (
            /* TAB 4: BROADCAST & PRIVATE NOTIFICATIONS CENTER */
            <div className="space-y-4">
              <form
                onSubmit={handleSendNotification}
                className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3.5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      إرسال إشعار جماعي أو خاص
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      يصل فوراً إلى جرس التنبيهات 🔔 داخل حساب العضو
                    </p>
                  </div>
                </div>

                {/* Scope Selector: Broadcast vs Private */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setNotifScope('broadcast')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      notifScope === 'broadcast'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>إشعار جماعي للكل ({totals.totalUsers || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotifScope('private')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      notifScope === 'private'
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>إشعار خاص لعضو</span>
                  </button>
                </div>

                {/* Private Target Selector */}
                {notifScope === 'private' && (
                  <div className="rounded-2xl bg-teal-50/60 border border-teal-200/80 p-3 space-y-2">
                    <label className="block text-[11px] font-extrabold text-teal-900">
                      تحديد العضو المستلم (رقم الهاتف أو رمز الدعوة أو الاختيار السريع)
                    </label>
                    <input
                      type="text"
                      value={notifTarget}
                      onChange={(e) => setNotifTarget(e.target.value)}
                      placeholder="مثال: 0991112233 أو +905... أو رمز الدعوة"
                      className="w-full rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-bold ltr-num text-right outline-none focus:border-teal-600"
                    />
                    {data?.users?.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) setNotifTarget(e.target.value);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700"
                      >
                        <option value="">— أو اختر عضواً مباشرة من القائمة —</option>
                        {data.users.map((u) => (
                          <option key={u.id} value={u.phone}>
                            {u.phone} (VIP {u.vipLevel} • رصيد ${formatUsdt(u.balance)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Notification Badge Style */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    تصنيف وأيقونة الإشعار
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'info', label: 'إعلان عام', activeCls: 'bg-sky-600 text-white border-sky-600' },
                      { id: 'reward', label: 'عرض / مكافأة', activeCls: 'bg-amber-500 text-white border-amber-500' },
                      { id: 'success', label: 'تأكيد إيجابي', activeCls: 'bg-emerald-600 text-white border-emerald-600' },
                      { id: 'warning', label: 'تنبيه هام', activeCls: 'bg-rose-600 text-white border-rose-600' }
                    ].map((tp) => (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => setNotifType(tp.id)}
                        className={`py-2 rounded-xl text-[10.5px] font-extrabold border transition-colors cursor-pointer ${
                          notifType === tp.id
                            ? tp.activeCls
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {tp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Ready Templates */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400">
                    قوالب سريعة بضغطة واحدة:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: '🎁 عرض ترقية VIP',
                        type: 'reward',
                        title: 'عرض خاص على ترقيات VIP اليوم!',
                        body: 'بادر بترقية باقتك اليوم واستفد من عوائد التقييم السياحي اليومية وعمولات الفريق الفورية.'
                      },
                      {
                        label: '🚀 تحديث جديد',
                        type: 'info',
                        title: 'تحديث جديد في منصة Arona Boost',
                        body: 'تمت إضافة وجهات سياحية عالمية جديدة للتقييم اليومي لتعزيز تجربتكم وعوائدكم.'
                      },
                      {
                        label: '🔐 تذكير أمان PIN',
                        type: 'warning',
                        title: 'تذكير بحماية محفظتك الرقمية',
                        body: 'يرجى التأكد من تفعيل رمز الحماية المالي (PIN) وعدم مشاركته مع أي طرف لضمان أمان سحوباتك.'
                      }
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNotifType(tpl.type);
                          setNotifTitle(tpl.title);
                          setNotifBody(tpl.body);
                        }}
                        className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[10.5px] font-bold text-slate-700 cursor-pointer"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Body Inputs */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      عنوان الإشعار
                    </label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="مثال: مكافأة موسمية جديدة لجميع الأعضاء"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      نص الرسالة التفصيلي
                    </label>
                    <textarea
                      rows={3}
                      value={notifBody}
                      onChange={(e) => setNotifBody(e.target.value)}
                      placeholder="اكتب محتوى التنبيه الذي سيظهر للعضو عند فتح جرس الإشعارات..."
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-800 outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingNotif}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-extrabold text-white shadow-md transition-colors cursor-pointer ${
                    notifScope === 'broadcast'
                      ? 'bg-slate-900 hover:bg-slate-800'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  {sendingNotif ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {sendingNotif
                      ? 'جاري إرسال الإشعار...'
                      : notifScope === 'broadcast'
                      ? `إرسال إشعار جماعي لجميع الأعضاء (${totals.totalUsers || 0})`
                      : 'إرسال الإشعار الخاص للعضو المحدد'}
                  </span>
                </button>
              </form>

              {/* Sent Notifications Log */}
              <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    سجل الإشعارات الإدارية المرسلة
                  </h4>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    آخر {data?.notificationLogs?.length || 0}
                  </span>
                </div>

                {!data?.notificationLogs?.length ? (
                  <p className="text-xs text-slate-400 text-center py-5">
                    لم يتم إرسال إشعارات إدارية جماعية أو خاصة بعد
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.notificationLogs.map((log) => (
                      <div key={log.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-slate-900 truncate">
                            {log.title}
                          </span>
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              log.scope === 'broadcast'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/70'
                                : 'bg-teal-50 text-teal-700 border border-teal-200/70'
                            }`}
                          >
                            {log.scope === 'broadcast'
                              ? `جماعي (${log.recipientsCount})`
                              : `خاص: ${log.targetLabel}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{log.body}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatDateTimeAr(log.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : tab === 'settings' ? (
            /* TAB 5: DYNAMIC VIP PLANS, WALLETS, WHATSAPP & SECURITY SETTINGS */
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Unified Static Wallets & WhatsApp */}
              <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    عناوين محافظ الإيداع الثابتة الموحّدة لجميع المستخدمين
                  </h4>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                    تظهر لكل الأعضاء + QR تلقائي
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  ضع هنا عنوان محفظتك الرسمي لشبكتي TRC20 و BEP20؛ سيظهر نفس العنوان الثابت لجميع المستخدمين مع التحقق الفوري عبر TXID.
                </p>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      محفظة الإيداع الموحّدة USDT (TRC20 — شبكة TRON)
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(form.trc20_address.trim())
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(form.trc20_address.trim())
                        ? '✓ صيغة TRC20 صحيحة'
                        : 'يبدأ بـ T (34 محرفاً)'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.trc20_address}
                    onChange={(e) => setForm({ ...form, trc20_address: e.target.value })}
                    placeholder="T..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono ltr-num"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      محفظة الإيداع الموحّدة USDT (BEP20 — BNB Smart Chain)
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        /^0x[0-9a-fA-F]{40}$/.test(form.bep20_address.trim())
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {/^0x[0-9a-fA-F]{40}$/.test(form.bep20_address.trim())
                        ? '✓ صيغة BEP20 صحيحة'
                        : 'يبدأ بـ 0x (42 محرفاً)'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.bep20_address}
                    onChange={(e) => setForm({ ...form, bep20_address: e.target.value })}
                    placeholder="0x..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono ltr-num"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    رقم واتساب الدعم الفني (مع الرمز الدولي بدون +، مثال: 963990000000)
                  </label>
                  <input
                    type="text"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold ltr-num"
                  />
                </div>
              </div>

              {/* Financial Rules & Manual/Auto Review Mode */}
              <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900">
                  ضوابط التحقق عبر TXID والسحب والمراجعة الأمنية
                </h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      أدنى إيداع ($)
                    </label>
                    <input
                      type="number"
                      value={form.min_deposit}
                      onChange={(e) => setForm({ ...form, min_deposit: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      أدنى سحب ($)
                    </label>
                    <input
                      type="number"
                      value={form.min_withdraw}
                      onChange={(e) => setForm({ ...form, min_withdraw: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      أقصى عدد سحوبات / 24س
                    </label>
                    <input
                      type="number"
                      value={form.daily_withdraw_limit}
                      onChange={(e) => setForm({ ...form, daily_withdraw_limit: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      نسبة الضريبة ورسوم السحب (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.withdraw_fee_percent}
                      onChange={(e) => setForm({ ...form, withdraw_fee_percent: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      مدة استرداد ضمان العمل (يوم)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.guarantee_duration_days}
                      onChange={(e) =>
                        setForm({ ...form, guarantee_duration_days: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      باقات السحب السريعة (USDT)
                    </label>
                    <input
                      type="text"
                      value={withdrawPresetsText}
                      onChange={(e) => setWithdrawPresetsText(e.target.value)}
                      placeholder="20, 80, 200, 800, 2000, 5000"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold ltr-num"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-200 p-2.5 cursor-pointer">
                  <span className="text-xs font-bold text-emerald-950">
                    اعتماد تلقائي فوري للإيداع عند تطابق فحص البلوكتشين 100% عبر TXID (TRON / BSC)
                  </span>
                  <input
                    type="checkbox"
                    checked={form.blockchain_auto_approve_verified === 'true'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        blockchain_auto_approve_verified: e.target.checked ? 'true' : 'false'
                      })
                    }
                    className="w-4 h-4 accent-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl bg-teal-50/70 border border-teal-200 p-2.5 cursor-pointer">
                  <span className="text-xs font-bold text-teal-950">
                    رفض الـ TXID الوهمي أو غير المؤكد على البلوكتشين فوراً (وضع التحقق الصارم)
                  </span>
                  <input
                    type="checkbox"
                    checked={form.strict_blockchain_txid === 'true'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        strict_blockchain_txid: e.target.checked ? 'true' : 'false'
                      })
                    }
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 cursor-pointer">
                  <span className="text-xs font-bold text-slate-800">
                    اعتماد تلقائي فوري للإيداعات (إيقافه يفعّل المراجعة اليدوية)
                  </span>
                  <input
                    type="checkbox"
                    checked={form.auto_approve_deposits === 'true'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        auto_approve_deposits: e.target.checked ? 'true' : 'false'
                      })
                    }
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 cursor-pointer">
                  <span className="text-xs font-bold text-slate-800">
                    اعتماد تلقائي فوري للمسحوبات (إيقافه يفعّل المراجعة اليدوية)
                  </span>
                  <input
                    type="checkbox"
                    checked={form.auto_approve_withdrawals === 'true'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        auto_approve_withdrawals: e.target.checked ? 'true' : 'false'
                      })
                    }
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 cursor-pointer">
                  <span className="text-xs font-bold text-slate-800">
                    إظهار شريط النشاط الحي للسحوبات والتفعيلات في الرئيسية
                  </span>
                  <input
                    type="checkbox"
                    checked={form.live_ticker_enabled !== 'false'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        live_ticker_enabled: e.target.checked ? 'true' : 'false'
                      })
                    }
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>
              </div>

              {/* Dynamic VIP Plans & Profit Rates Editor */}
              <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 space-y-2.5">
                <h4 className="text-xs font-extrabold text-slate-900">
                  تعديل ضمانات درجات أرونا (A0–A6) والعوائد اليومية
                </h4>
                <div className="space-y-2">
                  {editableVips.map((v, idx) => (
                    <div
                      key={v.level}
                      className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 grid grid-cols-4 gap-2 items-center text-xs"
                    >
                      <span className="font-extrabold text-slate-900">{v.name}</span>
                      <div>
                        <span className="block text-[9px] text-slate-400">الإيداع $</span>
                        <input
                          type="number"
                          disabled={v.level === 0}
                          value={v.minDeposit}
                          onChange={(e) => updateVipField(idx, 'minDeposit', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold tabular-nums disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">المهام</span>
                        <input
                          type="number"
                          min="1"
                          value={v.dailyTasks}
                          onChange={(e) => updateVipField(idx, 'dailyTasks', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold tabular-nums"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400">ربح يومي $</span>
                        <input
                          type="number"
                          step="0.01"
                          value={v.dailyProfit}
                          onChange={(e) => updateVipField(idx, 'dailyProfit', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-emerald-700 tabular-nums"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Home Announcements Ticker Editor */}
              <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900">
                  شريط الإعلانات المتحرك (كل سطر يمثل إعلاناً)
                </h4>
                <textarea
                  rows={3}
                  value={announcementsText}
                  onChange={(e) => setAnnouncementsText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white py-3.5 text-xs font-extrabold shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري حفظ التعديلات...' : 'حفظ كافة إعدادات المنصة والخطط'}</span>
              </button>
            </form>
          ) : null}

          {/* ==================== EXECUTIVE CONCIERGE SUPPORT DESK TAB ==================== */}
          {tab === 'support' && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-white border border-slate-200 p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    مكتب المساندة التنفيذية المباشر (الأعضاء)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    تُرتّب تذاكر الفئات العليا (الفئة A3+) في الصدارة تلقائياً
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadSupportTickets}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 p-2 text-slate-700 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {supportTickets.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-xs font-bold text-slate-500">
                  لا توجد تذاكر دعم مسجلة حالياً
                </div>
              ) : (
                <div className="space-y-2.5">
                  {supportTickets.map((tk) => {
                    const expanded = activeSupportId === tk.id;
                    return (
                      <div
                        key={tk.id}
                        className="rounded-2xl bg-white border border-slate-200/90 p-3.5 space-y-2.5 shadow-2xs"
                      >
                        <div
                          onClick={() => setActiveSupportId(expanded ? null : tk.id)}
                          className="flex items-start justify-between gap-2 cursor-pointer"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="ltr-num rounded-md bg-slate-900 text-amber-300 px-2 py-0.5 text-[10px] font-extrabold">
                                {tk.ticketCode}
                              </span>
                              <span className="ltr-num text-xs font-extrabold text-slate-900">
                                {tk.phone}
                              </span>
                              <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                                الفئة A{tk.vipLevel ?? 0}
                              </span>
                              {tk.priority === 'vip' && (
                                <span className="rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9.5px] font-extrabold text-rose-700">
                                  أولوية عليا
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-extrabold text-slate-900">{tk.subject}</p>
                            <p className="text-[10.5px] text-slate-400">
                              {tk.category} • {formatDateTimeAr(tk.updatedAt)}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                              tk.status === 'open'
                                ? 'bg-amber-100 text-amber-800'
                                : tk.status === 'answered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {tk.status === 'open'
                              ? 'بانتظار الرد'
                              : tk.status === 'answered'
                              ? 'تم الرد'
                              : 'مغلقة'}
                          </span>
                        </div>

                        {expanded && (
                          <div className="pt-2 border-t border-slate-100 space-y-2.5">
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {(tk.messages || []).map((m) => (
                                <div
                                  key={m.id}
                                  className={`rounded-xl p-2.5 text-xs ${
                                    m.senderRole === 'admin'
                                      ? 'bg-slate-900 text-white'
                                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <span
                                    className={`block text-[10px] font-extrabold mb-0.5 ${
                                      m.senderRole === 'admin' ? 'text-amber-300' : 'text-teal-700'
                                    }`}
                                  >
                                    {m.senderRole === 'admin' ? 'رد الإدارة الرسمي' : `العضو (${tk.phone})`}
                                  </span>
                                  <p className="whitespace-pre-line leading-relaxed">{m.body}</p>
                                </div>
                              ))}
                            </div>

                            {tk.status !== 'closed' && (
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  value={adminReplyText}
                                  onChange={(e) => setAdminReplyText(e.target.value)}
                                  placeholder="اكتب الرد الرسمي للعضو (سيصله إشعار فوري)..."
                                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-teal-600"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={sendingSupportReply || !adminReplyText.trim()}
                                    onClick={async () => {
                                      setSendingSupportReply(true);
                                      try {
                                        const res = await apiRequest(
                                          `/api/admin/support/${tk.id}/reply`,
                                          {
                                            method: 'POST',
                                            body: { message: adminReplyText.trim() }
                                          }
                                        );
                                        setAdminReplyText('');
                                        showToast(res.message);
                                        await loadSupportTickets();
                                      } catch (err) {
                                        showToast(err.message, 'error');
                                      } finally {
                                        setSendingSupportReply(false);
                                      }
                                    }}
                                    className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2 text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>إرسال الرد الرسمي</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await apiRequest(
                                          `/api/admin/support/${tk.id}/close`,
                                          { method: 'POST' }
                                        );
                                        showToast(res.message);
                                        await loadSupportTickets();
                                      } catch (err) {
                                        showToast(err.message, 'error');
                                      }
                                    }}
                                    className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-bold cursor-pointer"
                                  >
                                    إغلاق التذكرة
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
