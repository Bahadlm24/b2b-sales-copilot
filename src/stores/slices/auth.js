import { isTokenValid, issueTokenSession, refreshTokenSession } from "../../services/tokenService.js";

export function createAuthSlice({ state, persist, nextLocalId, audit }) {
  return {
    login(username, password) {
      const normalizedUsername = username.trim().toLowerCase();
      const user = state.users.find((item) => item.username.toLowerCase() === normalizedUsername);
      if (!user || user.password !== password) {
        audit(
          "auth.login_failed",
          "session",
          null,
          { username: normalizedUsername },
          "failed",
          { id: null, name: normalizedUsername || "Anonim" },
          { statusCode: 401, message: "Kullanıcı adı veya şifre hatalı" },
        );
        return { ok: false, message: "Kullanıcı adı veya şifre hatalı." };
      }
      if (!user.active) {
        audit(
          "auth.login_blocked",
          "session",
          null,
          { username: normalizedUsername },
          "failed",
          { id: user.id, name: user.name },
          { statusCode: 403, message: "Kullanıcı hesabı pasif" },
        );
        return { ok: false, message: "Bu kullanıcı hesabı pasif durumda." };
      }
      state.currentUserId = user.id;
      state.isAuthenticated = true;
      state.tokenSession = issueTokenSession(user.id);
      audit(
        "auth.login",
        "session",
        null,
        { tokenExpiresAt: state.tokenSession.expiresAt },
        "success",
        user,
        { statusCode: 200, message: "Giriş başarılı" },
      );
      return { ok: true, user };
    },
    logout() {
      audit("auth.logout", "session", null, {}, "success", null, { statusCode: 200, message: "Çıkış başarılı" });
      state.isAuthenticated = false;
      state.tokenSession = null;
    },
    ensureToken(now = Date.now()) {
      if (!state.isAuthenticated || !state.tokenSession?.refreshToken) return false;
      if (!isTokenValid(state.tokenSession, now)) {
        state.tokenSession = refreshTokenSession(state.tokenSession, now);
        audit("auth.token_refreshed", "session", null, { expiresAt: state.tokenSession?.expiresAt });
      }
      return isTokenValid(state.tokenSession, now);
    },
    tokenPreview() {
      const token = state.tokenSession?.accessToken;
      return token ? `${token.slice(0, 14)}••••••••` : "Token yok";
    },
    requestPasswordReminder(email) {
      const normalizedEmail = email.trim().toLowerCase();
      const user = state.users.find((item) => item.email.toLowerCase() === normalizedEmail && item.active);
      if (user) {
        state.mailOutbox.unshift({
          id: nextLocalId(),
          to: user.email,
          subject: `${state.organization.productName} giriş bilgisi`,
          message: `Merhaba ${user.name}, kullanıcı adınız: ${user.username}. Geçici mock şifreniz: ${user.password}`,
          createdAt: new Date().toISOString(),
        });
        audit(
          "mail.queued",
          "mail",
          state.mailOutbox[0].id,
          { to: user.email, subject: `${state.organization.productName} giriş bilgisi` },
          "success",
          null,
          { statusCode: 202, message: "E-posta kuyruğa alındı" },
        );
        persist();
      }
      audit(
        "auth.password_reminder_requested",
        "session",
        null,
        { email: normalizedEmail, accountMatched: Boolean(user) },
        "success",
        user || { id: null, name: "Anonim" },
        { statusCode: 202, message: "Şifre hatırlatma isteği alındı" },
      );
      return { ok: true, message: "Adres sistemde kayıtlıysa giriş bilgisi e-posta kuyruğuna eklendi." };
    },
    switchUser(id) {
      const user = state.users.find((item) => item.id === Number(id) && item.active);
      if (user) {
        state.currentUserId = user.id;
        persist();
      }
    },
  };
}
