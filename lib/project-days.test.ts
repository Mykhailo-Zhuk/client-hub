import { describe, expect, it } from 'vitest';
import { computeEffectiveDayCurrent } from './project-days';

describe('computeEffectiveDayCurrent', () => {
  it('advances days automatically when project is active', () => {
    const now = new Date('2026-11-15T12:00:00Z');
    const result = computeEffectiveDayCurrent(
      {
        status: 'active',
        dayCurrent: 10,
        startDate: '2026-11-01',
        updatedAt: '2026-11-12T10:00:00Z',
      },
      now
    );
    expect(result).toBe(13);
  });

  it('freezes day counter when project is paused', () => {
    const now = new Date('2026-12-01T12:00:00Z');
    const result = computeEffectiveDayCurrent(
      {
        status: 'paused',
        dayCurrent: 65,
        startDate: '2026-08-01',
        updatedAt: '2026-10-05T10:00:00Z',
      },
      now
    );
    expect(result).toBe(65);
  });

  it('freezes day counter when project is completed', () => {
    const now = new Date('2026-12-01T12:00:00Z');
    const result = computeEffectiveDayCurrent(
      {
        status: 'completed',
        dayCurrent: 65,
        startDate: '2026-08-01',
        updatedAt: '2026-10-05T10:00:00Z',
      },
      now
    );
    expect(result).toBe(65);
  });

  it('resumes counting from frozen dayCurrent after switching paused -> active', () => {
    const resumedAt = '2026-11-13T10:00:00Z';
    const twoDaysLater = new Date('2026-11-15T10:00:00Z');
    const result = computeEffectiveDayCurrent(
      {
        status: 'active',
        dayCurrent: 65,
        startDate: '2026-08-01',
        updatedAt: resumedAt,
      },
      twoDaysLater
    );
    expect(result).toBe(67);
  });
});
