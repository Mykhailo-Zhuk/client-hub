import { describe, expect, it } from 'vitest';
import { isSampleProject, sortSamplesFirst } from './projects';

describe('sample project ordering', () => {
  it('identifies sample projects by flag or known sample IDs', () => {
    expect(isSampleProject({ id: 'spa-canada' })).toBe(true);
    expect(isSampleProject({ id: 'iron-master' })).toBe(true);
    expect(isSampleProject({ id: 'universal-service-template' })).toBe(true);
    expect(isSampleProject({ id: 'custom', isSample: true })).toBe(true);
    expect(isSampleProject({ id: 'car4you', isSample: false })).toBe(false);
  });

  it('places sample projects first while preserving relative order', () => {
    const input = [
      { id: 'chronos-hub', isSample: false },
      { id: 'sashas-quilts', isSample: false },
      { id: 'spa-canada', isSample: true },
      { id: 'car4you' },
      { id: 'iron-master', isSample: true },
    ];
    const sorted = sortSamplesFirst(input);
    expect(sorted.map((p) => p.id)).toEqual([
      'spa-canada',
      'iron-master',
      'chronos-hub',
      'sashas-quilts',
      'car4you',
    ]);
  });
});
