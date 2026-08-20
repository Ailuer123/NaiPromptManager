import { describe, expect, it } from 'vitest';
import { STALE_GUEST_IDLE_MS, isStaleZeroQuotaUser } from './staleUsers';

const now = 1_700_000_000_000;

describe('isStaleZeroQuotaUser', () => {
  it('普通用户、15 天未登录、配额为 0 才符合', () => {
    const stale = now - STALE_GUEST_IDLE_MS - 1;
    expect(isStaleZeroQuotaUser({ id: 'u', role: 'user', lastLogin: stale, storageUsage: 0 }, now)).toBe(true);
    expect(isStaleZeroQuotaUser({ id: 'u', role: 'user', lastLogin: now, storageUsage: 0 }, now)).toBe(false);
    expect(isStaleZeroQuotaUser({ id: 'u', role: 'user', lastLogin: stale, storageUsage: 1 }, now)).toBe(false);
    expect(isStaleZeroQuotaUser({ id: 'u', role: 'vip', lastLogin: stale, storageUsage: 0 }, now)).toBe(false);
    expect(isStaleZeroQuotaUser({ id: 'me', role: 'user', lastLogin: stale, storageUsage: 0 }, now, 'me')).toBe(false);
    expect(isStaleZeroQuotaUser({ id: 'u', role: 'user', lastLogin: undefined, storageUsage: 0 }, now)).toBe(true);
  });
});
