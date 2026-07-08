import { useEffect, useState } from 'react';
import { PHASES } from '@omahi/core';
import { PhaseCalendar } from '../../components/calendar/phase-calendar';
import { Dashboard } from '../../components/dashboard/dashboard';
import { Onboarding } from '../../components/onboarding/onboarding';
import { PeriodLogView } from '../../components/period-log/period-log-view';
import { SettingsView } from '../../components/settings/settings-view';
import { formatLocalIso } from '../../lib/month-grid';
import { effectiveCycleConfig } from '../../lib/period-log';
import { omahiStorage, type OmahiState } from '../../lib/storage';

type View = 'dashboard' | 'calendar' | 'log' | 'settings';

function App() {
  // Runs the real storage layer (load → migrate → persist) on every open;
  // e2e asserts on the data attributes below.
  const [state, setState] = useState<OmahiState | null>(null);
  const [view, setView] = useState<View>('dashboard');
  useEffect(() => {
    void omahiStorage.load().then(setState);
  }, []);

  return (
    // The popup's fixed 380×560 frame is set once here; screens fill it with h-full.
    // The frame tracks the live viewport (the document's intrinsic size only
    // tells Chrome how big to open the popup window — see theme.css), so
    // zoomed popups and full-tab views reflow instead of clipping.
    <main
      className="h-dvh w-dvw overflow-hidden bg-field"
      data-storage={state ? `v${state.schemaVersion}` : 'loading'}
      data-onboarded={state ? String(state.cycleConfig !== null) : 'unknown'}
      // Imports core so the workspace wiring is exercised end-to-end.
      data-core={PHASES.join(' ')}
    >
      {state === null ? null : state.cycleConfig === null ? (
        <Onboarding
          todayIso={formatLocalIso(new Date())}
          onComplete={(next) => {
            setState(next);
            setView('dashboard');
          }}
        />
      ) : view === 'settings' ? (
        <SettingsView
          state={state}
          todayIso={formatLocalIso(new Date())}
          onBack={() => setView('dashboard')}
          onStateChange={(next) => {
            setState(next);
            // Delete-all lands back on onboarding, not a stale settings view.
            if (next.cycleConfig === null) setView('dashboard');
          }}
        />
      ) : view === 'log' ? (
        <PeriodLogView
          state={state}
          todayIso={formatLocalIso(new Date())}
          onBack={() => setView('dashboard')}
          onStateChange={setState}
        />
      ) : view === 'calendar' ? (
        <PhaseCalendar
          // Logged periods re-anchor predictions on every surface.
          config={effectiveCycleConfig(state)!}
          todayIso={formatLocalIso(new Date())}
          onBack={() => setView('dashboard')}
          onLogPeriod={() => setView('log')}
        />
      ) : (
        <Dashboard
          config={effectiveCycleConfig(state)!}
          today={new Date()}
          onOpenCalendar={() => setView('calendar')}
          onOpenSettings={() => setView('settings')}
          onLogPeriod={() => setView('log')}
        />
      )}
    </main>
  );
}

export default App;
