import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { PHASE_STYLE } from '../../components/phase-style';
import { getNewTabModel } from '../../lib/newtab';
import { formatShortDate } from '../../lib/month-grid';
import { effectiveCycleConfig } from '../../lib/period-log';
import { omahiStorage, type OmahiState } from '../../lib/storage';

/**
 * The new-tab page is READ-ONLY over storage (see the concurrency note in
 * lib/storage.ts) — every write happens in the popup.
 */

function Wordmark() {
  return (
    <span className="text-brand-gradient font-display text-2xl font-bold tracking-tight">
      omahi
    </span>
  );
}

/** Quiet fallback when the user turned the override off in settings. */
function DisabledState() {
  return (
    <div className="flex min-h-screen items-end justify-start bg-surface p-5">
      <p className="text-[12.5px] text-ink-ghost" data-newtab="disabled">
        Omahi&apos;s new tab is off — turn it on in the popup&apos;s settings.
      </p>
    </div>
  );
}

/** Graceful empty state when onboarding hasn't happened yet. */
function SetupState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-8 text-center">
      <Wordmark />
      <p className="max-w-sm text-[15px] leading-relaxed text-ink-soft" data-newtab="setup">
        Three quick questions and this page becomes your cycle-aware plan for the day — open the
        Omahi popup to begin.
      </p>
    </div>
  );
}

function NewTabDashboard({ state }: { state: OmahiState }) {
  const model = getNewTabModel(effectiveCycleConfig(state)!, new Date());
  const { color } = PHASE_STYLE[model.phase];
  const focusCards = [
    ['Work', model.work],
    ['Food', model.food],
    ['Move', model.move],
    ['Rest', model.rest],
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-surface" data-newtab="dashboard">
      <div className="flex items-center justify-between px-10 py-7">
        <Wordmark />
        <button
          type="button"
          aria-label="Open Omahi"
          onClick={() => void browser.tabs.create({ url: browser.runtime.getURL('/popup.html') })}
          className="cursor-pointer text-[15px] text-ink-faint"
        >
          ⚙
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-14 pb-10 text-center">
        <div>
          <div className="text-base font-bold tracking-[0.16em] uppercase" style={{ color }}>
            {model.phaseLabel} · Day {model.cycleDay} of{' '}
            {model.segments.reduce((sum, s) => sum + s.length, 0)}
          </div>
          <h1 className="mt-3.5 font-display text-[44px] leading-[1.2] font-bold">
            {model.headline}
          </h1>
          <p className="mt-3 text-lg text-ink-muted">
            {model.dateLine} · {model.nextLine}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {focusCards.map(([label, text]) => (
            <div
              key={label}
              className="w-[230px] rounded-[18px] bg-card p-6 text-left shadow-[0_4px_16px_rgba(46,34,38,0.06)]"
            >
              <div className="text-xs font-extrabold tracking-[0.14em] uppercase" style={{ color }}>
                {label}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3.5">
          <div className="flex w-[330px] items-center gap-1.5" aria-hidden="true">
            {model.segments.map((segment) => (
              <div
                key={segment.phase}
                className="relative h-2 rounded-full"
                style={{
                  flex: `${segment.length} ${segment.length} 0%`,
                  background: PHASE_STYLE[segment.phase].tint,
                }}
              >
                {segment.fillRatio !== null && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${segment.fillRatio * 100}%`,
                      background: PHASE_STYLE[segment.phase].color,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <span className="text-[13px] font-semibold text-ink-faint">
            next period · {formatShortDate(model.nextPeriodDate)}
          </span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [state, setState] = useState<OmahiState | null>(null);
  useEffect(() => {
    const reload = () => void omahiStorage.load().then(setState);
    reload();
    // New tabs are long-lived, unlike the popup: popup writes (log period,
    // toggle off, delete-all) must reach already-open tabs, and refocusing a
    // stale tab re-derives today's model (fresh state object → re-render).
    browser.storage.onChanged.addListener(reload);
    const onVisible = () => {
      if (!document.hidden) reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      browser.storage.onChanged.removeListener(reload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <main
      className="text-ink"
      data-onboarded={state ? String(state.cycleConfig !== null) : 'unknown'}
    >
      {state === null ? (
        <div className="min-h-screen bg-surface" />
      ) : state.cycleConfig === null ? (
        // Pre-onboarding the toggle is still at its default — invite setup
        // instead of claiming the user turned anything off.
        <SetupState />
      ) : !state.settings.newTabEnabled ? (
        <DisabledState />
      ) : (
        <NewTabDashboard state={state} />
      )}
    </main>
  );
}

export default App;
