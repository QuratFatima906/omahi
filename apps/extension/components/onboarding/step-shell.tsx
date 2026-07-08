import type { ReactNode } from 'react';
import { ambient, GlassScreen } from '../glass-screen';

interface StepShellProps {
  step: 1 | 2 | 3;
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

/** Shared frame for the three onboarding steps: wordmark, progress, title, footer. */
export function StepShell({ step, title, subtitle, footer, children }: StepShellProps) {
  return (
    <GlassScreen glow={[ambient('var(--color-follicular)', 32), ambient('var(--color-rose)', 24)]}>
      <div className="flex h-full min-h-0 flex-col px-7 py-6">
        <div className="flex shrink-0 items-center justify-between">
          <span className="font-display text-[17px] font-bold tracking-tight text-ink/40">
            omahi
          </span>
          <div className="flex gap-1.5" role="img" aria-label={`Step ${step} of 3`}>
            {([1, 2, 3] as const).map((i) => (
              <span
                key={i}
                className={`h-1.5 w-[22px] rounded-full ${i <= step ? 'bg-rose' : 'bg-ink/15'}`}
              />
            ))}
          </div>
        </div>
        {/* Middle scrolls when the viewport is short; the footer stays pinned
            so the step's buttons are never cut off. */}
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          <div className="mt-6 flex flex-col gap-2">
            <h1 className="font-display text-[22px] leading-[1.3] font-bold">{title}</h1>
            <p className="text-[13.5px] leading-relaxed text-ink-muted">{subtitle}</p>
          </div>
          {children}
        </div>
        <div className="mt-4 flex shrink-0 gap-3">{footer}</div>
      </div>
    </GlassScreen>
  );
}
