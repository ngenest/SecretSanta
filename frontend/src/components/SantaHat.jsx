export function SantaHat() {
  return (
    <svg
      className="santa-hat"
      viewBox="0 0 128 128"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="hatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <path
        d="M12 94c0-28 30-50 52-64 14-8 32-16 32-24 0-4-4-6-8-6-8 0-18 4-26 8C40 20 20 36 12 52c-4 8-4 24 0 32z"
        fill="url(#hatGradient)"
      />
      <ellipse cx="104" cy="26" rx="14" ry="14" fill="#FFFFFF" />
      <rect x="10" y="90" width="108" height="18" rx="8" fill="#FFFFFF" />
    </svg>
  );
}
