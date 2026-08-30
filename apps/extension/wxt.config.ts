import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
    // No modulepreload links. They only hide network latency, and every chunk
    // here is already on local disk — meanwhile popup.html is also loaded in
    // an iframe by the new-tab overlay, where Chrome reports its preload as a
    // "cross-world extension resource mismatch" on every open.
    build: { modulePreload: false },
  }),
  manifest: {
    name: 'Omahi',
    description: 'Plan your schedule, meals, workouts, and rest around your cycle.',
    // "search" powers the new-tab search field when the override is off; it
    // routes to the user's own default engine instead of a hardcoded one.
    permissions: ['storage', 'search'],
  },
});
