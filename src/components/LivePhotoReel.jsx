import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { assetUrl } from '../api';

export default function LivePhotoReel({
  images = [],
  fallbackImage = '/destinations/dest-1.jpg',
  alt = '',
  heightClass = 'h-48',
  intervalMs = 3800,
  staggerDelayMs = 0,
  showStoryBars = true,
  showNavArrows = false,
  onActiveImageChange,
  children
}) {
  const safeFallback = assetUrl(fallbackImage || '/destinations/dest-1.jpg');
  const [failedSet, setFailedSet] = useState(() => new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [started, setStarted] = useState(staggerDelayMs === 0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  const normalizedImages = useMemo(
    () => (Array.isArray(images) ? images.map((u) => assetUrl(u)).filter(Boolean) : []),
    [images]
  );

  // Reset failedSet & index if images identity changes
  const gallerySignature = normalizedImages.join('|');
  useEffect(() => {
    setFailedSet(new Set());
    setActiveIndex(0);
  }, [gallerySignature]);

  const validImages = useMemo(() => {
    const raw = normalizedImages.length > 0 ? normalizedImages : [safeFallback];
    const filtered = raw.filter((u) => u && !failedSet.has(u));
    if (filtered.length > 0) return filtered;
    return [safeFallback];
  }, [normalizedImages, safeFallback, failedSet]);

  const safeIndex = activeIndex % validImages.length;
  const currentSrc = validImages[safeIndex] || safeFallback;

  useEffect(() => {
    if (onActiveImageChange) {
      onActiveImageChange(currentSrc);
    }
  }, [currentSrc, onActiveImageChange]);

  // Preload next image so crossfade is zero-flicker
  useEffect(() => {
    if (validImages.length <= 1) return;
    const nextIdx = (safeIndex + 1) % validImages.length;
    const preload = new Image();
    preload.src = validImages[nextIdx];
  }, [safeIndex, validImages]);

  useEffect(() => {
    if (staggerDelayMs <= 0) {
      setStarted(true);
      return;
    }
    const t = setTimeout(() => setStarted(true), staggerDelayMs);
    return () => clearTimeout(t);
  }, [staggerDelayMs]);

  useEffect(() => {
    if (!started || paused || validImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % validImages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [started, paused, validImages.length, intervalMs]);

  const handleImgError = (badUrl) => {
    if (badUrl === safeFallback) return;
    setFailedSet((prev) => {
      const next = new Set(prev);
      next.add(badUrl);
      return next;
    });
  };

  const goNext = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % validImages.length);
  };

  const goPrev = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null && validImages.length > 1) {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 35) {
        if (delta > 0) goNext();
        else goPrev();
      }
    }
    touchStartX.current = null;
    setPaused(false);
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${heightClass} bg-slate-900 overflow-hidden select-none`}
    >
      {validImages.map((src, idx) => {
        const isCurrent = idx === safeIndex;
        const isNeighbor =
          idx === (safeIndex + 1) % validImages.length ||
          idx === (safeIndex - 1 + validImages.length) % validImages.length;
        if (!isCurrent && !isNeighbor) return null;

        return (
          <img
            key={`${src}-${idx}`}
            src={src}
            alt={alt}
            onError={() => handleImgError(src)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
              isCurrent ? 'opacity-100 z-[1] animate-ken-burns' : 'opacity-0 z-0'
            }`}
          />
        );
      })}

      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-slate-950/80 via-slate-900/15 to-slate-950/40" />

      {showStoryBars && validImages.length > 1 && (
        <div
          className="absolute top-2 inset-x-3 z-[4] flex items-center gap-1"
          dir="ltr"
        >
          {validImages.map((_, idx) => {
            const isPast = idx < safeIndex;
            const isActive = idx === safeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                aria-label={`صورة ${idx + 1}`}
                className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden cursor-pointer"
              >
                {isPast && <div className="h-full w-full bg-white rounded-full" />}
                {isActive && (
                  <div
                    key={`${safeIndex}-${paused ? 'p' : 'r'}`}
                    className="h-full bg-teal-300 rounded-full animate-story-bar"
                    style={{
                      animationDuration: `${intervalMs}ms`,
                      animationPlayState: paused || !started ? 'paused' : 'running'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {showNavArrows && validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="الصورة السابقة"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-[4] w-7 h-7 rounded-full bg-slate-900/45 hover:bg-slate-900/70 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="الصورة التالية"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-[4] w-7 h-7 rounded-full bg-slate-900/45 hover:bg-slate-900/70 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </>
      )}

      <div className="relative z-[3] w-full h-full">{children}</div>
    </div>
  );
}
