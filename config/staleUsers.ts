import type { User } from '../types';

/** 普通用户超过此时长未登录，且配额使用为 0，可批量改回游客。 */
export const STALE_GUEST_IDLE_MS = 15 * 24 * 60 * 60 * 1000;

export type StaleUserCandidate = Pick<User, 'id' | 'role' | 'lastLogin' | 'storageUsage'>;

export function isStaleZeroQuotaUser(
  user: StaleUserCandidate,
  now = Date.now(),
  selfId?: string,
): boolean {
  if (selfId && user.id === selfId) return false;
  if (user.role !== 'user') return false;
  if ((user.storageUsage || 0) !== 0) return false;
  if (user.lastLogin != null && Number(user.lastLogin) > 0 && now - Number(user.lastLogin) <= STALE_GUEST_IDLE_MS) {
    return false;
  }
  return true;
}
