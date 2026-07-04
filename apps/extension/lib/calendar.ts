/**
 * Pure view-model for the phase calendar: one month of phase-coded days.
 *
 * "Predicted period" = menstruation days in any cycle other than the one the
 * anchor starts (cycle 0). The anchor's own period block is recorded fact;
 * every other block — future cycles and hypothetical past ones — is a
 * prediction and renders dashed.
 */

import { getForecast, MS_PER_DAY, parseIsoDate, type CycleConfig, type Phase } from '@omahi/core';
import { getMonthGrid, shiftMonth } from './month-grid';

export interface CalendarDayModel {
  day: number;
  iso: string;
  phase: Phase;
  isToday: boolean;
  isPredictedPeriod: boolean;
}

export interface CalendarMonthModel {
  /** e.g. "July 2026". */
  label: string;
  /** Greyed trailing days of the previous month before day 1 (may be empty). */
  prevMonthTrail: number[];
  days: CalendarDayModel[];
  /** Greyed leading days of the next month completing the final week (may be empty). */
  nextMonthLead: number[];
}

export function getCalendarMonth(
  config: CycleConfig,
  year: number,
  month: number,
  todayIso: string,
): CalendarMonthModel {
  const grid = getMonthGrid(year, month);
  const anchorMs = parseIsoDate(config.anchorDate) as number;
  const forecast = getForecast(config, new Date(year, month - 1, 1, 12), grid.cells.length);

  const days = grid.cells.map((cell, index) => {
    const info = forecast[index]!;
    const diffDays = ((parseIsoDate(cell.iso) as number) - anchorMs) / MS_PER_DAY;
    const cycleIndex = Math.floor(diffDays / config.cycleLength);
    return {
      day: cell.day,
      iso: cell.iso,
      phase: info.phase,
      isToday: cell.iso === todayIso,
      isPredictedPeriod: info.phase === 'menstruation' && cycleIndex !== 0,
    };
  });

  const prev = shiftMonth(year, month, -1);
  const prevGrid = getMonthGrid(prev.year, prev.month);
  const prevMonthTrail = prevGrid.cells
    .slice(prevGrid.cells.length - grid.leadingBlanks)
    .map((c) => c.day);

  const cellsInLastWeek = (grid.leadingBlanks + grid.cells.length) % 7;
  const nextMonthLead =
    cellsInLastWeek === 0 ? [] : Array.from({ length: 7 - cellsInLastWeek }, (_, i) => i + 1);

  return { label: grid.label, prevMonthTrail, days, nextMonthLead };
}
