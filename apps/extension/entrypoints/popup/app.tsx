import { useEffect, useState } from 'react';
import { PHASES } from '@omahi/core';
import { omahiStorage, type OmahiState } from '../../lib/storage';
import './app.css';

function App() {
  // Runs the real storage layer (load → migrate → persist) on every open;
  // e2e asserts on the data attributes below. Chunk 3 builds onboarding on this.
  const [state, setState] = useState<OmahiState | null>(null);
  useEffect(() => {
    void omahiStorage.load().then(setState);
  }, []);

  return (
    <main
      data-storage={state ? `v${state.schemaVersion}` : 'loading'}
      data-onboarded={state ? String(state.cycleConfig !== null) : 'unknown'}
    >
      <h1>Omahi</h1>
      <p>Love every phase.</p>
      {/* Imports core so the workspace wiring is exercised end-to-end. */}
      <p className="core-check" data-core={PHASES.join(' ')}>
        Cycle-aware planning is on its way.
      </p>
    </main>
  );
}

export default App;
