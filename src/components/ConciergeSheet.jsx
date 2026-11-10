import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Headset,
  Send,
  Plus,
  Crown,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { apiRequest, formatDateTimeAr } from '../api';

const CATEGORIES = [
  'عقود الضيافة',
  'توثيق إيداع USDT',
  'سحب وتسوية الأرباح',
  'الترقية والمناصب',
  'استفسار عام'
];

export default function ConciergeSheet({ isOpen, onClose, user, showToast }) {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [isPriorityVip, setIsPriorityVip] = useState(false);
  const [priorityLabel, setPriorityLabel] = useState('');

  const [view, setView] = useState('list'); // 'list' | 'new' | 'thread'
  const [activeTicketId, setActiveTicketId] = useState(null);

  // New Ticket Form
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply Form
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/support/tickets');
      setTickets(res.tickets || []);
      setIsPriorityVip(Boolean(res.isPriorityVip));
      setPriorityLabel(res.priorityLabel || 'مكتب المساندة التنفيذية');
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen, loadTickets]);

  if (!isOpen) return null;

  const activeTicket = tickets.find((t) => t.id === activeTicketId) || null;

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast?.('يرجى كتابة عنوان التذكرة وتفاصيل رسالتك', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/support/tickets', {
        method: 'POST',
        body: { category, subject: subject.trim(), message: message.trim() }
      });
      showToast?.(res.message);
      setSubject('');
      setMessage('');
      await loadTickets();
      setActiveTicketId(res.ticketId);
      setView('thread');
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await apiRequest(`/api/support/tickets/${activeTicket.id}/reply`, {
        method: 'POST',
        body: { message: replyText.trim() }
      });
      setReplyText('');
      showToast?.(res.message);
      await loadTickets();
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const renderStatusPill = (status) => {
    if (status === 'answered') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          <span>تم الرد رسمياً</span>
        </span>
      );
    }
    if (status === 'closed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
          <span>مغلقة</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
        <Clock className="w-3 h-3" />
        <span>قيد المتابعة</span>
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] max-h-[92dvh] flex flex-col rounded-t-[30px] bg-[#F4F7FB] shadow-2xl animate-sheet overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Royal Concierge Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#F5D076]/25"
          style={{
            background: 'linear-gradient(145deg, #051322 0%, #0A2542 60%, #0D6E68 100%)'
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {view !== 'list' ? (
              <button
                type="button"
                onClick={() => setView('list')}
                className="w-9 h-9 rounded-xl bg-white/12 hover:bg-white/20 flex items-center justify-center text-white shrink-0 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-white/12 border border-[#F5D076]/35 flex items-center justify-center shrink-0">
                <Headset className="w-5 h-5 text-[#F5D076]" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-sm font-extrabold text-white truncate">
                  مكتب المساندة التنفيذية
                </h3>
                {isPriorityVip && (
                  <span className="gold-crest-pill inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold shrink-0">
                    <Crown className="w-2.5 h-2.5 text-[#051322]" />
                    <span>أولوية عليا</span>
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-teal-100/90 truncate">{priorityLabel}</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {view === 'list' && (
            <>
              {/* Security & Direct Desk Banner */}
              <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900">
                      قناة تواصل رسمية مشفّرة داخل التطبيق
                    </p>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      مرتبطة مباشرة بمجلس إدارة ومقاصة Arona Boost
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setView('new')}
                  className="shrink-0 exec-primary-btn rounded-xl px-3 py-2 text-xs font-extrabold text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F5D076]" />
                  <span>تذكرة جديدة</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0D7A72]" />
                  <span className="text-xs">جاري تحميل المحادثات الرسمية...</span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-2">
                  <p className="text-sm font-extrabold text-slate-800">
                    لا توجد تذاكر مساندة مفتوحة حالياً
                  </p>
                  <p className="text-xs text-slate-500">
                    يمكنك فتح محادثة مباشرة مع فريق المساندة التنفيذية في أي وقت
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tickets.map((tk) => {
                    const lastMsg = tk.messages?.[tk.messages.length - 1];
                    return (
                      <button
                        key={tk.id}
                        type="button"
                        onClick={() => {
                          setActiveTicketId(tk.id);
                          setView('thread');
                        }}
                        className="w-full text-right rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 p-3.5 shadow-2xs space-y-2 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="ltr-num rounded-md bg-[#081E36] text-[#F5D076] px-2 py-0.5 text-[10px] font-extrabold">
                              {tk.ticketCode}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              {tk.category}
                            </span>
                          </div>
                          {renderStatusPill(tk.status)}
                        </div>

                        <h4 className="text-xs font-extrabold text-slate-900">{tk.subject}</h4>

                        {lastMsg && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {lastMsg.senderRole === 'admin' ? 'رد الإدارة: ' : 'أنت: '}
                            {lastMsg.body}
                          </p>
                        )}

                        <p className="text-[10px] text-slate-400">
                          آخر تحديث: {formatDateTimeAr(tk.updatedAt)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {view === 'new' && (
            <form
              onSubmit={handleCreateTicket}
              className="rounded-2xl bg-white border border-slate-200/90 p-4 space-y-3.5 shadow-2xs"
            >
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  القسم المختص
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold border transition-colors cursor-pointer ${
                        category === cat
                          ? 'bg-[#081E36] text-[#F5D076] border-[#081E36]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  موضوع الطلب
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: استفسار حول ترقية الفئة A4 أو تسوية سحب"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#0D7A72] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  تفاصيل الرسالة الرسمية
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك بوضوح ليتم الرد عليها من المشرف المختص..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#0D7A72] focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full exec-primary-btn rounded-2xl py-3 text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#F5D076]" />
                <span>{submitting ? 'جاري الإرسال...' : 'إرسال التذكرة الرسمية'}</span>
              </button>
            </form>
          )}

          {view === 'thread' && activeTicket && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-white border border-slate-200 p-3.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="ltr-num rounded-md bg-[#081E36] text-[#F5D076] px-2 py-0.5 text-[10px] font-extrabold">
                    {activeTicket.ticketCode}
                  </span>
                  {renderStatusPill(activeTicket.status)}
                </div>
                <h4 className="text-xs font-extrabold text-slate-900 pt-1">
                  {activeTicket.subject}
                </h4>
              </div>

              {/* Messages */}
              <div className="space-y-2.5">
                {(activeTicket.messages || []).map((m) => {
                  const isAdmin = m.senderRole === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isAdmin
                          ? 'bg-[#07192E] text-white border border-[#F5D076]/35 mr-4'
                          : 'bg-white text-slate-800 border border-slate-200 ml-4'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[10.5px] font-extrabold ${
                            isAdmin ? 'text-[#F5D076]' : 'text-[#0D7A72]'
                          }`}
                        >
                          {isAdmin
                            ? 'مكتب المساندة التنفيذية — Arona Boost'
                            : `أنت (#${1000 + (user?.id || 1)})`}
                        </span>
                        <span
                          className={`text-[9.5px] ${
                            isAdmin ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {formatDateTimeAr(m.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-line">{m.body}</p>
                    </div>
                  );
                })}
              </div>

              {activeTicket.status !== 'closed' && (
                <form
                  onSubmit={handleSendReply}
                  className="rounded-2xl bg-white border border-slate-200 p-2.5 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب رداً أو استفساراً إضافياً..."
                    className="flex-1 bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="shrink-0 rounded-xl bg-[#081E36] hover:bg-slate-800 disabled:opacity-45 text-[#F5D076] px-3.5 py-2 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
