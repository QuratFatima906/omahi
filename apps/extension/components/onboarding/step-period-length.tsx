import { MAX_PERIOD_LENGTH, MIN_PERIOD_LENGTH } from '@omahi/core';
import { PrimaryButton, SecondaryButton } from './buttons';
import { StepShell } from './step-shell';

interface StepPeriodLengthProps {
  value: number;
  newTabEnabled: boolean;
  saving: boolean;
  onChange(value: number): void;
  onToggleNewTab(): void;
  onBack(): void;
  onFinish(): void;
}

const PERIOD_OPTIONS = Array.from(
  { length: MAX_PERIOD_LENGTH - MIN_PERIOD_LENGTH + 1 },
  (_, i) => MIN_PERIOD_LENGTH + i,
);

export function StepPeriodLength({
  value,
  newTabEnabled,
  saving,
  onChange,
  onToggleNewTab,
  onBack,
  onFinish,
}: StepPeriodLengthProps) {
  return (
    <StepShell
      step={3}
      title="And your period — how many days?"
      subtitle={`Typically ${MIN_PERIOD_LENGTH}–${MAX_PERIOD_LENGTH} days.`}
      footer={
        <>
          <SecondaryButton onClick={onBack} disabled={saving} className="flex-1">
            Back
          </SecondaryButton>
          <PrimaryButton onClick={onFinish} disabled={saving} className="flex-2">
            Start planning
          </PrimaryButton>
        </>
      }
    >
      <div className="mt-[26px] flex justify-center gap-1.5">
        {PERIOD_OPTIONS.map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={days === value}
            onClick={() => onChange(days)}
            className={`h-[46px] w-10 cursor-pointer rounded-[11px] font-display text-[17px] font-bold ${
              days === value
                ? 'bg-brand-gradient text-white'
                : 'border-[1.5px] border-line text-ink-faint'
            }`}
          >
            {days}
          </button>
        ))}
      </div>
      <div className="mt-[30px] flex items-center justify-between gap-3 rounded-[14px] bg-surface px-[18px] py-4">
        <div>
          <div className="font-display text-[14.5px] font-bold">Omahi on every new tab?</div>
          <div className="mt-0.5 text-[12.5px] leading-normal text-ink-muted">
            See your phase and today&apos;s plan each time you open a tab. Change any time in
            settings.
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={newTabEnabled}
          aria-label="Omahi on every new tab"
          onClick={onToggleNewTab}
          className={`relative h-[27px] w-[46px] shrink-0 cursor-pointer rounded-full transition-colors ${
            newTabEnabled ? 'bg-brand-gradient' : 'bg-line'
          }`}
        >
          <span
            className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow transition-all ${
              newTabEnabled ? 'left-[22px]' : 'left-[3px]'
            }`}
          />
        </button>
      </div>
      <p className="mt-[18px] text-[11.5px] leading-relaxed text-ink-faint">
        Phase estimates are heuristics — real timing varies from body to body. Suggestions are
        lifestyle ideas, never medical advice.
      </p>
    </StepShell>
  );
}
