import React, { useState, useMemo } from 'react';
import { Calculator, Award, ArrowDownToLine } from 'lucide-react';
import { formatUsdt } from '../api';

export default function ProfitCalculator({ vipLevels = [], onOpenDeposit }) {
  const [depositInput, setDepositInput] = useState(150);

  const paidLevels = useMemo(
    () => vipLevels.filter((v) => v.level >= 1),
    [vipLevels]
  );

  const calculation = useMemo(() => {
    const val = Math.max(0, Number(depositInput || 0));
    let matched = vipLevels[0] || {
      level: 0,
      name: 'الفئة A0',
      title: 'متدرب تقييم رقمي',
      dailyTasks: 1,
      dailyProfit: 0.25,
      monthlyProfit: 7.5,
      dailyRate: 'تجريبي'
    };
    for (const lvl of paidLevels) {
      if (val >= lvl.minDeposit) {
        matched = lvl;
      }
    }
    return matched;
  }, [depositInput, vipLevels, paidLevels]);

  return (
    <div className="exec-card rounded-[26px] p-4 space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#07182B] text-[#F5D076] border border-[#F5D076]/35 flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-extrabold text-[#07182B]">
              حاسبة العوائد وعقود التوظيف
            </h3>
            <p className="text-[11px] text-slate-500">احتساب فوري للدخل اليومي والشهري المتوقع</p>
          </div>
        </div>

        <span className="gold-crest-pill inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold">
          <Award className="w-3.5 h-3.5 text-[#061527]" />
          <span>الفئة A{calculation.level ?? 0}</span>
        </span>
      </div>

      {/* Amount Slider & Quick Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">قيمة ضمان العقد المقدر:</span>
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200/80 px-2.5 py-1">
            <input
              type="number"
              min="20"
              max="5000"
              value={depositInput}
              onChange={(e) => setDepositInput(e.target.value)}
              className="w-16 text-left font-extrabold text-[#07182B] bg-transparent outline-none tabular-nums ltr-num"
            />
            <span className="text-[10px] font-extrabold text-[#0D7A72]">USDT</span>
          </div>
        </div>

        <input
          type="range"
          min="20"
          max="2500"
          step="10"
          value={Math.min(2500, Math.max(20, Number(depositInput || 20)))}
          onChange={(e) => setDepositInput(Number(e.target.value))}
          className="w-full accent-[#07182B] cursor-pointer"
        />

        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 tabular-nums ltr-num">
          <span>$20</span>
          <span>$150</span>
          <span>$400</span>
          <span>$1,000</span>
          <span>$2,500</span>
        </div>
      </div>

      {/* Calculated Results */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/90 border border-slate-200/75 p-3 text-center">
        <div>
          <p className="text-[10px] font-semibold text-slate-500">العائد اليومي</p>
          <p className="ltr-num tabular-nums text-xs font-extrabold text-emerald-700 mt-0.5">
            +${formatUsdt(calculation.dailyProfit)}
          </p>
        </div>
        <div className="border-x border-slate-200/80">
          <p className="text-[10px] font-semibold text-slate-500">الدخل الشهري</p>
          <p className="ltr-num tabular-nums text-xs font-extrabold text-[#07182B] mt-0.5">
            ${formatUsdt(calculation.monthlyProfit)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-500">حصة التقييم</p>
          <p className="text-xs font-extrabold text-[#07182B] mt-0.5">
            {calculation.dailyTasks} وجهات
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenDeposit(Math.max(20, Number(depositInput || 20)), calculation)}
        className="exec-primary-btn w-full flex items-center justify-center gap-1.5 rounded-2xl text-white py-3 text-xs font-extrabold transition-all cursor-pointer"
      >
        <ArrowDownToLine className="w-3.5 h-3.5 text-[#F5D076]" />
        <span>
          توثيق ضمان {formatUsdt(Math.max(20, Number(depositInput || 20)))} USDT وتفعيل العقد
        </span>
      </button>
    </div>
  );
}
