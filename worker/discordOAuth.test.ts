import { describe, expect, it } from 'vitest';
import { isDiscordConfigured } from './discordOAuth';

describe('isDiscordConfigured', () => {
  it('只要求 Client ID、Secret 和服务器 ID', () => {
    expect(isDiscordConfigured({
      DISCORD_CLIENT_ID: 'id',
      DISCORD_CLIENT_SECRET: 'secret',
      DISCORD_GUILD_ID: 'guild',
    })).toBe(true);
    expect(isDiscordConfigured({
      DISCORD_CLIENT_ID: 'id',
      DISCORD_CLIENT_SECRET: 'secret',
    })).toBe(false);
  });
});
