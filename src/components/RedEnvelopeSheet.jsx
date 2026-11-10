import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Gift,
  Sparkles,
  Loader2,
  CheckCircle2,
  History,
  Wallet
} from 'lucide-react';
import { apiRequest, formatUsdt, formatDateTimeAr } from '../api';

export default function RedEnvelopeSheet({ isOpen, onClose, onUserUpdated, showToast }) {
  const [code, setCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [data, setData] = useState({ claims: [], totalReceived: 0 });
  const [loading, setLoading] = useState(false);
  const [wonBanner, setWonBanner] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/red-envelope');
      setData({
        claims: res.claims || [],
        totalReceived: Number(res.totalReceived || 0)
      });
    } catch {
      // ignore transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setWonBanner(null);
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  if (!isOpen) return null;

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('يرجى إدخال رمز الظرف الأحمر أولاً', 'error');
      return;
    }
    setClaiming(true);
    try {
      const res = await apiRequest('/api/red-envelope/claim', {
        method: 'POST',
        body: { code: code.trim() }
      });
      setWonBanner(res.amount);
      setCode('');
      if (res.user) onUserUpdated?.(res.user);
      showToast(res.message);
      await loadHistory();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[92dvh] flex flex-col rounded-t-[30px] sm:rounded-[30px] bg-[#F4F7FB] shadow-2xl overflow-hidden animate-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Royal Sovereign Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#F5D076]/30 relative"
          style={{
            background: 'linear-gradient(145deg, #051322 0%, #16294A 52%, #6E1C2A 100%)'
          }}
        >
          <div className="pointer-events-none absolute inset-0 exec-filigree opacity-50" />
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F5D076]/20 border border-[#F5D076]/45 flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#F5D076]" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-white">
                مكافأة الظرف الأحمر — Arona Boost
              </h3>
              <p className="text-[10.5px] text-amber-100/90">
                أدخل رمز الظرف الأحمر للحصول على مكافأة نقدية فورية في محفظة الدخل
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 w-8 h-8 rounded-full bg-white/12 hover:bg-white/22 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Celebration Banner when claimed */}
          {wonBanner !== null && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-emerald-900">
                    تهانينا! تمت إضافة المكافأة إلى محفظة الدخل
                  </p>
                  <p className="text-[11px] text-emerald-700">+15 نقطة إضافية في متجر النقاط</p>
                </div>
              </div>
              <span className="ltr-num font-display text-base font-extrabold text-emerald-700">
                +${formatUsdt(wonBanner)}
              </span>
            </div>
          )}

          {/* Code Input Card */}
          <form
            onSubmit={handleClaim}
            className="exec-royal-surface relative overflow-hidden rounded-[26px] p-4 text-white border border-[#F5D076]/35 space-y-3.5"
          >
            <div className="pointer-events-none absolute inset-0 exec-filigree opacity-55" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F5D076]">
                <Sparkles className="w-4 h-4" />
                <span>رمز الظرف الأحمر الرسمي</span>
              </span>
              <span className="ltr-num text-[11px] font-bold text-teal-200 inline-flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-[#F5D076]" />
                إجمالي المستلم: ${formatUsdt(data.totalReceived)} USDT
              </span>
            </div>

            <div className="relative z-10">
              <input
                type="text"
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="أدخل رمز الظرف الأحمر (مثال: ARONA2026)"
                className="w-full rounded-2xl bg-slate-950/55 border border-[#F5D076]/35 px-4 py-3 text-center font-mono text-sm font-extrabold tracking-wider text-[#F5D076] placeholder:text-slate-400 focus:outline-none focus:border-[#F5D076]"
              />
            </div>

            <button
              type="submit"
              disabled={claiming}
              className="relative z-10 w-full gold-crest-pill rounded-2xl py-3 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {claiming ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#061527]" />
              ) : (
                <Gift className="w-4 h-4 text-[#061527]" />
              )}
              <span>{claiming ? 'جاري فتح الظرف الأحمر...' : 'استلام المكافأة النقدية'}</span>
            </button>

            <p className="relative z-10 text-[10.5px] text-slate-300 text-center leading-relaxed">
              ملاحظة: يتم إيداع قيمة الظرف الأحمر مباشرة في «محفظة الدخل» القابلة للسحب فور التحقق من الرمز.
            </p>
          </form>

          {/* Red Envelope Claim History */}
          <div className="exec-card rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-xs font-extrabold text-[#07182B] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#0D7A72]" />
                <span>سجل الظرف الأحمر</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-500">
                {data.claims.length} عملية
              </span>
            </div>

            {loading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#0D7A72]" />
              </div>
            ) : data.claims.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                لم تقم بصرف أي ظرف أحمر بعد — جرّب رمز الترحيب النشط الآن!
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.claims.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-extrabold text-[#07182B]">{c.code}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTimeAr(c.createdAt)}</p>
                    </div>
                    <span className="ltr-num rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                      +${formatUsdt(c.amount)} USDT
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
