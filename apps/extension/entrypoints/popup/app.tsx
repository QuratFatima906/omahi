import { useEffect, useState } from 'react';
import { PHASES } from '@omahi/core';
import { Onboarding } from '../../components/onboarding/onboarding';
import { formatLocalIso } from '../../lib/month-grid';
import { omahiStorage, type OmahiState } from '../../lib/storage';

/** Post-onboarding placeholder; Chunk 4 replaces this with the dashboard. */
function HomeStub() {
  return (
    <div className="flex h-full flex-col">
      <header className="bg-brand-gradient flex items-center px-5 py-4">
        <span className="font-display text-[19px] font-bold tracking-tight text-white">omahi</span>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-surface p-8 text-center">
        <h1 className="font-display text-2xl font-bold">You&apos;re all set</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          Your phase dashboard is on its way in the next update.
        </p>
      </div>
    </div>
  );
}

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
        <HomeStub />
      )}
    </main>
  );
}

export default App;
