import type { ReactNode } from 'react';

/** Translucent wash of a theme color — the ambient light behind the glass. */
export function ambient(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

interface GlassScreenProps {
  /** Ambient blob colors: [top-left, bottom-right]. Use `ambient(...)` washes. */
  glow: [string, string];
  children: ReactNode;
}

/**
 * Shared frame for every glass popup screen: the warm field with two blurred
 * color blobs bleeding in from the corners, content floating above them in a
 * centered column. Everything is proportional to the viewport, so the same
 * screen works in the popup, a zoomed popup, or a full tab.
 */
export function GlassScreen({ glow, children }: GlassScreenProps) {
  const [topLeft, bottomRight] = glow;
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-field">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[6%] -left-[8%] h-[34%] w-[60%] rounded-full blur-[58px]"
        style={{ background: topLeft }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[8%] bottom-[6%] h-[34%] w-[60%] rounded-full blur-[62px]"
        style={{ background: bottomRight }}
      />
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-md flex-col">
        {children}
      </div>
    </div>
  );
}
