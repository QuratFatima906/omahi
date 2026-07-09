import type { CSSProperties, ReactNode } from 'react';

interface GlassProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Frosted-glass card recipe from the Omahi glass design: translucent white
 * wash over the ambient field, heavy blur + saturation boost, one hairline
 * highlight border. `GlassCard` is the hero-panel weight; `GlassPanel` is
 * the softer weight for rows and list groups.
 */
export function GlassCard({ className = '', style, children }: GlassProps) {
  return (
    <div
      className={`rounded-[22px] border border-glass-border bg-glass backdrop-blur-[24px] backdrop-saturate-[1.7] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function GlassPanel({ className = '', style, children }: GlassProps) {
  return (
    <div
      className={`rounded-[14px] border border-glass-border bg-glass-soft backdrop-blur-[18px] backdrop-saturate-150 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
