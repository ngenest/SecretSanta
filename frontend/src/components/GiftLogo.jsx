import { useEffect, useRef, useState } from 'react';
import staticGiftLogo from '../assets/secret_santa_app_gift_logo.png';
import defaultAnimatedGiftLogo from '../assets/gift_animation_loop.gif';

const animatedGiftSrc = (() => {
  const envPath = import.meta.env?.VITE_ANIMATED_LOGO_PATH;
  if (typeof envPath === 'string' && envPath.trim().length > 0) {
    return envPath.trim();
  }
  return defaultAnimatedGiftLogo;
})();

function StaticGiftLogo() {
  return (
    <img
      className="gift-logo-static"
      src={staticGiftLogo}
      alt=""
      aria-hidden="true"
      draggable="false"
    />
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
