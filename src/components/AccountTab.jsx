import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Crown,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  Lock,
  KeyRound,
  LogOut,
  Shield,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  MessageCircle,
  BookOpen,
  Briefcase,
  ShieldCheck,
  Headset,
  Smartphone,
  Unlock,
  ChevronLeft,
  Download
} from 'lucide-react';
import BalanceCard from './BalanceCard';
import AboutTermsSheet from './AboutTermsSheet';
import ExecutiveIdSheet from './ExecutiveIdSheet';
import OfficialReceiptModal from './OfficialReceiptModal';
import ModalPortal from './ModalPortal';
import { TashareTileIcon } from './TashareIcons';
import { apiRequest, formatUsdt, formatDateTimeAr } from '../api';

export default function AccountTab({
  user,
  whatsappNumber,
  guaranteeDurationDays = 365,
  refreshKey,
  pwaPrompt,
  onTriggerPwaInstall,
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
  const [txFilter, setTxFilter] = useState('all');
  const [showAllTx, setShowAllTx] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [execCredSheet, setExecCredSheet] = useState({ open: false, mode: 'id' });
  const [refundingGuarantee, setRefundingGuarantee] = useState(false);

  // Clean Personal Info & Security Sheet (matches tashare8 "personalInfo" inner page)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('wallet'); // 'wallet' | 'pin' | 'password' | 'security'

  const [walletAddr, setWalletAddr] = useState(user?.savedWalletAddress || '');
  const [walletNet, setWalletNet] = useState(user?.savedWalletNetwork || 'TRC20');
  const [walletEditPin, setWalletEditPin] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);

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
  const visibleTx = showAllTx ? filteredTx : filteredTx.slice(0, 4);

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
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
          <CheckCircle2 className="w-2.5 h-2.5" />
          مكتمل
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
          <Clock className="w-2.5 h-2.5" />
          مراجعة
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
        <XCircle className="w-2.5 h-2.5" />
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

  const handleInstallClick = () => {
    if (pwaPrompt && onTriggerPwaInstall) {
      onTriggerPwaInstall();
    } else {
      showToast('لتثبيت التطبيق: افتح قائمة المتصفح واختر "إضافة إلى الشاشة الرئيسية"');
    }
  };

  return (
    <div className="space-y-3.5 pt-2 animate-tab">
      {/* 1. Clean Profile Header on Light Canvas (EXACT IMG_4503.png top section) */}
      <div className="flex items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Circular Avatar */}
          <button
            type="button"
            onClick={() => setExecCredSheet({ open: true, mode: 'id' })}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#07182B] via-[#0C2F4F] to-[#0D7A72] ring-3 ring-white shadow-md flex items-center justify-center text-[#F5D076] shrink-0 cursor-pointer"
          >
            <User className="w-8 h-8" />
          </button>

          {/* Masked Phone + Two Crisp White Pill Badges */}
          <div className="min-w-0 space-y-1.5">
            <p className="ltr-num tabular-nums font-display text-[17px] font-extrabold text-[#07182B] leading-none">
              {user?.maskedPhone || user?.phone}
            </p>

            <div className="flex flex-col items-start gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11.5px] font-bold text-[#07182B] shadow-[0_2px_8px_rgba(7,24,43,0.05)]">
                <Crown className="w-3.5 h-3.5 text-[#D49B2A]" />
                <span className="text-slate-500">المستوى :</span>
                <span className="font-extrabold text-[#0D7A72]">A{user?.vipLevel ?? 0}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11.5px] font-bold text-[#07182B] shadow-[0_2px_8px_rgba(7,24,43,0.05)]">
                <Briefcase className="w-3.5 h-3.5 text-[#0D7A72]" />
                <span className="text-slate-500">المنصب :</span>
                <span className="font-extrabold text-[#0D7A72]">{jobTitle}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Royal Sovereign Balance Card (IMG_4503.png gradient card + standing balance rule) */}
      <BalanceCard
        user={user}
        onOpenDeposit={onOpenDeposit}
        onOpenWithdraw={onOpenWithdraw}
        showActions={true}
      />

      {/* 3. Pure White Work Guarantee Card (EXACT IMG_4503.png white card!) */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-2.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-bold text-[#07182B]">ضمان العمل</span>
          <span className="ltr-num tabular-nums font-display font-extrabold text-[#0D7A72]">
            {formatUsdt(guarAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[13px]">
          <span className="font-bold text-[#07182B]">العد التنازلي لاسترداد الضمان</span>
          <span className="ltr-num tabular-nums font-extrabold text-[#0D7A72]">
            {guarAmount > 0
              ? canRefundGuarantee
                ? 'مستحق للاسترداد الآن'
                : `يوم ${guarRemaining}`
              : `يوم ${totalContractDays}`}
          </span>
        </div>

        <div className="rounded-xl bg-[#F1F5F9] px-3 py-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-slate-500 font-semibold">
            {guarAmount > 0
              ? `تاريخ الصلاحية: ${guarStart.replace(/-/g, '/')} ~ ${guarExpires.replace(/-/g, '/')}`
              : `يُسترد مبلغ الضمان كاملاً بعد إتمام ${totalContractDays} يوماً`}
          </span>
          <button
            type="button"
            onClick={() => setExecCredSheet({ open: true, mode: 'bond' })}
            className="text-[#0D7A72] font-extrabold hover:underline shrink-0 cursor-pointer"
          >
            الشهادة
          </button>
        </div>

        {canRefundGuarantee && guarAmount > 0 && (
          <button
            type="button"
            disabled={refundingGuarantee}
            onClick={handleRefundGuarantee}
            className="w-full rounded-xl bg-[#0D7A72] hover:bg-[#0A645D] text-white py-2.5 text-xs font-extrabold cursor-pointer"
          >
            {refundingGuarantee
              ? 'جاري استرداد الضمان...'
              : `استرداد مبلغ الضمان ($${formatUsdt(guarAmount)} USDT)`}
          </button>
        )}
      </div>

      {/* 4. Soft Borderless Tile Grid on Light Canvas (EXACT IMG_4503.png nav-box!) */}
      <div className="grid grid-cols-4 gap-y-4 gap-x-2 py-1">
        <button
          type="button"
          onClick={onOpenWithdraw}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <TashareTileIcon variant="withdraw" className="w-12 h-12" />
          <span className="text-[11.5px] font-bold text-[#07182B]">سحب</span>
        </button>

        <button
          type="button"
          onClick={onOpenDeposit}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <TashareTileIcon variant="recharge" className="w-12 h-12" />
          <span className="text-[11.5px] font-bold text-[#07182B]">شحن</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenRecords?.('ledger')}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <TashareTileIcon variant="ledger" className="w-12 h-12" />
          <span className="text-[11.5px] font-bold text-[#07182B]">السجل المالي</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenRecords?.('daily')}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <TashareTileIcon variant="daily" className="w-12 h-12" />
          <span className="text-[11.5px] font-bold text-[#07182B]">البيان اليومي</span>
        </button>

        <button
          type="button"
          onClick={onOpenWheel}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <TashareTileIcon variant="wheel" className="w-12 h-12" />
          <span className="text-[11.5px] font-bold text-[#07182B]">السحب المحظوظ</span>
        </button>

        <button
          type="button"
          onClick={onOpenRedEnvelope}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <TashareTileIcon variant="envelope" className="w-12 h-12" />
          <span className="text-[11.5px] font-bold text-[#07182B]">الظرف الأحمر</span>
        </button>

        <button
          type="button"
          onClick={onOpenPointShop}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <TashareTileIcon variant="shop" className="w-12 h-12" />
          <span className="text-[11.5px] font-bold text-[#07182B]">متجر النقاط</span>
        </button>

        <button
          type="button"
          onClick={() => setExecCredSheet({ open: true, mode: 'id' })}
          className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <TashareTileIcon variant="cert" className="w-12 h-12" />
          <span className="text-[11.5px] font-bold text-[#07182B]">بطاقتي</span>
        </button>
      </div>

      {/* 5. Clean White Cumulative Earnings Summary Card (EXACT IMG_4503.png & pages-my-index tab-con) */}
      <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(7,24,43,0.05)] overflow-hidden divide-y divide-slate-100">
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الأرباح</p>
            <p className="ltr-num tabular-nums font-display text-xl font-extrabold text-[#0D7A72] mt-1">
              {formatUsdt(user?.totalCumulativeEarnings ?? 0)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPointShop}
            className="rounded-xl bg-[#F4F7FA] px-3 py-1.5 text-left cursor-pointer"
          >
            <p className="text-[10px] font-bold text-slate-400">النقاط</p>
            <p className="ltr-num text-xs font-extrabold text-[#07182B]">
              {(user?.pointsBalance ?? 0).toLocaleString('en-US')} pts
            </p>
          </button>
        </div>

        <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-100">
          <div className="p-3.5">
            <p className="text-[11px] font-semibold text-slate-500">أرباح الأمس</p>
            <p className="ltr-num tabular-nums text-sm font-extrabold text-[#07182B] mt-1">
              {formatUsdt(user?.yesterdayEarnings ?? 0)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenRecords?.('daily')}
            className="p-3.5 text-right flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-[11px] font-semibold text-slate-500">أرباح هذا الأسبوع</p>
              <p className="ltr-num tabular-nums text-sm font-extrabold text-[#0D7A72] mt-1">
                {formatUsdt(user?.thisWeekEarnings ?? 0)}
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-100">
          <div className="p-3.5">
            <p className="text-[11px] font-semibold text-slate-500">أرباح هذا الشهر</p>
            <p className="ltr-num tabular-nums text-sm font-extrabold text-[#07182B] mt-1">
              {formatUsdt(user?.thisMonthEarnings ?? 0)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenRecords?.('ledger')}
            className="p-3.5 text-right flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-[11px] font-semibold text-slate-500">كشف الحساب الكامل</p>
              <p className="text-xs font-extrabold text-[#0D7A72] mt-1">عرض السجل</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 6. Compact Clean Deposit & Withdrawal Records Card (standing rule: records in حسابي without clutter) */}
      <section className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[13.5px] font-extrabold text-[#07182B]">
            سجلات الإيداع والسحب
          </h2>
          <div className="flex items-center gap-1 rounded-xl bg-[#F1F5F9] p-0.5 text-[11px] font-bold">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'deposit', label: 'إيداع' },
              { id: 'withdraw', label: 'سحب' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTxFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  txFilter === tab.id ? 'bg-white text-[#07182B] shadow-2xs' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loadingTx ? (
          <div className="py-6 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#0D7A72]" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : !filteredTx.length ? (
          <p className="py-5 text-center text-xs font-semibold text-slate-400">
            لا توجد عمليات إيداع أو سحب مسجلة حتى الآن
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleTx.map((tx) => {
              const isDeposit = tx.type === 'deposit';
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => setSelectedTx(tx)}
                  className="w-full py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5 text-right hover:bg-slate-50/70 rounded-lg px-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isDeposit
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpFromLine className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#07182B] truncate">
                        {isDeposit ? 'إيداع USDT' : 'سحب USDT'} ({tx.network})
                      </p>
                      <p className="text-[10.5px] text-slate-400 truncate">
                        {formatDateTimeAr(tx.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-0.5">
                    <span
                      className={`ltr-num tabular-nums text-xs font-extrabold ${
                        isDeposit ? 'text-[#0D7A72]' : 'text-[#07182B]'
                      }`}
                    >
                      {isDeposit ? '+' : '-'}${formatUsdt(tx.amount)}
                    </span>
                    {renderStatusBadge(tx.status)}
                  </div>
                </button>
              );
            })}

            {filteredTx.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllTx((s) => !s)}
                className="w-full pt-2.5 text-center text-xs font-extrabold text-[#0D7A72] cursor-pointer"
              >
                {showAllTx ? 'عرض أقل' : `عرض كافة العمليات (${filteredTx.length})`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* 7. Clean White Bottom Menu List (EXACT tashare8 pages-my-index list-all!) */}
      <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(7,24,43,0.05)] overflow-hidden divide-y divide-slate-100">
        {/* المعلومات الشخصية وإعدادات المحفظة والـ PIN */}
        <button
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-right hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-4.5 h-4.5 text-[#0D7A72]" />
            <span className="text-[13px] font-bold text-[#07182B]">
              المعلومات الشخصية والمحفظة ورمز PIN
            </span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        {/* خدمة العملاء ومكتب المساندة */}
        <button
          type="button"
          onClick={() => setSupportModalOpen(true)}
          className="w-full px-4 py-3.5 flex items-center justify-between text-right hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Headset className="w-4.5 h-4.5 text-[#0D7A72]" />
            <span className="text-[13px] font-bold text-[#07182B]">
              خدمة العملاء ومكتب المساندة
            </span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        {/* الوثائق الرسمية والشروط */}
        <button
          type="button"
          onClick={() => onOpenCharter?.('charter')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-right hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-4.5 h-4.5 text-[#07182B]" />
            <span className="text-[13px] font-bold text-[#07182B]">
              بيان الشركة وشهادة الاعتماد
            </span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        {/* تحميل التطبيق */}
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full px-4 py-3.5 flex items-center justify-between text-right hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Download className="w-4.5 h-4.5 text-[#D49B2A]" />
            <span className="text-[13px] font-bold text-[#07182B]">
              تحميل التطبيق على الهاتف
            </span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        {/* لوحة الإدارة (للمشرف فقط) */}
        {user?.isAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full px-4 py-3.5 flex items-center justify-between text-right hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4.5 h-4.5 text-[#0D7A72]" />
              <span className="text-[13px] font-extrabold text-[#07182B]">
                لوحة الإدارة الشاملة
              </span>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {/* تسجيل الخروج */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full px-4 py-3.5 flex items-center justify-between text-right hover:bg-rose-50/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4.5 h-4.5 text-rose-500" />
            <span className="text-[13px] font-bold text-rose-600">تسجيل الخروج</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* Clean Inner Modal: Personal Info, Wallet, PIN & Security (tashare8 personalInfo) */}
      {settingsModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[94] bg-[#EEF4F8] flex flex-col items-center overflow-y-auto animate-tab">
            <div className="w-full max-w-[430px] min-h-dvh flex flex-col">
              {/* Top Navigation Bar */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#07182B] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-display text-sm font-extrabold text-[#07182B]">
                  المعلومات الشخصية والحماية
                </h3>
                <div className="w-8" />
              </div>

              <div className="p-4 space-y-4">
                {/* 4 Clean Sub-tabs */}
                <div className="grid grid-cols-4 gap-1 bg-white rounded-xl p-1 shadow-2xs">
                  {[
                    { id: 'wallet', label: 'المحفظة' },
                    { id: 'pin', label: 'رمز PIN' },
                    { id: 'password', label: 'كلمة السر' },
                    { id: 'security', label: 'الأمان' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSettingsTab(tab.id);
                        if (tab.id === 'security') loadSecurityCenter();
                      }}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        settingsTab === tab.id
                          ? 'bg-[#07182B] text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {settingsTab === 'wallet' && (
                  <form
                    onSubmit={handleSaveWallet}
                    className="bg-white rounded-2xl p-4 shadow-2xs space-y-3.5"
                  >
                    <p className="text-xs font-extrabold text-[#07182B]">
                      عنوان محفظة السحب المعتمدة (USDT)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {['TRC20', 'BEP20'].map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setWalletNet(net)}
                          className={`py-2.5 rounded-xl text-xs font-extrabold border cursor-pointer ${
                            walletNet === net
                              ? 'bg-[#0D7A72] text-white border-[#0D7A72]'
                              : 'bg-[#F8FAFC] text-slate-700 border-slate-200'
                          }`}
                        >
                          USDT - {net}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={walletAddr}
                      onChange={(e) => setWalletAddr(e.target.value)}
                      placeholder={
                        walletNet === 'TRC20' ? 'عنوان يبدأ بـ T...' : 'عنوان يبدأ بـ 0x...'
                      }
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0D7A72] ltr-num"
                    />
                    {user?.walletLocked && (
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={walletEditPin}
                        onChange={(e) => setWalletEditPin(e.target.value)}
                        placeholder="المحفظة مقفلة — أدخل رمز PIN للتعديل"
                        className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none text-right"
                      />
                    )}
                    <button
                      type="submit"
                      disabled={savingWallet}
                      className="w-full rounded-xl bg-[#07182B] text-white py-3 text-xs font-extrabold cursor-pointer"
                    >
                      {savingWallet ? 'جاري الحفظ...' : 'حفظ عنوان المحفظة'}
                    </button>
                  </form>
                )}

                {settingsTab === 'pin' && (
                  <form
                    onSubmit={handleSavePin}
                    className="bg-white rounded-2xl p-4 shadow-2xs space-y-3"
                  >
                    <p className="text-xs font-extrabold text-[#07182B]">
                      تعيين / تحديث رمز الدفع والسحب (PIN)
                    </p>
                    {user?.hasWithdrawPin && (
                      <input
                        type="password"
                        value={currentSecret}
                        onChange={(e) => setCurrentSecret(e.target.value)}
                        placeholder="رمز PIN الحالي أو كلمة مرور الحساب"
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0D7A72]"
                      />
                    )}
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="رمز PIN الجديد (4 إلى 6 أرقام)"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0D7A72] ltr-num text-right"
                    />
                    <button
                      type="submit"
                      disabled={savingPin}
                      className="w-full rounded-xl bg-[#07182B] text-white py-3 text-xs font-extrabold cursor-pointer"
                    >
                      {savingPin ? 'جاري الحفظ...' : 'حفظ رمز الدفع'}
                    </button>
                  </form>
                )}

                {settingsTab === 'password' && (
                  <form
                    onSubmit={handleSavePassword}
                    className="bg-white rounded-2xl p-4 shadow-2xs space-y-3"
                  >
                    <p className="text-xs font-extrabold text-[#07182B]">تغيير كلمة مرور الدخول</p>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="كلمة المرور الحالية"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0D7A72]"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="كلمة المرور الجديدة"
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#0D7A72]"
                    />
                    <button
                      type="submit"
                      disabled={savingPass}
                      className="w-full rounded-xl bg-[#07182B] text-white py-3 text-xs font-extrabold cursor-pointer"
                    >
                      {savingPass ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                    </button>
                  </form>
                )}

                {settingsTab === 'security' && (
                  <div className="space-y-3">
                    {loadingSecurity ? (
                      <div className="bg-white rounded-2xl p-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0D7A72]" />
                        <span>جاري التحميل...</span>
                      </div>
                    ) : (
                      <>
                        <form
                          onSubmit={handleToggleWalletLock}
                          className="bg-white rounded-2xl p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#07182B]">
                              قفل محفظة السحب (Whitelist)
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                                user?.walletLocked
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {user?.walletLocked ? 'مفعّل' : 'غير مفعّل'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            يمنع السحب لأي محفظة غير عنوانك المحفوظ حتى مع معرفة كلمة المرور.
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={6}
                              value={lockPin}
                              onChange={(e) => setLockPin(e.target.value)}
                              placeholder="رمز PIN"
                              className="flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold outline-none text-right"
                            />
                            <button
                              type="submit"
                              disabled={togglingLock}
                              className="rounded-xl bg-[#07182B] text-[#F5D076] px-4 py-2.5 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
                            >
                              {user?.walletLocked ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>فك القفل</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>تفعيل القفل</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>

                        <div className="bg-white rounded-2xl p-4 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#07182B]">
                              الأجهزة المتصلة ({securityData?.sessions?.length || 1})
                            </span>
                            {(securityData?.sessions?.length || 0) > 1 && (
                              <button
                                type="button"
                                disabled={revokingSessions}
                                onClick={handleRevokeOtherSessions}
                                className="text-[11px] font-extrabold text-rose-600 cursor-pointer"
                              >
                                إنهاء الجلسات الأخرى
                              </button>
                            )}
                          </div>
                          <div className="divide-y divide-slate-100">
                            {(securityData?.sessions || []).map((s) => (
                              <div
                                key={s.id}
                                className="py-2 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="font-bold text-slate-700 truncate">
                                    {s.deviceLabel}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-[#0D7A72] shrink-0">
                                  {s.isCurrent ? 'الجهاز الحالي' : 'نشط'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSettingsModalOpen(false);
                    setAboutOpen(true);
                  }}
                  className="w-full bg-white rounded-2xl p-4 shadow-2xs flex items-center justify-between text-xs font-bold text-[#07182B] cursor-pointer"
                >
                  <span>الشروط والأحكام وسياسة الاستخدام</span>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Clean Support Choice Sheet */}
      {supportModalOpen && (
        <ModalPortal>
          <div
            onClick={() => setSupportModalOpen(false)}
            className="fixed inset-0 z-[94] bg-slate-950/50 backdrop-blur-xs flex items-end justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 space-y-3 animate-sheet"
            >
              <div className="flex items-center justify-between pb-1">
                <h3 className="font-display text-sm font-extrabold text-[#07182B]">
                  خدمة العملاء ومكتب المساندة
                </h3>
                <button
                  type="button"
                  onClick={() => setSupportModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSupportModalOpen(false);
                  onOpenConcierge?.();
                }}
                className="w-full rounded-2xl bg-[#07182B] text-white p-4 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Headset className="w-5 h-5 text-[#F5D076]" />
                  <div className="text-right">
                    <p className="text-xs font-extrabold">مكتب المساندة المباشر داخل التطبيق</p>
                    <p className="text-[10.5px] text-slate-300 mt-0.5">إرسال تذكرة ومحادثة فورية مع الدعم</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-[#F5D076]" />
              </button>

              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSupportModalOpen(false)}
                className="w-full rounded-2xl bg-[#0D7A72] text-white p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-white" />
                  <div className="text-right">
                    <p className="text-xs font-extrabold">خدمة العملاء عبر واتساب (24/7)</p>
                    <p className="text-[10.5px] text-teal-100 mt-0.5">متابعة فورية مع ممثل الخدمة</p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </ModalPortal>
      )}

      <AboutTermsSheet isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      <ExecutiveIdSheet
        isOpen={execCredSheet.open}
        initialMode={execCredSheet.mode}
        onClose={() => setExecCredSheet((s) => ({ ...s, open: false }))}
        user={user}
        guaranteeDurationDays={guaranteeDurationDays}
        showToast={showToast}
      />

      <OfficialReceiptModal
        transaction={selectedTx}
        user={user}
        onClose={() => setSelectedTx(null)}
        showToast={showToast}
      />
    </div>
  );
}
