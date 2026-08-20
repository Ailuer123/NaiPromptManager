import { describe, expect, it } from 'vitest';
import { db } from './dbService';

describe('dbService auth', () => {
  it('不再提供游客口令登录或游客口令管理', () => {
    expect(db).not.toHaveProperty('guestLogin');
    expect(db).not.toHaveProperty('getGuestCode');
    expect(db).not.toHaveProperty('updateGuestCode');
    expect(db).toHaveProperty('login');
  });
});
