const DISCORD_API = 'https://discord.com/api/v10';
const VIEW_CHANNEL = 1n << 10n;
const ADMINISTRATOR = 1n << 3n;

export type DiscordEnv = {
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_BOT_TOKEN?: string;
  DISCORD_GUILD_ID?: string;
  DISCORD_CHANNEL_ID?: string;
};

export type DiscordOverwrite = { id: string; type: number; allow: string; deny: string };
export type DiscordRole = { id: string; permissions: string };

export const isDiscordConfigured = (env: DiscordEnv): boolean => Boolean(
  env.DISCORD_CLIENT_ID
  && env.DISCORD_CLIENT_SECRET
  && env.DISCORD_BOT_TOKEN
  && env.DISCORD_GUILD_ID
  && env.DISCORD_CHANNEL_ID
);

export const canViewChannel = (
  everyoneRole: DiscordRole,
  memberRoles: DiscordRole[],
  overwrites: DiscordOverwrite[],
  memberId: string,
): boolean => {
  let perms = BigInt(everyoneRole.permissions || '0');
  for (const role of memberRoles) perms |= BigInt(role.permissions || '0');
  if ((perms & ADMINISTRATOR) !== 0n) return true;

  const apply = (allow: string, deny: string) => {
    perms &= ~BigInt(deny || '0');
    perms |= BigInt(allow || '0');
  };

  const everyoneOw = overwrites.find((item) => item.id === everyoneRole.id && item.type === 0);
  if (everyoneOw) apply(everyoneOw.allow, everyoneOw.deny);

  for (const role of memberRoles) {
    const ow = overwrites.find((item) => item.id === role.id && item.type === 0);
    if (ow) apply(ow.allow, ow.deny);
  }

  const memberOw = overwrites.find((item) => item.id === memberId && item.type === 1);
  if (memberOw) apply(memberOw.allow, memberOw.deny);

  return (perms & VIEW_CHANNEL) !== 0n;
};

const discordFetch = async (path: string, token: string, tokenType = 'Bot') => {
  const res = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `${tokenType} ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Discord API ${res.status}`);
  return res.json();
};

export const exchangeDiscordCode = async (
  env: DiscordEnv,
  code: string,
  redirectUri: string,
): Promise<string> => {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID!,
    client_secret: env.DISCORD_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Discord 授权码交换失败');
  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error('Discord 未返回 access_token');
  return data.access_token;
};

export type DiscordIdentity = { id: string; username: string; globalName?: string };

export const fetchDiscordIdentity = async (accessToken: string): Promise<DiscordIdentity> => {
  const me = await discordFetch('/users/@me', accessToken, 'Bearer') as {
    id: string; username: string; global_name?: string;
  } | null;
  if (!me?.id) throw new Error('无法读取 Discord 用户');
  return { id: me.id, username: me.username, globalName: me.global_name || undefined };
};

export const verifyDiscordChannelAccess = async (
  env: DiscordEnv,
  discordUserId: string,
): Promise<boolean> => {
  const guildId = env.DISCORD_GUILD_ID!;
  const channelId = env.DISCORD_CHANNEL_ID!;
  const token = env.DISCORD_BOT_TOKEN!;

  const member = await discordFetch(`/guilds/${guildId}/members/${discordUserId}`, token) as {
    user?: { id: string };
    roles?: string[];
  } | null;
  if (!member) return false;

  const channel = await discordFetch(`/channels/${channelId}`, token) as {
    guild_id?: string;
    permission_overwrites?: DiscordOverwrite[];
  } | null;
  if (!channel || channel.guild_id !== guildId) return false;

  const rolesPayload = await discordFetch(`/guilds/${guildId}/roles`, token) as DiscordRole[] | null;
  if (!Array.isArray(rolesPayload)) return false;

  const everyone = rolesPayload.find((role) => role.id === guildId);
  if (!everyone) return false;
  const memberRoles = rolesPayload.filter((role) => (member.roles || []).includes(role.id));
  return canViewChannel(everyone, memberRoles, channel.permission_overwrites || [], discordUserId);
};

export const pickDiscordUsername = (identity: DiscordIdentity, taken: (name: string) => Promise<boolean>): Promise<string> => {
  const base = (identity.globalName || identity.username || 'discord')
    .replace(/[^\w\u4e00-\u9fff.-]+/g, '')
    .slice(0, 24) || 'discord';
  return (async () => {
    if (!(await taken(base))) return base;
    const suffix = identity.id.slice(-4);
    const candidate = `${base}-${suffix}`.slice(0, 32);
    if (!(await taken(candidate))) return candidate;
    return `u${identity.id}`.slice(0, 32);
  })();
};

export const discordAuthorizeUrl = (env: DiscordEnv, redirectUri: string, state: string): string => {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
    state,
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
};
