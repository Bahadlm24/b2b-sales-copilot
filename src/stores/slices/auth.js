import { isTokenValid, issueTokenSession, refreshTokenSession } from "../../services/tokenService.js";
import { t } from "../../i18n/localeStore.js";

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
          { id: null, name: normalizedUsername || t("store.anonymous") },
          { statusCode: 401, message: t("store.invalidCredentialsAudit") },
        );
        return { ok: false, message: t("store.invalidCredentials") };
      }
      if (!user.active) {
        audit(
          "auth.login_blocked",
          "session",
          null,
          { username: normalizedUsername },
          "failed",
          { id: user.id, name: user.name },
          { statusCode: 403, message: t("store.inactiveAudit") },
        );
        return { ok: false, message: t("store.inactiveUser") };
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
        { statusCode: 200, message: t("store.loginOk") },
      );
      return { ok: true, user };
    },
    logout() {
      audit("auth.logout", "session", null, {}, "success", null, { statusCode: 200, message: t("store.logoutOk") });
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
      return token ? `${token.slice(0, 14)}••••••••` : t("store.noToken");
    },
    requestPasswordReminder(email) {
      const normalizedEmail = email.trim().toLowerCase();
      const user = state.users.find((item) => item.email.toLowerCase() === normalizedEmail && item.active);
      if (user) {
        state.mailOutbox.unshift({
          id: nextLocalId(),
          to: user.email,
          subject: t("store.mailSubject", { product: state.organization.productName }),
          message: t("store.mailBody", { name: user.name, username: user.username, password: user.password }),
          createdAt: new Date().toISOString(),
        });
        audit(
          "mail.queued",
          "mail",
          state.mailOutbox[0].id,
          { to: user.email, subject: t("store.mailSubject", { product: state.organization.productName }) },
          "success",
          null,
          { statusCode: 202, message: t("store.mailQueued") },
        );
        persist();
      }
      audit(
        "auth.password_reminder_requested",
        "session",
        null,
        { email: normalizedEmail, accountMatched: Boolean(user) },
        "success",
        user || { id: null, name: t("store.anonymous") },
        { statusCode: 202, message: t("store.reminderAudit") },
      );
      return { ok: true, message: t("store.reminderOk") };
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
