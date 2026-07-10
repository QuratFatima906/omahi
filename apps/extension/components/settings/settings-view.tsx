import { useRef, useState, type ReactNode } from 'react';
import {
  MAX_CYCLE_LENGTH,
  MAX_PERIOD_LENGTH,
  MIN_CYCLE_LENGTH,
  MIN_PERIOD_LENGTH,
} from '@omahi/core';
import { browser } from 'wxt/browser';
import { formatHumanDate } from '../../lib/month-grid';
import {
  exportStateJson,
  importStateJson,
  omahiStorage,
  StorageSchemaError,
  type OmahiState,
} from '../../lib/storage';
import { ambient, GlassScreen, PHASE_STYLE } from '@omahi/ui';
import { MonthCalendar } from '../month-calendar';
import { ToggleSwitch } from '../toggle-switch';

interface SettingsViewProps {
  state: OmahiState;
  todayIso: string;
  onBack: () => void;
  onStateChange: (state: OmahiState) => void;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11.5px] font-extrabold tracking-[0.14em] text-ink-faint uppercase">
        {title}
      </div>
      <div className="overflow-hidden rounded-[16px] border border-glass-border bg-glass-soft backdrop-blur-[20px] backdrop-saturate-150">
        {children}
      </div>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/[0.08] px-4 py-3 last:border-b-0">
      {children}
    </div>
  );
}

/** − value + inline stepper that commits on every tap. */
function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const stepButton =
    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border ' +
    'border-glass-border bg-glass-soft text-[15px] text-ink-faint disabled:cursor-default disabled:opacity-40';
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={stepButton}
      >
        −
      </button>
      <span className="min-w-[64px] text-center text-[13.5px] font-bold text-rose">
        {value} days
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={stepButton}
      >
        +
      </button>
    </div>
  );
}

export function SettingsView({ state, todayIso, onBack, onStateChange }: SettingsViewProps) {
  const config = state.cycleConfig!;
  const [anchorOpen, setAnchorOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Patch-based: the merge happens on freshly loaded storage state, so two
  // quick edits can't clobber each other via stale render-time props.
  async function saveConfig(patch: Partial<typeof config>) {
    setNotice(null);
    onStateChange(await omahiStorage.saveCycleConfig(patch));
  }

  function exportBackup() {
    const blob = new Blob([exportStateJson(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omahi-backup-${todayIso}.json`;
    link.click();
    // Deferred: revoking synchronously races the download start in some engines.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function importBackup(file: File) {
    setNotice(null);
    try {
      const imported = importStateJson(await file.text());
      await omahiStorage.save(imported);
      onStateChange(imported);
      const anchor = imported.cycleConfig?.anchorDate;
      const hasFutureData =
        (anchor !== undefined && anchor > todayIso) ||
        imported.periodLog.some((entry) => entry.start > todayIso);
      setNotice(
        hasFutureData
          ? 'Backup restored — heads up, it contains future-dated entries.'
          : 'Backup restored.',
      );
    } catch (error) {
      setNotice(
        error instanceof StorageSchemaError
          ? `That file isn't a valid Omahi backup: ${error.message}`
          : `Import failed: ${(error as Error).message}`,
      );
    }
  }

  async function deleteAll() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    onStateChange(await omahiStorage.reset());
  }

  return (
    <GlassScreen glow={[ambient('var(--color-rose)', 22), ambient(PHASE_STYLE.luteal.color, 20)]}>
      <header className="flex items-center gap-3 px-5 pt-4 pb-1">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="-ml-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[19px] text-ink-faint hover:bg-ink/5"
        >
          ←
        </button>
        <h1 className="font-display text-base font-bold">Settings</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-3 pb-5">
        <Group title="My cycle">
          <Row>
            <span className="text-[13.5px]">Last period started</span>
            <button
              type="button"
              aria-label="Last period started"
              onClick={() => setAnchorOpen((open) => !open)}
              className="cursor-pointer text-[13.5px] font-bold text-rose"
            >
              {formatHumanDate(config.anchorDate)} ›
            </button>
          </Row>
          {anchorOpen && (
            <div className="border-b border-ink/[0.08] px-3 pb-3">
              <MonthCalendar
                todayIso={todayIso}
                selected={config.anchorDate}
                onSelect={(iso) => {
                  setAnchorOpen(false);
                  void saveConfig({ anchorDate: iso });
                }}
              />
            </div>
          )}
          <Row>
            <span className="text-[13.5px]">Cycle length</span>
            <Stepper
              label="cycle length"
              value={config.cycleLength}
              min={MIN_CYCLE_LENGTH}
              max={MAX_CYCLE_LENGTH}
              onChange={(cycleLength) => void saveConfig({ cycleLength })}
            />
          </Row>
          <Row>
            <span className="text-[13.5px]">Period length</span>
            <Stepper
              label="period length"
              value={config.periodLength}
              min={MIN_PERIOD_LENGTH}
              max={MAX_PERIOD_LENGTH}
              onChange={(periodLength) => void saveConfig({ periodLength })}
            />
          </Row>
        </Group>

        <Group title="New tab">
          <Row>
            <div>
              <div className="text-[13.5px]">Show Omahi on every new tab</div>
              <div className="mt-0.5 text-xs text-ink-faint">Phase + today&apos;s plan</div>
            </div>
            <ToggleSwitch
              checked={state.settings.newTabEnabled}
              label="Show Omahi on every new tab"
              onToggle={() => void omahiStorage.toggleNewTab().then(onStateChange)}
            />
          </Row>
        </Group>

        <Group title="My data">
          <Row>
            <button
              type="button"
              onClick={exportBackup}
              className="flex w-full cursor-pointer items-center justify-between text-[13.5px]"
            >
              <span>Export backup (JSON)</span>
              <span className="text-[13px] text-ink-faint">↓</span>
            </button>
          </Row>
          <Row>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full cursor-pointer items-center justify-between text-[13.5px]"
            >
              <span>Import backup</span>
              <span className="text-[13px] text-ink-faint">↑</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              aria-label="Import backup file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void importBackup(file);
              }}
            />
          </Row>
          <Row>
            <button
              type="button"
              onClick={() => void deleteAll()}
              className="cursor-pointer text-[13.5px] font-bold text-danger"
            >
              {confirmingDelete ? 'Tap again to delete everything' : 'Delete all data…'}
            </button>
          </Row>
        </Group>

        {notice !== null && (
          <p role="status" className="text-[12.5px] font-semibold text-ink-soft">
            {notice}
          </p>
        )}

        <p className="text-[11.5px] leading-relaxed text-ink-faint">
          Everything lives on this device — Omahi has no server and no account. Suggestions are
          lifestyle ideas, not medical advice. Phase timing is an estimate you can always correct.
        </p>
        <p className="text-center text-[11.5px] text-ink-ghost">
          omahi v{browser.runtime.getManifest().version} · made with love
        </p>
      </div>
    </GlassScreen>
  );
}
