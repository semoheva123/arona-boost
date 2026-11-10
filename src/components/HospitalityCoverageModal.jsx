import React, { useState, useEffect } from 'react';
import {
  X,
  Globe2,
  ShieldCheck,
  Clock,
  Building2,
  Star,
  CheckCircle2,
  MapPin,
  Loader2
} from 'lucide-react';
import { apiRequest } from '../api';

export function HospitalityCoverageContent() {
  const [metrics, setMetrics] = useState(null);
  const [selectedHubId, setSelectedHubId] = useState('dxb');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiRequest('/api/transparency-metrics')
      .then((res) => {
        if (!mounted) return;
        setMetrics(res);
        if (res?.regionalHubs?.[0]?.id) {
          setSelectedHubId(res.regionalHubs[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-[#0D7A72]" />
        <span className="text-xs">جاري تحميل خريطة العقود ومؤشر الشفافية...</span>
      </div>
    );
  }

  const hubs = metrics?.regionalHubs || [];
  const activeHub = hubs.find((h) => h.id === selectedHubId) || hubs[0];

  return (
    <div className="space-y-3.5">
      {/* Live Institutional Transparency Index */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white border border-slate-200/90 p-3 text-center shadow-2xs">
          <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <p className="ltr-num tabular-nums text-sm font-extrabold text-slate-900">
            {metrics?.avgSettlementMinutes ?? 4.2} د
          </p>
          <p className="text-[10px] font-bold text-slate-500 mt-0.5">متوسط تسوية السحب</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-3 text-center shadow-2xs">
          <div className="w-7 h-7 mx-auto rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <p className="ltr-num tabular-nums text-sm font-extrabold text-emerald-700">
            {metrics?.blockchainAuditRatePct ?? 99.8}%
          </p>
          <p className="text-[10px] font-bold text-slate-500 mt-0.5">دقة تدقيق العقود</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-3 text-center shadow-2xs">
          <div className="w-7 h-7 mx-auto rounded-lg bg-sky-50 text-[#081E36] flex items-center justify-center mb-1">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <p className="ltr-num tabular-nums text-sm font-extrabold text-[#081E36]">
            {(metrics?.totalHospitalityReports || 14820).toLocaleString('en-US')}
          </p>
          <p className="text-[10px] font-bold text-slate-500 mt-0.5">تقرير سياحي وفندقي</p>
        </div>
      </div>

      {/* Interactive Regional Hospitality & Tourism Map */}
      <div
        className="relative overflow-hidden rounded-[24px] p-4 text-white border border-[#F5D076]/30"
        style={{
          background: 'linear-gradient(155deg, #04101E 0%, #081F38 58%, #0B3F4C 100%)'
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Globe2 className="w-4 h-4 text-[#F5D076]" />
            <span className="text-xs font-extrabold">خريطة المنتجعات والفنادق والوجهات الشريكة</span>
          </div>
          <span className="ltr-num rounded-full bg-emerald-400/15 border border-emerald-300/30 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300">
            {metrics?.contractedHotelsTotal ?? 199} وجهة ومنشأة
          </span>
        </div>

        {/* Stylized EMEA Regional Map Canvas */}
        <div className="relative w-full h-44 rounded-2xl bg-[#030C18]/75 border border-white/10 overflow-hidden">
          <svg
            viewBox="0 0 100 76"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Latitude / Longitude Grid */}
            {[15, 30, 45, 60].map((y) => (
              <line
                key={`lat-${y}`}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="rgba(148,163,184,0.12)"
                strokeWidth="0.3"
              />
            ))}
            {[20, 40, 60, 80].map((x) => (
              <line
                key={`lon-${x}`}
                x1={x}
                y1="0"
                x2={x}
                y2="76"
                stroke="rgba(148,163,184,0.12)"
                strokeWidth="0.3"
              />
            ))}

            {/* Stylized Europe + MENA landmass silhouette */}
            <path
              d="M18,22 L28,16 L42,18 L52,25 L62,28 L76,34 L82,48 L72,64 L58,66 L48,58 L42,64 L26,60 L20,46 Z"
              fill="rgba(20, 184, 166, 0.11)"
              stroke="rgba(245, 208, 118, 0.25)"
              strokeWidth="0.45"
            />

            {/* Network Arcs from Dubai Flagship Hub */}
            {hubs.map((h) =>
              h.id !== 'dxb' ? (
                <line
                  key={`arc-${h.id}`}
                  x1="68"
                  y1="56"
                  x2={h.x}
                  y2={h.y}
                  stroke="rgba(245,208,118,0.28)"
                  strokeDasharray="1.2 1.2"
                  strokeWidth="0.4"
                />
              ) : null
            )}

            {/* Clickable Hub Beacons */}
            {hubs.map((h) => {
              const isSelected = h.id === activeHub?.id;
              return (
                <g
                  key={h.id}
                  onClick={() => setSelectedHubId(h.id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={h.x}
                    cy={h.y}
                    r={isSelected ? 4.4 : 2.8}
                    fill={isSelected ? 'rgba(245,208,118,0.28)' : 'rgba(16,185,129,0.22)'}
                  />
                  <circle
                    cx={h.x}
                    cy={h.y}
                    r={isSelected ? 1.9 : 1.3}
                    fill={isSelected ? '#F5D076' : '#34D399'}
                    stroke="#04101E"
                    strokeWidth="0.45"
                  />
                </g>
              );
            })}
          </svg>

          <p className="absolute bottom-2 right-2.5 text-[9.5px] text-slate-300/90">
            اضغط على أي مركز إقليمي لمعاينة العقود الفندقية النشطة
          </p>
        </div>

        {/* City Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-0.5 no-scrollbar">
          {hubs.map((h) => {
            const active = h.id === activeHub?.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedHubId(h.id)}
                className={`shrink-0 rounded-xl px-2.5 py-1 text-[10.5px] font-extrabold border transition-all cursor-pointer ${
                  active
                    ? 'bg-[#F5D076] text-[#051322] border-[#F5D076]'
                    : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/18'
                }`}
              >
                {h.city}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hub Live Dossier */}
      {activeHub && (
        <div className="rounded-2xl bg-white border border-slate-200/95 p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#081E36] text-[#F5D076] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  {activeHub.city} — {activeHub.country}
                </h4>
                <p className="text-[10.5px] text-slate-500">{activeHub.flagship}</p>
              </div>
            </div>
            <span className="ltr-num rounded-lg bg-teal-50 border border-teal-200 px-2 py-1 text-[10.5px] font-extrabold text-[#0D7A72]">
              {activeHub.codePrefix}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="rounded-xl bg-slate-50 p-2 text-center">
              <span className="block text-[9.5px] text-slate-500">فنادق متعاقدة</span>
              <strong className="ltr-num text-xs font-extrabold text-slate-900">
                {activeHub.contractedHotels} منشأة
              </strong>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 text-center">
              <span className="block text-[9.5px] text-slate-500">عقود اليوم</span>
              <strong className="ltr-num text-xs font-extrabold text-[#0D7A72]">
                {activeHub.activeContractsToday} عقد
              </strong>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 text-center">
              <span className="block text-[9.5px] text-slate-500">متوسط التقييم</span>
              <strong className="ltr-num text-xs font-extrabold text-amber-600 inline-flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {activeHub.avgRating}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-700 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>متاح للتقييم اليومي وتسوية العوائد الفورية بعملة USDT</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HospitalityCoverageModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[92dvh] flex flex-col rounded-t-[30px] bg-[#F4F7FB] shadow-2xl animate-sheet overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#F5D076]/25"
          style={{
            background: 'linear-gradient(145deg, #051322 0%, #0A2542 60%, #0D6E68 100%)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/12 border border-[#F5D076]/35 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-[#F5D076]" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-white">
                خريطة المنتجعات والفنادق والوجهات السياحية
              </h3>
              <p className="text-[10.5px] text-teal-100/85">
                التغطية الإقليمية الحية وسرعة تسوية مقاصة USDT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/12 hover:bg-white/22 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <HospitalityCoverageContent />
        </div>
      </div>
    </div>
  );
}
