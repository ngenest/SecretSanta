import { useEffect, useRef, useState } from 'react';

const animatedGiftSrc = (() => {
  const envPath = import.meta.env?.VITE_ANIMATED_LOGO_PATH;
  if (typeof envPath === 'string' && envPath.trim().length > 0) {
    return envPath.trim();
  }
  return '/assets/secret-santa-logo-animated.gif';
})();

function StaticGiftLogo() {
  return (
    <svg
      className="gift-logo-static"
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="giftGlow" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#f8d1ff" stopOpacity="0.72" />
          <stop offset="45%" stopColor="#a16bff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1a1c3f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="giftBaseLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b7d" />
          <stop offset="100%" stopColor="#d7264a" />
        </linearGradient>
        <linearGradient id="giftBaseRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285ff" />
          <stop offset="50%" stopColor="#2fb0ff" />
          <stop offset="100%" stopColor="#1fc88b" />
        </linearGradient>
        <linearGradient id="giftLid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3862f8" />
          <stop offset="45%" stopColor="#2fd8ff" />
          <stop offset="100%" stopColor="#ff5f6d" />
        </linearGradient>
        <linearGradient id="giftRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe7a0" />
          <stop offset="100%" stopColor="#ffb347" />
        </linearGradient>
        <linearGradient id="giftRibbonHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff4d6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffda76" stopOpacity="0.2" />
        </linearGradient>
        <filter id="giftShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="rgba(9, 12, 35, 0.45)" />
        </filter>
      </defs>

      <g filter="url(#giftShadow)">
        <ellipse cx="80" cy="78" rx="68" ry="66" fill="url(#giftGlow)" opacity="0.85" />
        <path
          d="M34 70c0-9.5 7.7-17.2 17.2-17.2H80V128H45.2C36.7 128 29 120.3 29 111.8z"
          fill="url(#giftBaseLeft)"
        />
        <path
          d="M80 52.8h28.8c9.5 0 17.2 7.7 17.2 17.2v41.1c0 8.5-7.7 17.2-17.2 17.2H80z"
          fill="url(#giftBaseRight)"
        />
        <rect x="32" y="44" width="96" height="18" rx="10" fill="url(#giftLid)" />
        <rect x="32" y="84" width="96" height="14" rx="6" fill="url(#giftRibbonHighlight)" opacity="0.7" />
        <rect x="74" y="44" width="12" height="84" rx="6" fill="url(#giftRibbon)" />

        <path
          d="M80 24c-10.2 0-19.3 6.9-21.2 16.7-.3 1.6 1.4 2.8 2.8 1.9 7.1-4.4 13.9-4.6 18.4-.8 4.5-3.8 11.3-3.6 18.4.8 1.5.9 3.1-.3 2.8-1.9C99.3 30.9 90.2 24 80 24z"
          fill="url(#giftLid)"
        />
        <path
          d="M80.2 36.7c-5.8-5.8-14.9-6.9-22-3.2-1.6.8-1.7 3-.2 4.1l14.7 9.9c1.9 1.3 4.4.1 4.4-2.1z"
          fill="#ff5f6d"
        />
        <path
          d="M80 36.7v8.7c0 2.2 2.5 3.4 4.4 2.1l14.7-9.9c1.5-1.1 1.4-3.3-.2-4.1-7.1-3.7-16.2-2.6-21 3.2z"
          fill="#2cb0ff"
        />
      </g>
    </svg>
  );
}

export function GiftLogo({ className = 'gift-logo' }) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [canAnimate, setCanAnimate] = useState(true);
  const revertTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (revertTimer.current) {
        clearTimeout(revertTimer.current);
      }
    };
  }, []);

  const showAnimated = () => {
    if (!canAnimate) {
      return;
    }
    if (revertTimer.current) {
      clearTimeout(revertTimer.current);
      revertTimer.current = null;
    }
    setIsAnimated(true);
  };

  const hideAnimated = () => {
    if (revertTimer.current) {
      clearTimeout(revertTimer.current);
      revertTimer.current = null;
    }
    setIsAnimated(false);
  };

  const showTemporarily = () => {
    if (!canAnimate) {
      return;
    }
    showAnimated();
    revertTimer.current = setTimeout(() => {
      setIsAnimated(false);
      revertTimer.current = null;
    }, 2200);
  };

  const handlePointerEnter = () => {
    if (!canAnimate) {
      return;
    }
    showAnimated();
  };
  const handlePointerLeave = () => hideAnimated();
  const handlePointerDown = (event) => {
    if (!canAnimate) {
      return;
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      showTemporarily();
    }
  };

  const handleAnimationError = () => {
    if (revertTimer.current) {
      clearTimeout(revertTimer.current);
      revertTimer.current = null;
    }
    setIsAnimated(false);
    setCanAnimate(false);
  };

  return (
    <div
      className={`${className}${isAnimated ? ' is-animated' : ''}`}
      role="img"
      aria-label="Secret Santa gift logo"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      onPointerDown={handlePointerDown}
    >
      {isAnimated && canAnimate ? (
        <img
          src={animatedGiftSrc}
          alt=""
          aria-hidden="true"
          draggable="false"
          onError={handleAnimationError}
        />
      ) : (
        <StaticGiftLogo />
      )}
    </div>
  );
}
