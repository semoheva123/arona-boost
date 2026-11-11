import React, { useState, useEffect, useCallback } from 'react';
import ModalPortal from './ModalPortal';
import {
  X,
  Gift,
  Sparkles,
  ArrowDownToLine,
  Loader2,
  Trophy
} from 'lucide-react';
import { apiRequest, formatUsdt, formatDateTimeAr } from '../api';

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    cx,
    cy,
    'L',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'Z'
  ].join(' ');
}

export default function LuckyWheelSheet({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onOpenDeposit,
  showToast
}) {
  const [wheelData, setWheelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);

  const loadWheel = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/wheel');
      setWheelData(res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      setWonPrize(null);
      loadWheel();
    }
  }, [isOpen, loadWheel]);

  if (!isOpen) return null;

  const segments = wheelData?.segments || [];
  const spinCredits = wheelData?.spinCredits ?? user?.spinCredits ?? 0;
  const minDeposit = wheelData?.minDepositForSpin ?? 20;
  const count = segments.length || 6;
  const sliceAngle = 360 / count;

  const handleSpin = async () => {
    if (spinning) return;
    if (spinCredits <= 0) {
      showToast(`تحتاج إلى لفة متاحة! أودع ${minDeposit} USDT فأكثر للحصول على لفة مجانية`, 'error');
      return;
    }

    setSpinning(true);
    setWonPrize(null);

    try {
      const res = await apiRequest('/api/wheel/spin', { method: 'POST' });
      const winIdx = Number(res.winningIndex || 0);

      // Slice i occupies [i * sliceAngle, (i+1) * sliceAngle], center at (i + 0.5) * sliceAngle.
      // To bring that slice center under the top pointer (0 deg), target angle mod 360 = 360 - centerAngle.
      const centerAngle = (winIdx + 0.5) * sliceAngle;
      const desiredMod = (360 - centerAngle + 360) % 360;
      const currentMod = ((rotationDeg % 360) + 360) % 360;
      const extraSpins = 360 * 6; // 6 full turns
      const delta = (desiredMod - currentMod + 360) % 360;
      const nextRotation = rotationDeg + extraSpins + delta;

      setRotationDeg(nextRotation);

      setTimeout(() => {
        setSpinning(false);
        setWonPrize(res.segment);
        if (res.user && onUserUpdated) onUserUpdated(res.user);
        showToast(res.message);
        loadWheel();
      }, 4500);
    } catch (err) {
      setSpinning(false);
      showToast(err.message, 'error');
    }
  };

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[92] bg-slate-900/60 backdrop-blur-xs flex items-end justify-center"
      onClick={() => !spinning && onClose()}
    >
      <div
        className="w-full max-w-[430px] max-h-[93dvh] flex flex-col rounded-t-3xl bg-[#F5F7FA] shadow-2xl animate-sheet overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between shrink-0"
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 52%, #0D9488 100%)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/35 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold">عجلة مكافآت الإيداع</h3>
              <p className="text-[11px] text-indigo-100/85">
                جوائز فورية بعملة USDT تُضاف مباشرة لرصيدك
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={spinning}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && !wheelData ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : (
            <>
              {/* Spins Balance Banner */}
              <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      رصيد لفات الحظ المتاحة لديك
                    </p>
                    <p className="text-[10.5px] text-slate-500">
                      +1 لفة مجانية لكل إيداع بقيمة{' '}
                      <strong className="ltr-num">${minDeposit}+ USDT</strong>
                    </p>
                  </div>
                </div>
                <span className="ltr-num tabular-nums rounded-xl bg-slate-900 text-amber-300 px-3 py-1.5 text-sm font-extrabold">
                  {spinCredits} لفات
                </span>
              </div>

              {/* Interactive SVG Wheel */}
              <div className="rounded-3xl bg-white border border-slate-200/85 p-5 flex flex-col items-center shadow-2xs relative overflow-hidden">
                {/* Top Pointer */}
                <div className="z-20 -mb-3 drop-shadow-md">
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: '13px solid transparent',
                      borderRight: '13px solid transparent',
                      borderTop: '22px solid #F59E0B'
                    }}
                  />
                </div>

                {/* Rotating Wheel */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div
                    className="w-full h-full rounded-full shadow-lg border-4 border-slate-900 overflow-hidden"
                    style={{
                      transform: `rotate(${rotationDeg}deg)`,
                      transition: spinning
                        ? 'transform 4.4s cubic-bezier(0.15, 0.88, 0.22, 1)'
                        : 'none'
                    }}
                  >
                    <svg viewBox="0 0 260 260" className="w-full h-full">
                      {segments.map((seg, i) => {
                        const startA = i * sliceAngle;
                        const endA = (i + 1) * sliceAngle;
                        const midA = startA + sliceAngle / 2;
                        const labelPos = polarToCartesian(130, 130, 82, midA);

                        return (
                          <g key={seg.id || i}>
                            <path
                              d={describeSlice(130, 130, 128, startA, endA)}
                              fill={seg.color || '#0D9488'}
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                            <text
                              x={labelPos.x}
                              y={labelPos.y}
                              fill="#FFFFFF"
                              fontSize="11.5"
                              fontWeight="800"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${midA}, ${labelPos.x}, ${labelPos.y})`}
                            >
                              {seg.label}
                            </text>
                          </g>
                        );
                      })}
                      <circle cx="130" cy="130" r="24" fill="#0F172A" stroke="#FBBF24" strokeWidth="4" />
                    </svg>
                  </div>
                </div>

                {/* Celebratory Win Alert */}
                {wonPrize && (
                  <div className="mt-4 w-full rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center animate-tab">
                    <p className="text-xs font-extrabold text-emerald-900 flex items-center justify-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>مبارك! ربحت {wonPrize.label} وأُضيفت لرصيدك فوراً!</span>
                    </p>
                  </div>
                )}

                {/* Spin CTA or Deposit CTA */}
                <div className="mt-4 w-full space-y-2">
                  <button
                    type="button"
                    disabled={spinning || spinCredits <= 0}
                    onClick={handleSpin}
                    className="w-full rounded-2xl bg-gradient-to-l from-amber-500 to-orange-500 hover:opacity-95 disabled:opacity-45 text-slate-950 py-3.5 text-sm font-extrabold shadow-md transition-all cursor-pointer"
                  >
                    {spinning
                      ? 'جاري دوران العجلة...'
                      : spinCredits > 0
                      ? 'أدر عجلة الحظ الآن 🎡'
                      : 'لا توجد لفات متاحة حالياً'}
                  </button>

                  {spinCredits <= 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDeposit(minDeposit);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 text-white py-3 text-xs font-extrabold cursor-pointer"
                    >
                      <ArrowDownToLine className="w-4 h-4 text-teal-400" />
                      <span>أودع ${minDeposit} USDT للحصول على لفة مجانية</span>
                    </button>
                  )}
                </div>
              </div>

              {/* User's Spin Wins History */}
              {wheelData?.myHistory?.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-200/85 p-3.5 space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900">سجل جوائزك السابقة</h4>
                  <div className="divide-y divide-slate-100">
                    {wheelData.myHistory.map((h) => (
                      <div key={h.id} className="py-2 flex items-center justify-between text-xs">
                        <span className="text-slate-600">{formatDateTimeAr(h.createdAt)}</span>
                        <span className="ltr-num font-extrabold text-emerald-700">
                          +${formatUsdt(h.reward)} USDT
                        </span>
                      </div>
                    ))}
                  </div>
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
