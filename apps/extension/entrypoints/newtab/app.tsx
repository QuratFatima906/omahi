import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import { CycleRing } from '../../components/cycle-ring';
import { GearIcon } from '../../components/icons';
import { PrimaryButton } from '../../components/onboarding/buttons';
import { PHASE_STYLE } from '../../components/phase-style';
import { formatClock, formatDateLine, getGreeting, getNewTabModel } from '../../lib/newtab';
import { effectiveCycleConfig } from '../../lib/period-log';
import { omahiStorage, type OmahiState } from '../../lib/storage';

/**
 * The new-tab page is READ-ONLY over storage (see the concurrency note in
 * lib/storage.ts) — every write happens in the popup app. The gear opens
 * that app as an in-page dialog (popup.html in an iframe), so the popup
 * remains the only write surface even when opened from here.
 */

function Wordmark() {
  return <span className="font-display text-2xl font-bold tracking-tight text-ink/35">omahi</span>;
}

/** Modal overlay hosting the popup app on the same tab. */
function AppOverlay({ onClose }: { onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    // Fixed scrim (not a theme token): it must darken the page in both themes.
    <div
      data-newtab="overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,12,18,0.45)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Omahi"
        className="relative"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButton}
          type="button"
          aria-label="Close Omahi"
          onClick={onClose}
          className="absolute -top-3.5 -right-3.5 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-card text-[15px] text-ink-soft shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:text-ink"
        >
          ✕
        </button>
        <div className="overflow-hidden rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
          <iframe
            src={browser.runtime.getURL('/popup.html')}
            title="Omahi"
            className="block h-[min(560px,90dvh)] w-[min(380px,92dvw)] border-0"
          />
        </div>
      </div>
    </div>
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
function SetupState({ onOpenApp }: { onOpenApp: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface p-8 text-center">
      <Wordmark />
      <p className="max-w-sm text-[15px] leading-relaxed text-ink-soft" data-newtab="setup">
        Three quick questions and this page becomes your cycle-aware plan for the day.
      </p>
      <PrimaryButton onClick={onOpenApp} className="mt-2 px-9">
        Get started
      </PrimaryButton>
    </div>
  );
}

/** Re-renders on each minute boundary so the clock stays right while a tab idles. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000));
    };
    timer = setTimeout(tick, 60_000 - (Date.now() % 60_000));
    // A tab can idle for hours before being refocused; the minute-boundary
    // timer alone would leave the clock stale for up to a minute after that.
    const onVisible = () => {
      if (!document.hidden) setNow(new Date());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return now;
}

function NewTabDashboard({ state, onOpenApp }: { state: OmahiState; onOpenApp: () => void }) {
  const now = useNow();
  const model = getNewTabModel(effectiveCycleConfig(state)!, now);
  const { color } = PHASE_STYLE[model.phase];
  const phaseLabel = model.phase.charAt(0).toUpperCase() + model.phase.slice(1);
  const tint = (pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface" data-newtab="dashboard">
      {/* Phase-tinted field: two faint washes + two soft blobs, all token-driven. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(700px 520px at 28% 18%, ${tint(9)}, transparent 70%), radial-gradient(820px 600px at 74% 82%, ${tint(8)}, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute h-[280px] w-[460px] rounded-full blur-[80px]"
        style={{ left: '44%', top: '50%', background: tint(16) }}
      />
      <div
        className="pointer-events-none absolute h-[230px] w-[380px] rounded-full blur-[80px]"
        style={{ left: '58%', top: '62%', background: tint(13) }}
      />

      <div className="relative flex items-center justify-between px-10 py-7">
        <Wordmark />
        <button
          type="button"
          aria-label="Open Omahi"
          onClick={onOpenApp}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink/25 hover:bg-ink/5 hover:text-ink/45"
        >
          <GearIcon size={22} />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-12 px-8">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="text-[23px] font-medium text-ink/50">{getGreeting(now)}</div>
          <div
            className="text-[136px] leading-none font-extralight tracking-[-0.02em] text-ink max-[900px]:text-[96px]"
            data-newtab="clock"
          >
            {formatClock(now)}
          </div>
          <div className="mt-2 text-[20px] font-medium text-ink/45">{formatDateLine(now)}</div>
        </div>

        <div className="flex w-[600px] max-w-full flex-col gap-5 rounded-[28px] border border-glass-border bg-glass px-8 py-7 shadow-[0_20px_56px_rgba(46,34,38,0.10)] backdrop-blur-[30px] backdrop-saturate-150">
          <div className="flex items-center gap-5">
            <CycleRing fraction={model.ringFraction} color={color} />
            <div className="flex flex-col gap-1">
              <div className="text-[22px] leading-tight font-semibold">
                {phaseLabel} · Day {model.cycleDay} of {model.cycleLength}
              </div>
              <div className="text-[16px] text-ink/55">{model.statusLine}</div>
            </div>
          </div>
          <div className="h-px bg-ink/[0.08]" />
          <div className="text-[17px] leading-normal text-ink/75">{model.tip}</div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [state, setState] = useState<OmahiState | null>(null);
  const [appOpen, setAppOpen] = useState(false);
  const openApp = () => setAppOpen(true);
  useEffect(() => {
    const reload = () => void omahiStorage.load().then(setState);
    reload();
    // New tabs are long-lived, unlike the popup: popup writes (log period,
    // toggle off, delete-all) must reach already-open tabs via this storage
    // reload, while refocusing a stale tab re-derives today's model through
    // useNow's own visibilitychange refresh.
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
        <SetupState onOpenApp={openApp} />
      ) : !state.settings.newTabEnabled ? (
        <DisabledState />
      ) : (
        <NewTabDashboard state={state} onOpenApp={openApp} />
      )}
      {appOpen && <AppOverlay onClose={() => setAppOpen(false)} />}
    </main>
  );
}

export default App;
