import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Gift,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import { apiRequest, formatDateTimeAr } from '../api';

export default function NotificationsSheet({
  isOpen,
  onClose,
  onUserUpdated,
  showToast
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/notifications');
      setItems(res.notifications || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      const res = await apiRequest('/api/notifications/read-all', { method: 'POST' });
      onUserUpdated(res.user);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('تم تحديد جميع الإشعارات كمقروءة');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setMarking(false);
    }
  };

  const renderIcon = (type) => {
    if (type === 'reward') {
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4" />
        </div>
      );
    }
    if (type === 'success') {
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    }
    if (type === 'warning') {
      return (
        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/70 flex items-center justify-center shrink-0">
        <Info className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-900">
                مركز الإشعارات
              </h3>
              <p className="text-[11px] text-slate-500">تنبيهات الحساب والعمليات والمكافآت</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {items.some((i) => !i.isRead) && (
              <button
                type="button"
                disabled={marking}
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 rounded-xl bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 text-[11px] font-bold text-teal-800 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>قراءة الكل</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="text-xs">جاري تحميل الإشعارات...</span>
          </div>
        ) : !items.length ? (
          <div className="py-12 text-center">
            <p className="text-sm font-bold text-slate-700">لا توجد إشعارات حالياً</p>
            <p className="text-xs text-slate-400 mt-1">
              ستظهر هنا كافة تنبيهات الإيداع والسحب والمكافآت
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((n) => (
              <div
                key={n.id}
                className={`rounded-2xl border p-3.5 flex items-start gap-3 transition-colors ${
                  n.isRead
                    ? 'bg-white border-slate-200/80'
                    : 'bg-teal-50/45 border-teal-200/90'
                }`}
              >
                {renderIcon(n.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {formatDateTimeAr(n.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
