import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShoppingBag,
  Award,
  Loader2,
  CheckCircle2,
  History,
  Package,
  MapPin,
  Wallet
} from 'lucide-react';
import { apiRequest, formatUsdt, formatDateTimeAr } from '../api';

export default function PointShopSheet({ isOpen, user, onClose, onUserUpdated, showToast }) {
  const [tab, setTab] = useState('shop'); // 'shop' | 'orders' | 'logs'
  const [shopData, setShopData] = useState({
    pointsBalance: user?.pointsBalance || 0,
    items: [],
    orders: [],
    logs: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPhysicalItem, setSelectedPhysicalItem] = useState(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [redeemingId, setRedeemingId] = useState(null);

  const loadShop = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/point-shop');
      setShopData({
        pointsBalance: Number(res.pointsBalance ?? user?.pointsBalance ?? 0),
        items: res.items || [],
        orders: res.orders || [],
        logs: res.logs || []
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.pointsBalance]);

  useEffect(() => {
    if (isOpen) {
      loadShop();
    }
  }, [isOpen, loadShop]);

  if (!isOpen) return null;

  const executeRedeem = async (item, addr = '') => {
    setRedeemingId(item.id);
    try {
      const res = await apiRequest('/api/point-shop/redeem', {
        method: 'POST',
        body: { itemId: item.id, shippingAddress: addr }
      });
      if (res.user) onUserUpdated?.(res.user);
      showToast(res.message);
      setSelectedPhysicalItem(null);
      setShippingAddress('');
      await loadShop();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRedeemingId(null);
    }
  };

  const handleRedeemClick = (item) => {
    if (shopData.pointsBalance < item.pointsCost) {
      showToast('رصيد نقاطك الحالي غير كافٍ لاستبدال هذا العنصر', 'error');
      return;
    }
    if (item.category === 'physical') {
      setSelectedPhysicalItem(item);
      return;
    }
    executeRedeem(item, '');
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
        {/* Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#F5D076]/30"
          style={{
            background: 'linear-gradient(145deg, #051322 0%, #0A2542 60%, #0D6E68 100%)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F5D076]/18 border border-[#F5D076]/40 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#F5D076]" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-white">
                متجر النقاط — Arona Boost
              </h3>
              <p className="text-[10.5px] text-teal-100/90">
                استبدل نقاط نشاطك وتقييماتك بقسائم USDT فورية وهدايا عينية
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Points Balance Card */}
          <div className="exec-royal-surface relative overflow-hidden rounded-[24px] p-4 text-white border border-[#F5D076]/30 flex items-center justify-between gap-3">
            <div className="pointer-events-none absolute inset-0 exec-filigree opacity-55" />
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-slate-300">رصيد النقاط المتاح للاستبدال</p>
              <p className="ltr-num font-display text-2xl font-extrabold text-[#F5D076] mt-0.5">
                {shopData.pointsBalance.toLocaleString('en-US')}{' '}
                <span className="text-xs font-bold text-teal-200">نقطة</span>
              </p>
              <p className="text-[10.5px] text-slate-300 mt-1">
                تكسب +10 نقاط تلقائياً مع كل تقرير سفر يومي معتمد
              </p>
            </div>
            <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#F5D076]/18 border border-[#F5D076]/45 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-[#F5D076]" />
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-white rounded-2xl border border-slate-200/90">
            {[
              { id: 'shop', label: 'المتجر' },
              { id: 'orders', label: 'الاستبدالات' },
              { id: 'logs', label: 'سجل النقاط' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  tab === t.id
                    ? 'bg-[#07182B] text-[#F5D076]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Physical Address Form if selected */}
          {selectedPhysicalItem && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeRedeem(selectedPhysicalItem, shippingAddress);
              }}
              className="rounded-2xl bg-white border-2 border-[#07182B] p-4 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-[#07182B] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0D7A72]" />
                  <span>عنوان استلام: {selectedPhysicalItem.title}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedPhysicalItem(null)}
                  className="text-[11px] font-bold text-slate-400 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
              <input
                type="text"
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="الدولة، المدينة، العنوان التفصيلي، ورقم الهاتف"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#07182B]"
              />
              <button
                type="submit"
                disabled={redeemingId === selectedPhysicalItem.id}
                className="w-full rounded-xl bg-[#07182B] text-[#F5D076] py-2.5 text-xs font-extrabold cursor-pointer"
              >
                {redeemingId === selectedPhysicalItem.id
                  ? 'جاري تأكيد الطلب...'
                  : `تأكيد الاستبدال مقابل ${selectedPhysicalItem.pointsCost} نقطة`}
              </button>
            </form>
          )}

          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0D7A72]" />
            </div>
          ) : tab === 'shop' ? (
            <div className="space-y-3">
              {shopData.items.map((item) => {
                const canAfford = shopData.pointsBalance >= item.pointsCost;
                const isVoucher = item.category === 'voucher';
                return (
                  <div
                    key={item.id}
                    className="exec-card rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isVoucher
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-[#07182B] border-[#F5D076]/40 text-[#F5D076]'
                        }`}
                      >
                        {isVoucher ? (
                          <Wallet className="w-5 h-5" />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display text-xs font-extrabold text-[#07182B]">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {item.subtitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10.5px] font-bold">
                          <span className="text-amber-700">
                            المطلوب: {item.pointsCost.toLocaleString('en-US')} نقطة
                          </span>
                          <span className="text-slate-400">
                            • السعر الرسمي: ${formatUsdt(item.officialPriceUsdt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={redeemingId === item.id}
                      onClick={() => handleRedeemClick(item)}
                      className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-extrabold transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-[#07182B] text-[#F5D076] border border-[#F5D076]/40'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {redeemingId === item.id ? '...' : 'استبدال المنتج'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : tab === 'orders' ? (
            <div className="exec-card rounded-2xl p-4">
              {shopData.orders.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  لا توجد عمليات استبدال مسجلة بعد
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {shopData.orders.map((o) => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-extrabold text-[#07182B]">{o.itemTitle}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTimeAr(o.createdAt)}</p>
                      </div>
                      <div className="text-left">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {o.status === 'completed' ? 'تم التسليم فوراً' : 'قيد التجهيز والشحن'}
                        </span>
                        <p className="ltr-num text-[10px] text-slate-500 font-bold">
                          -{o.pointsSpent} نقطة
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="exec-card rounded-2xl p-4">
              {shopData.logs.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">لا يوجد سجل نقاط بعد</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {shopData.logs.map((l) => (
                    <div key={l.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#07182B] truncate">{l.reason}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTimeAr(l.createdAt)}</p>
                      </div>
                      <span
                        className={`ltr-num text-xs font-extrabold shrink-0 ${
                          l.delta >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {l.delta >= 0 ? `+${l.delta}` : l.delta} نقطة
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
