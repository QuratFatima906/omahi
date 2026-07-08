import { useState } from 'react';
import {
  getMonthGrid,
  isoMonthOrdinal,
  isoYearMonth,
  monthOrdinal,
  shiftMonth,
  WEEKDAYS,
} from '../lib/month-grid';

interface MonthCalendarProps {
  /** Local calendar today (`YYYY-MM-DD`); future days are not selectable. */
  todayIso: string;
  selected: string | null;
  onSelect(iso: string): void;
}

const WEEKDAY_INITIALS = WEEKDAYS.map((weekday) => weekday.charAt(0));

export function MonthCalendar({ todayIso, selected, onSelect }: MonthCalendarProps) {
  const [view, setView] = useState(() => isoYearMonth(selected ?? todayIso));
  const grid = getMonthGrid(view.year, view.month);
  const atCurrentMonth = monthOrdinal(view.year, view.month) >= isoMonthOrdinal(todayIso);

  return (
    <div className="mt-[22px] rounded-[14px] bg-surface p-4">
      <div className="flex items-center justify-between pb-2 font-display text-sm font-bold">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView(shiftMonth(view.year, view.month, -1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[20px] font-normal text-ink-faint hover:bg-line"
        >
          ‹
        </button>
        <span>{grid.label}</span>
        <button
          type="button"
          aria-label="Next month"
          disabled={atCurrentMonth}
          onClick={() => setView(shiftMonth(view.year, view.month, 1))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[20px] font-normal text-ink-faint hover:bg-line disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11.5px] font-bold text-ink-faint">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <span key={index} aria-hidden="true">
            {initial}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: grid.leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {grid.cells.map((cell) => {
          const isFuture = cell.iso > todayIso;
          const isSelected = cell.iso === selected;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={isFuture}
              aria-pressed={isSelected}
              onClick={() => onSelect(cell.iso)}
              className={`rounded-full py-[7px] text-center text-[12.5px] ${
                isSelected
                  ? 'bg-brand-gradient font-extrabold text-white'
                  : isFuture
                    ? 'text-ink-ghost/50'
                    : 'cursor-pointer text-ink hover:bg-line'
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
