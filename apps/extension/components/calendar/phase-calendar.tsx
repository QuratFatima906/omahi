import { useState } from 'react';
import { PHASE_LABELS, PHASES, type CycleConfig } from '@omahi/core';
import { getCalendarMonth } from '../../lib/calendar';
import { isoYearMonth, shiftMonth, WEEKDAYS } from '../../lib/month-grid';
import { PHASE_STYLE } from '../phase-style';

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

  return (
    <div className="flex h-full flex-col bg-surface">
      <header className="flex items-center gap-3.5 border-b border-line bg-card px-5 py-3.5">
        <button
          type="button"
          aria-label="Back to dashboard"
          onClick={onBack}
          className="cursor-pointer text-[17px] text-ink-faint"
        >
          ←
        </button>
        <h1 className="flex-1 font-display text-base font-bold">Calendar</h1>
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView(shiftMonth(view.year, view.month, -1))}
          className="cursor-pointer px-1 text-[15px] text-ink-faint"
        >
          ‹
        </button>
        <span className="font-display text-sm font-bold text-ink-soft">{model.label}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView(shiftMonth(view.year, view.month, 1))}
          className="cursor-pointer px-1 text-[15px] text-ink-faint"
        >
          ›
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-[18px] pt-4 pb-5">
        <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-ink-faint">
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
                background: PHASE_STYLE[cell.phase].tint,
                color: PHASE_STYLE[cell.phase].deep,
                ...(cell.isPredictedPeriod ? { borderColor: PHASE_STYLE.menstruation.deep } : {}),
              }}
            >
              {cell.day}
            </div>
          ))}
          {model.nextMonthLead.map((day) => (
            <AdjacentDay key={`next-${day}`} day={day} />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2.5 text-[11.5px] font-semibold text-ink-soft">
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
              style={{
                background: PHASE_STYLE.menstruation.tint,
                borderColor: PHASE_STYLE.menstruation.deep,
              }}
            />
            Predicted period
          </span>
        </div>

        <button
          type="button"
          onClick={onLogPeriod}
          className="bg-brand-gradient mt-4 w-full cursor-pointer rounded-xl py-[13px] text-center font-display text-[14.5px] font-bold text-white"
        >
          Log period start
        </button>
      </div>
    </div>
  );
}
