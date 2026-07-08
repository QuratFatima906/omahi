import { DEFAULT_CYCLE_LENGTH, MAX_CYCLE_LENGTH, MIN_CYCLE_LENGTH } from '@omahi/core';
import { clampCycleLength } from '../../lib/onboarding-form';
import { PrimaryButton, SecondaryButton } from './buttons';
import { StepShell } from './step-shell';

interface StepCycleLengthProps {
  value: number;
  onChange(value: number): void;
  onBack(): void;
  onContinue(): void;
}

const stepperClasses =
  'flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border ' +
  'border-glass-border bg-glass-soft text-[22px] text-ink-soft disabled:cursor-default disabled:opacity-40';

export function StepCycleLength({ value, onChange, onBack, onContinue }: StepCycleLengthProps) {
  return (
    <StepShell
      step={2}
      title="How long is your cycle, usually?"
      subtitle={`First day of one period to the first day of the next. Most cycles run ${MIN_CYCLE_LENGTH}–${MAX_CYCLE_LENGTH} days; ${DEFAULT_CYCLE_LENGTH} is a common average.`}
      footer={
        <>
          <SecondaryButton onClick={onBack} className="flex-1">
            Back
          </SecondaryButton>
          <PrimaryButton onClick={onContinue} className="flex-2">
            Continue
          </PrimaryButton>
        </>
      }
    >
      <div className="mt-8 flex flex-col items-center gap-[22px] rounded-[20px] border border-glass-border bg-glass px-[22px] py-[26px] backdrop-blur-[20px] backdrop-saturate-150">
        <div className="flex items-center gap-[26px]">
          <button
            type="button"
            aria-label="Decrease cycle length"
            disabled={value <= MIN_CYCLE_LENGTH}
            onClick={() => onChange(clampCycleLength(value - 1))}
            className={stepperClasses}
          >
            −
          </button>
          <div className="text-center">
            <div className="text-[64px] leading-none font-light">{value}</div>
            <div className="mt-1.5 text-[13px] font-bold text-ink-faint">days</div>
          </div>
          <button
            type="button"
            aria-label="Increase cycle length"
            disabled={value >= MAX_CYCLE_LENGTH}
            onClick={() => onChange(clampCycleLength(value + 1))}
            className={stepperClasses}
          >
            +
          </button>
        </div>
        <div className="w-full px-1">
          <input
            type="range"
            aria-label="Cycle length in days"
            min={MIN_CYCLE_LENGTH}
            max={MAX_CYCLE_LENGTH}
            value={value}
            onChange={(event) => onChange(clampCycleLength(Number(event.target.value)))}
            className="w-full cursor-pointer accent-rose"
          />
          <div className="mt-2 flex justify-between text-[11.5px] font-bold text-ink-ghost">
            <span>{MIN_CYCLE_LENGTH}</span>
            <span>{MAX_CYCLE_LENGTH}</span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-[12.5px] leading-relaxed text-ink-muted">
        Not sure? Leave it at {DEFAULT_CYCLE_LENGTH} — Omahi learns as you log real periods.
      </p>
    </StepShell>
  );
}
