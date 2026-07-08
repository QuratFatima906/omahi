interface CycleRingProps {
  /** Progress through the cycle, 0–1. */
  fraction: number;
  /** Phase color for the progress arc. */
  color: string;
  size?: number;
  strokeWidth?: number;
}

/** Circular cycle-progress arc over a faint ink track. */
export function CycleRing({ fraction, color, size = 50, strokeWidth = 3.5 }: CycleRingProps) {
  const center = size / 2;
  const radius = center - 4.5;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="color-mix(in srgb, var(--color-ink) 10%, transparent)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${fraction * circumference} ${circumference}`}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </svg>
  );
}
