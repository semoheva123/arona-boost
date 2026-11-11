import React, { useState } from 'react';
import { Eye, EyeOff, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { formatUsdt } from '../api';
import { useI18n } from '../i18n';

export default function BalanceCard({
  user,
  onOpenDeposit,
  onOpenWithdraw,
  showActions = true
}) {
  const [hidden, setHidden] = useState(false);
  const { t } = useI18n();

  const maskOrFormat = (val) => (hidden ? '••••••' : formatUsdt(val));

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 text-white shadow-[0_10px_28px_-8px_rgba(7,24,43,0.28)]"
      style={{
        background: 'linear-gradient(128deg, #07182B 0%, #0B3650 52%, #0D7A72 100%)'
      }}
    >
      {/* Subtle soft glow like IMG_4503.png wallet card */}
      <div
        className="pointer-events-none absolute -top-12 -left-10 w-36 h-36 rounded-full opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, #F5D076 0%, transparent 70%)' }}
      />

      {/* Top Row: Wallet Icon + محفظة الدخل + Eye Toggle */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#F5D076]" />
          </div>
          <span className="text-[13px] font-bold text-white/95">
            {t('wallet_income_short', 'محفظة الدخل')} :
          </span>
        </div>

        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          aria-label="إظهار أو إخفاء الرصيد"
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/85 transition-colors cursor-pointer"
        >
          {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Balance Row (exact IMG_4503.png typography) */}
      <div className="relative z-10 mt-2 mb-3 flex items-baseline gap-2">
        <span className="text-xs font-bold text-[#F5D076]">(USDT)</span>
        <span className="ltr-num tabular-nums font-display text-[28px] font-extrabold tracking-tight text-white leading-none">
          {maskOrFormat(user?.balance)}
        </span>
      </div>

      {/* Recharge Balance + Total Deposits / Withdrawals Row */}
      <div className="relative z-10 pt-2.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-[11.5px]">
        <div className="flex items-center gap-1.5">
          <span className="text-white/80 font-semibold">
            {t('wallet_recharge_label', 'رصيد الشحن')} :
          </span>
          <span className="ltr-num tabular-nums font-extrabold text-[#F5D076]">
            (USDT) {maskOrFormat(user?.rechargeBalance ?? 0)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-white/85">
          <span>
            الإيداعات:{' '}
            <strong className="ltr-num tabular-nums text-white">
              ${maskOrFormat(user?.totalDeposits)}
            </strong>
          </span>
          <span className="text-white/30">|</span>
          <span>
            المسحوبات:{' '}
            <strong className="ltr-num tabular-nums text-white">
              ${maskOrFormat(user?.totalWithdrawals)}
            </strong>
          </span>
        </div>
      </div>

      {/* Clean Side-by-Side Deposit & Withdraw Buttons inside the Same Unified Card */}
      {showActions && (
        <div className="relative z-10 grid grid-cols-2 gap-2.5 mt-3.5">
          <button
            type="button"
            onClick={() => onOpenDeposit?.()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#F5D076] hover:bg-[#f7da8d] text-[#07182B] py-2.5 px-3 text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>{t('btn_deposit', 'إيداع رصيد')}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenWithdraw?.()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/14 hover:bg-white/22 border border-white/25 text-white py-2.5 px-3 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 text-[#F5D076]" />
            <span>{t('btn_withdraw', 'سحب الأرباح')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
