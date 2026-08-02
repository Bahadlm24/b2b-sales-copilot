import test from "node:test";
import assert from "node:assert/strict";
import { TOKEN_LIFETIME_MS, isTokenValid, issueTokenSession, refreshTokenSession } from "../src/services/tokenService.js";

test("token oturumu 60 dakika geçerli olur", () => {
  const now = 1_000_000;
  const session = issueTokenSession(1, now);

  assert.equal(session.expiresAt - session.issuedAt, TOKEN_LIFETIME_MS);
  assert.equal(isTokenValid(session, now + TOKEN_LIFETIME_MS - 1), true);
  assert.equal(isTokenValid(session, now + TOKEN_LIFETIME_MS), false);
});

test("süresi dolan erişim tokenını yeniler", () => {
  const session = issueTokenSession(1, 1_000);
  const refreshed = refreshTokenSession(session, 1_000 + TOKEN_LIFETIME_MS);

  assert.notEqual(refreshed.accessToken, session.accessToken);
  assert.equal(refreshed.refreshToken, session.refreshToken);
  assert.equal(refreshed.refreshCount, 1);
  assert.equal(isTokenValid(refreshed, refreshed.issuedAt), true);
});

test("refresh token olmadan yenileme yapmaz", () => {
  assert.equal(refreshTokenSession({ accessToken: "access" }), null);
});
