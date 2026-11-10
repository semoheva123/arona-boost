import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Plus, Trash2, BellRing, Loader2 } from 'lucide-react';
import { apiRequest, formatUsdt } from '../api';

export default function AdminRedEnvelopePanel({ welcomePopup, showToast, onRefresh }) {
  const [envelopes, setEnvelopes] = useState([]);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('مكافأة الظرف الأحمر الرسمية');
  const [rewardAmount, setRewardAmount] = useState('2');
  const [maxClaims, setMaxClaims] = useState('50');
  const [minVip, setMinVip] = useState('0');
  const [creating, setCreating] = useState(false);

  const [popupEnabled, setPopupEnabled] = useState(welcomePopup?.enabled !== false);
  const [popupTitle, setPopupTitle] = useState(
    welcomePopup?.title || 'إشعار الموظفين الرسمي — Arona Boost'
  );
  const [popupBody, setPopupBody] = useState(welcomePopup?.body || '');
  const [savingPopup, setSavingPopup] = useState(false);

  const loadEnvelopes = useCallback(async () => {
    try {
      const res = await apiRequest('/api/admin/red-envelopes');
      setEnvelopes(res.envelopes || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadEnvelopes();
  }, [loadEnvelopes]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await apiRequest('/api/admin/red-envelopes', {
        method: 'POST',
        body: {
          code,
          title,
          rewardAmount: Number(rewardAmount),
          maxClaims: Number(maxClaims),
          minVip: Number(minVip)
        }
      });
      showToast(res.message);
      setCode('');
      await loadEnvelopes();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await apiRequest(`/api/admin/red-envelopes/${id}`, { method: 'DELETE' });
      showToast(res.message);
      await loadEnvelopes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSavePopup = async () => {
    setSavingPopup(true);
    try {
      const res = await apiRequest('/api/admin/welcome-popup', {
        method: 'POST',
        body: {
          enabled: popupEnabled,
          title: popupTitle,
          body: popupBody
        }
      });
      showToast(res.message);
      onRefresh?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPopup(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Red Envelope Codes Manager */}
      <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">
              إدارة أكواد «الظرف الأحمر» النقدية
            </h4>
            <p className="text-[10.5px] text-slate-500">
              أنشئ رمز هدية لنشره في مجموعات الموظفين بمكافأة USDT فورية ومقاعد محددة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            dir="ltr"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="الرمز (مثال: GIFT50)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-extrabold"
          />
          <input
            type="number"
            step="0.1"
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
            placeholder="المكافأة ($)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold ltr-num"
          />
          <input
            type="number"
            value={maxClaims}
            onChange={(e) => setMaxClaims(e.target.value)}
            placeholder="عدد المقاعد"
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold ltr-num"
          />
          <select
            value={minVip}
            onChange={(e) => setMinVip(e.target.value)}
            className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold bg-white"
          >
            {[0, 1, 2, 3, 4, 5, 6].map((lvl) => (
              <option key={lvl} value={lvl}>
                الفئة A{lvl} فأعلى
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={creating}
          onClick={handleCreate}
          className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-[#F5D076] py-2.5 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          <span>إنشاء رمز ظرف أحمر جديد</span>
        </button>

        {envelopes.length > 0 && (
          <div className="divide-y divide-slate-100 pt-1">
            {envelopes.map((env) => (
              <div key={env.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono font-extrabold text-slate-900">{env.code}</span>
                  <span className="text-[10.5px] text-slate-500 mr-2">
                    • +${formatUsdt(env.rewardAmount)} • استُلم {env.claimedCount}/{env.maxClaims} (A
                    {env.minVip}+)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(env.id)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Welcome Notice Popup Manager */}
      <div className="rounded-3xl bg-white border border-slate-200/85 p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">نافذة التعميم المنبثقة عند الدخول</h4>
              <p className="text-[10.5px] text-slate-500">تظهر للموظفين تلقائياً عند فتح المنصة</p>
            </div>
          </div>

          <input
            type="checkbox"
            checked={popupEnabled}
            onChange={(e) => setPopupEnabled(e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        <input
          type="text"
          value={popupTitle}
          onChange={(e) => setPopupTitle(e.target.value)}
          placeholder="عنوان التعميم"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
        />
        <textarea
          rows={3}
          value={popupBody}
          onChange={(e) => setPopupBody(e.target.value)}
          placeholder="نص إشعار الموظفين..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs leading-relaxed"
        />
        <button
          type="button"
          disabled={savingPopup}
          onClick={handleSavePopup}
          className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white py-2 text-xs font-extrabold cursor-pointer"
        >
          {savingPopup ? 'جاري الحفظ...' : 'حفظ إعدادات نافذة الترحيب'}
        </button>
      </div>
    </div>
  );
}
