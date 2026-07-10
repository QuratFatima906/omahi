import { PHASES, type CycleConfig } from '@omahi/core';
import { getDashboardModel } from '../../lib/dashboard';
import { CycleRing } from '../cycle-ring';
import { ambient, GlassScreen, PHASE_STYLE } from '@omahi/ui';
import { CalendarIcon, GearIcon } from '../icons';

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

const glassRow =
  'rounded-[14px] border border-glass-border bg-glass-soft backdrop-blur-[20px] backdrop-saturate-150';

export function Dashboard({
  config,
  today,
  onOpenCalendar,
  onOpenSettings,
  onLogPeriod,
}: DashboardProps) {
  const model = getDashboardModel(config, today);
  const { color, deep } = PHASE_STYLE[model.phase];
  // Ambient light: today's phase glows top-left, the phase after it waits
  // bottom-right — the field itself hints at where the cycle is heading.
  const nextPhase = PHASES[(PHASES.indexOf(model.phase) + 1) % PHASES.length] ?? model.phase;
  const focusRows = [
    ['Work', model.work],
    ['Food', model.food],
    ['Move', model.move],
    ['Rest', model.rest],
  ] as const;

  return (
    <GlassScreen glow={[ambient(color, 35), ambient(PHASE_STYLE[nextPhase].color, 22)]}>
      <header className="flex items-center justify-between px-6 pt-3 pb-0">
        <span className="font-display text-[20px] font-bold tracking-tight text-ink/40">omahi</span>
        <div className="flex items-center gap-1">
          {(
            [
              ['Calendar', <CalendarIcon key="calendar" />, onOpenCalendar],
              ['Settings', <GearIcon key="settings" />, onOpenSettings],
            ] as const
          ).map(([label, icon, onClick]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={onClick}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink/35 hover:bg-ink/5 hover:text-ink/60"
            >
              {icon}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5 pt-2 pb-4">
        <section className="rounded-[20px] border border-glass-border bg-glass px-5 py-4 shadow-[0_8px_24px_rgba(46,34,38,0.06)] backdrop-blur-[24px] backdrop-saturate-150">
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-[11.5px] font-extrabold tracking-[0.14em] uppercase"
                style={{ color: deep }}
              >
                {model.phaseLabel} · Day {model.cycleDay}
              </div>
              <h1 className="mt-1 font-display text-[22px] leading-[1.25] font-bold">
                {model.hero}
              </h1>
            </div>
            <CycleRing fraction={model.ringFraction} color={color} size={48} strokeWidth={4} />
          </div>
          <div className="mt-3 flex gap-[5px]" aria-hidden="true">
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
          <p className="mt-2 text-[12.5px] text-ink-muted">{model.nextLine}</p>
        </section>

        <div className="flex flex-col gap-2">
          {focusRows.map(([label, text]) => (
            <div key={label} className={`${glassRow} flex items-start gap-3 px-4 py-2.5`}>
              <span
                className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full"
                style={{ background: color }}
              />
              <p className="text-[13px] leading-snug">
                <b className="font-display">{label}</b> — {text}
              </p>
            </div>
          ))}
        </div>

        <div
          className="rounded-[14px] border px-4 py-2.5 text-[12.5px] leading-snug"
          style={{ background: ambient(color, 15), borderColor: ambient(color, 28) }}
        >
          <b className="font-display" style={{ color: deep }}>
            Today&apos;s nudge
          </b>{' '}
          · {model.tip}
        </div>

        <button
          type="button"
          onClick={onLogPeriod}
          className="cursor-pointer py-0.5 text-center text-[13px] font-bold text-rose"
        >
          My period started →
        </button>
      </div>
    </GlassScreen>
  );
}
