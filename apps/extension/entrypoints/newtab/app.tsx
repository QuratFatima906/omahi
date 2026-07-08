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
 * lib/storage.ts) with ONE exception: the Quiet-mode toggle (a privacy
 * screen must be reachable from the page it protects). Every other write
 * happens in the popup app. The gear opens that app as an in-page dialog
 * (popup.html in an iframe), so the popup remains the write surface for all
 * cycle data even when opened from here.
 *
 * Privacy contract (see the "Omahi New Tab - Private" design handoff): the
 * resting card shows only neutral copy — the phase word, day count, and
 * period countdown render exclusively inside the tap-to-reveal chip, which
 * starts collapsed on every new tab and never persists.
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

/** Manual privacy screen: pill in the header, styled after the design's 2c. */
function QuietToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      data-newtab="quiet-toggle"
      onClick={onToggle}
      className={
        on
          ? 'flex cursor-pointer items-center gap-2 rounded-full bg-ink py-2 pr-4 pl-3.5 text-[15px] font-semibold text-surface'
          : 'flex cursor-pointer items-center gap-2 rounded-full border border-glass-border bg-glass py-2 pr-4 pl-3.5 text-[15px] font-semibold text-ink/60 hover:text-ink/80'
      }
    >
      {on ? (
        <span className="relative h-4 w-4 rounded-full bg-surface">
          <span className="absolute inset-1 rounded-full bg-ink" />
        </span>
      ) : (
        <span className="h-4 w-4 rounded-full border-2 border-ink/40" />
      )}
      {on ? 'Quiet on' : 'Quiet'}
    </button>
  );
}

/** Clock block shared by the normal and quiet layouts (quiet enlarges it). */
function ClockBlock({ now, quiet }: { now: Date; quiet: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="text-[23px] font-medium text-ink/50">{getGreeting(now)}</div>
      <div
        className={
          quiet
            ? 'text-[172px] leading-none font-extralight tracking-[-0.02em] text-ink max-[900px]:text-[120px]'
            : 'text-[136px] leading-none font-extralight tracking-[-0.02em] text-ink max-[900px]:text-[96px]'
        }
        data-newtab="clock"
      >
        {formatClock(now)}
      </div>
      <div className="mt-2 text-[20px] font-medium text-ink/45">{formatDateLine(now)}</div>
    </div>
  );
}

function NewTabDashboard({
  state,
  onOpenApp,
  onToggleQuiet,
}: {
  state: OmahiState;
  onOpenApp: () => void;
  onToggleQuiet: () => void;
}) {
  const now = useNow();
  // Reveal is per-tab and deliberately unpersisted: every new tab starts
  // neutral, so the identifying detail is always one intentional tap away.
  const [detailOpen, setDetailOpen] = useState(false);
  const quiet = state.settings.quietMode;
  const model = getNewTabModel(effectiveCycleConfig(state)!, now);
  const { color, deep } = PHASE_STYLE[model.phase];
  const tint = (pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface" data-newtab="dashboard">
      {quiet ? (
        // Quiet drops the phase-tinted field too — a barely-there neutral
        // wash is all that remains, so nothing on screen keys to the cycle.
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(760px 560px at 50% 42%, color-mix(in srgb, var(--color-ink) 3%, transparent), transparent 72%)',
          }}
        />
      ) : (
        <>
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
        </>
      )}

      <div className="relative z-10 flex items-center justify-between px-10 py-7">
        <Wordmark />
        <div className="flex items-center gap-3">
          <QuietToggle on={quiet} onToggle={onToggleQuiet} />
          <button
            type="button"
            aria-label="Open Omahi"
            onClick={onOpenApp}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink/25 hover:bg-ink/5 hover:text-ink/45"
          >
            <GearIcon size={22} />
          </button>
        </div>
      </div>

      {quiet ? (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8"
          data-newtab="quiet"
        >
          <ClockBlock now={now} quiet />
          <div className="mt-[26px] text-[18px] font-medium text-ink/40">
            Your plan is hidden — tap Quiet to bring it back
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-12 px-8">
          <ClockBlock now={now} quiet={false} />

          <div className="pointer-events-auto flex w-[600px] max-w-full flex-col gap-5 rounded-[28px] border border-glass-border bg-glass px-8 py-7 shadow-[0_20px_56px_rgba(46,34,38,0.10)] backdrop-blur-[30px] backdrop-saturate-150">
            <button
              type="button"
              aria-expanded={detailOpen}
              data-newtab="card-toggle"
              onClick={() => setDetailOpen((open) => !open)}
              className="flex cursor-pointer items-center gap-5 text-left"
            >
              <CycleRing fraction={model.ringFraction} color={color} />
              <span className="flex flex-col gap-1">
                <span className="text-[22px] leading-tight font-semibold text-ink">
                  {model.title}
                </span>
                <span className="text-[16px] text-ink/55">{model.subtitle}</span>
              </span>
              <span className="ml-auto shrink-0 text-[13px] text-ink/35">
                {detailOpen ? 'Tap to hide ⌄' : 'Tap for detail ›'}
              </span>
            </button>
            {detailOpen && (
              <div
                data-newtab="detail"
                className="flex flex-wrap items-center gap-3 rounded-[14px] border px-[18px] py-3.5"
                style={{ background: tint(14), borderColor: tint(32) }}
              >
                <span
                  className="text-[12px] font-extrabold tracking-[0.12em] uppercase"
                  style={{ color: deep }}
                >
                  {model.phase}
                </span>
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: `color-mix(in srgb, ${deep} 50%, transparent)` }}
                />
                <span className="text-[15px] font-semibold" style={{ color: deep }}>
                  Day {model.cycleDay} of {model.cycleLength}
                </span>
                <span className="ml-auto text-[14px] text-ink/50">{model.statusLine}</span>
              </div>
            )}
            <div className="h-px bg-ink/[0.08]" />
            <div className="text-[17px] leading-normal text-ink/75">{model.tip}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [state, setState] = useState<OmahiState | null>(null);
  const [appOpen, setAppOpen] = useState(false);
  const openApp = () => setAppOpen(true);
  // The page's single storage write (see the header comment). Other open
  // tabs converge through their storage.onChanged reload below.
  const toggleQuiet = () => void omahiStorage.toggleQuiet().then(setState);
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
        <NewTabDashboard state={state} onOpenApp={openApp} onToggleQuiet={toggleQuiet} />
      )}
      {appOpen && <AppOverlay onClose={() => setAppOpen(false)} />}
    </main>
  );
}

export default App;
