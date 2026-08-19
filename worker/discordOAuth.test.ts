import { describe, expect, it } from 'vitest';
import { canViewChannel, type DiscordOverwrite, type DiscordRole } from './discordOAuth';

const everyone: DiscordRole = { id: 'guild', permissions: String(1 << 10) };
const noViewEveryone: DiscordRole = { id: 'guild', permissions: '0' };
const staff: DiscordRole = { id: 'staff', permissions: String(1 << 10) };

describe('canViewChannel', () => {
  it('everyone 可见时成员可见', () => {
    expect(canViewChannel(everyone, [], [], 'user')).toBe(true);
  });

  it('频道对 everyone 拒绝后，持有允许覆盖的角色可见', () => {
    const overwrites: DiscordOverwrite[] = [
      { id: 'guild', type: 0, allow: '0', deny: String(1 << 10) },
      { id: 'staff', type: 0, allow: String(1 << 10), deny: '0' },
    ];
    expect(canViewChannel(noViewEveryone, [staff], overwrites, 'user')).toBe(true);
    expect(canViewChannel(noViewEveryone, [], overwrites, 'user')).toBe(false);
  });

  it('管理员无视频道覆盖', () => {
    const admin: DiscordRole = { id: 'admin', permissions: String(1 << 3) };
    const overwrites: DiscordOverwrite[] = [
      { id: 'guild', type: 0, allow: '0', deny: String(1 << 10) },
    ];
    expect(canViewChannel(noViewEveryone, [admin], overwrites, 'user')).toBe(true);
  });
});
