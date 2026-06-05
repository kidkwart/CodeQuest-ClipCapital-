// Animated semi-circle ClipScore gauge
export function ClipScoreGauge({ score, max = 850, size = 220 }: { score: number; max?: number; size?: number }) {
  const pct = Math.min(1, score / max);
  const radius = size / 2 - 16;
  const circ = Math.PI * radius;
  const offset = circ * (1 - pct);
  const tier = score >= 750 ? "Excellent" : score >= 650 ? "Good" : score >= 550 ? "Building" : "New";

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 24 }}>
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.62 0.15 160)" />
            <stop offset="100%" stopColor="oklch(0.82 0.14 85)" />
          </linearGradient>
        </defs>
        <path
          d={`M 16 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 16} ${size / 2}`}
          fill="none"
          stroke="oklch(0.3 0.02 160)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d={`M 16 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 16} ${size / 2}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-4xl font-display font-bold text-foreground leading-none">{score}</div>
        <div className="text-xs text-gold font-semibold uppercase tracking-wider mt-1">{tier}</div>
      </div>
    </div>
  );
}
