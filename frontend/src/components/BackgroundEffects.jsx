import { useMemo } from 'react';

const NEAR_FLAKES = 70;
const FAR_FLAKES = 80;

const wrapPercentage = (value) => {
  const bounded = value % 100;
  return `${bounded < 0 ? bounded + 100 : bounded}%`;
};

const createFlake = (index, layer, total) => {
  const baseSize = layer === 'near' ? 2.6 : 1.6;
  const sizeStep = layer === 'near' ? 0.28 : 0.22;
  const spreadOffset = layer === 'near' ? 3 : 1.5;
  const depthFactor = layer === 'near' ? 1 : 0.78;
  const modulation = (index % 9) / 9;
  const horizontalBand = ((index % 5) - 2) * spreadOffset;

  return {
    id: `${layer}-${index}`,
    layer,
    left: wrapPercentage((index / total) * 100 + horizontalBand),
    fallDuration: (layer === 'near' ? 14 : 18) + (index % 6) * 0.55,
    fallDelay: -((index % 18) * 0.45),
    size: baseSize + modulation * sizeStep * 8,
    opacity: layer === 'near' ? 0.5 + modulation * 0.35 : 0.35 + modulation * 0.3,
    blur: layer === 'near' ? 0.25 + modulation * 0.5 : 0.5 + modulation * 0.85,
    gustDuration: 10 + (index % 5) * 1.15,
    gustDelay: (index % 7) * 0.65,
    gustAmplitude: ((index % 5) - 2) * (layer === 'near' ? 3.2 : 2.1) * depthFactor
  };
};

export default function BackgroundEffects() {
  const snowflakes = useMemo(() => {
    const near = Array.from({ length: NEAR_FLAKES }, (_, idx) => createFlake(idx, 'near', NEAR_FLAKES));
    const far = Array.from({ length: FAR_FLAKES }, (_, idx) => createFlake(idx, 'far', FAR_FLAKES));
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
