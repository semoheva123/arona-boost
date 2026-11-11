import React from 'react';

/**
 * Clean, glossy 3D-inspired vector icons & pastel-royal card illustrations
 * modeled directly after tashare8.com's visual style in Arona Boost Royal Sovereign colors.
 */

export function TashareWithdrawIcon({ className = 'w-12 h-12' }) {
  return (
    <svg viewBox="0 0 56 56" className={className} fill="none">
      <defs>
        <linearGradient id="ab-wd-bg" x1="8" y1="6" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8DB84" />
          <stop offset="100%" stopColor="#D49B2A" />
        </linearGradient>
        <linearGradient id="ab-wd-card" x1="14" y1="18" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#FFF4D4" stopOpacity="0.88" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="48" height="48" rx="15" fill="url(#ab-wd-bg)" />
      <rect x="13" y="21" width="30" height="20" rx="5" fill="url(#ab-wd-card)" />
      <rect x="13" y="25" width="30" height="4" fill="#D49B2A" fillOpacity="0.35" />
      <circle cx="28" cy="17" r="7" fill="#07182B" />
      <path d="M28 20.5V13.8M28 13.8L25.2 16.6M28 13.8L30.8 16.6" stroke="#F5D076" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TashareDepositIcon({ className = 'w-12 h-12' }) {
  return (
    <svg viewBox="0 0 56 56" className={className} fill="none">
      <defs>
        <linearGradient id="ab-dp-bg" x1="6" y1="6" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#123A63" />
          <stop offset="100%" stopColor="#07182B" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="48" height="48" rx="15" fill="url(#ab-dp-bg)" />
      <rect x="13" y="18" width="30" height="22" rx="5.5" fill="#FFFFFF" fillOpacity="0.94" />
      <path d="M33 25.5H43V32.5H33C31.07 32.5 29.5 30.93 29.5 29C29.5 27.07 31.07 25.5 33 25.5Z" fill="#0D7A72" />
      <circle cx="33.5" cy="29" r="1.6" fill="#F5D076" />
      <path d="M22 14V21M22 21L19.3 18.3M22 21L24.7 18.3" stroke="#F5D076" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TashareInviteIcon({ className = 'w-12 h-12' }) {
  return (
    <svg viewBox="0 0 56 56" className={className} fill="none">
      <defs>
        <linearGradient id="ab-inv-bg" x1="6" y1="6" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#149B90" />
          <stop offset="100%" stopColor="#0A665F" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="48" height="48" rx="15" fill="url(#ab-inv-bg)" />
      <rect x="15" y="14" width="26" height="19" rx="4" fill="#FFF7DE" />
      <path d="M22 20.5H34M22 24.5H30" stroke="#0A665F" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 24L28 34L44 24V40C44 41.66 42.66 43 41 43H15C13.34 43 12 41.66 12 40V24Z" fill="#FFFFFF" fillOpacity="0.95" />
      <circle cx="39" cy="16" r="5" fill="#F5D076" />
    </svg>
  );
}

export function TashareInvestIcon({ className = 'w-12 h-12' }) {
  return (
    <svg viewBox="0 0 56 56" className={className} fill="none">
      <defs>
        <linearGradient id="ab-iv-bg" x1="8" y1="6" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B2947" />
          <stop offset="100%" stopColor="#0D7A72" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="48" height="48" rx="15" fill="url(#ab-iv-bg)" />
      <circle cx="28" cy="28" r="14" fill="#F5D076" fillOpacity="0.18" stroke="#F5D076" strokeWidth="1.8" />
      <path d="M19 33L25 27L29.5 30.5L37 21.5" stroke="#F5D076" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32.5 21.5H37V26" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TashareTileIcon({ variant = 'withdraw', className = 'w-11 h-11' }) {
  const configs = {
    withdraw: { bg: '#FFF7E3', stroke: '#C88D1E', accent: '#07182B' },
    recharge: { bg: '#E7F5F3', stroke: '#0D7A72', accent: '#D49B2A' },
    ledger: { bg: '#EAF0F8', stroke: '#0B2A4A', accent: '#0D7A72' },
    daily: { bg: '#E8F6F2', stroke: '#0D7A72', accent: '#07182B' },
    wheel: { bg: '#FFF3DC', stroke: '#D49B2A', accent: '#0D7A72' },
    envelope: { bg: '#FDECEC', stroke: '#C83745', accent: '#F5D076' },
    shop: { bg: '#EEF2FA', stroke: '#123A63', accent: '#D49B2A' },
    cert: { bg: '#EBF5F3', stroke: '#07182B', accent: '#0D7A72' }
  };
  const c = configs[variant] || configs.ledger;

  return (
    <div
      className={`${className} rounded-2xl bg-white shadow-[0_4px_14px_rgba(7,24,43,0.06)] flex items-center justify-center shrink-0`}
    >
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect x="3" y="3" width="34" height="34" rx="11" fill={c.bg} />
        {variant === 'withdraw' && (
          <>
            <rect x="10" y="15" width="20" height="13" rx="3" stroke={c.stroke} strokeWidth="2" fill="#FFFFFF" />
            <path d="M20 19V11M20 11L17.2 13.8M20 11L22.8 13.8" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {variant === 'recharge' && (
          <>
            <rect x="10" y="13" width="20" height="14" rx="3.5" stroke={c.stroke} strokeWidth="2" fill="#FFFFFF" />
            <circle cx="25" cy="20" r="2" fill={c.accent} />
            <path d="M16 10V15" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {variant === 'ledger' && (
          <>
            <rect x="11" y="9" width="18" height="22" rx="3" stroke={c.stroke} strokeWidth="2" fill="#FFFFFF" />
            <path d="M15 15H25M15 20H25M15 25H21" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {variant === 'daily' && (
          <>
            <rect x="10" y="11" width="20" height="19" rx="3" stroke={c.stroke} strokeWidth="2" fill="#FFFFFF" />
            <path d="M14 9V13M26 9V13M10 16H30" stroke={c.stroke} strokeWidth="1.9" strokeLinecap="round" />
            <path d="M15 24L18.5 21L21.5 23L25.5 19" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {variant === 'wheel' && (
          <>
            <circle cx="20" cy="20" r="9.5" stroke={c.stroke} strokeWidth="2.2" fill="#FFFFFF" />
            <circle cx="20" cy="20" r="3" fill={c.accent} />
            <path d="M20 10.5V17M20 23V29.5M10.5 20H17M23 20H29.5" stroke={c.stroke} strokeWidth="1.8" />
          </>
        )}
        {variant === 'envelope' && (
          <>
            <rect x="11" y="10" width="18" height="20" rx="3.5" fill="#D93848" />
            <path d="M11 15C15.5 18.5 24.5 18.5 29 15" stroke="#F5D076" strokeWidth="1.8" />
            <circle cx="20" cy="17.5" r="2.8" fill="#F5D076" />
          </>
        )}
        {variant === 'shop' && (
          <>
            <path d="M12 16H28L26.5 28.5H13.5L12 16Z" stroke={c.stroke} strokeWidth="2" fill="#FFFFFF" strokeLinejoin="round" />
            <path d="M16 16V13.5C16 11.57 17.57 10 19.5 10H20.5C22.43 10 24 11.57 24 13.5V16" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {variant === 'cert' && (
          <>
            <rect x="10" y="11" width="20" height="16" rx="3" stroke={c.stroke} strokeWidth="2" fill="#FFFFFF" />
            <circle cx="24.5" cy="24.5" r="4" fill={c.accent} />
            <path d="M14 16H22M14 20H19" stroke={c.stroke} strokeWidth="1.8" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * Pastel-Royal Illustrated Banner for "< الأرباح" card on Home (matches IMG_4532.png left card)
 */
export function ProfitCardIllustration() {
  return (
    <div
      className="w-full h-[92px] rounded-xl overflow-hidden relative flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #E6F5F1 0%, #D9EFEA 55%, #FBF3DC 100%)'
      }}
    >
      <svg viewBox="0 0 220 96" className="w-full h-full" fill="none">
        <circle cx="176" cy="20" r="28" fill="#F5D076" fillOpacity="0.28" />
        <circle cx="42" cy="78" r="32" fill="#0D7A72" fillOpacity="0.10" />
        {/* Soft rising bars */}
        <rect x="42" y="54" width="16" height="28" rx="4" fill="#9BD7CD" />
        <rect x="68" y="42" width="16" height="40" rx="4" fill="#5BB9AA" />
        <rect x="94" y="30" width="16" height="52" rx="4" fill="#0D7A72" />
        <rect x="120" y="20" width="16" height="62" rx="4" fill="#07182B" />
        {/* Rising arrow */}
        <path
          d="M36 52L76 34L104 38L148 15"
          stroke="#D49B2A"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M139 14H149V24" stroke="#D49B2A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Gold coin emblem */}
        <circle cx="168" cy="54" r="18" fill="#F5D076" stroke="#FFFFFF" strokeWidth="2.5" />
        <circle cx="168" cy="54" r="13" stroke="#C88D1E" strokeWidth="1.4" strokeDasharray="3 2" />
        <text
          x="168"
          y="59"
          textAnchor="middle"
          fill="#07182B"
          fontSize="14"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          $
        </text>
      </svg>
    </div>
  );
}

/**
 * Pastel-Royal Illustrated Banner for "< رحلة النجوم" card on Home (matches IMG_4532.png right card)
 */
export function StarJourneyCardIllustration() {
  return (
    <div
      className="w-full h-[92px] rounded-xl overflow-hidden relative flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #E7F0FA 0%, #DCEAF7 55%, #E7F5F2 100%)'
      }}
    >
      <svg viewBox="0 0 220 96" className="w-full h-full" fill="none">
        <circle cx="48" cy="22" r="24" fill="#FFFFFF" fillOpacity="0.65" />
        <path d="M18 84C52 64 96 66 136 78C166 86 192 80 212 70V96H18V84Z" fill="#0D7A72" fillOpacity="0.14" />
        {/* Globe & flight arc */}
        <circle cx="154" cy="54" r="24" fill="#07182B" fillOpacity="0.90" />
        <ellipse cx="154" cy="54" rx="11" ry="24" stroke="#5BB9AA" strokeWidth="1.4" />
        <path d="M130 54H178" stroke="#5BB9AA" strokeWidth="1.4" />
        {/* Flight path + star */}
        <path
          d="M36 66C66 32 108 22 152 28"
          stroke="#0D7A72"
          strokeWidth="2.4"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        {/* Star badge */}
        <circle cx="72" cy="46" r="16" fill="#F5D076" stroke="#FFFFFF" strokeWidth="2.5" />
        <path
          d="M72 36.5L74.9 42.4L81.4 43.3L76.7 47.9L77.8 54.4L72 51.3L66.2 54.4L67.3 47.9L62.6 43.3L69.1 42.4L72 36.5Z"
          fill="#07182B"
        />
      </svg>
    </div>
  );
}
