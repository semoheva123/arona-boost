import React, { useState, useEffect, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { apiRequest } from '../api';

const FALLBACK_ITEMS = [
  {
    id: 'fb-1',
    member: '0944***9063',
    text: 'استلم سحب أرباح فوري عبر TRC20 بقيمة 38.50 USDT'
  },
  {
    id: 'fb-2',
    member: '0963***2618',
    text: 'وثّق عقد أخصائي تصنيف سياحي ضمن درجات أرونا (الفئة A3)'
  },
  {
    id: 'fb-3',
    member: '0966***8309',
    text: 'استلم عائد محفظة «استثمر مع أرونا» بقيمة 16.80 USDT'
  }
];

export default function LiveActivityTicker({ enabled = true }) {
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [serverEnabled, setServerEnabled] = useState(true);
  const [index, setIndex] = useState(0);

  const loadFeed = useCallback(async () => {
    try {
      const res = await apiRequest('/api/live-activity', { token: null });
      if (res.enabled === false) {
        setServerEnabled(false);
        return;
      }
      setServerEnabled(true);
      if (Array.isArray(res.items) && res.items.length > 0) {
        setItems(
          res.items.map((it, idx) => ({
            id: it.id || `act-${idx}`,
            member: it.member || '',
            text: it.amountText ? `${it.text} (${it.amountText})` : it.text
          }))
        );
      }
    } catch {
      // keep fallback items silently
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    loadFeed();
    const refreshTimer = setInterval(loadFeed, 45000);
    return () => clearInterval(refreshTimer);
  }, [enabled, loadFeed]);

  useEffect(() => {
    if (!enabled || !serverEnabled || items.length <= 1) return;
    const cycleTimer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(cycleTimer);
  }, [enabled, serverEnabled, items.length]);

  if (!enabled || !serverEnabled || !items.length) return null;

  const current = items[index % items.length];

  return (
    <button
      type="button"
      onClick={() => setIndex((prev) => (prev + 1) % items.length)}
      title="اضغط لعرض الإشعار التالي"
      className="w-full rounded-2xl bg-white border border-slate-200/85 px-3.5 py-2.5 shadow-[0_6px_18px_-12px_rgba(7,24,43,0.12)] flex items-center gap-2.5 text-right cursor-pointer"
    >
      <div className="w-7 h-7 rounded-xl bg-[#0D7A72]/12 text-[#0D7A72] flex items-center justify-center shrink-0">
        <Volume2 className="w-4 h-4" />
      </div>

      <p
        key={current.id}
        className="text-[11.5px] font-bold text-slate-700 truncate flex-1 min-w-0 animate-editorial"
      >
        {current.member ? (
          <>
            <span>للموظف رقم </span>
            <span className="ltr-num font-extrabold text-[#07182B]">{current.member}</span>
            <span> — {current.text}</span>
          </>
        ) : (
          current.text
        )}
      </p>
    </button>
  );
}
