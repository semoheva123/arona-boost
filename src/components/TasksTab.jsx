import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  Lock,
  Clock,
  Award,
  Loader2,
  MapPin,
  Star,
  History,
  RefreshCw,
  Compass,
  Zap,
  Users,
  BedDouble,
  TreePalm,
  Landmark,
  ShieldCheck,
  Wallet,
  X,
  ChevronLeft,
  Globe2
} from 'lucide-react';
import { apiRequest, assetUrl, formatUsdt, formatDateTimeAr } from '../api';
import HospitalityCoverageModal from './HospitalityCoverageModal';
import ModalPortal from './ModalPortal';

// Sector-tailored 3-axis criteria, tags, badges & CTAs for Resorts, Hotels & Tourist Landmarks
const SECTOR_META = {
  resort: {
    id: 'resort',
    filterLabel: 'منتجعات عالمية',
    badgeLabel: 'عقد منتجع عالمي',
    Icon: TreePalm,
    badgeTheme: 'bg-teal-950/70 border-teal-300/35 text-teal-100',
    iconColor: 'text-emerald-300',
    cardCta: 'تقييم المنتجع العالمي',
    modalHeader: 'بروتوكول تقييم المنتجع والاستجمام',
    submitLabel: 'اعتماد وإرسال تقرير المنتجع',
    submittingLabel: 'جاري اعتماد وإرسال تقرير المنتجع...',
    completedPill: 'تم توثيق تقرير المنتجع',
    criteria: [
      { key: 'facilities', label: 'الشواطئ والمرافق الاستجمامية' },
      { key: 'location', label: 'الإطلالة والخصوصية الطبيعية' },
      { key: 'value', label: 'تجربة الإقامة والرفاهية' }
    ],
    tags: [
      'شاطئ فيروزي صافي',
      'إطلالة بانورامية',
      'موصى به للعائلات',
      'أجواء استجمام هادئة',
      'رفاهية عالمية',
      'تجربة استثنائية'
    ]
  },
  hotel: {
    id: 'hotel',
    filterLabel: 'فنادق عالمية',
    badgeLabel: 'عقد فندق عالمي',
    Icon: BedDouble,
    badgeTheme: 'bg-[#07182B]/75 border-[#F5D076]/40 text-[#F5D076]',
    iconColor: 'text-[#F5D076]',
    cardCta: 'تقييم الفندق والضيافة',
    modalHeader: 'بروتوكول التقييم الفندقي المعتمد',
    submitLabel: 'اعتماد وإرسال التقرير الفندقي',
    submittingLabel: 'جاري اعتماد وإرسال التقرير الفندقي...',
    completedPill: 'تم توثيق التقرير الفندقي',
    criteria: [
      { key: 'facilities', label: 'جودة الأجنحة والنظافة' },
      { key: 'location', label: 'الموقع وسهولة الوصول' },
      { key: 'value', label: 'الضيافة والقيمة السعرية' }
    ],
    tags: [
      'خدمة ضيافة ممتازة',
      'إطلالة مميزة',
      'أجنحة فسيحة وراقية',
      'موقع مركزي استراتيجي',
      'موصى به للأعمال والعائلات',
      'تجهيزات فاخرة'
    ]
  },
  landmark: {
    id: 'landmark',
    filterLabel: 'أماكن سياحية',
    badgeLabel: 'عقد معلم سياحي',
    Icon: Landmark,
    badgeTheme: 'bg-amber-950/70 border-amber-300/40 text-amber-100',
    iconColor: 'text-[#F5D076]',
    cardCta: 'تقييم المعلم السياحي',
    modalHeader: 'بروتوكول تقييم الوجهة والمعلم السياحي',
    submitLabel: 'اعتماد وإرسال التقرير السياحي',
    submittingLabel: 'جاري اعتماد وإرسال التقرير السياحي...',
    completedPill: 'تم توثيق التقرير السياحي',
    criteria: [
      { key: 'facilities', label: 'التنظيم ومرافق الزوار' },
      { key: 'location', label: 'القيمة التاريخية والجمالية' },
      { key: 'value', label: 'سهولة الوصول والجولات' }
    ],
    tags: [
      'وجهة سياحية عالمية',
      'تنظيم ممتاز للزوار',
      'مشهد بانورامي ساحر',
      'إرشاد وخدمات متكاملة',
      'تراث معماري فريد',
      'موصى بالزيارة'
    ]
  }
};

function resolveSectorType(item) {
  if (item?.sectorType && SECTOR_META[item.sectorType]) return item.sectorType;
  const text = `${item?.title || ''} ${item?.category || ''} ${item?.key || ''}`;
  if (/منتجع|resort|maldives|santorini|bali|alps|redsea|alula/i.test(text)) return 'resort';
  if (/فندق|فنادق|أجنحة|رياض|hotel|jounieh|venice|istanbul|marrakech|deadsea/i.test(text)) {
    return 'hotel';
  }
  return 'landmark';
}

function getSectorConfig(item) {
  return SECTOR_META[resolveSectorType(item)] || SECTOR_META.landmark;
}

const CONTRACT_PREFIXES = {
  dubai: '#DXB',
  istanbul: '#IST',
  alula: '#ULH',
  petra: '#PTR',
  giza: '#CAI',
  jounieh: '#BEY',
  maldives: '#MLE',
  santorini: '#JTR',
  alhambra: '#GRX',
  swiss_alps: '#ZRH',
  bali: '#DPS',
  abudhabi: '#AUH',
  marrakech: '#RAK',
  venice: '#VCE',
  redsea: '#SSH',
  deadsea: '#AMM',
  cappadocia: '#CAP'
};

function getContractCode(item) {
  if (!item) return '#AB-4821';
  const rawKey = String(item.key || '');
  const baseKey = rawKey.replace(/_(resort|hotel|landmark)$/i, '');
  const prefix = item.codePrefix || CONTRACT_PREFIXES[rawKey] || CONTRACT_PREFIXES[baseKey] || '#AB';
  const num = 4100 + ((Number(item.slot || item.id || 1) * 317 + rawKey.length * 43) % 5400);
  return `${prefix}-${num}`;
}

function getRemainingToUtcMidnight() {
  const now = new Date();
  const nextMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  const diffSec = Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
  const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const s = String(diffSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function StarRow({ count = 5, size = 'w-3.5 h-3.5' }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= count ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </span>
  );
}

function DestinationSlideBanner({ gallery = [], fallbackImage, alt, children }) {
  const safeFallback = assetUrl(fallbackImage || '/destinations/dest-1.jpg');
  const validSlides =
    gallery.length > 0 ? gallery.map((u) => assetUrl(u)).filter(Boolean) : [safeFallback];
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    setSlideIdx(0);
  }, [validSlides[0]]);

  useEffect(() => {
    if (validSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % validSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [validSlides.length]);

  const currentSrc = validSlides[slideIdx % validSlides.length] || safeFallback;

  return (
    <div className="relative h-46 w-full overflow-hidden bg-slate-900">
      <img
        key={currentSrc}
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onError={(e) => {
          if (safeFallback && e.currentTarget.src !== safeFallback && !e.currentTarget.dataset.fb) {
            e.currentTarget.dataset.fb = '1';
            e.currentTarget.src = safeFallback;
          }
        }}
        className="w-full h-full object-cover transition-all duration-700 scale-[1.01]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#051221]/92 via-[#051221]/30 to-transparent" />

      {validSlides.length > 1 && (
        <div className="absolute bottom-3 left-3.5 z-10 flex items-center gap-1">
          {validSlides.slice(0, 5).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSlideIdx(idx);
              }}
              aria-label={`صورة ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === slideIdx % validSlides.length
                  ? 'w-4 bg-[#F5D076]'
                  : 'w-1.5 bg-white/55 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

export default function TasksTab({
  user,
  onUserUpdated,
  onOpenGrades,
  onNavigateTab,
  onNavigateHome,
  showToast
}) {
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshingLive, setRefreshingLive] = useState(false);
  const [subTab, setSubTab] = useState('today');
  const [sectorFilter, setSectorFilter] = useState('all'); // 'all' | 'resort' | 'hotel' | 'landmark'
  const [countdown, setCountdown] = useState(getRemainingToUtcMidnight());
  const [rotationSeed, setRotationSeed] = useState(() => Math.floor(Date.now() / 45000) % 1000);

  // Tri-Sector Contract Evaluation Sheet State
  const [ratingTarget, setRatingTarget] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState(null);
  const [criteriaScores, setCriteriaScores] = useState({
    facilities: 5,
    location: 5,
    value: 5
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [recommendChoice, setRecommendChoice] = useState('yes');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);

  const ratingOpenRef = useRef(false);
  ratingOpenRef.current = Boolean(ratingTarget);

  const loadTasks = useCallback(
    async (seedOverride, silent = false) => {
      const targetSeed = seedOverride !== undefined ? seedOverride : rotationSeed;
      if (!silent && !taskData) setLoading(true);
      try {
        const data = await apiRequest(`/api/tasks?seed=${targetSeed}`);
        setTaskData(data);
      } catch (err) {
        if (!silent) showToast(err.message, 'error');
      } finally {
        setLoading(false);
        setRefreshingLive(false);
      }
    },
    [rotationSeed, showToast, taskData]
  );

  useEffect(() => {
    loadTasks(rotationSeed, Boolean(taskData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.vipLevel]);

  // Automatic background live gallery & destination rotation every 45 seconds
  useEffect(() => {
    const autoRotateTimer = setInterval(() => {
      if (ratingOpenRef.current) return;
      setRotationSeed((prev) => {
        const nextSeed = prev + 1;
        loadTasks(nextSeed, true);
        return nextSeed;
      });
    }, 45000);
    return () => clearInterval(autoRotateTimer);
  }, [loadTasks]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getRemainingToUtcMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefreshGallery = () => {
    setRefreshingLive(true);
    const nextSeed = rotationSeed + 1;
    setRotationSeed(nextSeed);
    loadTasks(nextSeed, true);
  };

  const openRatingSheet = (destination) => {
    const sec = getSectorConfig(destination);
    setRatingTarget(destination);
    setActiveModalImage(destination.image || destination.fallbackImage || destination.imageUrl);
    setCriteriaScores({ facilities: 5, location: 5, value: 5 });
    setSelectedTags(sec.tags.slice(0, 3));
    setRecommendChoice('yes');
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const setAxisScore = (axisKey, score) => {
    setCriteriaScores((prev) => ({ ...prev, [axisKey]: score }));
  };

  const avgStars = Math.round(
    (criteriaScores.facilities + criteriaScores.location + criteriaScores.value) / 3
  );

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!ratingTarget || submittingReview) return;

    const sec = getSectorConfig(ratingTarget);
    const contractCode = getContractCode(ratingTarget);
    const summaryNote = `${sec.badgeLabel} ${contractCode} — ${sec.criteria[0].label} ${criteriaScores.facilities}/5 • ${sec.criteria[1].label} ${criteriaScores.location}/5 • ${sec.criteria[2].label} ${criteriaScores.value}/5`;

    setSubmittingReview(true);
    try {
      await new Promise((r) => setTimeout(r, 550));

      if (ratingTarget.isFlashMission) {
        const res = await apiRequest(`/api/tasks/flash/${ratingTarget.id}/complete`, {
          method: 'POST',
          body: {
            rating: avgStars,
            comment: summaryNote
          }
        });
        onUserUpdated(res.user);
        showToast(res.message);
      } else {
        const res = await apiRequest('/api/tasks/complete', {
          method: 'POST',
          body: {
            slot: ratingTarget.slot,
            destKey: ratingTarget.key,
            contractCode,
            activeImage: activeModalImage || ratingTarget.image,
            rating: avgStars,
            tags: selectedTags,
            comment: summaryNote
          }
        });
        onUserUpdated(res.user, res.todayStats);
        showToast(res.message);
      }

      setRatingTarget(null);
      await loadTasks(rotationSeed, true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const currentVip = taskData?.currentVip;
  const stats = taskData?.todayStats;
  const completedCount = stats?.todayCompletedCount ?? 0;
  const totalLimit = stats?.dailyTasksLimit ?? 1;
  const progressPct = Math.min(100, Math.round((completedCount / Math.max(1, totalLimit)) * 100));

  const allActiveTasks = taskData?.activeTasks || [];
  const sectorCounts = allActiveTasks.reduce(
    (acc, item) => {
      const st = resolveSectorType(item);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { resort: 0, hotel: 0, landmark: 0 }
  );

  const visibleTasks =
    sectorFilter === 'all'
      ? allActiveTasks
      : allActiveTasks.filter((item) => resolveSectorType(item) === sectorFilter);

  const activeModalSector = ratingTarget ? getSectorConfig(ratingTarget) : SECTOR_META.hotel;
  const ActiveModalIcon = activeModalSector.Icon;

  const goHomeForUpgrade = () => {
    if (onOpenGrades) onOpenGrades();
    else if (onNavigateTab) onNavigateTab('earnings');
    else if (onNavigateHome) onNavigateHome();
  };

  return (
    <div className="space-y-4 animate-tab">
      {/* Sovereign Tri-Sector Contract Console Header */}
      <div className="exec-royal-surface relative overflow-hidden rounded-[28px] p-5 text-white border border-[#F5D076]/25">
        <div className="pointer-events-none absolute inset-0 exec-filigree opacity-60" />

        <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="gold-crest-pill inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold shrink-0">
              <Award className="w-3.5 h-3.5 text-[#061527]" />
              <span>{currentVip?.name || `الفئة A${user?.vipLevel ?? 0}`}</span>
            </span>
            <span className="font-display text-xs font-extrabold text-white truncate">
              المنتجعات والفنادق والمعالم السياحية
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950/40 border border-white/14 px-2.5 py-1 text-[11px] font-bold text-teal-100 shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#F5D076]" />
            <span className="ltr-num tabular-nums">{countdown}</span>
          </div>
        </div>

        {/* Tri-Sector Coverage Pills Inside Header */}
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 mb-4">
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/15 px-2 py-0.5 text-[10.5px] font-bold text-emerald-200">
            <TreePalm className="w-3 h-3 text-emerald-300" />
            <span>منتجعات عالمية</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/15 px-2 py-0.5 text-[10.5px] font-bold text-[#F5D076]">
            <BedDouble className="w-3 h-3 text-[#F5D076]" />
            <span>فنادق فاخرة</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/15 px-2 py-0.5 text-[10.5px] font-bold text-amber-100">
            <Landmark className="w-3 h-3 text-amber-300" />
            <span>أماكن ومعالم سياحية</span>
          </span>
        </div>

        {/* Daily Progress Bar */}
        <div className="relative z-10 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-200">عقود التقييم المعتمدة اليوم</span>
            <span className="font-extrabold text-[#F5D076] tabular-nums">
              {completedCount} من {totalLimit} عقود ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[#F5D076] to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Earnings Metrics */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-950/35 border border-white/14 p-3">
            <p className="text-[11px] font-medium text-teal-200/90">عائد التقارير اليوم</p>
            <p className="ltr-num tabular-nums text-base font-extrabold text-emerald-300 mt-0.5">
              +${formatUsdt(stats?.todayTaskEarnings)} USDT
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/35 border border-white/14 p-3">
            <p className="text-[11px] font-medium text-slate-300">إجمالي عوائد التقييم</p>
            <p className="ltr-num tabular-nums text-base font-extrabold text-[#F5D076] mt-0.5">
              ${formatUsdt(user?.totalTaskEarnings)} USDT
            </p>
          </div>
        </div>

        {/* Regional Hospitality & Tourism Coverage Map Trigger */}
        <button
          type="button"
          onClick={() => setCoverageOpen(true)}
          className="relative z-10 mt-3 w-full rounded-2xl bg-white/10 hover:bg-white/16 border border-[#F5D076]/30 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-extrabold text-white transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#F5D076]" />
            <span>خريطة المنتجعات والفنادق والوجهات ومؤشر الشفافية</span>
          </span>
          <span className="rounded-lg bg-[#F5D076]/20 border border-[#F5D076]/40 px-2 py-0.5 text-[10px] font-extrabold text-[#F5D076]">
            استعراض حي
          </span>
        </button>
      </div>

      {/* Live Auto-Renewing Gallery Status Bar */}
      <div className="exec-card flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-extrabold text-[#07182B] truncate">
            بث حي متجدد للمنتجعات العالمية والفنادق والمعالم السياحية
          </span>
        </div>

        <button
          type="button"
          disabled={refreshingLive}
          onClick={handleManualRefreshGallery}
          className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-[#07182B] hover:bg-slate-800 border border-[#F5D076]/35 px-2.5 py-1 text-[11px] font-extrabold text-[#F5D076] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${refreshingLive ? 'animate-spin' : ''}`} />
          <span>تجديد البث</span>
        </button>
      </div>

      {/* Sub-tabs Switcher */}
      <div className="grid grid-cols-2 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <button
          type="button"
          onClick={() => setSubTab('today')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            subTab === 'today'
              ? 'bg-[#07182B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className={`w-3.5 h-3.5 ${subTab === 'today' ? 'text-[#F5D076]' : ''}`} />
          <span>عقود اليوم ({totalLimit})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('history')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            subTab === 'history'
              ? 'bg-[#07182B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className={`w-3.5 h-3.5 ${subTab === 'history' ? 'text-[#F5D076]' : ''}`} />
          <span>أرشيف التقارير</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D7A72]" />
          <span className="text-xs font-medium">
            جاري تحميل عقود المنتجعات والفنادق والمعالم السياحية...
          </span>
        </div>
      ) : subTab === 'today' ? (
        <div className="space-y-4">
          {/* Interactive Tri-Sector Filter Pills */}
          {allActiveTasks.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {[
                { key: 'all', label: `الكل (${allActiveTasks.length})`, Icon: Compass },
                {
                  key: 'resort',
                  label: `منتجعات عالمية (${sectorCounts.resort})`,
                  Icon: TreePalm
                },
                {
                  key: 'hotel',
                  label: `فنادق فاخرة (${sectorCounts.hotel})`,
                  Icon: BedDouble
                },
                {
                  key: 'landmark',
                  label: `أماكن سياحية (${sectorCounts.landmark})`,
                  Icon: Landmark
                }
              ].map(({ key, label, Icon }) => {
                const active = sectorFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSectorFilter(key)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-extrabold border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#07182B] text-[#F5D076] border-[#07182B] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#F5D076]' : 'text-[#0D7A72]'}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Limited Special Arona Tourism & Hospitality Missions */}
          {taskData?.flashMissions?.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-b from-amber-50/90 to-white border border-amber-200/85 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-extrabold text-[#07182B]">
                      عقود السياحة والمنتجعات الاستثنائية المحدودة
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      مكافآت إضافية استثنائية بمقاعد محدودة للمنتجعات والفنادق والمعالم المعتمدة
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 border border-amber-300/70 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                  حصري ومحدود
                </span>
              </div>

              <div className="space-y-2.5">
                {taskData.flashMissions.map((fm) => {
                  const minVipReq = fm.minVip ?? fm.minVipLevel ?? 1;
                  const remainingClaims = fm.remainingClaims ?? fm.remainingSlots ?? 0;
                  const completedByUser = Boolean(fm.completedByUser ?? fm.alreadyClaimed);
                  const eligibleVip = Boolean(
                    fm.eligibleVip ?? fm.isVipQualified ?? (user?.vipLevel ?? 0) >= minVipReq
                  );
                  const soldOut = Boolean(fm.soldOut ?? fm.isSoldOut ?? remainingClaims <= 0);
                  const fmImg = assetUrl(fm.imageUrl || '/destinations/dest-7.jpg');
                  const usedPct = Math.min(
                    100,
                    Math.round((fm.claimedCount / Math.max(1, fm.maxClaims)) * 100)
                  );
                  return (
                    <div
                      key={fm.id}
                      className="rounded-2xl bg-white border border-amber-200/75 p-3 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <img
                            src={fmImg}
                            alt={fm.title}
                            onError={(e) => {
                              const fb = assetUrl('/destinations/dest-7.jpg');
                              if (e.currentTarget.src !== fb && !e.currentTarget.dataset.fb) {
                                e.currentTarget.dataset.fb = '1';
                                e.currentTarget.src = fb;
                              }
                            }}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="rounded-md bg-slate-900 text-[#F5D076] px-1.5 py-0.5 text-[10px] font-bold">
                                الفئة A{minVipReq}+
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 truncate">
                                {fm.location}
                              </span>
                            </div>
                            <h4 className="font-display text-xs font-extrabold text-[#07182B] mt-0.5 leading-snug">
                              {fm.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-semibold">
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3 h-3 text-amber-600" />
                                متبقي {remainingClaims} من {fm.maxClaims} مقعد
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          <span className="ltr-num tabular-nums inline-block rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                            +${formatUsdt(fm.reward)}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-amber-500 to-orange-500"
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>

                      <div className="flex justify-end">
                        {completedByUser ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تم توثيق التقرير الاستثنائي
                          </span>
                        ) : !eligibleVip ? (
                          <button
                            type="button"
                            onClick={goHomeForUpgrade}
                            className="rounded-xl bg-slate-100 text-slate-600 px-3 py-1.5 text-[11px] font-bold cursor-pointer"
                          >
                            يتطلب الفئة A{minVipReq}
                          </button>
                        ) : soldOut ? (
                          <span className="text-[11px] font-bold text-slate-400">اكتمل العدد</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              openRatingSheet({
                                id: fm.id,
                                title: fm.title,
                                location: fm.location,
                                category: fm.category || 'عقد استثنائي محدود',
                                image: fmImg,
                                fallbackImage: assetUrl('/destinations/dest-7.jpg'),
                                reward: fm.reward,
                                avgRating: 5.0,
                                isFlashMission: true
                              })
                            }
                            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 text-[11px] font-extrabold transition-colors cursor-pointer"
                          >
                            توثيق التقرير الاستثنائي الآن
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state when user filters a sector with 0 slots right now */}
          {visibleTasks.length === 0 && allActiveTasks.length > 0 && (
            <div className="exec-card rounded-3xl p-5 text-center space-y-2.5">
              <p className="font-display text-sm font-extrabold text-[#07182B]">
                لا توجد عقود ضمن هذا التصنيف في الجولة الحالية
              </p>
              <p className="text-xs text-slate-500">
                اضغط على «تجديد البث» لتدوير حزمة العقود الحية أو استعرض جميع القطاعات المتاحة اليوم
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSectorFilter('all')}
                  className="rounded-xl bg-[#07182B] text-[#F5D076] px-3.5 py-2 text-xs font-extrabold cursor-pointer"
                >
                  عرض كل العقود ({allActiveTasks.length})
                </button>
                <button
                  type="button"
                  onClick={handleManualRefreshGallery}
                  className="rounded-xl bg-slate-100 text-slate-700 px-3.5 py-2 text-xs font-extrabold cursor-pointer"
                >
                  تجديد البث
                </button>
              </div>
            </div>
          )}

          {/* Active Daily Resort, Hotel & Tourist Landmark Contract Cards */}
          {visibleTasks.map((t) => {
            const code = getContractCode(t);
            const sec = getSectorConfig(t);
            const SectorIcon = sec.Icon;
            return (
              <article
                key={t.slot}
                className={`exec-card rounded-[26px] overflow-hidden transition-all ${
                  t.completed ? 'ring-1 ring-emerald-300/80' : ''
                }`}
              >
                <DestinationSlideBanner
                  gallery={t.gallery}
                  fallbackImage={t.fallbackImage || t.image}
                  alt={t.title}
                >
                  {/* Top Badges: Dynamic Sector Contract Badge + Verified USDT Payout */}
                  <div className="absolute top-3 inset-x-3.5 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full backdrop-blur-md border px-2.5 py-1 text-[10.5px] font-extrabold shadow-xs ${sec.badgeTheme}`}
                    >
                      <SectorIcon className={`w-3 h-3 ${sec.iconColor}`} />
                      <span>
                        {t.sectorBadge || sec.badgeLabel} {code}
                      </span>
                    </span>

                    <span className="ltr-num tabular-nums rounded-full bg-[#E8F8F3]/95 text-[#087A62] border border-emerald-300 px-3 py-1 text-xs font-extrabold shadow-sm">
                      +{formatUsdt(t.reward)} USDT
                    </span>
                  </div>

                  {/* Bottom Title & Location Overlay */}
                  <div className="absolute bottom-3 right-3.5 left-16 text-white">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#F5D076] mb-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t.location}</span>
                    </div>
                    <h3 className="font-display text-[15px] font-extrabold leading-snug drop-shadow-xs">
                      {t.title}
                    </h3>
                  </div>
                </DestinationSlideBanner>

                {/* Contract Card Body */}
                <div className="p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-[11px] font-bold text-[#07182B]">
                      <SectorIcon className="w-3.5 h-3.5 text-[#0D7A72]" />
                      <span>{t.category}</span>
                    </span>

                    <div className="flex items-center gap-1 text-slate-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="ltr-num tabular-nums text-[#07182B] font-extrabold">
                        {t.avgRating}
                      </span>
                      <span className="text-[11px] text-slate-400">({t.reviewsCount})</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>

                  {/* Action or Completed Report Summary */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    {t.completed ? (
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200/70 px-2.5 py-1.5 text-xs font-extrabold text-emerald-700 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{sec.completedPill}</span>
                          </span>
                          {t.userRating && <StarRow count={t.userRating} />}
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold truncate">
                          {t.userTags ? t.userTags.split('،')[0] : 'معتمد'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="text-[11px] text-slate-500 font-semibold">
                          تقييم متعدد المحاور • إيداع فوري
                        </div>

                        <button
                          type="button"
                          onClick={() => openRatingSheet(t)}
                          className="exec-primary-btn inline-flex items-center gap-1.5 rounded-2xl text-white px-4 py-2.5 text-xs font-extrabold cursor-pointer"
                        >
                          <SectorIcon className="w-4 h-4 text-[#F5D076]" />
                          <span>{sec.cardCta}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {/* Locked Higher Grade Preview */}
          {taskData?.nextVip && (
            <div className="exec-royal-surface relative overflow-hidden rounded-[26px] text-white p-4 space-y-3 border border-[#F5D076]/25">
              <div className="pointer-events-none absolute inset-0 exec-filigree opacity-50" />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#F5D076]/18 border border-[#F5D076]/35 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#F5D076] mb-1.5">
                    <Lock className="w-3 h-3" />
                    <span>عقود إضافية في {taskData.nextVip.name}</span>
                  </div>
                  <p className="font-display text-sm font-extrabold">
                    قيّم {taskData.nextVip.dailyTasks} منتجعات وفنادق ومعالم يومياً بعائد $
                    {formatUsdt(taskData.nextVip.dailyProfit)} USDT
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    عائد ${formatUsdt(taskData.nextVip.rewardPerTask)} USDT لكل عقد تقييم معتمد
                  </p>
                </div>

                <button
                  type="button"
                  onClick={goHomeForUpgrade}
                  className="gold-crest-pill shrink-0 rounded-xl text-xs font-extrabold px-3.5 py-2.5 cursor-pointer"
                >
                  ترقية العقد
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Completed Resorts, Hotels & Landmarks Reports Archive */
        <div className="exec-card rounded-3xl p-4">
          {!taskData?.history?.length ? (
            <div className="py-10 text-center">
              <p className="font-display text-sm font-extrabold text-[#07182B]">
                لا توجد تقارير موثقة بعد
              </p>
              <p className="text-xs text-slate-500 mt-1">
                أكمل تقييم عقود المنتجعات والفنادق والمعالم السياحية المتاحة اليوم لتظهر تقاريرك هنا
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {taskData.history.map((h) => (
                <div key={h.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  {h.imageUrl ? (
                    <img
                      src={assetUrl(h.imageUrl)}
                      alt={h.title}
                      onError={(e) => {
                        const fb = assetUrl('/destinations/dest-1.jpg');
                        if (e.currentTarget.src !== fb && !e.currentTarget.dataset.fb) {
                          e.currentTarget.dataset.fb = '1';
                          e.currentTarget.src = fb;
                        }
                      }}
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200/80"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#0D7A72] flex items-center justify-center shrink-0">
                      <Compass className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-extrabold text-[#07182B] truncate">{h.title}</p>
                      <span className="ltr-num tabular-nums shrink-0 rounded-xl bg-[#E8F8F3] px-2.5 py-0.5 text-xs font-extrabold text-[#087A62]">
                        +${formatUsdt(h.reward)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <StarRow count={h.rating || 5} size="w-3 h-3" />
                      {h.location && (
                        <span className="text-[10px] text-slate-400 truncate">• {h.location}</span>
                      )}
                    </div>

                    {h.reviewTags && (
                      <p className="text-[11px] text-[#0D7A72] font-semibold mt-1 truncate">
                        {h.reviewTags}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 mt-0.5">
                      الفئة A{h.vipLevel} • {formatDateTimeAr(h.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== UPGRADED TRI-SECTOR CONTRACT EVALUATION MODAL (RESORTS, HOTELS & LANDMARKS) ==================== */}
      {ratingTarget && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[95] bg-[#040D18]/75 backdrop-blur-xs flex items-end sm:items-center justify-center"
            onClick={() => !submittingReview && setRatingTarget(null)}
          >
          <div
            className="w-full max-w-[430px] max-h-[95dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-white shadow-2xl animate-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Luxury Scenic Banner */}
            <div className="relative h-54 w-full overflow-hidden bg-slate-900">
              <img
                src={assetUrl(activeModalImage || ratingTarget.image || ratingTarget.fallbackImage)}
                alt={ratingTarget.title}
                onError={(e) => {
                  const fb = assetUrl(ratingTarget.fallbackImage || '/destinations/dest-1.jpg');
                  if (e.currentTarget.src !== fb && !e.currentTarget.dataset.fb) {
                    e.currentTarget.dataset.fb = '1';
                    e.currentTarget.src = fb;
                  }
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#04101F]/92 via-[#04101F]/35 to-black/25" />

              {/* Top Bar: Close Button + Dynamic Sector Contract Pill */}
              <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-[#F5D076]/45 px-3 py-1 text-[11px] font-extrabold text-white">
                  <ActiveModalIcon className="w-3.5 h-3.5 text-[#F5D076]" />
                  <span>
                    {ratingTarget.sectorBadge || activeModalSector.badgeLabel}{' '}
                    {getContractCode(ratingTarget)}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => !submittingReview && setRatingTarget(null)}
                  aria-label="إغلاق"
                  className="w-8 h-8 rounded-full bg-slate-950/55 hover:bg-slate-950/80 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbnail Strip if multiple live photos exist */}
              {ratingTarget.gallery?.length > 1 && (
                <div className="absolute bottom-3 left-3.5 z-10 flex items-center gap-1.5">
                  {ratingTarget.gallery.slice(0, 3).map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveModalImage(imgUrl)}
                      className={`w-8 h-6 rounded-md overflow-hidden border transition-all cursor-pointer ${
                        activeModalImage === imgUrl
                          ? 'border-[#F5D076] ring-1 ring-[#F5D076] scale-105'
                          : 'border-white/50 opacity-80'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Resort / Hotel / Landmark Title, Location & Global Rating */}
              <div className="absolute bottom-3.5 right-4 left-28 text-white text-right">
                <h3 className="font-display text-[18px] font-extrabold leading-snug drop-shadow-sm">
                  {ratingTarget.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-semibold text-slate-200">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#F5D076]" />
                    <span>{ratingTarget.location}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#F5D076] font-extrabold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="ltr-num tabular-nums">{ratingTarget.avgRating || 4.9}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Evaluation Form Body */}
            <form onSubmit={handleSubmitRating} className="p-4 sm:p-5 space-y-4">
              {/* Sector-Tailored 3-Axis Star Evaluation Box */}
              <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/90 px-3.5 py-2.5">
                <div className="pb-2 mb-1 border-b border-slate-200/75 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-[#0D7A72] inline-flex items-center gap-1.5">
                    <ActiveModalIcon className="w-3.5 h-3.5" />
                    <span>{activeModalSector.modalHeader}</span>
                  </span>
                  <span className="text-[10.5px] font-extrabold text-slate-500">
                    المتوسط: {avgStars}/5
                  </span>
                </div>

                <div className="divide-y divide-slate-200/70">
                  {activeModalSector.criteria.map((axis) => {
                    const currentScore = criteriaScores[axis.key] || 5;
                    return (
                      <div
                        key={axis.key}
                        className="py-2.5 first:pt-1.5 last:pb-0.5 flex items-center justify-between gap-2"
                      >
                        <span className="text-[13px] font-extrabold text-[#07182B]">
                          {axis.label}
                        </span>

                        <div className="flex items-center gap-1" dir="ltr">
                          {[1, 2, 3, 4, 5].map((starNum) => {
                            const active = starNum <= currentScore;
                            return (
                              <button
                                key={starNum}
                                type="button"
                                onClick={() => setAxisScore(axis.key, starNum)}
                                className="p-0.5 transition-transform active:scale-90 cursor-pointer"
                                aria-label={`${axis.label} ${starNum}`}
                              >
                                <Star
                                  className={`w-5 h-5 transition-colors ${
                                    active
                                      ? 'fill-[#F4B400] text-[#F4B400]'
                                      : 'fill-slate-200 text-slate-300'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sector-Tailored Selectable Feature Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {activeModalSector.tags.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold border transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#081C30] text-[#F5D076] border-[#C89D3C]/60 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#F5D076]" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>

              {/* Friend Recommendation Prompt (matching tashare8 Travel Task flow) */}
              <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/90 px-3.5 py-2.5 flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#07182B]">
                  هل ستوصي بهذه الوجهة لصديق؟
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {[
                    { id: 'yes', label: 'نعم' },
                    { id: 'maybe', label: 'سأفكر في الأمر' }
                  ].map((opt) => {
                    const active = recommendChoice === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRecommendChoice(opt.id)}
                        className={`rounded-xl px-3 py-1.5 text-[11px] font-extrabold border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#07182B] text-[#F5D076] border-[#07182B]'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verified USDT Evaluation Reward Box */}
              <div className="rounded-2xl bg-[#EAF8F3] border border-[#BFE7DA] px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0D8A70]/15 text-[#096A56] flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-extrabold text-[#07182B]">
                      عائد توثيق التقييم (+10 نقاط)
                    </p>
                    <p className="ltr-num tabular-nums font-display text-lg font-extrabold text-[#087A62] leading-tight">
                      +{formatUsdt(ratingTarget.reward)} USDT
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-1 border-r border-[#BCE5D9] pr-3">
                  <div className="w-9 h-9 rounded-full bg-[#158F76] text-white flex items-center justify-center font-extrabold text-base shadow-xs">
                    ₮
                  </div>
                </div>
              </div>

              {/* Primary Royal Emerald-Obsidian Submit CTA */}
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full rounded-full py-3.5 px-5 text-white font-display text-sm font-extrabold flex items-center justify-between shadow-[0_14px_28px_-10px_rgba(6,24,44,0.48)] border border-[#F5D076]/50 transition-all cursor-pointer disabled:opacity-65"
                style={{
                  background: 'linear-gradient(90deg, #06182C 0%, #093C49 54%, #0D6E59 100%)'
                }}
              >
                <div className="flex items-center gap-2">
                  {submittingReview ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#F5D076]" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  )}
                </div>
                <span>
                  {submittingReview
                    ? activeModalSector.submittingLabel
                    : activeModalSector.submitLabel}
                </span>
                <ChevronLeft className="w-4 h-4 text-[#F5D076]" />
              </button>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      <HospitalityCoverageModal
        isOpen={coverageOpen}
        onClose={() => setCoverageOpen(false)}
      />
    </div>
  );
}
