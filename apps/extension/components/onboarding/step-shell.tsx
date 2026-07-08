import type { ReactNode } from 'react';

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
    <div className="flex h-full flex-col px-7 py-6">
      <div className="flex items-center justify-between">
        <span className="text-brand-gradient font-display text-[17px] font-bold tracking-tight">
          omahi
        </span>
        <div className="flex gap-1.5" role="img" aria-label={`Step ${step} of 3`}>
          {([1, 2, 3] as const).map((i) => (
            <span
              key={i}
              className={`h-1.5 w-[22px] rounded-full ${i <= step ? 'bg-brand-gradient' : 'bg-line'}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-[30px] flex flex-col gap-2">
        <h1 className="font-display text-[22px] leading-[1.3] font-bold">{title}</h1>
        <p className="text-[13.5px] leading-relaxed text-ink-muted">{subtitle}</p>
      </div>
      {children}
      <div className="flex-1" />
      <div className="mt-5 flex gap-3">{footer}</div>
    </div>
  );
}
