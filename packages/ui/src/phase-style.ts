import type { Phase } from '@omahi/core';

/**
 * Phase → theme-token CSS variables (from assets/theme.css). Kept as a static
 * map because Tailwind can't build class names dynamically. `deep` is the
 * darker variant that stays readable as text on the phase tint.
 */
export const PHASE_STYLE: Record<Phase, { color: string; tint: string; deep: string }> = {
  menstruation: {
    color: 'var(--color-menstruation)',
    tint: 'var(--color-menstruation-tint)',
    deep: 'var(--color-menstruation-deep)',
  },
  follicular: {
    color: 'var(--color-follicular)',
    tint: 'var(--color-follicular-tint)',
    deep: 'var(--color-follicular-deep)',
  },
  ovulation: {
    color: 'var(--color-ovulation)',
    tint: 'var(--color-ovulation-tint)',
    deep: 'var(--color-ovulation-deep)',
  },
  luteal: {
    color: 'var(--color-luteal)',
    tint: 'var(--color-luteal-tint)',
    deep: 'var(--color-luteal-deep)',
  },
};
