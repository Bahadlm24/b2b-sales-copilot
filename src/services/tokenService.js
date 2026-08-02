export const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

function randomToken(prefix) {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${id}`;
}

export function issueTokenSession(userId, now = Date.now()) {
  return {
    userId,
    accessToken: randomToken("access"),
    refreshToken: randomToken("refresh"),
    issuedAt: now,
    expiresAt: now + TOKEN_LIFETIME_MS,
    refreshCount: 0,
  };
}

export function isTokenValid(session, now = Date.now()) {
  return Boolean(session?.accessToken && session?.refreshToken && session.expiresAt > now);
}

export function refreshTokenSession(session, now = Date.now()) {
  if (!session?.refreshToken) return null;
  return {
    ...session,
    accessToken: randomToken("access"),
    issuedAt: now,
    expiresAt: now + TOKEN_LIFETIME_MS,
    refreshCount: (session.refreshCount || 0) + 1,
  };
}
