import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  UserPlus,
  Lock,
  Volume2,
  VolumeX,
  TrendingUp,
  Award,
  Sparkles,
  Gift,
  ShoppingBag,
  Play,
  Pause,
  FileText,
  Briefcase,
  BookOpen,
  Bell,
  ChevronLeft
} from 'lucide-react';
import { apiRequest, assetUrl } from '../api';
import { useI18n } from '../i18n';
import CorporateShowcase from './CorporateShowcase';
import ServicesCarousel from './ServicesCarousel';
import InstallAppBanner from './InstallAppBanner';
import VipLevelsSection from './VipLevelsSection';

const FALLBACK_ACTIVITY = [
  { id: 1, text: 'العضو 0991***233 أتم تقييم وجهاته السياحية وحقق +$6.38 USDT' },
  { id: 2, text: 'العضو 0944***812 فعّل عقد الفئة A3 (ضمان عمل 150 USDT)' },
  { id: 3, text: 'العضو 0988***519 استلم عمولة فريق مباشرة +$15.00 USDT' }
];

const PROMO_SLIDES = [
  {
    image: assetUrl('/corporate/arona-field-4.jpg?v=4'),
    fallback: assetUrl('/destinations/dest-1.jpg'),
    title: 'منظومة Arona Boost العالمية للتقييم السياحي والفندقي',
    caption: 'عقود تشغيلية موثقة مع المنتجعات العالمية والفنادق الفاخرة والمعالم السياحية الكبرى'
  },
  {
    image: assetUrl('/destinations/dest-7.jpg'),
    fallback: assetUrl('/destinations/dest-8.jpg'),
    title: 'تغطية شاملة للمنتجعات والفنادق والأماكن السياحية',
    caption: 'تقييم يومي معتمد يمنحك عوائد فورية بالدولار الرقمي USDT وضمان عمل قابل للاسترداد'
  },
  {
    image: assetUrl('/corporate/arona-field-2.jpg?v=4'),
    fallback: assetUrl('/destinations/dest-3.jpg'),
    title: 'مجالس إقليمية وسلّم وظيفي رسمي (الفئة A0 — A6)',
    caption: 'رواتب شهرية ثابتة، مكافآت فريق من 3 مستويات، متجر نقاط، وفعاليات الظرف الأحمر'
  }
];

function CorporatePromoPlayer({ onOpenGrades }) {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioCtxRef = useRef(null);
  const soundTimerRef = useRef(null);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setPlaying(false);
          return 0;
        }
        const next = prev + 2;
        setSlideIdx(Math.min(PROMO_SLIDES.length - 1, Math.floor((next / 100) * PROMO_SLIDES.length)));
        return next;
      });
    }, 300);
    return () => clearInterval(timer);
  }, [playing]);

  // Ambient harmonic chime synthesizer when playing & unmuted (zero external audio files needed)
  useEffect(() => {
    if (!playing || muted) {
      if (soundTimerRef.current) {
        clearInterval(soundTimerRef.current);
        soundTimerRef.current = null;
      }
      return undefined;
    }

    const playAmbientChord = (chordIdx = 0) => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const chords = [
          [261.63, 329.63, 392.0],
          [293.66, 369.99, 440.0],
          [329.63, 392.0, 493.88]
        ];
        const notes = chords[chordIdx % chords.length];
        const now = ctx.currentTime;
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.0001, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.035, now + i * 0.08 + 0.18);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + 2.0);
        });
      } catch {
        // ignore browser autoplay restriction
      }
    };

    let step = slideIdx;
    playAmbientChord(step);
    soundTimerRef.current = setInterval(() => {
      step += 1;
      playAmbientChord(step);
    }, 2400);

    return () => {
      if (soundTimerRef.current) {
        clearInterval(soundTimerRef.current);
        soundTimerRef.current = null;
      }
    };
  }, [playing, muted, slideIdx]);

  useEffect(() => {
    return () => {
      if (soundTimerRef.current) clearInterval(soundTimerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const current = PROMO_SLIDES[slideIdx] || PROMO_SLIDES[0];

  const handleSeek = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    // Progress bar is LTR left-to-right or RTL depending on dir; calculate click ratio cleanly
    const isRtl = document.documentElement.dir === 'rtl';
    const ratio = isRtl
      ? (rect.right - e.clientX) / rect.width
      : (e.clientX - rect.left) / rect.width;
    const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    setProgress(pct);
    setSlideIdx(Math.min(PROMO_SLIDES.length - 1, Math.floor((pct / 100) * PROMO_SLIDES.length)));
  };

  return (
    <div className="exec-card rounded-[24px] overflow-hidden border border-slate-200/90 shadow-sm">
      <div className="relative h-48 w-full bg-[#07182B] overflow-hidden">
        <img
          src={current.image}
          alt={current.title}
          onError={(e) => {
            if (current.fallback && e.currentTarget.src !== current.fallback) {
              e.currentTarget.src = current.fallback;
            }
          }}
          className={`w-full h-full object-cover transition-transform duration-1000 ${
            playing ? 'scale-105' : 'scale-100'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040E1A]/90 via-[#07182B]/35 to-black/25" />

        {/* Top Badge */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#07182B]/80 border border-[#F5D076]/40 backdrop-blur-xs px-2.5 py-1 text-[10px] font-extrabold text-[#F5D076]">
            <Sparkles className="w-3 h-3" />
            {t('promo_badge', 'العرض التعريفي — Arona Boost')}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextMuted = !muted;
              setMuted(nextMuted);
              if (!nextMuted && !playing) {
                setPlaying(true);
              }
            }}
            aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center cursor-pointer"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#F5D076]" />}
          </button>
        </div>

        {/* Center Play/Pause Button */}
        <button
          type="button"
          onClick={() => {
            if (!playing && progress >= 100) setProgress(0);
            setPlaying((p) => !p);
          }}
          aria-label={playing ? 'إيقاف العرض' : 'تشغيل العرض'}
          className="absolute inset-0 flex items-center justify-center cursor-pointer group"
        >
          <span
            className={`w-13 h-13 rounded-full bg-[#07182B]/80 border-2 border-[#F5D076] text-[#F5D076] flex items-center justify-center shadow-xl transition-all ${
              playing ? 'opacity-0 group-hover:opacity-100 scale-90' : 'opacity-100 group-hover:scale-105'
            }`}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-[#F5D076] ml-0.5" />}
          </span>
        </button>

        {/* Bottom Caption + Progress */}
        <div className="absolute bottom-0 inset-x-0 p-3.5 space-y-2 pointer-events-none">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display text-xs font-extrabold text-white truncate">{current.title}</p>
              <p className="text-[10.5px] text-slate-200 line-clamp-1">{current.caption}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGrades();
              }}
              className="pointer-events-auto shrink-0 rounded-lg bg-[#F5D076] text-[#07182B] px-2.5 py-1 text-[10px] font-extrabold cursor-pointer"
            >
              {t('promo_grades_btn', 'درجات الوظيفة')}
            </button>
          </div>
          <div
            onClick={handleSeek}
            className="pointer-events-auto h-1.5 w-full rounded-full bg-white/25 overflow-hidden flex items-center cursor-pointer"
          >
            <div
              className="h-full bg-gradient-to-l from-[#F5D076] to-[#0D7A72] transition-all duration-300"
              style={{ width: `${playing || progress > 0 ? progress : 18}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeTab({
  user,
  vipLevels = [],
  liveTickerEnabled = true,
  pwaPrompt,
  onTriggerPwaInstall,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenVault,
  onOpenRedEnvelope,
  onOpenPointShop,
  onOpenEarnings,
  onOpenCharter,
  onNavigateTab,
  onUserUpdated,
  showToast
}) {
  const { t } = useI18n();
  const [subView, setSubView] = useState('hub'); // 'hub' | 'levels'
  const [activityItems, setActivityItems] = useState(FALLBACK_ACTIVITY);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    if (!liveTickerEnabled) return undefined;
    let mounted = true;
    const fetchFeed = async () => {
      try {
        const res = await apiRequest('/api/activity-feed');
        if (mounted && Array.isArray(res.items) && res.items.length > 0) {
          setActivityItems(res.items);
        }
      } catch {
        // silent fallback
      }
    };
    fetchFeed();
    const refreshTimer = setInterval(fetchFeed, 35000);
    return () => {
      mounted = false;
      clearInterval(refreshTimer);
    };
  }, [liveTickerEnabled]);

  useEffect(() => {
    if (!liveTickerEnabled || activityItems.length <= 1) return undefined;
    const rotate = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % activityItems.length);
    }, 3800);
    return () => clearInterval(rotate);
  }, [liveTickerEnabled, activityItems]);

  const activeFeedItem = activityItems[tickerIndex % activityItems.length] || FALLBACK_ACTIVITY[0];

  if (subView === 'levels') {
    return (
      <div className="space-y-4">
        <VipLevelsSection
          user={user}
          vipLevels={vipLevels}
          onBack={() => setSubView('hub')}
          onOpenDeposit={onOpenDeposit}
          onOpenDepositWithAmount={onOpenDeposit}
          onNavigateTab={onNavigateTab}
          onUserUpdated={onUserUpdated}
          showToast={showToast}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* 1. Compact Top Photo Slider (التقارير التنفيذية والمجالس — rotates every 10s) */}
      <CorporateShowcase />

      {/* 2. Executive Quick Actions Card (4 Primary Actions + 2 Tashare Event Pills) */}
      <div className="exec-card rounded-[24px] px-3 py-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={onOpenWithdraw}
            className="flex flex-col items-center gap-2 py-1 rounded-2xl hover:bg-slate-50 active:scale-[0.97] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/90 border border-amber-200/80 text-amber-700 flex items-center justify-center shadow-xs group-hover:shadow-md transition-all">
              <ArrowUpRight className="w-5 h-5 stroke-[2.3]" />
            </div>
            <span className="text-[11.5px] font-extrabold text-slate-800">
              {t('home_act_withdraw', 'سحب')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDeposit()}
            className="flex flex-col items-center gap-2 py-1 rounded-2xl hover:bg-slate-50 active:scale-[0.97] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100/90 border border-sky-200/80 text-[#0B2D50] flex items-center justify-center shadow-xs group-hover:shadow-md transition-all">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.3]" />
            </div>
            <span className="text-[11.5px] font-extrabold text-slate-800">
              {t('home_act_deposit', 'إيداع')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('team')}
            className="flex flex-col items-center gap-2 py-1 rounded-2xl hover:bg-slate-50 active:scale-[0.97] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100/90 border border-teal-200/80 text-[#0D7A72] flex items-center justify-center shadow-xs group-hover:shadow-md transition-all">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[11.5px] font-extrabold text-slate-800">
              {t('home_act_invite', 'دعوة')}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenVault}
            className="flex flex-col items-center gap-2 py-1 rounded-2xl hover:bg-slate-50 active:scale-[0.97] transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#07182B] to-[#123358] border border-[#F5D076]/45 text-[#F5D076] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all relative">
              <Lock className="w-5 h-5 stroke-[2.2]" />
              {user.activeVaultCount > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center justify-center border border-white">
                  {user.activeVaultCount}
                </span>
              )}
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B] leading-tight text-center">
              {t('home_act_vault', 'استثمر مع أرونا')}
            </span>
          </button>
        </div>

        {/* Red Envelope (الظرف الأحمر) & Point Shop (متجر النقاط) Strip */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onOpenRedEnvelope}
            className="flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-l from-[#7F1D1D] via-[#991B1B] to-[#07182B] text-white px-3 py-2.5 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#F5D076]/20 border border-[#F5D076]/45 text-[#F5D076] flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div className="text-right min-w-0">
                <p className="text-[11px] font-extrabold text-[#F5D076] truncate">الظرف الأحمر</p>
                <p className="text-[9.5px] text-rose-100 truncate">أكواد الهدايا النقدية</p>
              </div>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-[#F5D076] shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenPointShop}
            className="flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-l from-[#07182B] via-[#0F2B4C] to-[#0D7A72] text-white px-3 py-2.5 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#F5D076]/20 border border-[#F5D076]/45 text-[#F5D076] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-right min-w-0">
                <p className="text-[11px] font-extrabold text-white truncate">متجر النقاط</p>
                <p className="text-[9.5px] text-amber-200 truncate ltr-num">
                  {user.pointsBalance || 0} pts
                </p>
              </div>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 text-[#F5D076] shrink-0" />
          </button>
        </div>
      </div>

      {/* 3. Single-Line Speaker Live Activity Bar */}
      {liveTickerEnabled && (
        <div className="exec-card rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 overflow-hidden">
          <div className="w-6 h-6 rounded-lg bg-[#07182B] text-[#F5D076] flex items-center justify-center shrink-0">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <p
            key={activeFeedItem.id || tickerIndex}
            className="text-[11.5px] font-bold text-slate-700 truncate flex-1 animate-editorial"
          >
            {activeFeedItem.text}
          </p>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        </div>
      )}

      {/* 4. Side-by-Side Feature Cards (< رحلة النجوم > & < الأرباح >) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onOpenEarnings('star')}
          className="relative overflow-hidden rounded-[22px] p-4 text-right bg-gradient-to-br from-[#F4FBF8] via-[#E6F6F1] to-[#D4EFE7] border border-teal-200/80 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-800 bg-white/80 border border-teal-200/70 rounded-full px-2 py-0.5 mb-2">
                <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                {t('home_star_sub', 'سلم المناصب والرواتب')}
              </span>
              <h3 className="font-display text-sm sm:text-base font-extrabold text-[#07182B]">
                {t('home_star_title', '< رحلة النجوم >')}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#0D7A72] text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSubView('levels')}
          className="relative overflow-hidden rounded-[22px] p-4 text-right bg-gradient-to-br from-[#FDFBF4] via-[#FAF2DC] to-[#F3E5BE] border border-amber-200/85 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-white/85 border border-amber-200/80 rounded-full px-2 py-0.5 mb-2">
                {t('grade_prefix', 'الفئة A')}
                {user.vipLevel}
              </span>
              <h3 className="font-display text-sm sm:text-base font-extrabold text-[#07182B]">
                {t('home_profit_title', '< الأرباح >')}
              </h3>
              <p className="text-[10px] font-bold text-amber-900/80 mt-0.5">
                {t('home_profit_sub', 'درجات العقود وجدول العوائد')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#07182B] text-[#F5D076] flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </button>
      </div>

      {/* 5. Embedded Corporate Promo Player */}
      <CorporatePromoPlayer onOpenGrades={() => setSubView('levels')} />

      {/* 6. Tri-Sector Live Tourism Showcase (Resorts + Hotels + Landmarks) */}
      <ServicesCarousel onNavigateTab={onNavigateTab} />

      {/* 7. Official Corporate Information Feed Cards (Tashare-style Stacked Article Cards in Royal Sovereign Palette) */}
      <div className="space-y-2.5">
        {[
          {
            id: 'about',
            tab: 'about',
            title: t('feed_about_title', 'نبذة عن شركة Arona Boost'),
            subtitle: t(
              'feed_about_sub',
              'منظومة دولية متخصصة في الترويج الرقمي وتصنيف المنتجعات والفنادق والمعالم السياحية الشريكة حول العالم.'
            ),
            image: assetUrl('/corporate/arona-field-1.jpg?v=4'),
            fallback: assetUrl('/destinations/dest-4.jpg'),
            icon: BookOpen
          },
          {
            id: 'job',
            tab: 'job',
            title: t('feed_job_title', 'وصف وظيفة الموظف الجزئي عبر الإنترنت'),
            subtitle: t(
              'feed_job_sub',
              'يقوم الموظف بإتمام عقود التقييم اليومية للمعالم والفنادق والمنتجعات مقابل دخل يومي ثابت ومكافآت ترقية.'
            ),
            image: assetUrl('/corporate/arona-field-5.jpg?v=4'),
            fallback: assetUrl('/destinations/dest-2.jpg'),
            icon: Briefcase
          },
          {
            id: 'charter',
            tab: 'charter',
            title: t('feed_charter_title', 'بيان شركة Arona Boost الرسمي'),
            subtitle: t(
              'feed_charter_sub',
              'المبادئ العشرة المعتمدة لضمان حقوق الموظفين، استرداد ضمان العمل الكامل (365 يوماً)، وشفافية الأرباح.'
            ),
            image: assetUrl('/corporate/arona-field-3.jpg?v=4'),
            fallback: assetUrl('/destinations/dest-7.jpg'),
            icon: FileText
          },
          {
            id: 'guidelines',
            tab: 'guidelines',
            title: t('feed_guide_title', 'إشعار الموظفين وإرشادات العمل'),
            subtitle: t(
              'feed_guide_sub',
              'ضوابط ساعات التقييم اليومية، مواعيد السحب الفئوي، والمشاركة في فعاليات الظرف الأحمر ومتجر النقاط.'
            ),
            image: assetUrl('/destinations/dest-3.jpg'),
            fallback: assetUrl('/destinations/dest-1.jpg'),
            icon: Bell
          }
        ].map((card) => {
          const IconComp = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpenCharter && onOpenCharter(card.tab)}
              className="w-full exec-card rounded-[20px] p-3 flex items-center gap-3 text-right hover:border-[#0D7A72]/40 active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="relative w-20 h-16 rounded-2xl overflow-hidden bg-[#07182B] shrink-0">
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  onError={(e) => {
                    if (card.fallback && e.currentTarget.src !== card.fallback) {
                      e.currentTarget.src = card.fallback;
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-[#07182B]/25" />
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-[#07182B]/85 text-[#F5D076] flex items-center justify-center">
                  <IconComp className="w-3 h-3" />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-display text-xs font-extrabold text-[#07182B] truncate">
                  {card.title}
                </h4>
                <p className="text-[10.5px] text-slate-500 leading-relaxed line-clamp-2">
                  {card.subtitle}
                </p>
              </div>

              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-[#07182B] shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Optional PWA Install Prompt */}
      <InstallAppBanner pwaPrompt={pwaPrompt} onTriggerPwaInstall={onTriggerPwaInstall} />
    </div>
  );
}
