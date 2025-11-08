const steps = ['Event Setup', 'Draw', 'Confirmation'];

export default function ProgressDots({ activeIndex }) {
  return (
    <div className="progress-dots" aria-label="Progress">
      {steps.map((label, index) => (
        <div
          key={label}
          className={`dot ${index === activeIndex ? 'active' : ''}`}
          aria-current={index === activeIndex ? 'step' : undefined}
        >
          <span className="sr-only">{label}</span>
        </div>
      ))}
    </div>
  );
}
