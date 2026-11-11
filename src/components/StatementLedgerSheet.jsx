import React, { useState, useEffect, useCallback } from 'react';
import ModalPortal from './ModalPortal';
import {
  X,
  CalendarDays,
  ScrollText,
  Loader2,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Compass,
  Users,
  Sparkles,
  Lock,
  Award,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { apiRequest, formatUsdt, formatDateTimeAr } from '../api';

export default function StatementLedgerSheet({
  isOpen,
  initialTab = 'daily', // 'daily' | 'ledger'
  onClose,
  showToast
}) {
  const [activeMode, setActiveMode] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [dailyStatements, setDailyStatements] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerFilter, setLedgerFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialTab || 'daily');
    }
  }, [isOpen, initialTab]);

  const loadRecords = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const data = await apiRequest('/api/account/financial-records');
      setDailyStatements(data.dailyStatements || []);
      setLedgerEntries(data.ledgerEntries || []);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [isOpen, showToast]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  if (!isOpen) return null;

  const total14DaysIncome = dailyStatements.reduce(
    (sum, d) => sum + Number(d.totalIncome || 0),
    0
  );

  const filteredLedger = ledgerEntries.filter((item) => {
    if (ledgerFilter === 'all') return true;
    if (ledgerFilter === 'tasks') return item.category === 'task' || item.category === 'flash';
    if (ledgerFilter === 'team')
      return (
        item.category === 'commission' ||
        item.category === 'salary' ||
        item.category === 'promotion'
      );
    if (ledgerFilter === 'transfers')
      return item.category === 'deposit' || item.category === 'withdraw';
    if (ledgerFilter === 'rewards')
      return (
        item.category === 'wheel' ||
        item.category === 'vault' ||
        item.category === 'vault_profit'
      );
    return true;
  });

  const renderCategoryIcon = (cat) => {
    if (cat === 'task' || cat === 'flash') {
      return <Compass className="w-4 h-4 text-teal-600" />;
    }
    if (cat === 'commission' || cat === 'salary' || cat === 'promotion') {
      return <Award className="w-4 h-4 text-indigo-600" />;
    }
    if (cat === 'deposit') {
      return <ArrowDownToLine className="w-4 h-4 text-emerald-600" />;
    }
    if (cat === 'withdraw') {
      return <ArrowUpFromLine className="w-4 h-4 text-amber-600" />;
    }
    if (cat === 'vault' || cat === 'vault_profit') {
      return <Lock className="w-4 h-4 text-cyan-700" />;
    }
    return <Sparkles className="w-4 h-4 text-amber-500" />;
  };

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[96] bg-slate-900/55 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[92dvh] flex flex-col rounded-t-3xl bg-[#F6F8FB] shadow-2xl animate-sheet overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200/85 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center">
              {activeMode === 'daily' ? (
                <CalendarDays className="w-5 h-5" />
              ) : (
                <ScrollText className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-900">
                {activeMode === 'daily' ? 'البيان اليومي للأرباح' : 'السجل المالي الشامل'}
              </h3>
              <p className="text-[11px] text-slate-500">
                كشف حساب تفصيلي لمحفظة الدخل ورصيد الشحن
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

        {/* Mode Switcher */}
        <div className="px-4 pt-3 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-200/75 p-1">
            <button
              type="button"
              onClick={() => setActiveMode('daily')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition-all cursor-pointer ${
                activeMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
              <span>البيان اليومي</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('ledger')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition-all cursor-pointer ${
                activeMode === 'ledger'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5 text-indigo-600" />
              <span>السجل المالي</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <p className="text-xs font-bold">جاري تحضير الكشف المالي...</p>
            </div>
          ) : activeMode === 'daily' ? (
            <>
              {/* Summary Banner */}
              <div className="rounded-2xl bg-gradient-to-l from-slate-900 via-slate-800 to-teal-900 text-white p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-teal-200/90 font-medium">
                    إجمالي العوائد المحققة (آخر 14 يوماً)
                  </p>
                  <p className="ltr-num tabular-nums text-xl font-extrabold mt-0.5">
                    +${formatUsdt(total14DaysIncome)}{' '}
                    <span className="text-xs text-teal-300">USDT</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/12 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                </div>
              </div>

              {/* Daily Rows */}
              <div className="space-y-2.5">
                {dailyStatements.map((day, idx) => {
                  const hasActivity =
                    day.totalIncome > 0 || day.depositsTotal > 0 || day.withdrawalsTotal > 0;
                  return (
                    <div
                      key={day.date}
                      className={`rounded-2xl border p-3.5 transition-all ${
                        hasActivity
                          ? 'bg-white border-slate-200/90 shadow-2xs'
                          : 'bg-white/65 border-slate-200/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="ltr-num tabular-nums text-xs font-extrabold text-slate-900">
                            {day.date}
                          </span>
                          {idx === 0 && (
                            <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-extrabold text-teal-700">
                              اليوم
                            </span>
                          )}
                        </div>
                        <span
                          className={`ltr-num tabular-nums text-sm font-extrabold ${
                            day.totalIncome > 0 ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          +${formatUsdt(day.totalIncome)} USDT
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] text-slate-500">دخل المهام ({day.tasksCount})</p>
                          <p className="ltr-num tabular-nums text-xs font-extrabold text-slate-800 mt-0.5">
                            +${formatUsdt(day.tasksIncome)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] text-slate-500">عمولات ورواتب</p>
                          <p className="ltr-num tabular-nums text-xs font-extrabold text-indigo-700 mt-0.5">
                            +${formatUsdt(day.teamIncome)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] text-slate-500">مكافآت وخزنة</p>
                          <p className="ltr-num tabular-nums text-xs font-extrabold text-amber-700 mt-0.5">
                            +${formatUsdt(day.rewardsIncome)}
                          </p>
                        </div>
                      </div>

                      {(day.depositsTotal > 0 || day.withdrawalsTotal > 0) && (
                        <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px]">
                          {day.depositsTotal > 0 ? (
                            <span className="text-emerald-700 font-bold ltr-num">
                              شحن: +${formatUsdt(day.depositsTotal)}
                            </span>
                          ) : (
                            <span />
                          )}
                          {day.withdrawalsTotal > 0 && (
                            <span className="text-amber-700 font-bold ltr-num">
                              سحب: -${formatUsdt(day.withdrawalsTotal)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Ledger Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'tasks', label: 'المهام' },
                  { id: 'team', label: 'الفريق والرواتب' },
                  { id: 'transfers', label: 'الشحن والسحب' },
                  { id: 'rewards', label: 'الاستثمار والمكافآت' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLedgerFilter(f.id)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-extrabold border transition-all cursor-pointer ${
                      ledgerFilter === f.id
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredLedger.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-200/80 p-8 text-center">
                  <ScrollText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">
                    لا توجد حركات مالية مسجلة ضمن هذا التصنيف بعد
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLedger.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white border border-slate-200/85 p-3.5 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                          {renderCategoryIcon(item.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold text-slate-900 truncate">
                              {item.categoryAr}
                            </span>
                            {item.status === 'pending' ? (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-700">
                                <Clock className="w-2.5 h-2.5" />
                                مراجعة
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                مؤكد
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.walletAr} • {formatDateTimeAr(item.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <p
                          className={`ltr-num tabular-nums text-sm font-extrabold ${
                            item.direction === 'in' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {item.direction === 'in' ? '+' : '-'}${formatUsdt(item.amount)}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 ltr-num">USDT</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
