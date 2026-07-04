import type { Phase } from '@omahi/core';

/**
 * Phase → theme-token CSS variables (from assets/theme.css). Kept as a static
 * map because Tailwind can't build class names dynamically.
 */
export const PHASE_STYLE: Record<Phase, { color: string; tint: string }> = {
  menstruation: { color: 'var(--color-menstruation)', tint: 'var(--color-menstruation-tint)' },
  follicular: { color: 'var(--color-follicular)', tint: 'var(--color-follicular-tint)' },
  ovulation: { color: 'var(--color-ovulation)', tint: 'var(--color-ovulation-tint)' },
  luteal: { color: 'var(--color-luteal)', tint: 'var(--color-luteal-tint)' },
};
