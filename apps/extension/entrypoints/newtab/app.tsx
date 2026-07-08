import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { GearIcon } from '../../components/icons';
import { PrimaryButton } from '../../components/onboarding/buttons';
import { PHASE_STYLE } from '../../components/phase-style';
import { getNewTabModel } from '../../lib/newtab';
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
        Three quick questions and this page becomes your cycle-aware plan for the day.
      </p>
      <PrimaryButton
        onClick={() => void browser.tabs.create({ url: browser.runtime.getURL('/popup.html') })}
        className="mt-2 px-9"
      >
        Get started
      </PrimaryButton>
    </div>
  );
}

function NewTabDashboard({ state }: { state: OmahiState }) {
  const model = getNewTabModel(effectiveCycleConfig(state)!, new Date());
  const { color, deep } = PHASE_STYLE[model.phase];
  // The design darkens the ovulation lead-in for contrast on the white card;
  // `deep` is that text-on-tint variant (aliases the base everywhere else).
  const tipAccent = model.phase === 'ovulation' ? deep : color;

  return (
    <div className="flex min-h-screen flex-col bg-surface" data-newtab="dashboard">
      <div className="flex items-center justify-between px-10 py-7">
        <Wordmark />
        <button
          type="button"
          aria-label="Open Omahi"
          onClick={() => void browser.tabs.create({ url: browser.runtime.getURL('/popup.html') })}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink-faint hover:bg-ink/5"
        >
          <GearIcon size={22} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center gap-20 px-20 pb-[60px] max-[900px]:flex-col max-[900px]:gap-10 max-[900px]:px-8">
        <div
          className="flex h-[260px] w-[260px] shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${color} 0deg ${model.ringDeg}deg, var(--color-ring-track) ${model.ringDeg}deg 360deg)`,
          }}
        >
          <div className="flex h-[212px] w-[212px] flex-col items-center justify-center gap-1 rounded-full bg-surface">
            <div className="mb-2.5 flex items-center" aria-hidden="true">
              <div className="box-content flex h-[36px] w-[72px] rounded-[10px] border-4 border-ink p-1">
                <div
                  className="rounded-[4px]"
                  style={{ width: `${model.batteryPct}%`, background: color }}
                />
              </div>
              <div className="ml-[3px] h-[18px] w-[7px] rounded-r-[4px] bg-ink" />
            </div>
            <div className="font-display text-[26px] leading-none font-bold">
              {model.batteryLabel}
            </div>
            <div
              className="text-[13px] font-extrabold tracking-[0.12em] whitespace-nowrap uppercase"
              style={{ color }}
            >
              Day {model.cycleDay} of {model.cycleLength}
            </div>
          </div>
        </div>

        <div className="flex max-w-[780px] flex-col gap-5">
          <h1 className="font-display text-[72px] leading-[1.12] font-bold tracking-[-0.02em] max-[900px]:text-center max-[900px]:text-[44px]">
            {model.headline}
          </h1>
          <div className="rounded-[18px] bg-card px-7 py-5 text-[21px] leading-normal shadow-[0_4px_16px_rgba(46,34,38,0.06)]">
            <b className="font-display font-bold" style={{ color: tipAccent }}>
              One thing for today:
            </b>{' '}
            {model.tip}
          </div>
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
