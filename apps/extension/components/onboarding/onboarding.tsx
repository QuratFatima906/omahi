import { useState } from 'react';
import { DEFAULT_CYCLE_LENGTH, DEFAULT_PERIOD_LENGTH } from '@omahi/core';
import { validateAnchorDate, type AnchorDateError } from '../../lib/onboarding-form';
import { omahiStorage, type OmahiState } from '../../lib/storage';
import { StepAnchorDate } from './step-anchor-date';
import { StepCycleLength } from './step-cycle-length';
import { StepPeriodLength } from './step-period-length';
import { WelcomeScreen } from './welcome-screen';

type Step = 'welcome' | 'date' | 'cycle' | 'period';

interface OnboardingProps {
  /** Local calendar today (`YYYY-MM-DD`), injected so date logic stays testable. */
  todayIso: string;
  onComplete(state: OmahiState): void;
}

export function Onboarding({ todayIso, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [anchorDate, setAnchorDate] = useState<string | null>(null);
  const [dateError, setDateError] = useState<AnchorDateError | null>(null);
  const [cycleLength, setCycleLength] = useState(DEFAULT_CYCLE_LENGTH);
  const [periodLength, setPeriodLength] = useState(DEFAULT_PERIOD_LENGTH);
  // Design default: the new-tab ask starts opted in; the user can flip it here
  // or later in settings (Chunk 8).
  const [newTabEnabled, setNewTabEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  function continueFromDate() {
    const error = validateAnchorDate(anchorDate, todayIso);
    setDateError(error);
    if (error === null) setStep('cycle');
  }

  function notSure() {
    // "Not sure" anchors to today — the copy promises it can be corrected any
    // time, and logging a real period (Chunk 7) re-anchors.
    setAnchorDate(todayIso);
    setDateError(null);
    setStep('cycle');
  }

  async function finish() {
    if (anchorDate === null || saving) return;
    setSaving(true);
    try {
      const state = await omahiStorage.completeOnboarding(
        { anchorDate, cycleLength, periodLength },
        { newTabEnabled, quietMode: false },
      );
      onComplete(state);
    } finally {
      setSaving(false);
    }
  }

  switch (step) {
    case 'welcome':
      return <WelcomeScreen onBegin={() => setStep('date')} />;
    case 'date':
      return (
        <StepAnchorDate
          todayIso={todayIso}
          selected={anchorDate}
          error={dateError}
          onSelect={(iso) => {
            setAnchorDate(iso);
            setDateError(null);
          }}
          onNotSure={notSure}
          onContinue={continueFromDate}
        />
      );
    case 'cycle':
      return (
        <StepCycleLength
          value={cycleLength}
          onChange={setCycleLength}
          onBack={() => setStep('date')}
          onContinue={() => setStep('period')}
        />
      );
    case 'period':
      return (
        <StepPeriodLength
          value={periodLength}
          newTabEnabled={newTabEnabled}
          saving={saving}
          onChange={setPeriodLength}
          onToggleNewTab={() => setNewTabEnabled((on) => !on)}
          onBack={() => setStep('cycle')}
          onFinish={() => void finish()}
        />
      );
  }
}
