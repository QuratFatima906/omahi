import { useEffect, useState } from 'react';
import { PHASES } from '@omahi/core';
import { Dashboard } from '../../components/dashboard/dashboard';
import { Onboarding } from '../../components/onboarding/onboarding';
import { formatLocalIso } from '../../lib/month-grid';
import { omahiStorage, type OmahiState } from '../../lib/storage';

function App() {
  // Runs the real storage layer (load → migrate → persist) on every open;
  // e2e asserts on the data attributes below.
  const [state, setState] = useState<OmahiState | null>(null);
  useEffect(() => {
    void omahiStorage.load().then(setState);
  }, []);

  return (
    // The popup's fixed 380×560 frame is set once here; screens fill it with h-full.
    <main
      className="h-[560px] w-[380px] bg-card"
      data-storage={state ? `v${state.schemaVersion}` : 'loading'}
      data-onboarded={state ? String(state.cycleConfig !== null) : 'unknown'}
      // Imports core so the workspace wiring is exercised end-to-end.
      data-core={PHASES.join(' ')}
    >
      {state === null ? null : state.cycleConfig === null ? (
        <Onboarding todayIso={formatLocalIso(new Date())} onComplete={setState} />
      ) : (
        <Dashboard config={state.cycleConfig} today={new Date()} />
      )}
    </main>
  );
}

export default App;
