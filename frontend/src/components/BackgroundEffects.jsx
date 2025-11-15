import { useMemo } from 'react';

const NEAR_FLAKES = 35;
const FAR_FLAKES = 35;

const createFlake = (index, layer) => {
  const gusty = Math.random() > 0.6;
  const baseSize = layer === 'near' ? 3 : 2;
  const sizeVariance = layer === 'near' ? 3.5 : 2.5;

  return {
    id: `${layer}-${index}`,
    layer,
    left: `${Math.random() * 100}%`,
    fallDuration: 16 + Math.random() * 16,
    fallDelay: -Math.random() * 20,
    size: baseSize + Math.random() * sizeVariance,
    opacity: layer === 'near' ? 0.55 + Math.random() * 0.35 : 0.35 + Math.random() * 0.35,
    blur: layer === 'near' ? Math.random() * 0.6 : 0.6 + Math.random() * 1.2,
    gustDuration: gusty ? 5 + Math.random() * 6 : 7 + Math.random() * 4,
    gustDelay: Math.random() * 6,
    gustAmplitude: gusty ? (Math.random() > 0.5 ? 1 : -1) * (16 + Math.random() * 28) : (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 12)
  };
};

export default function BackgroundEffects() {
  const snowflakes = useMemo(() => {
    const near = Array.from({ length: NEAR_FLAKES }, (_, idx) => createFlake(idx, 'near'));
    const far = Array.from({ length: FAR_FLAKES }, (_, idx) => createFlake(idx, 'far'));
    return [...near, ...far];
  }, []);

  return (
    <div className="background-effects" aria-hidden="true">
      <div className="holiday-glow" />
      <div className="snowfall">
        {snowflakes.map((flake) => (
          <span
            key={flake.id}
            className={`snowflake snowflake--${flake.layer}`}
            style={{
              left: flake.left,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              opacity: flake.opacity,
              filter: `blur(${flake.blur}px)`,
              '--fall-duration': `${flake.fallDuration}s`,
              '--fall-delay': `${flake.fallDelay}s`,
              '--gust-duration': `${flake.gustDuration}s`,
              '--gust-delay': `${flake.gustDelay}s`,
              '--gust-amplitude': `${flake.gustAmplitude}px`
            }}
          />
        ))}
      </div>
    </div>
  );
}
