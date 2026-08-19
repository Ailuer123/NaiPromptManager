const DISCORD_API = 'https://discord.com/api/v10';

export type DiscordEnv = {
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_GUILD_ID?: string;
};

export const isDiscordConfigured = (env: DiscordEnv): boolean => Boolean(
  env.DISCORD_CLIENT_ID
  && env.DISCORD_CLIENT_SECRET
  && env.DISCORD_GUILD_ID
);

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

export const verifyDiscordGuildMembership = async (
  env: DiscordEnv,
  accessToken: string,
): Promise<boolean> => {
  const guilds = await discordFetch('/users/@me/guilds', accessToken, 'Bearer') as Array<{ id?: string }> | null;
  if (!Array.isArray(guilds)) return false;
  return guilds.some((guild) => guild.id === env.DISCORD_GUILD_ID);
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
    scope: 'identify guilds',
    state,
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
};
