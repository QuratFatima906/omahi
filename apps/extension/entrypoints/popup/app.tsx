import { PHASES } from '@omahi/core';
import './app.css';

function App() {
  return (
    <main>
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
