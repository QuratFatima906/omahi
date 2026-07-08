import { useState } from 'react';
import { PrimaryButton, SecondaryButton } from '../onboarding/buttons';
import { formatHumanDate } from '../../lib/month-grid';
import { omahiStorage, type OmahiState } from '../../lib/storage';
import { ambient, GlassScreen } from '../glass-screen';
import { MonthCalendar } from '../month-calendar';
import { PHASE_STYLE } from '../phase-style';

interface PeriodLogViewProps {
  state: OmahiState;
  todayIso: string;
  onBack: () => void;
  onStateChange: (state: OmahiState) => void;
}

export function PeriodLogView({ state, todayIso, onBack, onStateChange }: PeriodLogViewProps) {
  // Defaults to today — "My period started" is usually tapped on the day.
  const [selected, setSelected] = useState<string>(todayIso);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const alreadyLogged = state.periodLog.some((entry) => entry.start === selected);
  // Display newest-dated first; undo still removes the last APPENDED entry,
  // so the undo button names the entry it will remove.
  const history = [...state.periodLog].sort((a, b) => (a.start < b.start ? 1 : -1));
  const lastAppended = state.periodLog[state.periodLog.length - 1];

  async function save() {
    if (saving || alreadyLogged) return;
    setSaving(true);
    setStorageError(null);
    try {
      onStateChange(await omahiStorage.logPeriod(selected));
      onBack();
    } catch (error) {
      setStorageError(`Could not save: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function undo() {
    if (saving) return;
    setSaving(true);
    setStorageError(null);
    try {
      onStateChange(await omahiStorage.undoLastPeriod());
    } catch (error) {
      setStorageError(`Could not undo: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassScreen
      glow={[ambient(PHASE_STYLE.menstruation.color, 26), ambient('var(--color-rose)', 20)]}
    >
      <header className="flex items-center gap-3 px-5 pt-4 pb-1">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="-ml-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[19px] text-ink-faint hover:bg-ink/5"
        >
          ←
        </button>
        <h1 className="font-display text-base font-bold">Log period</h1>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-3 pb-5">
        <p className="text-[13.5px] leading-relaxed text-ink-muted">
          When did this period start? Omahi re-anchors your predictions around it.
        </p>
        <MonthCalendar todayIso={todayIso} selected={selected} onSelect={setSelected} />
        {(alreadyLogged || storageError !== null) && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-rose">
            {storageError ?? 'That period start is already logged.'}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <SecondaryButton onClick={onBack} disabled={saving} className="flex-1">
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={() => void save()}
            disabled={saving || alreadyLogged}
            className="flex-2"
          >
            Save
          </PrimaryButton>
        </div>

        {history.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-[11.5px] font-extrabold tracking-[0.14em] text-ink-faint uppercase">
              Logged periods
            </div>
            <ul className="overflow-hidden rounded-[16px] border border-glass-border bg-glass-soft backdrop-blur-[20px] backdrop-saturate-150">
              {history.map((entry) => (
                <li
                  key={entry.start}
                  className="border-b border-ink/[0.08] px-4 py-3 text-[13.5px] last:border-b-0"
                >
                  Started {formatHumanDate(entry.start)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void undo()}
              disabled={saving}
              className="mt-3 cursor-pointer text-[13px] font-bold text-rose"
            >
              Undo last entry{lastAppended ? ` (${formatHumanDate(lastAppended.start)})` : ''}
            </button>
          </div>
        )}
      </div>
    </GlassScreen>
  );
}
