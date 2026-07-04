/**
 * Pure view-model for the new-tab page: the dashboard model plus the
 * greeting, long date line, and the next predicted period date.
 */

import { getForecast, type CycleConfig } from '@omahi/core';
import { getDashboardModel, type DashboardModel } from './dashboard';
import { formatLongDate } from './month-grid';

export interface NewTabModel extends DashboardModel {
  /** "Good morning — big-idea energy." */
  headline: string;
  /** "Saturday, July 5". */
  dateLine: string;
  /** Next predicted period start, `YYYY-MM-DD`. */
  nextPeriodDate: string;
}

/** Time-of-day greeting from a 0–23 hour. */
export function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** The first day at or after tomorrow that starts a cycle (cycle day 1). */
export function getNextPeriodDate(config: CycleConfig, today: Date): string {
  // A full cycle from tomorrow always contains the next day-1.
  const forecast = getForecast(config, today, config.cycleLength + 1);
  return forecast.slice(1).find((day) => day.cycleDay === 1)!.date;
}

export function getNewTabModel(config: CycleConfig, today: Date): NewTabModel {
  const model = getDashboardModel(config, today);
  const hero = model.hero.charAt(0).toLowerCase() + model.hero.slice(1);
  return {
    ...model,
    headline: `${getGreeting(today.getHours())} — ${hero}.`,
    dateLine: formatLongDate(today),
    nextPeriodDate: getNextPeriodDate(config, today),
  };
}
