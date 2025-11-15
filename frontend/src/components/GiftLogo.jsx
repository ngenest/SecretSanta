export function GiftLogo({ className = 'gift-logo' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Secret Santa gift icon"
    >
      <defs>
        <linearGradient id="giftBaseLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef476f" />
          <stop offset="100%" stopColor="#b5174f" />
        </linearGradient>
        <linearGradient id="giftBaseRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2d8cff" />
          <stop offset="100%" stopColor="#1fc88b" />
        </linearGradient>
        <linearGradient id="giftLid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2d8cff" />
          <stop offset="50%" stopColor="#1fc88b" />
          <stop offset="100%" stopColor="#ef476f" />
        </linearGradient>
        <linearGradient id="giftRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor="#ffd166" />
        </linearGradient>
        <linearGradient id="giftRibbonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd166" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f3722c" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      <g filter="url(#shadow)">
        <path
          d="M20 50h34c2 0 3.5 1.6 3.5 3.5V108H20z"
          fill="url(#giftBaseLeft)"
        />
        <path
          d="M60.5 50H100v58H60.5z"
          fill="url(#giftBaseRight)"
        />
        <rect x="20" y="40" width="80" height="18" rx="6" fill="url(#giftLid)" />
        <rect x="20" y="68" width="80" height="12" fill="url(#giftRibbonGlow)" />
        <rect x="53.5" y="40" width="13" height="68" fill="url(#giftRibbon)" />

        <path
          d="M60 14c-8 0-15 5.5-16.5 13-.4 1.8 1.3 3.2 3 2.4 5.4-2.5 10.2-3.2 13.5-0.5 3.3-2.7 8.1-2 13.5 0.5 1.7 0.8 3.4-0.6 3-2.4C75 19.5 68 14 60 14z"
          fill="url(#giftLid)"
        />
        <path
          d="M60.1 24.5c-4.4-4.5-11.4-5.4-16.7-2.5-1.4 0.8-1.5 2.8-0.2 3.7l11.2 8c1.5 1.1 3.6 0.1 3.6-1.7z"
          fill="#ef476f"
        />
        <path
          d="M60 24.5v7.5c0 1.8 2.1 2.8 3.6 1.7l11.2-8c1.3-1 1.2-2.9-0.2-3.7-5.3-2.9-12.3-2-16.6 2.5z"
          fill="#2d8cff"
        />
      </g>

      <defs>
        <filter id="shadow" x="0" y="0" width="160" height="160" filterUnits="userSpaceOnUse">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feOffset dy="4" in="blur" result="offset" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.25" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="offset" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
