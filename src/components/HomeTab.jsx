import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { apiRequest, assetUrl } from '../api';
import { useI18n } from '../i18n';
import CorporateShowcase from './CorporateShowcase';
import VipLevelsSection from './VipLevelsSection';
import {
  TashareWithdrawIcon,
  TashareDepositIcon,
  TashareInviteIcon,
  TashareInvestIcon,
  ProfitCardIllustration,
  StarJourneyCardIllustration
} from './TashareIcons';

const FALLBACK_ACTIVITY = [
  { id: 1, text: 'العضو 0991***233 أتم تقييم وجهاته السياحية وحقق +$6.38 USDT' },
  { id: 2, text: 'العضو 0944***812 فعّل عقد الفئة A3 (ضمان عمل 150 USDT)' },
  { id: 3, text: 'العضو 0988***519 استلم عمولة فريق مباشرة +$15.00 USDT' }
];

const PROMO_SLIDES = [
  {
    image: assetUrl('/corporate/arona-field-4.jpg?v=4'),
    fallback: assetUrl('/destinations/dest-1.jpg'),
    title: 'منظومة Arona Boost العالمية للتقييم السياحي والفندقي'
  },
  {
    image: assetUrl('/destinations/dest-7.jpg'),
    fallback: assetUrl('/destinations/dest-8.jpg'),
    title: 'تغطية شاملة للمنتجعات والفنادق والمعالم السياحية الشريكة'
  },
  {
    image: assetUrl('/corporate/arona-field-2.jpg?v=4'),
    fallback: assetUrl('/destinations/dest-3.jpg'),
    title: 'عقود تقييم يومية معتمدة وسلّم وظيفي رسمي (الفئة A0 — A6)'
  }
];

function CorporatePromoPlayer() {
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
          gain.gain.exponentialRampToValueAtTime(0.03, now + i * 0.08 + 0.18);
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
    const isRtl = document.documentElement.dir === 'rtl';
    const ratio = isRtl
      ? (rect.right - e.clientX) / rect.width
      : (e.clientX - rect.left) / rect.width;
    const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    setProgress(pct);
    setSlideIdx(Math.min(PROMO_SLIDES.length - 1, Math.floor((pct / 100) * PROMO_SLIDES.length)));
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-black shadow-[0_4px_16px_rgba(7,24,43,0.06)] relative h-44 w-full">
      {playing ? (
        <img
          src={current.image}
          alt={current.title}
          onError={(e) => {
            if (current.fallback && e.currentTarget.src !== current.fallback) {
              e.currentTarget.src = current.fallback;
            }
          }}
          className="w-full h-full object-cover transition-transform duration-1000 scale-105 opacity-90"
        />
      ) : (
        <div
          className="w-full h-full relative flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #040D17 0%, #07182B 60%, #0A2E36 100%)'
          }}
        >
          <img
            src={current.image}
            alt={current.title}
            onError={(e) => {
              if (current.fallback && e.currentTarget.src !== current.fallback) {
                e.currentTarget.src = current.fallback;
              }
            }}
            className="w-full h-full object-cover opacity-35"
          />
        </div>
      )}

      {/* Clean Minimal Play/Pause Overlay (matches IMG_4532.png clean video frame) */}
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
          className={`w-12 h-12 rounded-full bg-white/15 backdrop-blur-xs border border-white/60 text-white flex items-center justify-center transition-all ${
            playing ? 'opacity-0 group-hover:opacity-100 scale-95' : 'opacity-100 group-hover:scale-105'
          }`}
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
        </span>
      </button>

      {/* Subtle Bottom Video Bar when active */}
      {playing && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-white truncate">{current.title}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMuted((m) => !m);
              }}
              aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
              className="w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0 cursor-pointer"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#F5D076]" />}
            </button>
          </div>
          <div
            onClick={handleSeek}
            className="h-1 w-full rounded-full bg-white/25 overflow-hidden cursor-pointer"
          >
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomeTab({
  user,
  vipLevels = [],
  liveTickerEnabled = true,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenVault,
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
      <div className="space-y-3.5 pt-1">
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
    <div className="space-y-3">
      {/* 1. Top Photo Slider (IMG_4532.png #1 — rotates every 10s) */}
      <CorporateShowcase />

      {/* 2. Pure White 4-Icon Card (IMG_4532.png #2 — ONLY 4 clean icons, zero clutter) */}
      <div className="bg-white rounded-2xl px-3 py-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)]">
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={onOpenWithdraw}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform cursor-pointer"
          >
            <TashareWithdrawIcon className="w-12 h-12" />
            <span className="text-[12px] font-bold text-[#07182B]">
              {t('home_act_withdraw', 'سحب')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDeposit()}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform cursor-pointer"
          >
            <TashareDepositIcon className="w-12 h-12" />
            <span className="text-[12px] font-bold text-[#07182B]">
              {t('home_act_deposit', 'إيداع')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('team')}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform cursor-pointer"
          >
            <TashareInviteIcon className="w-12 h-12" />
            <span className="text-[12px] font-bold text-[#07182B]">
              {t('home_act_invite', 'دعوة')}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenVault}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform cursor-pointer relative"
          >
            <div className="relative">
              <TashareInvestIcon className="w-12 h-12" />
              {user.activeVaultCount > 0 && (
                <span className="ltr-num absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#0D7A72] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                  {user.activeVaultCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-[#07182B] leading-tight text-center">
              {t('home_act_vault', 'استثمر مع أرونا')}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Single-Line White Speaker Notice Bar (IMG_4532.png #3) */}
      {liveTickerEnabled && (
        <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-[0_2px_10px_rgba(7,24,43,0.04)] flex items-center gap-2.5 overflow-hidden">
          <Volume2 className="w-4 h-4 text-[#0D7A72] shrink-0" />
          <p
            key={activeFeedItem.id || tickerIndex}
            className="text-[12px] font-semibold text-slate-600 truncate flex-1 animate-editorial"
          >
            {activeFeedItem.text}
          </p>
        </div>
      )}

      {/* 4. Side-by-Side Pure White Illustrated Cards (IMG_4532.png #4: "< الأرباح" & "< رحلة النجوم") */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setSubView('levels')}
          className="bg-white rounded-2xl p-2.5 shadow-[0_4px_16px_rgba(7,24,43,0.05)] active:scale-[0.98] transition-transform cursor-pointer text-center"
        >
          <ProfitCardIllustration />
          <p className="font-display text-[13.5px] font-extrabold text-[#07182B] pt-2 pb-0.5">
            {'< '}
            {t('nav_earnings', 'الأرباح')}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onOpenEarnings('star')}
          className="bg-white rounded-2xl p-2.5 shadow-[0_4px_16px_rgba(7,24,43,0.05)] active:scale-[0.98] transition-transform cursor-pointer text-center"
        >
          <StarJourneyCardIllustration />
          <p className="font-display text-[13.5px] font-extrabold text-[#07182B] pt-2 pb-0.5">
            {'< رحلة النجوم'}
          </p>
        </button>
      </div>

      {/* 5. Clean Video Frame (IMG_4532.png #5) */}
      <CorporatePromoPlayer />

      {/* 6. Clean Corporate Articles Section (tashare8 pages-index-index n-list) */}
      <div className="pt-1 space-y-2.5">
        <h3 className="font-display text-[13.5px] font-extrabold text-[#07182B] px-1">
          Arona Boost — الشركة واللوائح
        </h3>

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
            fallback: assetUrl('/destinations/dest-4.jpg')
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
            fallback: assetUrl('/destinations/dest-2.jpg')
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
            fallback: assetUrl('/destinations/dest-7.jpg')
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
            fallback: assetUrl('/destinations/dest-1.jpg')
          }
        ].map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onOpenCharter && onOpenCharter(card.tab)}
            className="w-full bg-white rounded-2xl p-3.5 shadow-[0_3px_12px_rgba(7,24,43,0.04)] flex items-center justify-between gap-3 text-right active:scale-[0.99] transition-transform cursor-pointer"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="font-display text-[13px] font-extrabold text-[#07182B] truncate">
                {card.title}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                {card.subtitle}
              </p>
            </div>

            <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              <img
                src={card.image}
                alt={card.title}
                loading="lazy"
                onError={(e) => {
                  if (card.fallback && e.currentTarget.src !== card.fallback) {
                    e.currentTarget.src = card.fallback;
                  }
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
