import React from 'react';

export default function BrandLogo({
  size = 'md',
  showTagline = false,
  variant = 'dark' // 'dark' (dark text on light bg) | 'light' (white/gold text on dark bg)
}) {
  const dims =
    size === 'xl'
      ? 'w-16 h-16 rounded-[20px]'
      : size === 'lg'
      ? 'w-14 h-14 rounded-2xl'
      : size === 'sm'
      ? 'w-9 h-9 rounded-xl'
      : 'w-10 h-10 rounded-xl';

  const textSize =
    size === 'xl'
      ? 'text-[26px]'
      : size === 'lg'
      ? 'text-2xl'
      : size === 'sm'
      ? 'text-[15.5px]'
      : 'text-lg';

  const isLight = variant === 'light';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`${dims} relative flex items-center justify-center overflow-hidden shrink-0 ${
          isLight
            ? 'border border-[#F5D076]/45 shadow-[0_8px_22px_rgba(0,0,0,0.34)]'
            : 'shadow-sm border border-slate-900/12'
        }`}
        style={{
          background: isLight
            ? 'linear-gradient(145deg, #071A2F 0%, #0B413A 62%, #0D6E61 100%)'
            : 'linear-gradient(135deg, #071A2F 0%, #0B4A41 58%, #0D7A6E 100%)'
        }}
      >
        {/* Precision double-bezel inner gold ring */}
        <div className="pointer-events-none absolute inset-[2px] rounded-[inherit] border border-[#F5D076]/22" />
        <svg viewBox="0 0 64 64" className="w-7/12 h-7/12 relative z-10" fill="none">
          <path
            d="M31.5 10.5L50.5 49.5H40.8L36.5 40H26.5L22.2 49.5H12.5L31.5 10.5ZM31.5 23.5L28.6 31.2H34.4L31.5 23.5Z"
            fill="#FFFFFF"
          />
          <circle cx="48.5" cy="16" r="5.6" fill="#F5D076" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-display font-extrabold tracking-tight ${textSize} ${
              isLight ? 'text-white' : 'text-[#07182B]'
            }`}
          >
            Arona{' '}
            <span className={isLight ? 'text-[#F5D076]' : 'text-[#0D7A72]'}>Boost</span>
          </span>
        </div>
        {showTagline ? (
          <span
            className={`text-[11px] font-medium ${
              isLight ? 'text-teal-100/85' : 'text-slate-500'
            }`}
          >
            المجموعة الدولية للتصنيف والترويج السياحي
          </span>
        ) : (
          <span
            className={`text-[9px] font-bold tracking-wide ${
              isLight ? 'text-[#F5D076]/80' : 'text-slate-400'
            }`}
          >
            التصنيف السياحي المعتمد
          </span>
        )}
      </div>
    </div>
  );
}
