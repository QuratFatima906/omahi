import { useState } from 'react';
import { PHASE_LABELS, PHASES, type CycleConfig } from '@omahi/core';
import { getCalendarMonth } from '../../lib/calendar';
import { isoYearMonth, shiftMonth, WEEKDAYS } from '../../lib/month-grid';
import { ambient, GlassScreen, PHASE_STYLE } from '@omahi/ui';
import { PrimaryButton } from '../onboarding/buttons';

/** Greyed day number from the previous/next month, padding the week rows. */
function AdjacentDay({ day }: { day: number }) {
  return <div className="py-[9px] text-ink-disabled">{day}</div>;
}

interface PhaseCalendarProps {
  config: CycleConfig;
  todayIso: string;
  onBack: () => void;
  /** Chunk 7 wires this to period logging. */
  onLogPeriod?: () => void;
}

export function PhaseCalendar({ config, todayIso, onBack, onLogPeriod }: PhaseCalendarProps) {
  const [view, setView] = useState(() => isoYearMonth(todayIso));
  const model = getCalendarMonth(config, view.year, view.month, todayIso);
  // Dashed prediction marks stay readable at full opacity minus a step.
  const predictedEdge = ambient(PHASE_STYLE.menstruation.color, 65);
  const predictedWash = ambient(PHASE_STYLE.menstruation.color, 12);

  return (
    <GlassScreen
      glow={[ambient(PHASE_STYLE.luteal.color, 24), ambient(PHASE_STYLE.follicular.color, 24)]}
    >
      <header className="flex items-center gap-3 px-5 pt-4 pb-1">
        <button
          type="button"
          aria-label="Back to dashboard"
          onClick={onBack}
          className="-ml-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[19px] text-ink-faint hover:bg-ink/5"
        >
          ←
        </button>
        <h1 className="flex-1 font-display text-base font-bold">Calendar</h1>
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView(shiftMonth(view.year, view.month, -1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[20px] text-ink-faint hover:bg-ink/5"
        >
          ‹
        </button>
        <span className="font-display text-sm font-bold text-ink-soft">{model.label}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView(shiftMonth(view.year, view.month, 1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[20px] text-ink-faint hover:bg-ink/5"
        >
          ›
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-[18px] pt-3 pb-5">
        <div className="rounded-[18px] border border-glass-border bg-glass p-4 backdrop-blur-[22px] backdrop-saturate-150">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-ink-faint">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[12.5px] font-semibold">
            {model.prevMonthTrail.map((day) => (
              <AdjacentDay key={`prev-${day}`} day={day} />
            ))}
            {model.days.map((cell) => (
              <div
                key={cell.iso}
                data-iso={cell.iso}
                data-phase={cell.phase}
                data-predicted={cell.isPredictedPeriod || undefined}
                data-today={cell.isToday || undefined}
                className={`rounded-[10px] py-[9px] ${cell.isToday ? 'font-extrabold outline-2 -outline-offset-2 outline-rose' : ''} ${
                  cell.isPredictedPeriod ? 'border-[1.5px] border-dashed' : ''
                }`}
                style={{
                  background: cell.isPredictedPeriod ? predictedWash : PHASE_STYLE[cell.phase].tint,
                  color: PHASE_STYLE[cell.phase].deep,
                  ...(cell.isPredictedPeriod ? { borderColor: predictedEdge } : {}),
                }}
              >
                {cell.day}
              </div>
            ))}
            {model.nextMonthLead.map((day) => (
              <AdjacentDay key={`next-${day}`} day={day} />
            ))}
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2.5 px-0.5 text-[11.5px] font-semibold text-ink-soft">
          {PHASES.map((phase) => (
            <span key={phase} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-[4px]"
                style={{ background: PHASE_STYLE[phase].color }}
              />
              {PHASE_LABELS[phase]}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-[4px] border-[1.5px] border-dashed"
              style={{ background: predictedWash, borderColor: predictedEdge }}
            />
            Predicted period
          </span>
        </div>

        <PrimaryButton onClick={onLogPeriod} className="mt-4 w-full text-[14.5px]">
          Log period start
        </PrimaryButton>
      </div>
    </GlassScreen>
  );
}
