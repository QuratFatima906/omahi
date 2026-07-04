import type { CycleConfig } from '@omahi/core';
import { getDashboardModel } from '../../lib/dashboard';
import { PHASE_STYLE } from '../phase-style';

interface DashboardProps {
  config: CycleConfig;
  today: Date;
  /** Chunk 6 wires this to the calendar view. */
  onOpenCalendar?: () => void;
  /** Chunk 8 wires this to the settings view. */
  onOpenSettings?: () => void;
  /** Chunk 7 wires this to period logging. */
  onLogPeriod?: () => void;
}

export function Dashboard({
  config,
  today,
  onOpenCalendar,
  onOpenSettings,
  onLogPeriod,
}: DashboardProps) {
  const model = getDashboardModel(config, today);
  const { color, tint } = PHASE_STYLE[model.phase];
  const focusRows = [
    ['Work', model.work],
    ['Food', model.food],
    ['Move', model.move],
    ['Rest', model.rest],
  ] as const;

  return (
    <div className="flex h-full flex-col bg-surface">
      <header className="bg-brand-gradient flex items-center justify-between px-5 py-4">
        <span className="font-display text-[19px] font-bold tracking-tight text-white">omahi</span>
        <div className="flex items-center gap-3.5">
          {(
            [
              ['Calendar', '▦', onOpenCalendar],
              ['Settings', '⚙', onOpenSettings],
            ] as const
          ).map(([label, glyph, onClick]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={onClick}
              className="cursor-pointer text-[15px] text-blush"
            >
              {glyph}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 pt-[18px] pb-5">
        <section className="rounded-2xl bg-card px-5 py-[18px] shadow-[0_3px_12px_rgba(46,34,38,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-[11.5px] font-extrabold tracking-[0.14em] uppercase"
                style={{ color }}
              >
                {model.phaseLabel} · Day {model.cycleDay}
              </div>
              <h1 className="mt-[5px] font-display text-[23px] leading-[1.25] font-bold">
                {model.hero}
              </h1>
            </div>
            <div
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full font-display text-[17px] font-bold"
              style={{ background: tint, color }}
            >
              {model.cycleDay}
            </div>
          </div>
          <div className="mt-3.5 flex gap-[5px]" aria-hidden="true">
            {model.segments.map((segment) => (
              <div
                key={segment.phase}
                className="relative h-[7px] rounded-full"
                style={{
                  flex: `${segment.length} ${segment.length} 0%`,
                  background: PHASE_STYLE[segment.phase].tint,
                }}
              >
                {segment.fillRatio !== null && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${segment.fillRatio * 100}%`,
                      background: PHASE_STYLE[segment.phase].color,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[12.5px] text-ink-muted">{model.nextLine}</p>
        </section>

        <div className="flex flex-col gap-2">
          {focusRows.map(([label, text]) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-[13px] bg-card px-4 py-3 shadow-[0_2px_8px_rgba(46,34,38,0.05)]"
            >
              <span
                className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full"
                style={{ background: color }}
              />
              <p className="text-[13.5px] leading-normal">
                <b className="font-display">{label}</b> — {text}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-[13px] px-4 py-[13px] text-[13px] leading-relaxed"
          style={{ background: tint }}
        >
          <b className="font-display">Today&apos;s nudge</b> · {model.tip}
        </div>

        <button
          type="button"
          onClick={onLogPeriod}
          className="cursor-pointer py-1 text-center text-[13px] font-bold text-rose"
        >
          My period started →
        </button>
      </div>
    </div>
  );
}
