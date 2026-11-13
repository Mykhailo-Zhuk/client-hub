import type { ProjectStatus } from './types';

export function daysBetween(
  startIso: string | Date,
  endIso: string | Date = new Date()
): number {
  const start = startIso instanceof Date ? startIso : new Date(startIso);
  const end = endIso instanceof Date ? endIso : new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
}

/**
 * Computes the effective elapsed days for a project:
 * - When `status === 'active'`, automatically advances from `updatedAt` (or `startDate`)
 *   on top of the stored `dayCurrent` snapshot.
 * - When `paused` or `completed`, stays frozen at the stored `dayCurrent` snapshot.
 */
export function computeEffectiveDayCurrent(
  project: {
    status: ProjectStatus;
    dayCurrent?: number;
    startDate?: string | null;
    updatedAt?: string | null;
  },
  now: Date = new Date()
): number {
  const baseDays = project.dayCurrent ?? 0;
  if (project.status !== 'active') {
    return baseDays;
  }
  const anchor = project.updatedAt || project.startDate;
  if (!anchor) return baseDays;
  return baseDays + daysBetween(anchor, now);
}
