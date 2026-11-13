import { describe, expect, it } from 'vitest';
import { hashClientPassword, verifyPasswordValue } from './client-passwords';

describe('client password hashing', () => {
  it('hashes with scrypt and verifies matching password', () => {
    const hash = hashClientPassword('super-secret-123');
    expect(hash.startsWith('scrypt:')).toBe(true);
    expect(hash).not.toContain('super-secret-123');
    expect(verifyPasswordValue('super-secret-123', hash)).toBe(true);
    expect(verifyPasswordValue('wrong-password', hash)).toBe(false);
  });

  it('remains backwards-compatible with legacy plain-text passwords', () => {
    expect(verifyPasswordValue('legacy123', 'legacy123')).toBe(true);
    expect(verifyPasswordValue('other', 'legacy123')).toBe(false);
  });
});
