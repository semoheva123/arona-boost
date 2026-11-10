import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Crown,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Wallet,
  Lock,
  KeyRound,
  LogOut,
  Shield,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  MessageCircle,
  BookOpen,
  Briefcase,
  ShieldCheck,
  CalendarDays,
  ScrollText,
  Sparkles,
  Building2,
  Timer,
  IdCard,
  Headset,
  Smartphone,
  Unlock,
  Gift,
  ShoppingBag
} from 'lucide-react';
import BalanceCard from './BalanceCard';
import InstallAppBanner from './InstallAppBanner';
import AboutTermsSheet from './AboutTermsSheet';
import ExecutiveIdSheet from './ExecutiveIdSheet';
import OfficialReceiptModal from './OfficialReceiptModal';
import { apiRequest, formatUsdt, formatDateTimeAr, formatShortDateAr } from '../api';

export default function AccountTab({
  user,
  whatsappNumber,
  guaranteeDurationDays = 365,
  refreshKey,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenRecords,
  onOpenWheel,
  onOpenRedEnvelope,
  onOpenPointShop,
  onOpenCharter,
  onOpenConcierge,
  onOpenAdmin,
  onUserUpdated,
  onLogout,
  showToast
}) {
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txFilter, setTxFilter] = useState('all'); // 'all' | 'deposit' | 'withdraw'
  const [selectedTx, setSelectedTx] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [execCredSheet, setExecCredSheet] = useState({ open: false, mode: 'id' });
  const [refundingGuarantee, setRefundingGuarantee] = useState(false);

  // Settings collapsible panels
  const [openSection, setOpenSection] = useState(null); // 'wallet' | 'pin' | 'password' | 'security' | null
  const [walletAddr, setWalletAddr] = useState(user?.savedWalletAddress || '');
  const [walletNet, setWalletNet] = useState(user?.savedWalletNetwork || 'TRC20');
  const [walletEditPin, setWalletEditPin] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);

  // Security Center State
  const [securityData, setSecurityData] = useState(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [lockPin, setLockPin] = useState('');
  const [togglingLock, setTogglingLock] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);

  const [currentSecret, setCurrentSecret] = useState('');
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const data = await apiRequest('/api/transactions');
      setTransactions(data.transactions || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingTx(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, refreshKey]);

  useEffect(() => {
    setWalletAddr(user?.savedWalletAddress || '');
    setWalletNet(user?.savedWalletNetwork || 'TRC20');
  }, [user?.savedWalletAddress, user?.savedWalletNetwork]);

  const filteredTx = transactions.filter((t) =>
    txFilter === 'all' ? true : t.type === txFilter
  );

  const loadSecurityCenter = useCallback(async () => {
    setLoadingSecurity(true);
    try {
      const res = await apiRequest('/api/account/security');
      setSecurityData(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingSecurity(false);
    }
  }, [showToast]);

  const handleToggleWalletLock = async (e) => {
    e.preventDefault();
    setTogglingLock(true);
    try {
      const wantLock = !Boolean(user?.walletLocked);
      const res = await apiRequest('/api/account/wallet-lock', {
        method: 'POST',
        body: { lock: wantLock, pin: lockPin }
      });
      onUserUpdated(res.user);
      setLockPin('');
      showToast(res.message);
      await loadSecurityCenter();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setTogglingLock(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokingSessions(true);
    try {
      const res = await apiRequest('/api/account/sessions/revoke-others', {
        method: 'POST'
      });
      showToast(res.message);
      await loadSecurityCenter();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRevokingSessions(false);
    }
  };

  const handleSaveWallet = async (e) => {
    e.preventDefault();
    setSavingWallet(true);
    try {
      const res = await apiRequest('/api/account/wallet', {
        method: 'PUT',
        body: { walletAddress: walletAddr, network: walletNet, pin: walletEditPin }
      });
      onUserUpdated(res.user);
      setWalletEditPin('');
      showToast(res.message);
      setOpenSection(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingWallet(false);
    }
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    setSavingPin(true);
    try {
      const res = await apiRequest('/api/account/pin', {
        method: 'PUT',
        body: { currentSecret, newPin }
      });
      onUserUpdated(res.user);
      showToast(res.message);
      setCurrentSecret('');
      setNewPin('');
      setOpenSection(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPin(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setSavingPass(true);
    try {
      const res = await apiRequest('/api/account/password', {
        method: 'PUT',
        body: { currentPassword, newPassword }
      });
      showToast(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setOpenSection(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          مكتمل
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          <Clock className="w-3 h-3" />
          قيد المراجعة
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-700">
        <XCircle className="w-3 h-3" />
        مرفوض
      </span>
    );
  };

  const cleanWa = String(whatsappNumber || '963990000000').replace(/\D/g, '');
  const waHref = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    `مرحباً فريق دعم Arona Boost، رقم حسابي #${1000 + (user?.id || 1)} (${user?.phone})`
  )}`;

  const guarAmount = Number(user?.workGuarantee?.amount || 0);
  const guarRemaining = Number(user?.workGuarantee?.remainingDays ?? guaranteeDurationDays);
  const guarStart = user?.workGuarantee?.startDate
    ? String(user.workGuarantee.startDate).slice(0, 10)
    : '';
  const guarExpires = user?.workGuarantee?.expiresDate
    ? String(user.workGuarantee.expiresDate).slice(0, 10)
    : '';
  const canRefundGuarantee = Boolean(user?.workGuarantee?.canRefund);
  const totalContractDays = Math.max(1, Number(guaranteeDurationDays || 365));
  const elapsedPct =
    guarAmount > 0
      ? Math.min(100, Math.max(4, Math.round(((totalContractDays - guarRemaining) / totalContractDays) * 100)))
      : 0;
  const jobTitle = user?.jobTitle || ((user?.vipLevel ?? 0) > 0 ? 'موظف رسمي' : 'موظف متدرب');

  const handleRefundGuarantee = async () => {
    setRefundingGuarantee(true);
    try {
      const res = await apiRequest('/api/account/refund-guarantee', { method: 'POST' });
      onUserUpdated(res.user);
      showToast(res.message);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRefundingGuarantee(false);
    }
  };

  return (
    <div className="space-y-4 animate-tab">
      {/* 1. Sovereign Employee Profile Header (matching IMG_4503 layout in Royal Colors) */}
      <div className="exec-card rounded-[26px] p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#061628] via-[#0C2C4E] to-[#0D7A72] border-2 border-[#F5D076]/65 flex items-center justify-center text-[#F5D076] shrink-0 shadow-md">
            <User className="w-7 h-7" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="ltr-num tabular-nums font-display text-base font-extrabold text-[#07182B] leading-none">
              {user?.maskedPhone || user?.phone}
            </p>

            <div className="flex flex-col items-start gap-1">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F6F8FB] border border-slate-200/90 px-2.5 py-1 text-[11px] font-extrabold text-[#07182B]">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-500">المستوى :</span>
                <span className="text-[#0D7A72]">A{user?.vipLevel ?? 0}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F6F8FB] border border-slate-200/90 px-2.5 py-1 text-[11px] font-extrabold text-[#07182B]">
                <Briefcase className="w-3.5 h-3.5 text-[#0D7A72]" />
                <span className="text-slate-500">المنصب :</span>
                <span className="text-[#0D7A72]">{jobTitle}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setExecCredSheet({ open: true, mode: 'id' })}
            className="inline-flex items-center gap-1 rounded-xl bg-[#081E36] hover:bg-slate-800 border border-[#F5D076]/45 text-[#F5D076] px-2.5 py-2 text-[11px] font-extrabold cursor-pointer"
          >
            <IdCard className="w-3.5 h-3.5" />
            <span>بطاقتي</span>
          </button>

          {user?.isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[#081E36] px-2.5 py-1.5 text-[10.5px] font-extrabold cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#0D7A72]" />
              <span>الإدارة</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Unified Sovereign Balance Card inside My Account */}
      <BalanceCard
        user={user}
        onOpenDeposit={() => onOpenDeposit()}
        onOpenWithdraw={() => onOpenWithdraw()}
        showActions={true}
      />

      {/* 3. 365-Day Official Work Guarantee Card (exact IMG_4503 structure in Royal Colors) */}
      <div className="exec-royal-surface relative overflow-hidden rounded-[26px] p-4 text-white border border-[#F5D076]/28 space-y-3">
        <div className="pointer-events-none absolute inset-0 exec-filigree opacity-60" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-white">ضمان العمل</span>
            <span className="ltr-num tabular-nums font-display text-sm font-extrabold text-[#F5D076]">
              {formatUsdt(guarAmount)} USDT
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200">العد التنازلي لاسترداد الضمان</span>
            <span className="ltr-num tabular-nums font-extrabold text-emerald-300">
              {guarAmount > 0
                ? canRefundGuarantee
                  ? 'مستحق للاسترداد الآن'
                  : `يوم ${guarRemaining}`
                : `${totalContractDays} يوم`}
            </span>
          </div>
        </div>

        <div className="relative z-10 rounded-xl bg-slate-950/45 border border-white/14 px-3 py-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-300 font-semibold">
            {guarAmount > 0
              ? `تاريخ الصلاحية: ${guarStart.replace(/-/g, '/')} ~ ${guarExpires.replace(/-/g, '/')}`
              : `يُسترد مبلغ الضمان كاملاً بعد إتمام ${totalContractDays} يوماً`}
          </span>
          <Timer className="w-3.5 h-3.5 text-[#F5D076] shrink-0" />
        </div>

        {guarAmount > 0 && (
          <div className="relative z-10 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[#F5D076] to-emerald-400 transition-all"
              style={{ width: `${elapsedPct}%` }}
            />
          </div>
        )}

        {canRefundGuarantee && guarAmount > 0 && (
          <button
            type="button"
            disabled={refundingGuarantee}
            onClick={handleRefundGuarantee}
            className="relative z-10 w-full rounded-xl bg-[#F5D076] hover:bg-amber-300 text-[#051322] py-2 text-xs font-extrabold cursor-pointer"
          >
            {refundingGuarantee
              ? 'جاري استرداد الضمان...'
              : `استرداد مبلغ الضمان ($${formatUsdt(guarAmount)} USDT) إلى محفظة الدخل`}
          </button>
        )}

        <button
          type="button"
          onClick={() => setExecCredSheet({ open: true, mode: 'bond' })}
          className="relative z-10 w-full rounded-xl bg-white/10 hover:bg-white/16 border border-[#F5D076]/30 py-2 px-3 text-[11px] font-extrabold text-[#F5D076] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>عرض وحفظ شهادة عقد ضمان العمل الرسمية</span>
        </button>
      </div>

      {/* 4. Full 8-Button Action Matrix (matching IMG_4503 + tashare8 tools in Royal Colors) */}
      <div className="exec-card rounded-[26px] p-3.5">
        <div className="grid grid-cols-4 gap-y-3.5 gap-x-2">
          {/* سحب */}
          <button
            type="button"
            onClick={() => onOpenWithdraw()}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className="w-11 h-11 rounded-2xl border border-[#F5D076]/55 text-[#07182B] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(145deg, #F8DF95 0%, #DFB14B 100%)' }}
            >
              <ArrowUpFromLine className="w-4.5 h-4.5 stroke-[2.3]" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B]">سحب</span>
          </button>

          {/* شحن */}
          <button
            type="button"
            onClick={() => onOpenDeposit()}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className="w-11 h-11 rounded-2xl border border-[#F5D076]/35 text-[#F5D076] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(145deg, #07182B 0%, #10355C 100%)' }}
            >
              <ArrowDownToLine className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B]">شحن</span>
          </button>

          {/* السجل المالي */}
          <button
            type="button"
            onClick={() => onOpenRecords?.('ledger')}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 text-[#0D7A72] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ScrollText className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B]">السجل المالي</span>
          </button>

          {/* البيان اليومي */}
          <button
            type="button"
            onClick={() => onOpenRecords?.('daily')}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B]">البيان اليومي</span>
          </button>

          {/* السحب المحظوظ */}
          <button
            type="button"
            onClick={onOpenWheel}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FFFDF5] border border-amber-300/80 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B]">السحب المحظوظ</span>
          </button>

          {/* الظرف الأحمر */}
          <button
            type="button"
            onClick={onOpenRedEnvelope}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className="w-11 h-11 rounded-2xl border border-[#F5D076]/45 text-[#F5D076] flex items-center justify-center group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(145deg, #5C1622 0%, #8E2335 100%)' }}
            >
              <Gift className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B]">الظرف الأحمر</span>
          </button>

          {/* متجر النقاط */}
          <button
            type="button"
            onClick={onOpenPointShop}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#07182B] border border-[#F5D076]/40 text-[#F5D076] flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B]">متجر النقاط</span>
          </button>

          {/* بيان الشركة */}
          <button
            type="button"
            onClick={() => onOpenCharter?.('charter')}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-[#081E36] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B]">بيان الشركة</span>
          </button>
        </div>
      </div>

      {/* 5. Cumulative & Period Earnings Card (matching IMG_4503 + tashare8 my/index) */}
      <div className="exec-card rounded-[24px] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الأرباح</p>
            <p className="ltr-num tabular-nums font-display text-xl font-extrabold text-[#0D7A72] mt-0.5">
              ${formatUsdt(user?.totalCumulativeEarnings ?? 0)} USDT
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenPointShop}
            className="rounded-xl bg-[#F6F8FB] border border-slate-200/90 px-3 py-1.5 text-left cursor-pointer hover:border-[#07182B]/30"
          >
            <p className="text-[10px] font-bold text-slate-500">رصيد النقاط</p>
            <p className="ltr-num text-xs font-extrabold text-[#07182B]">
              {(user?.pointsBalance ?? 0).toLocaleString('en-US')} نقطة
            </p>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/75 p-2.5">
            <p className="text-[10px] font-bold text-slate-500">أرباح الأمس</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-[#07182B] mt-1">
              ${formatUsdt(user?.yesterdayEarnings ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/75 p-2.5">
            <p className="text-[10px] font-bold text-slate-500">أرباح هذا الأسبوع</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-[#07182B] mt-1">
              ${formatUsdt(user?.thisWeekEarnings ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/75 p-2.5">
            <p className="text-[10px] font-bold text-slate-500">أرباح هذا الشهر</p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-emerald-700 mt-1">
              ${formatUsdt(user?.thisMonthEarnings ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Dual Executive Concierge (In-App Direct Desk + WhatsApp) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onOpenConcierge}
          className="rounded-2xl bg-[#07192E] hover:bg-[#0B2544] border border-[#F5D076]/35 text-white p-3.5 text-right flex items-center gap-2.5 shadow-xs transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#F5D076]/15 border border-[#F5D076]/35 text-[#F5D076] flex items-center justify-center shrink-0">
            <Headset className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white truncate">مكتب المساندة</p>
            <p className="text-[10px] text-teal-200 truncate">محادثة رسمية فورية</p>
          </div>
        </button>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white p-3.5 text-right flex items-center gap-2.5 shadow-xs hover:opacity-95 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white truncate">دعم واتساب</p>
            <p className="text-[10px] text-emerald-100 truncate">متابعة مباشرة 24/7</p>
          </div>
        </a>
      </div>

      {/* Transaction Records for Deposits & Withdrawals */}
      <section className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-extrabold text-slate-900">
                سجلات المعاملات
              </h2>
              <p className="text-[11px] text-slate-500">كشف عمليات الإيداع والسحب</p>
            </div>
          </div>

          <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 tabular-nums">
            {filteredTx.length} عملية
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'deposit', label: 'الإيداعات' },
            { id: 'withdraw', label: 'المسحوبات' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTxFilter(tab.id)}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                txFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadingTx ? (
          <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="text-xs">جاري تحميل سجلات المعاملات...</span>
          </div>
        ) : !filteredTx.length ? (
          <div className="py-9 text-center">
            <p className="text-sm font-bold text-slate-700">لا توجد معاملات مسجلة في هذا القسم</p>
            <p className="text-xs text-slate-400 mt-1">
              أي عملية إيداع أو سحب تقوم بها ستظهر هنا بالتفصيل
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTx.map((tx) => {
              const isDeposit = tx.type === 'deposit';
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => setSelectedTx(tx)}
                  className="w-full py-3.5 first:pt-1 last:pb-0 flex items-center justify-between gap-3 text-right hover:bg-slate-50/60 rounded-xl px-1 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isDeposit
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/70'
                          : 'bg-amber-50 text-amber-600 border border-amber-200/70'
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDownToLine className="w-4 h-4" />
                      ) : (
                        <ArrowUpFromLine className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900">
                          {isDeposit ? 'إيداع رصيد USDT' : 'سحب رصيد USDT'}
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {tx.network}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {formatDateTimeAr(tx.createdAt)} •{' '}
                        <span className="ltr-num">{tx.referenceCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span
                      className={`ltr-num tabular-nums text-sm font-extrabold ${
                        isDeposit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isDeposit ? '+' : '-'}${formatUsdt(tx.amount)}
                    </span>
                    {renderStatusBadge(tx.status)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Account Preferences, PIN Security, Install & Terms */}
      <div className="rounded-3xl bg-white border border-slate-200/85 overflow-hidden shadow-2xs divide-y divide-slate-100">
        {/* Install App Option */}
        <InstallAppBanner compact={true} />

        {/* Financial Withdrawal PIN */}
        <div>
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'pin' ? null : 'pin')}
            className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  رمز الحماية المالي للسحب (PIN)
                </p>
                <p className="text-[11px] text-slate-400">
                  {user?.hasWithdrawPin
                    ? 'مفعّل • يمكنك تغييره في أي وقت'
                    : 'غير مفعّل بعد • اضغط لإعداد رمز سري من 4-6 أرقام'}
                </p>
              </div>
            </div>
            {openSection === 'pin' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSection === 'pin' && (
            <form onSubmit={handleSavePin} className="px-4 pb-4 pt-1 space-y-2.5 bg-slate-50/50">
              {user?.hasWithdrawPin && (
                <input
                  type="password"
                  value={currentSecret}
                  onChange={(e) => setCurrentSecret(e.target.value)}
                  placeholder="الرمز المالي الحالي أو كلمة مرور الحساب"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600"
                />
              )}
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="رمز PIN الجديد (4 إلى 6 أرقام)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600 ltr-num text-right"
              />
              <button
                type="submit"
                disabled={savingPin}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold cursor-pointer"
              >
                {savingPin ? 'جاري الحفظ...' : 'حفظ رمز الحماية المالي'}
              </button>
            </form>
          )}
        </div>

        {/* Saved Withdrawal Wallet */}
        <div>
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'wallet' ? null : 'wallet')}
            className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">عنوان محفظة USDT للسحب</p>
                <p className="text-[11px] text-slate-400">
                  {user?.savedWalletAddress
                    ? `${user.savedWalletNetwork}: ${user.savedWalletAddress.slice(0, 10)}...`
                    : 'احفظ عنوان محفظتك لتسريع عمليات السحب'}
                </p>
              </div>
            </div>
            {openSection === 'wallet' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSection === 'wallet' && (
            <form onSubmit={handleSaveWallet} className="px-4 pb-4 pt-1 space-y-3 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-2">
                {['TRC20', 'BEP20'].map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setWalletNet(net)}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      walletNet === net
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    شبكة {net}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={walletAddr}
                onChange={(e) => setWalletAddr(e.target.value)}
                placeholder={
                  walletNet === 'TRC20' ? 'عنوان محفظة يبدأ بـ T...' : 'عنوان محفظة يبدأ بـ 0x...'
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600 ltr-num"
              />
              {user?.walletLocked && (
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={walletEditPin}
                  onChange={(e) => setWalletEditPin(e.target.value)}
                  placeholder="المحفظة مقفلة مصرفياً — أدخل رمز PIN لتأكيد التعديل"
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-amber-600 text-right"
                />
              )}
              <button
                type="submit"
                disabled={savingWallet}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold cursor-pointer"
              >
                {savingWallet ? 'جاري الحفظ...' : 'حفظ عنوان المحفظة'}
              </button>
            </form>
          )}
        </div>

        {/* Banking Security Center: Wallet Whitelist Lock & Active Sessions */}
        <div>
          <button
            type="button"
            onClick={() => {
              const next = openSection === 'security' ? null : 'security';
              setOpenSection(next);
              if (next === 'security') loadSecurityCenter();
            }}
            className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900">
                    مركز الحماية المصرفية والجلسات النشطة
                  </p>
                  {user?.walletLocked && (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-extrabold text-emerald-800">
                      مقفلة بأمان
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  قفل عنوان محفظة السحب المعتمدة وإدارة الأجهزة المتصلة
                </p>
              </div>
            </div>
            {openSection === 'security' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSection === 'security' && (
            <div className="px-4 pb-4 pt-1 space-y-3 bg-slate-50/70">
              {loadingSecurity ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0D7A72]" />
                  <span>جاري فحص مستوى الحماية المصرفية...</span>
                </div>
              ) : (
                <>
                  {/* Security Score Meter */}
                  <div className="rounded-2xl bg-[#07192E] text-white p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">مؤشر الأمان المصرفي للحساب</span>
                      <span className="ltr-num font-extrabold text-[#F5D076]">
                        {securityData?.securityScore ?? 75}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-[#F5D076] to-emerald-400"
                        style={{ width: `${securityData?.securityScore ?? 75}%` }}
                      />
                    </div>
                  </div>

                  {/* Wallet Whitelist Lock Form */}
                  <form
                    onSubmit={handleToggleWalletLock}
                    className="rounded-2xl bg-white border border-slate-200 p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        قفل عنوان محفظة السحب (Whitelist Lock)
                      </span>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                          user?.walletLocked
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user?.walletLocked ? 'مفعّل' : 'غير مفعّل'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      عند تفعيل القفل، يُمنع السحب لأي محفظة خارجية غير عنوانك المحفوظ حتى في حال
                      معرفة كلمة المرور.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={lockPin}
                        onChange={(e) => setLockPin(e.target.value)}
                        placeholder="رمز الحماية المالي PIN"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600 text-right"
                      />
                      <button
                        type="submit"
                        disabled={togglingLock}
                        className="shrink-0 rounded-xl bg-[#081E36] hover:bg-slate-800 text-[#F5D076] px-3.5 py-2 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {user?.walletLocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>فك القفل</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>قفل المحفظة</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Active Sessions List */}
                  <div className="rounded-2xl bg-white border border-slate-200 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">
                        الأجهزة والجلسات النشطة ({securityData?.sessions?.length || 1})
                      </span>
                      {(securityData?.sessions?.length || 0) > 1 && (
                        <button
                          type="button"
                          disabled={revokingSessions}
                          onClick={handleRevokeOtherSessions}
                          className="text-[10.5px] font-extrabold text-rose-600 hover:underline cursor-pointer"
                        >
                          {revokingSessions ? 'جاري الإنهاء...' : 'إنهاء كافة الجلسات الأخرى'}
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100">
                      {(securityData?.sessions || []).map((s) => (
                        <div
                          key={s.id}
                          className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11.5px] font-bold text-slate-800 truncate">
                                {s.deviceLabel}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {s.ipHint} • {formatDateTimeAr(s.lastSeenAt)}
                              </p>
                            </div>
                          </div>
                          {s.isCurrent ? (
                            <span className="shrink-0 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9.5px] font-extrabold text-emerald-700">
                              الجهاز الحالي
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] text-slate-400">نشط</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Change Password */}
        <div>
          <button
            type="button"
            onClick={() => setOpenSection(openSection === 'password' ? null : 'password')}
            className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">تغيير كلمة المرور</p>
                <p className="text-[11px] text-slate-400">تحديث كلمة مرور حماية حسابك</p>
              </div>
            </div>
            {openSection === 'password' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSection === 'password' && (
            <form onSubmit={handleSavePassword} className="px-4 pb-4 pt-1 space-y-2.5 bg-slate-50/50">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="كلمة المرور الحالية"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-600"
              />
              <button
                type="submit"
                disabled={savingPass}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold cursor-pointer"
              >
                {savingPass ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </form>
          )}
        </div>

        {/* Official About & Terms */}
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">حول Arona Boost والشروط والأحكام</p>
              <p className="text-[11px] text-slate-400">سياسة العمل والأمان والعضويات</p>
            </div>
          </div>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-rose-50/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-600">تسجيل الخروج</p>
              <p className="text-[11px] text-slate-400">الخروج الآمن من جلستك الحالية</p>
            </div>
          </div>
        </button>
      </div>

      <AboutTermsSheet isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* Official Executive ID Card & Work Guarantee Bond Certificate */}
      <ExecutiveIdSheet
        isOpen={execCredSheet.open}
        initialMode={execCredSheet.mode}
        onClose={() => setExecCredSheet((s) => ({ ...s, open: false }))}
        user={user}
        guaranteeDurationDays={guaranteeDurationDays}
        showToast={showToast}
      />

      {/* Bank-Grade Downloadable & Shareable Verified USDT Settlement Receipt */}
      <OfficialReceiptModal
        transaction={selectedTx}
        user={user}
        onClose={() => setSelectedTx(null)}
        showToast={showToast}
      />
    </div>
  );
}
