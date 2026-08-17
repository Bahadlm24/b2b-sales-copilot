import { t } from "../../i18n/localeStore.js";
import { permissionCatalog } from "../../services/authorization.js";

export function createDirectorySlice({ state, persist, nextLocalId, changeDetails, audit }) {
  return {
    addUser(user) {
      const normalizedEmail = user.email.trim().toLowerCase();
      const normalizedUsername = user.username.trim().toLowerCase();
      if (state.users.some((item) => item.email.toLowerCase() === normalizedEmail)) {
        return { ok: false, message: t("store.emailInUse") };
      }
      if (state.users.some((item) => item.username.toLowerCase() === normalizedUsername)) {
        return { ok: false, message: t("store.usernameInUse") };
      }
      state.users.push({
        ...user,
        id: nextLocalId(),
        username: normalizedUsername,
        email: normalizedEmail,
        departmentId: user.departmentId || null,
        teamId: user.teamId || null,
        permissions: [...(state.roleDefinitions.find((role) => role.key === user.role)?.permissions || [])],
        active: true,
      });
      audit("user.created", "user", state.users.at(-1).id, { username: normalizedUsername, role: user.role });
      persist();
      return { ok: true };
    },
    updateUserRole(id, role) {
      const user = state.users.find((item) => item.id === id);
      if (user) {
        const before = { role: user.role, permissions: [...(user.permissions || [])] };
        user.role = role;
        user.permissions = [...(state.roleDefinitions.find((item) => item.key === role)?.permissions || [])];
        audit("user.role_changed", "user", id, changeDetails(before, { role: user.role, permissions: [...user.permissions] }));
        persist();
      }
    },
    toggleUserStatus(id) {
      const user = state.users.find((item) => item.id === id);
      if (user && user.id !== state.currentUserId) {
        const before = { active: user.active };
        user.active = !user.active;
        audit("user.status_changed", "user", id, changeDetails(before, { active: user.active }));
        persist();
      }
    },
    removeUser(id) {
      if (id === state.currentUserId) return false;
      state.users = state.users.filter((item) => item.id !== id);
      audit("user.deleted", "user", id);
      persist();
      return true;
    },
    toggleUserPermission(userId, permission) {
      if (!permissionCatalog.some((item) => item.key === permission)) return;
      const user = state.users.find((item) => item.id === Number(userId));
      if (!user) return;
      const before = { permissions: [...(user.permissions || [])] };
      const permissions = new Set(user.permissions || []);
      if (permissions.has(permission)) permissions.delete(permission);
      else permissions.add(permission);
      user.permissions = [...permissions];
      audit("permission.user_changed", "user", user.id, {
        permission,
        enabled: permissions.has(permission),
        ...changeDetails(before, { permissions: [...user.permissions] }),
      });
      persist();
    },
    updateUserOrganization(userId, departmentId, teamId) {
      const user = state.users.find((item) => item.id === Number(userId));
      if (!user) return;
      const before = { departmentId: user.departmentId, teamId: user.teamId };
      user.departmentId = departmentId ? Number(departmentId) : null;
      user.teamId = teamId ? Number(teamId) : null;
      audit("user.organization_changed", "user", user.id, changeDetails(before, { departmentId: user.departmentId, teamId: user.teamId }));
      persist();
    },
    addDepartment(name) {
      const cleanName = name.trim();
      if (!cleanName || state.departments.some((item) => item.name.toLocaleLowerCase("tr-TR") === cleanName.toLocaleLowerCase("tr-TR"))) return false;
      state.departments.push({ id: nextLocalId(), name: cleanName });
      audit("department.created", "department", state.departments.at(-1).id, { name: cleanName });
      persist();
      return true;
    },
    removeDepartment(id) {
      if (state.users.some((user) => user.departmentId === id) || state.teams.some((team) => team.departmentId === id)) return false;
      state.departments = state.departments.filter((item) => item.id !== id);
      audit("department.deleted", "department", id);
      persist();
      return true;
    },
    addTeam(name, departmentId) {
      const cleanName = name.trim();
      if (!cleanName || !departmentId) return false;
      state.teams.push({ id: nextLocalId(), name: cleanName, departmentId: Number(departmentId) });
      audit("team.created", "team", state.teams.at(-1).id, { name: cleanName, departmentId: Number(departmentId) });
      persist();
      return true;
    },
    removeTeam(id) {
      if (state.users.some((user) => user.teamId === id)) return false;
      state.teams = state.teams.filter((item) => item.id !== id);
      audit("team.deleted", "team", id);
      persist();
      return true;
    },
    addRole(label) {
      const cleanLabel = label.trim();
      if (!cleanLabel || state.roleDefinitions.some((role) => role.label.toLocaleLowerCase("tr-TR") === cleanLabel.toLocaleLowerCase("tr-TR"))) return false;
      state.roleDefinitions.push({
        key: `role_${Date.now()}`,
        label: cleanLabel,
        permissions: ["dashboard"],
      });
      audit("role.created", "role", state.roleDefinitions.at(-1).key, { label: cleanLabel });
      persist();
      return true;
    },
    removeRole(roleKey) {
      if (state.users.some((user) => user.role === roleKey)) return false;
      state.roleDefinitions = state.roleDefinitions.filter((role) => role.key !== roleKey);
      audit("role.deleted", "role", roleKey);
      persist();
      return true;
    },
    toggleRolePermission(roleKey, permission) {
      if (!permissionCatalog.some((item) => item.key === permission)) return;
      const role = state.roleDefinitions.find((item) => item.key === roleKey);
      if (!role) return;
      const before = { permissions: [...(role.permissions || [])] };
      const permissions = new Set(role.permissions || []);
      if (permissions.has(permission)) permissions.delete(permission);
      else permissions.add(permission);
      role.permissions = [...permissions];
      audit("permission.role_changed", "role", roleKey, {
        permission,
        enabled: permissions.has(permission),
        ...changeDetails(before, { permissions: [...role.permissions] }),
      });
      persist();
    },
  };
}
