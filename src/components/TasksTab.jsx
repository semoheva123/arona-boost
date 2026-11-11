import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Star,
  RefreshCw,
  Zap,
  BedDouble,
  TreePalm,
  Landmark,
  ShieldCheck,
  Wallet,
  X,
  ChevronLeft,
  Volume2,
  Globe2
} from 'lucide-react';
import { apiRequest, assetUrl, formatUsdt, formatDateTimeAr } from '../api';
import HospitalityCoverageModal from './HospitalityCoverageModal';
import ModalPortal from './ModalPortal';

const SECTOR_META = {
  resort: {
    id: 'resort',
    shortLabel: 'منتجع عالمي',
    badgeLabel: 'عقد منتجع عالمي',
    Icon: TreePalm,
    modalHeader: 'بروتوكول تقييم المنتجع والاستجمام',
    submitLabel: 'اعتماد وإرسال تقرير المنتجع',
    submittingLabel: 'جاري اعتماد التقرير...',
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
    shortLabel: 'فندق فاخر',
    badgeLabel: 'عقد فندق عالمي',
    Icon: BedDouble,
    modalHeader: 'بروتوكول التقييم الفندقي المعتمد',
    submitLabel: 'اعتماد وإرسال التقرير الفندقي',
    submittingLabel: 'جاري اعتماد التقرير...',
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
    shortLabel: 'معلم سياحي',
    badgeLabel: 'عقد معلم سياحي',
    Icon: Landmark,
    modalHeader: 'بروتوكول تقييم الوجهة والمعلم السياحي',
    submitLabel: 'اعتماد وإرسال التقرير السياحي',
    submittingLabel: 'جاري اعتماد التقرير...',
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

  // Matches tashare8 pages-task-index: top tabIndex (0 = مهام السفر اليوم, 1 = قائمة السفر) + inner current (0 = قيد التنفيذ, 1 = مكتمل)
  const [mainView, setMainView] = useState('hub'); // 'hub' | 'list'
  const [listFilter, setListFilter] = useState('pending'); // 'pending' | 'completed'
  const [heroIdx, setHeroIdx] = useState(0);
  const [countdown, setCountdown] = useState(getRemainingToUtcMidnight());
  const [rotationSeed, setRotationSeed] = useState(() => Math.floor(Date.now() / 45000) % 1000);

  // Approved 3-Axis Evaluation Modal State
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

  // Rotate top live destination hero every 6 seconds
  const allActiveTasks = taskData?.activeTasks || [];
  useEffect(() => {
    if (allActiveTasks.length <= 1) return undefined;
    const t = setInterval(() => {
      setHeroIdx((p) => (p + 1) % allActiveTasks.length);
    }, 6000);
    return () => clearInterval(t);
  }, [allActiveTasks.length]);

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
      await new Promise((r) => setTimeout(r, 450));

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

  const stats = taskData?.todayStats;
  const completedCount = stats?.todayCompletedCount ?? 0;
  const totalLimit = stats?.dailyTasksLimit ?? 1;
  const nextPendingTask = allActiveTasks.find((t) => !t.completed) || null;
  const heroDest = allActiveTasks[heroIdx % Math.max(1, allActiveTasks.length)] || null;
  const pendingTasks = allActiveTasks.filter((t) => !t.completed);

  const activeModalSector = ratingTarget ? getSectorConfig(ratingTarget) : SECTOR_META.hotel;
  const ActiveModalIcon = activeModalSector.Icon;

  const goHomeForUpgrade = () => {
    if (onOpenGrades) onOpenGrades();
    else if (onNavigateTab) onNavigateTab('earnings');
    else if (onNavigateHome) onNavigateHome();
  };

  const handleStartNextTask = () => {
    if (nextPendingTask) {
      openRatingSheet(nextPendingTask);
    } else if (totalLimit > 0 && completedCount >= totalLimit) {
      showToast('لقد أتممت كافة مهام تقييم السفر المخصصة لك اليوم بنجاح');
    }
  };

  return (
    <div className="space-y-3.5 pt-2 animate-tab">
      {/* 1. Clean 2-Tab Top Switcher (EXACT tashare8 pages-task-index trade-title-box!) */}
      <div className="bg-white rounded-2xl p-1.5 shadow-[0_3px_12px_rgba(7,24,43,0.05)] grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setMainView('hub')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
            mainView === 'hub'
              ? 'bg-[#07182B] text-[#F5D076]'
              : 'text-slate-600 hover:text-[#07182B]'
          }`}
        >
          مهام السفر اليوم
        </button>

        <button
          type="button"
          onClick={() => setMainView('list')}
          className={`py-2.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
            mainView === 'list'
              ? 'bg-[#0D7A72] text-white'
              : 'text-slate-600 hover:text-[#07182B]'
          }`}
        >
          قائمة السفر ({completedCount}/{totalLimit})
        </button>
      </div>

      {loading ? (
        <div className="py-14 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D7A72]" />
          <span className="text-xs font-medium">جاري تحميل وجهات السفر الحية...</span>
        </div>
      ) : mainView === 'hub' ? (
        <div className="space-y-3.5">
          {/* 2. Single-Line White Speaker Notice + Live Refresh */}
          <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-[0_2px_10px_rgba(7,24,43,0.04)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Volume2 className="w-4 h-4 text-[#0D7A72] shrink-0" />
              <p className="text-xs font-semibold text-slate-600 truncate">
                تقييم منتجعات عالمية وفنادق ومعالم سياحية • تجديد اليوم بعد{' '}
                <span className="ltr-num font-bold text-[#07182B]">{countdown}</span>
              </p>
            </div>

            <button
              type="button"
              disabled={refreshingLive}
              onClick={handleManualRefreshGallery}
              title="تحديث الصور الحية"
              className="w-7 h-7 rounded-lg bg-[#EEF4F8] text-[#07182B] flex items-center justify-center shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingLive ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 3. Two Clean White Metric Cards Side-by-Side (EXACT tashare8 contwo-box tab-a!) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)]">
              <p className="text-xs font-semibold text-slate-500">أرباح مهام اليوم</p>
              <p className="ltr-num tabular-nums font-display text-lg font-extrabold text-[#0D7A72] mt-1">
                USDT {formatUsdt(stats?.todayTaskEarnings)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)]">
              <p className="text-xs font-semibold text-slate-500">الرصيد الشخصي</p>
              <p className="ltr-num tabular-nums font-display text-lg font-extrabold text-[#07182B] mt-1">
                USDT {formatUsdt((user?.balance || 0) + (user?.rechargeBalance || 0))}
              </p>
            </div>
          </div>

          {/* 4. Clean Auto-Renewing Live Destination Showcase Card */}
          {heroDest && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(7,24,43,0.05)]">
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                <img
                  key={heroDest.image || heroDest.key}
                  src={assetUrl(heroDest.image || heroDest.fallbackImage)}
                  alt={heroDest.title}
                  onError={(e) => {
                    const fb = assetUrl(heroDest.fallbackImage || '/destinations/dest-1.jpg');
                    if (e.currentTarget.src !== fb && !e.currentTarget.dataset.fb) {
                      e.currentTarget.dataset.fb = '1';
                      e.currentTarget.src = fb;
                    }
                  }}
                  className="w-full h-full object-cover animate-photo-fade"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                  <span className="rounded-full bg-black/45 backdrop-blur-xs text-[#F5D076] px-2.5 py-1 text-[10.5px] font-extrabold">
                    {getSectorConfig(heroDest).shortLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCoverageOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-white/90 text-[#07182B] px-2.5 py-1 text-[10px] font-extrabold cursor-pointer"
                  >
                    <Globe2 className="w-3 h-3 text-[#0D7A72]" />
                    <span>خريطة الوجهات</span>
                  </button>
                </div>

                <div className="absolute bottom-3 inset-x-3.5 text-white flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#F5D076] font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{heroDest.location}</span>
                    </p>
                    <h3 className="font-display text-sm font-extrabold truncate mt-0.5">
                      {heroDest.title}
                    </h3>
                  </div>
                  <span className="ltr-num rounded-lg bg-[#0D7A72] text-white px-2.5 py-1 text-xs font-extrabold shrink-0">
                    +{formatUsdt(heroDest.reward)} USDT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Clean Greeting + Primary Start Action Card (EXACT tashare8 start + btns!) */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-3.5 text-center">
            <p className="text-xs font-bold text-slate-600">
              عزيزي عضو{' '}
              <span className="font-extrabold text-[#0D7A72]">
                الفئة A{user?.vipLevel ?? 0}
              </span>{' '}
              ، مهام تقييم السفر اليومية المخصصة لحسابك:
            </p>

            <button
              type="button"
              onClick={handleStartNextTask}
              className={`w-full rounded-full py-3.5 px-6 font-display text-sm font-extrabold shadow-sm transition-all cursor-pointer ${
                nextPendingTask
                  ? 'bg-[#0D7A72] hover:bg-[#0A645D] text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {nextPendingTask ? (
                <span>
                  بدء تقييم السفر الآن ({completedCount}/{totalLimit})
                </span>
              ) : (
                <span>
                  اكتملت مهام اليوم ({completedCount}/{totalLimit})
                </span>
              )}
            </button>

            {taskData?.nextVip && (
              <button
                type="button"
                onClick={goHomeForUpgrade}
                className="text-xs font-extrabold text-[#07182B] hover:text-[#0D7A72] cursor-pointer"
              >
                ترقية إلى {taskData.nextVip.name} للحصول على {taskData.nextVip.dailyTasks} مهام يومياً ($
                {formatUsdt(taskData.nextVip.dailyProfit)}/يوم) ←
              </button>
            )}
          </div>

          {/* 6. Clean 2-Column Destination Cards Grid (EXACT tashare8 item-box 2-per-row!) */}
          <div className="grid grid-cols-2 gap-3">
            {allActiveTasks.map((t) => {
              const sec = getSectorConfig(t);
              return (
                <div
                  key={t.slot}
                  className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(7,24,43,0.05)] flex flex-col"
                >
                  <div className="relative h-28 bg-slate-200 overflow-hidden">
                    <img
                      src={assetUrl(t.image || t.fallbackImage)}
                      alt={t.title}
                      loading="lazy"
                      onError={(e) => {
                        const fb = assetUrl(t.fallbackImage || '/destinations/dest-1.jpg');
                        if (e.currentTarget.src !== fb && !e.currentTarget.dataset.fb) {
                          e.currentTarget.dataset.fb = '1';
                          e.currentTarget.src = fb;
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 rounded-md bg-black/55 backdrop-blur-xs text-white px-2 py-0.5 text-[9.5px] font-bold">
                      {sec.shortLabel}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <h4 className="font-display text-xs font-extrabold text-[#07182B] line-clamp-1">
                        {t.title}
                      </h4>
                      <p className="text-[11px] font-bold text-[#0D7A72] mt-1 ltr-num">
                        العائد: +{formatUsdt(t.reward)} USDT
                      </p>
                    </div>

                    {t.completed ? (
                      <div className="w-full rounded-lg bg-emerald-50 text-[#0D7A72] py-1.5 text-center text-[11px] font-extrabold">
                        مكتمل
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openRatingSheet(t)}
                        className="w-full rounded-lg bg-[#07182B] hover:bg-slate-800 text-[#F5D076] py-1.5 text-[11px] font-extrabold cursor-pointer"
                      >
                        إرسال التقييم
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 7. Compact Flash Missions (if any exist) */}
          {taskData?.flashMissions?.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-display text-xs font-extrabold text-[#07182B]">
                  <Zap className="w-4 h-4 text-[#D49B2A]" />
                  <span>مهام سياحية خاصة محدودة</span>
                </span>
              </div>

              {taskData.flashMissions.map((fm) => {
                const minVipReq = fm.minVip ?? fm.minVipLevel ?? 1;
                const remainingClaims = fm.remainingClaims ?? fm.remainingSlots ?? 0;
                const completedByUser = Boolean(fm.completedByUser ?? fm.alreadyClaimed);
                const eligibleVip = Boolean(
                  fm.eligibleVip ?? fm.isVipQualified ?? (user?.vipLevel ?? 0) >= minVipReq
                );
                const soldOut = Boolean(fm.soldOut ?? fm.isSoldOut ?? remainingClaims <= 0);
                const fmImg = assetUrl(fm.imageUrl || '/destinations/dest-7.jpg');

                return (
                  <div
                    key={fm.id}
                    className="rounded-xl bg-[#F6F9FC] p-3 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
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
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#07182B] truncate">{fm.title}</p>
                        <p className="text-[10.5px] text-slate-500 mt-0.5">
                          الفئة A{minVipReq}+ •{' '}
                          <span className="ltr-num font-bold text-[#0D7A72]">
                            +${formatUsdt(fm.reward)} USDT
                          </span>
                        </p>
                      </div>
                    </div>

                    {completedByUser ? (
                      <span className="text-[11px] font-bold text-[#0D7A72] shrink-0">مكتمل</span>
                    ) : !eligibleVip ? (
                      <button
                        type="button"
                        onClick={goHomeForUpgrade}
                        className="rounded-lg bg-slate-200/80 text-slate-700 px-2.5 py-1.5 text-[10.5px] font-bold shrink-0 cursor-pointer"
                      >
                        ترقية A{minVipReq}
                      </button>
                    ) : soldOut ? (
                      <span className="text-[11px] text-slate-400 shrink-0">مكتمل العدد</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openRatingSheet({
                            id: fm.id,
                            title: fm.title,
                            location: fm.location,
                            category: fm.category || 'مهمة خاصة',
                            image: fmImg,
                            fallbackImage: assetUrl('/destinations/dest-7.jpg'),
                            reward: fm.reward,
                            avgRating: 5.0,
                            isFlashMission: true
                          })
                        }
                        className="rounded-lg bg-[#0D7A72] text-white px-3 py-1.5 text-[11px] font-extrabold shrink-0 cursor-pointer"
                      >
                        تقييم
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: قائمة السفر (قيد التنفيذ | مكتمل — EXACT tashare8 content-box!) */
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-1 shadow-[0_2px_10px_rgba(7,24,43,0.04)] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setListFilter('pending')}
              className={`py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                listFilter === 'pending'
                  ? 'bg-[#EEF4F8] text-[#07182B]'
                  : 'text-slate-500'
              }`}
            >
              قيد التنفيذ ({pendingTasks.length})
            </button>

            <button
              type="button"
              onClick={() => setListFilter('completed')}
              className={`py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                listFilter === 'completed'
                  ? 'bg-[#EEF4F8] text-[#07182B]'
                  : 'text-slate-500'
              }`}
            >
              مكتمل ({taskData?.history?.length || 0})
            </button>
          </div>

          {listFilter === 'pending' ? (
            !pendingTasks.length ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-[0_4px_16px_rgba(7,24,43,0.05)]">
                <p className="text-xs font-bold text-slate-500">
                  لا توجد مهام قيد التنفيذ حالياً — أتممت حصة اليوم بنجاح
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {pendingTasks.map((t) => (
                  <div
                    key={t.slot}
                    className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(7,24,43,0.05)] flex flex-col"
                  >
                    <img
                      src={assetUrl(t.image || t.fallbackImage)}
                      alt={t.title}
                      onError={(e) => {
                        const fb = assetUrl(t.fallbackImage || '/destinations/dest-1.jpg');
                        if (e.currentTarget.src !== fb && !e.currentTarget.dataset.fb) {
                          e.currentTarget.dataset.fb = '1';
                          e.currentTarget.src = fb;
                        }
                      }}
                      className="h-28 w-full object-cover"
                    />
                    <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <h4 className="font-display text-xs font-extrabold text-[#07182B] line-clamp-1">
                          {t.title}
                        </h4>
                        <p className="text-[11px] font-bold text-[#0D7A72] mt-1 ltr-num">
                          +{formatUsdt(t.reward)} USDT
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openRatingSheet(t)}
                        className="w-full rounded-lg bg-[#0D7A72] text-white py-1.5 text-[11px] font-extrabold cursor-pointer"
                      >
                        إرسال التقييم
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : !taskData?.history?.length ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-[0_4px_16px_rgba(7,24,43,0.05)]">
              <p className="text-xs font-bold text-slate-500">لا توجد مهام مكتملة في الأرشيف بعد</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(7,24,43,0.05)] divide-y divide-slate-100">
              {taskData.history.map((h) => (
                <div key={h.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                  <img
                    src={assetUrl(h.imageUrl || '/destinations/dest-1.jpg')}
                    alt={h.title}
                    onError={(e) => {
                      const fb = assetUrl('/destinations/dest-1.jpg');
                      if (e.currentTarget.src !== fb && !e.currentTarget.dataset.fb) {
                        e.currentTarget.dataset.fb = '1';
                        e.currentTarget.src = fb;
                      }
                    }}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-[#07182B] truncate">{h.title}</p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      {formatDateTimeAr(h.createdAt)}
                    </p>
                  </div>
                  <span className="ltr-num text-xs font-extrabold text-[#0D7A72] shrink-0">
                    +${formatUsdt(h.reward)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== APPROVED 3-AXIS TRI-SECTOR EVALUATION MODAL (RESORTS, HOTELS & LANDMARKS) ==================== */}
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
              {/* Top Scenic Banner */}
              <div className="relative h-52 w-full overflow-hidden bg-slate-900">
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
                    className="w-8 h-8 rounded-full bg-slate-950/55 hover:bg-slate-950/80 backdrop-blur-md border border-white/25 text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

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

                <div className="absolute bottom-3.5 right-4 left-28 text-white text-right">
                  <h3 className="font-display text-[17px] font-extrabold leading-snug drop-shadow-sm">
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
              <form onSubmit={handleSubmitRating} className="p-4 space-y-3.5">
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
                          className="py-2 first:pt-1.5 last:pb-0.5 flex items-center justify-between gap-2"
                        >
                          <span className="text-[12.5px] font-extrabold text-[#07182B]">
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

                {/* Feature Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeModalSector.tags.map((tag) => {
                    const selected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#081C30] text-[#F5D076] border-[#C89D3C]/60'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-[#F5D076]" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Friend Recommendation Prompt */}
                <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/90 px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#07182B]">
                    هل ستوصي بهذه الوجهة لصديق؟
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[
                      { id: 'yes', label: 'نعم' },
                      { id: 'maybe', label: 'ربما' }
                    ].map((opt) => {
                      const active = recommendChoice === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setRecommendChoice(opt.id)}
                          className={`rounded-xl px-3 py-1 text-[11px] font-extrabold border transition-all cursor-pointer ${
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

                {/* Reward Strip */}
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

                  <div className="w-9 h-9 rounded-full bg-[#158F76] text-white flex items-center justify-center font-extrabold text-base">
                    ₮
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full rounded-full py-3.5 px-5 text-white font-display text-sm font-extrabold flex items-center justify-between shadow-md border border-[#F5D076]/50 transition-all cursor-pointer disabled:opacity-65"
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
