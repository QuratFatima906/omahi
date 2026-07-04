import { ANCHOR_DATE_ERROR_MESSAGES, type AnchorDateError } from '../../lib/onboarding-form';
import { PrimaryButton, SecondaryButton } from './buttons';
import { MonthCalendar } from '../month-calendar';
import { StepShell } from './step-shell';

interface StepAnchorDateProps {
  todayIso: string;
  selected: string | null;
  error: AnchorDateError | null;
  onSelect(iso: string): void;
  onNotSure(): void;
  onContinue(): void;
}

export function StepAnchorDate({
  todayIso,
  selected,
  error,
  onSelect,
  onNotSure,
  onContinue,
}: StepAnchorDateProps) {
  return (
    <StepShell
      step={1}
      title="When did your last period start?"
      subtitle="Your best guess is fine — you can correct it any time."
      footer={
        <>
          <SecondaryButton onClick={onNotSure} className="flex-1">
            Not sure
          </SecondaryButton>
          <PrimaryButton onClick={onContinue} className="flex-2">
            Continue
          </PrimaryButton>
        </>
      }
    >
      <MonthCalendar todayIso={todayIso} selected={selected} onSelect={onSelect} />
      {error !== null && (
        <p role="alert" className="mt-3 text-[12.5px] font-semibold text-rose">
          {ANCHOR_DATE_ERROR_MESSAGES[error]}
        </p>
      )}
    </StepShell>
  );
}
