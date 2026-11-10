import React, { useState, useEffect } from 'react';
import { MapPin, Star, ChevronLeft, Compass } from 'lucide-react';
import LivePhotoReel from './LivePhotoReel';
import { apiRequest } from '../api';

const FALLBACK_TOURISM_SPOTS = [
  {
    id: 'spot-maldives',
    sectorBadge: 'عقد منتجع عالمي',
    title: 'منتجعات جزر المالديف الفيروزية العائمة',
    country: 'جزر المالديف',
    gallery: ['/destinations/dest-7.jpg', '/destinations/dest-8.jpg']
  },
  {
    id: 'spot-dubai-hotel',
    sectorBadge: 'عقد فندق عالمي',
    title: 'فنادق وأجنحة بوليفارد دبي ونخلة جميرا',
    country: 'الإمارات العربية المتحدة',
    gallery: ['/destinations/dest-1.jpg', '/destinations/dest-2.jpg']
  },
  {
    id: 'spot-petra',
    sectorBadge: 'عقد معلم سياحي',
    title: 'مدينة البتراء الوردية ومحمية وادي رم',
    country: 'المملكة الأردنية الهاشمية',
    gallery: ['/destinations/dest-3.jpg', '/destinations/dest-4.jpg']
  }
];

export default function ServicesCarousel({ onNavigateTab }) {
  const [featuredSpots, setFeaturedSpots] = useState(FALLBACK_TOURISM_SPOTS);
  const [spotIdx, setSpotIdx] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadFeatured = async (seedVal) => {
      try {
        const res = await apiRequest(`/api/destinations/featured?seed=${seedVal}`);
        if (mounted && Array.isArray(res.items) && res.items.length > 0) {
          setFeaturedSpots(res.items);
        }
      } catch {
        // local destinations remain active
      }
    };

    loadFeatured(Math.floor(Date.now() / 30000) % 500);
    const refreshTimer = setInterval(() => {
      loadFeatured(Math.floor(Date.now() / 15000) % 999);
    }, 45000);

    return () => {
      mounted = false;
      clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSpotIdx((prev) => (prev + 1) % Math.max(1, featuredSpots.length));
    }, 8000);
    return () => clearInterval(timer);
  }, [featuredSpots.length]);

  const currentSpot = featuredSpots[spotIdx % featuredSpots.length] || FALLBACK_TOURISM_SPOTS[0];
  const gallery =
    Array.isArray(currentSpot.gallery) && currentSpot.gallery.length > 0
      ? currentSpot.gallery
      : ['/destinations/dest-1.jpg'];

  return (
    <div className="exec-card rounded-[24px] overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/80 text-[#0D7A72] flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-xs sm:text-[13px] font-extrabold text-[#07182B] truncate">
              المنتجعات والفنادق والوجهات المتعاقدة
            </h3>
            <p className="text-[10px] text-slate-500 truncate">
              صور حية متجددة للمنتجعات العالمية والفنادق والمعالم السياحية
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('tasks')}
          className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-[#07182B] hover:bg-[#0D2744] text-[#F5D076] px-3 py-1.5 text-[11px] font-extrabold transition-colors cursor-pointer"
        >
          <span>بدء التقييم</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        <LivePhotoReel
          images={gallery}
          fallbackImage={gallery[0]}
          alt={currentSpot.title}
          heightClass="h-44"
          intervalMs={4200}
          showStoryBars={false}
        />

        {currentSpot.sectorBadge && (
          <div className="absolute top-2.5 right-3 z-10">
            <span className="inline-flex items-center rounded-full bg-[#07182B]/80 border border-[#F5D076]/40 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-extrabold text-[#F5D076]">
              {currentSpot.sectorBadge}
            </span>
          </div>
        )}

        <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-[#07182B]/85 border border-white/15 backdrop-blur-xs px-3 py-1.5 text-[11px] font-bold text-white max-w-[78%] truncate">
            <MapPin className="w-3.5 h-3.5 text-[#F5D076] shrink-0" />
            <span className="truncate">{currentSpot.title}</span>
          </div>

          <span className="inline-flex items-center gap-1 rounded-xl bg-[#07182B]/85 border border-[#F5D076]/40 backdrop-blur-xs px-2.5 py-1 text-[10.5px] font-extrabold text-[#F5D076] shrink-0">
            <Star className="w-3 h-3 fill-[#F5D076] text-[#F5D076]" />
            <span className="ltr-num">5.0</span>
          </span>
        </div>
      </div>
    </div>
  );
}
