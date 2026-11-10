import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  ArrowDownToLine,
  ArrowUpFromLine,
  Crown,
  Wallet,
  Briefcase,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { formatUsdt } from '../api';
import { useI18n, REFERENCE_CURRENCIES } from '../i18n';

export default function BalanceCard({
  user,
  onOpenDeposit,
  onOpenWithdraw,
  showActions = true
}) {
  const [hidden, setHidden] = useState(false);
  const { t, currency, setCurrency, formatReferenceEquivalent } = useI18n();

  const maskOrFormat = (val) => (hidden ? '••••••' : formatUsdt(val));
  const jobTitle = user?.jobTitle || ((user?.vipLevel ?? 0) > 0 ? 'موظف رسمي' : 'موظف متدرب');

  const cycleCurrency = () => {
    const idx = REFERENCE_CURRENCIES.findIndex((c) => c.code === currency);
    const next = REFERENCE_CURRENCIES[(idx + 1) % REFERENCE_CURRENCIES.length];
    setCurrency(next.code);
  };

  const localEquiv = !hidden ? formatReferenceEquivalent(user?.balance || 0) : null;

  return (
    <div className="space-y-3">
      {/* Single Unified Dignified Sovereign Balance Card */}
      <div className="balance-card-surface relative overflow-hidden rounded-[28px] p-5 text-white border border-[#F5D076]/22">
        {/* Bank-grade geometric guilloché filigree */}
        <div className="pointer-events-none absolute inset-0 exec-filigree opacity-75" />

        {/* Ambient Champagne Gold & Emerald Glows */}
        <div
          className="pointer-events-none absolute -top-16 -right-14 h-44 w-44 rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #F5D076 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #14B8A6 0%, transparent 70%)' }}
        />

        {/* Card Top Institutional Row */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-[#F5D076]/30 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-4 h-4 text-[#F5D076]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-extrabold text-white tracking-tight leading-none">
                  {t('wallet_central_title', 'المحفظة المركزية المعتمدة')}
                </p>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-300 mt-1 truncate">
                {t('wallet_account_no', 'حساب رقم')} #{1000 + (user?.id || 1)} •{' '}
                {t('wallet_instant_usdt', 'تسوية فورية USDT')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/18 px-2.5 py-1 text-[10px] font-bold text-teal-100">
              <Briefcase className="w-3 h-3 text-[#F5D076]" />
              <span>{jobTitle}</span>
            </span>
            <span className="gold-crest-pill inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold">
              <Crown className="w-3 h-3 text-[#061527]" />
              <span>
                {t('grade_prefix', 'الفئة A')}
                {user?.vipLevel ?? 0}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setHidden((h) => !h)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/18 border border-white/12 flex items-center justify-center text-white/85 transition-colors cursor-pointer"
              aria-label="إظهار أو إخفاء الرصيد"
            >
              {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center Main Metric: Income Wallet (Withdrawable Current Balance) + Recharge Wallet */}
        <div className="relative z-10 mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-teal-100/90 mb-1">
              {t('wallet_income_label', 'محفظة الدخل (الرصيد القابل للسحب)')}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="ltr-num tabular-nums font-display text-[32px] sm:text-[35px] font-extrabold tracking-tight text-white leading-none">
                ${maskOrFormat(user?.balance)}
              </span>
              <span className="rounded-lg bg-[#F5D076]/18 border border-[#F5D076]/35 px-2 py-0.5 text-[10.5px] font-extrabold tracking-wider text-[#F5D076]">
                USDT
              </span>
            </div>

            {/* Subtle Optional Local Reference Currency Converter Pill */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={cycleCurrency}
                title="تغيير العملة المرجعية التقريبية"
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/16 border border-white/15 px-2 py-0.5 text-[10px] font-bold text-[#F5D076] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span className="ltr-num">{currency}</span>
              </button>
              {localEquiv && (
                <span className="ltr-num tabular-nums text-[10.5px] font-bold text-teal-100/90">
                  {localEquiv}
                </span>
              )}
            </div>
          </div>

          {/* Secondary Wallet Pill: Recharge Balance */}
          <div className="rounded-2xl bg-slate-950/35 border border-white/15 backdrop-blur-xs px-3 py-2 text-left shrink-0">
            <p className="text-[10px] font-medium text-slate-300">
              {t('wallet_recharge_label', 'رصيد الشحن')}
            </p>
            <p className="ltr-num tabular-nums text-xs font-extrabold text-emerald-300 mt-0.5">
              ${maskOrFormat(user?.rechargeBalance ?? 0)} USDT
            </p>
          </div>
        </div>

        {/* Unified Bottom Sub-Metrics Panel: Total Deposits & Total Withdrawals */}
        <div className="relative z-10 grid grid-cols-2 rounded-2xl bg-slate-950/32 backdrop-blur-xs border border-white/14 p-3.5">
          <div className="flex items-center gap-2.5 pl-3 border-l border-white/14">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/18 border border-emerald-300/25 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium text-slate-300 truncate">
                {t('wallet_total_deposits', 'إجمالي الإيداعات')}
              </p>
              <p className="ltr-num tabular-nums text-sm font-extrabold text-white mt-0.5 truncate">
                ${maskOrFormat(user?.totalDeposits)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pr-3">
            <div className="w-8 h-8 rounded-xl bg-[#F5D076]/18 border border-[#F5D076]/30 flex items-center justify-center shrink-0">
              <ArrowUpFromLine className="w-4 h-4 text-[#F5D076]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium text-slate-300 truncate">
                {t('wallet_total_withdrawals', 'إجمالي المسحوبات')}
              </p>
              <p className="ltr-num tabular-nums text-sm font-extrabold text-white mt-0.5 truncate">
                ${maskOrFormat(user?.totalWithdrawals)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Sovereign Deposit & Withdraw Buttons */}
      {showActions && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onOpenDeposit()}
            className="exec-primary-btn flex items-center justify-center gap-2 rounded-2xl active:scale-[0.98] py-3.5 px-4 text-sm font-extrabold text-white transition-all cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 text-[#F5D076]" />
            <span>{t('btn_deposit', 'إيداع رصيد')}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenWithdraw()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] py-3.5 px-4 text-sm font-extrabold text-[#081E36] border border-slate-300/90 shadow-xs transition-all cursor-pointer"
          >
            <ArrowUpFromLine className="w-4 h-4 text-[#0D7A72]" />
            <span>{t('btn_withdraw', 'سحب الأرباح')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
