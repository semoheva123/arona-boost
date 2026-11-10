import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Star,
  Building2,
  UserPlus,
  ArrowRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Award,
  Briefcase,
  BookOpen,
  BellRing,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ShieldCheck
} from 'lucide-react';
import LiveActivityTicker from './LiveActivityTicker';
import InstallAppBanner from './InstallAppBanner';
import ServicesCarousel from './ServicesCarousel';
import CorporateShowcase from './CorporateShowcase';
import ProfitCalculator from './ProfitCalculator';
import VipLevelsSection from './VipLevelsSection';

const PROMO_SCENES = [
  {
    image: '/destinations/dest-7.jpg',
    tag: 'عقود سياحية دولية معتمدة',
    title: 'ترويج وتقييم أرقى المنتجعات والفنادق العالمية',
    caption: 'شراكات رقمية مع أكثر من 190 منتجعاً وفندقاً ومعلماً سياحياً في الشرق الأوسط وأوروبا وآسيا.'
  },
  {
    image: '/destinations/dest-1.jpg',
    tag: 'تسوية فورية عبر USDT',
    title: 'عوائد يومية موثقة تُودع مباشرة في محفظة الدخل',
    caption: 'إنجاز مرن لعقود السفر اليومية عبر الهاتف الذكي خلال دقائق معدودة مع سحب عبر TRC20 و BEP20.'
  },
  {
    image: '/destinations/dest-4.jpg',
    tag: 'وثيقة ضمان العمل 365 يوماً',
    title: 'حماية تعاقدية كاملة واسترداد ضمان العقد السنوي',
    caption: 'يُحفظ مبلغ توثيق الفئة الوظيفية كضمان عمل رسمي باسم الموظف يُسترد كاملاً عند إتمام مدة العقد.'
  },
  {
    image: '/destinations/dest-8.jpg',
    tag: 'برنامج رحلة النجوم المهنية',
    title: 'مسار ترقية واضح ورواتب شهرية ثابتة للمناصب القيادية',
    caption: 'تدرّج وظيفي من أخصائي التوظيف حتى مدير التوظيف الإقليمي بمكافآت نقدية وهدايا عينية.'
  }
];

function CorporatePromoPlayer({ onOpenGrades }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0); // 0..32 sec

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setElapsed((prev) => (prev + 1) % 32);
    }, 1000);
    return () => clearInterval(timer);
  }, [playing]);

  const sceneIdx = Math.floor(elapsed / 8) % PROMO_SCENES.length;
  const scene = PROMO_SCENES[sceneIdx];
  const pct = Math.round(((elapsed + 1) / 32) * 100);
  const fmt = (s) => `00:${String(s).padStart(2, '0')}`;

  return (
    <div className="exec-card rounded-[24px] overflow-hidden border border-[#07182B]/15">
      <div className="relative h-46 w-full overflow-hidden bg-[#051322]">
        <img
          src={scene.image}
          alt={scene.title}
          className={`w-full h-full object-cover transition-transform duration-1000 ${
            playing ? 'scale-105' : 'scale-100'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04101E]/95 via-[#06182C]/50 to-[#04101E]/35" />

        {/* Top Crest Tag */}
        <div className="absolute top-3 inset-x-3.5 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#07182B]/80 border border-[#F5D076]/45 backdrop-blur-xs px-2.5 py-1 text-[10px] font-extrabold text-[#F5D076]">
            <ShieldCheck className="w-3 h-3" />
            <span>العرض التعريفي — Arona Boost</span>
          </span>

          <button
            type="button"
            onClick={onOpenGrades}
            className="rounded-full bg-[#F5D076] text-[#07182B] px-2.5 py-0.5 text-[10px] font-extrabold cursor-pointer"
          >
            درجات الوظيفة
          </button>
        </div>

        {/* Center Play Overlay when paused */}
        {!playing && (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="تشغيل العرض التعريفي"
            className="absolute inset-0 flex items-center justify-center cursor-pointer group"
          >
            <span className="w-13 h-13 rounded-full bg-[#07182B]/85 border-2 border-[#F5D076] text-[#F5D076] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 fill-[#F5D076] ml-0.5" />
            </span>
          </button>
        )}

        {/* Bottom Caption & Controls */}
        <div className="absolute bottom-0 inset-x-0 p-3.5 space-y-2 text-white">
          <div>
            <span className="text-[10px] font-bold text-[#F5D076]">{scene.tag}</span>
            <h4 className="font-display text-xs sm:text-[13px] font-extrabold leading-snug">
              {scene.title}
            </h4>
            {playing && (
              <p className="text-[10.5px] text-slate-200 mt-0.5 line-clamp-1">{scene.caption}</p>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="w-6 h-6 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer shrink-0"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#F5D076] to-emerald-400 transition-all duration-500"
                style={{ width: `${playing ? pct : 18}%` }}
              />
            </div>

            <span className="ltr-num text-[10px] font-bold text-slate-200 tabular-nums shrink-0">
              {fmt(elapsed)} / 00:32
            </span>

            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="text-slate-200 hover:text-white cursor-pointer shrink-0"
              aria-label="الصوت"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CORPORATE_FEED_ARTICLES = [
  {
    id: 'about',
    title: 'نبذة عن شركة Arona Boost',
    subtitle:
      'منظومة دولية متخصصة في الترويج الرقمي وتصنيف المنتجعات والفنادق والمعالم السياحية الشريكة حول العالم.',
    image: '/destinations/dest-1.jpg',
    Icon: BookOpen
  },
  {
    id: 'job',
    title: 'وصف وظيفة الموظف الجزئي عبر الإنترنت',
    subtitle:
      'يقوم الموظف بإتمام عقود التقييم اليومية للمعالم والفنادق والمنتجعات مقابل دخل يومي ثابت ومكافآت ترقية.',
    image: '/destinations/dest-7.jpg',
    Icon: Briefcase
  },
  {
    id: 'charter',
    title: 'بيان شركة Arona Boost الرسمي',
    subtitle:
      'المبادئ العشرة المعتمدة لضمان حقوق الموظفين، استرداد ضمان العمل الكامل (365 يوماً)، وشفافية الأرباح.',
    image: '/destinations/dest-8.jpg',
    Icon: Building2
  },
  {
    id: 'guidelines',
    title: 'إشعار الموظفين وإرشادات العمل',
    subtitle:
      'ضوابط ساعات التقييم اليومية، مواعيد السحب الفئوي، والمشاركة في فعاليات الظرف الأحمر ومتجر النقاط.',
    image: '/destinations/dest-4.jpg',
    Icon: BellRing
  }
];

export default function HomeTab({
  user,
  vipLevels,
  liveTickerEnabled = true,
  externalSubTab,
  onClearExternalSubTab,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenVault,
  onOpenCharter,
  onOpenEarnings,
  onNavigateTab,
  onUserUpdated,
  showToast
}) {
  const [homeSubTab, setHomeSubTab] = useState('overview');
  const userVip = user?.vipLevel ?? 0;

  useEffect(() => {
    if (externalSubTab === 'vip_levels') {
      setHomeSubTab('vip_levels');
      onClearExternalSubTab?.();
    }
  }, [externalSubTab, onClearExternalSubTab]);

  if (homeSubTab === 'vip_levels') {
    return (
      <div className="space-y-4 animate-tab">
        <div className="exec-royal-surface relative overflow-hidden rounded-[24px] p-4 text-white border border-[#F5D076]/30 flex items-center justify-between gap-3">
          <div className="pointer-events-none absolute inset-0 exec-filigree opacity-55" />
          <div className="relative z-10 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold text-[#F5D076] mb-1">
              <Award className="w-3.5 h-3.5 text-[#F5D076]" />
              <span>درجات التوظيف المعتمدة — أرونا (عقدك: الفئة A{userVip})</span>
            </div>
            <p className="text-xs font-bold text-slate-100 leading-relaxed">
              اختر فئة العقد الوظيفي المناسبة لك أو احسب عائدك المتوقع قبل التوثيق
            </p>
          </div>

          <button
            type="button"
            onClick={() => setHomeSubTab('overview')}
            className="relative z-10 shrink-0 inline-flex items-center gap-1 rounded-xl bg-white/12 hover:bg-white/22 border border-white/20 px-3 py-2 text-[11px] font-extrabold text-white cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 text-[#F5D076]" />
            <span>الرئيسية</span>
          </button>
        </div>

        <ProfitCalculator
          vipLevels={vipLevels}
          onOpenDeposit={(amount, tier) => onOpenDeposit(amount, tier)}
        />

        <VipLevelsSection
          user={user}
          vipLevels={vipLevels}
          onOpenDepositWithAmount={(amount, tier) => onOpenDeposit(amount, tier)}
          onNavigateTab={onNavigateTab}
          onUserUpdated={onUserUpdated}
          showToast={showToast}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-tab">
      {/* PWA Install Prompt Banner */}
      <InstallAppBanner />

      {/* 1. Top Compact Hero Slider: التقارير التنفيذية والمجالس (10s synchronized Photo + Workplace + Summary) */}
      <CorporateShowcase />

      {/* 2. Clean 4-Action Rounded White Card (Exact Layout & Buttons of tashare8 in Royal Colors) */}
      <div className="exec-card rounded-[24px] px-3.5 py-4">
        <div className="grid grid-cols-4 gap-2">
          {/* سحب */}
          <button
            type="button"
            onClick={onOpenWithdraw}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <div
              className="w-12 h-12 rounded-2xl border border-[#F5D076]/55 text-[#07182B] flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(215,165,59,0.38)] group-hover:scale-[1.04] transition-transform"
              style={{
                background: 'linear-gradient(145deg, #F8DF95 0%, #DFB14B 100%)'
              }}
            >
              <ArrowUpFromLine className="w-5 h-5 stroke-[2.3]" />
            </div>
            <span className="text-[11.5px] font-extrabold text-[#07182B] text-center leading-tight">
              سحب
            </span>
          </button>

          {/* إيداع */}
          <button
            type="button"
            onClick={() => onOpenDeposit()}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <div
              className="w-12 h-12 rounded-2xl border border-[#F5D076]/35 text-[#F5D076] flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(7,24,43,0.38)] group-hover:scale-[1.04] transition-transform"
              style={{
                background: 'linear-gradient(145deg, #07182B 0%, #10355C 100%)'
              }}
            >
              <ArrowDownToLine className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[11.5px] font-extrabold text-[#07182B] text-center leading-tight">
              إيداع
            </span>
          </button>

          {/* دعوة */}
          <button
            type="button"
            onClick={() => onNavigateTab('team')}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <div
              className="w-12 h-12 rounded-2xl border border-emerald-300/45 text-white flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(13,122,114,0.35)] group-hover:scale-[1.04] transition-transform"
              style={{
                background: 'linear-gradient(145deg, #0A5C56 0%, #0F8A7E 100%)'
              }}
            >
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[11.5px] font-extrabold text-[#07182B] text-center leading-tight">
              دعوة
            </span>
          </button>

          {/* استثمر مع أرونا */}
          <button
            type="button"
            onClick={onOpenVault}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            <div
              className="w-12 h-12 rounded-2xl border border-[#F5D076]/45 text-[#F5D076] flex items-center justify-center shadow-[0_8px_18px_-6px_rgba(7,24,43,0.35)] group-hover:scale-[1.04] transition-transform relative"
              style={{
                background: 'linear-gradient(145deg, #061526 0%, #1B3654 55%, #0D6E66 100%)'
              }}
            >
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#07182B] text-center leading-tight">
              استثمر مع أرونا
            </span>
          </button>
        </div>
      </div>

      {/* 3. Single-Line Acoustic Live Broadcast Pill */}
      <LiveActivityTicker enabled={liveTickerEnabled} />

      {/* 4. Bespoke Twin Portal Cards: < الأرباح > & < رحلة النجوم > */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onOpenEarnings?.('stars')}
          className="exec-card rounded-[24px] p-2 hover:border-amber-300/90 transition-all cursor-pointer text-center group"
        >
          <div
            className="h-24 rounded-[18px] relative overflow-hidden flex flex-col items-center justify-center px-2 border border-[#F5D076]/25"
            style={{
              background: 'linear-gradient(145deg, #061526 0%, #102B4C 56%, #453110 100%)'
            }}
          >
            <div className="pointer-events-none absolute inset-0 exec-filigree opacity-50" />
            <div className="relative z-10 w-11 h-11 rounded-2xl bg-[#F5D076]/18 border border-[#F5D076]/45 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6 text-[#F5D076]" />
            </div>
            <span className="relative z-10 text-[10px] font-bold text-amber-100/90">
              سلم المناصب والرواتب
            </span>
            <Star className="w-3 h-3 text-[#F5D076] fill-[#F5D076] absolute top-2.5 right-2.5 opacity-85" />
          </div>
          <p className="font-display text-xs sm:text-[13px] font-extrabold text-[#07182B] pt-2 pb-1">
            &lt; رحلة النجوم &gt;
          </p>
        </button>

        <button
          type="button"
          onClick={() => onOpenEarnings?.('guide')}
          className="exec-card rounded-[24px] p-2 hover:border-teal-300/90 transition-all cursor-pointer text-center group"
        >
          <div
            className="h-24 rounded-[18px] relative overflow-hidden flex flex-col items-center justify-center px-2 border border-teal-300/25"
            style={{
              background: 'linear-gradient(145deg, #061526 0%, #0A4354 56%, #0D7A72 100%)'
            }}
          >
            <div className="pointer-events-none absolute inset-0 exec-filigree opacity-50" />
            <div className="relative z-10 w-11 h-11 rounded-2xl bg-emerald-300/18 border border-emerald-300/40 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="relative z-10 text-[10px] font-bold text-teal-100/90">
              درجات العقود وجدول العوائد
            </span>
          </div>
          <p className="font-display text-xs sm:text-[13px] font-extrabold text-[#07182B] pt-2 pb-1">
            &lt; الأرباح &gt;
          </p>
        </button>
      </div>

      {/* 5. Corporate Promo Presentation Player + Contracted Destinations + Official Corporate Feed Cards */}
      <CorporatePromoPlayer onOpenGrades={() => setHomeSubTab('vip_levels')} />

      <ServicesCarousel onNavigateTab={onNavigateTab} />

      {/* Official Illustrated Corporate Feed Cards (matching tashare8 Home feed in Royal Colors) */}
      <div className="space-y-2.5 pt-1">
        {CORPORATE_FEED_ARTICLES.map((art) => {
          const Icon = art.Icon;
          return (
            <button
              key={art.id}
              type="button"
              onClick={() => onOpenCharter?.(art.id)}
              className="w-full exec-card rounded-[22px] p-3 flex items-center gap-3 text-right hover:border-[#07182B]/30 transition-all cursor-pointer group"
            >
              <div className="relative w-18 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-[#07182B]/35 flex items-center justify-center">
                  <span className="w-7 h-7 rounded-xl bg-[#07182B]/80 border border-[#F5D076]/45 text-[#F5D076] flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-display text-xs font-extrabold text-[#07182B] truncate">
                  {art.title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mt-0.5">
                  {art.subtitle}
                </p>
              </div>

              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-[#07182B] shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
