import { reactive } from "vue";
import { resolveApiBaseUrl } from "../config/appConfig.js";
import { inboundSources } from "../services/inboundLeadService.js";
import { loadPersistedState } from "./persistence.js";
import {
  customers,
  defaultActivities,
  defaultDepartments,
  defaultLeads,
  defaultMeetingJourneys,
  defaultOffers,
  defaultProductUpdates,
  defaultRoleDefinitions,
  defaultRoles,
  defaultSyncSettings,
  defaultTasks,
  defaultTeams,
  defaultUsers,
} from "../data/seed.js";

function migrateTasks(saved) {
  return (Array.isArray(saved.tasks) ? saved.tasks : defaultTasks).map((task) => ({
    ...task,
    status: task.status || (task.completed ? "Tamamlandı" : "Bekliyor"),
    completed: task.status ? task.status === "Tamamlandı" : Boolean(task.completed),
    ownerId: task.ownerId || 2,
  }));
}

function migrateRoleDefinitions(saved) {
  return (Array.isArray(saved.roleDefinitions) && saved.roleDefinitions.length
    ? saved.roleDefinitions
    : defaultRoleDefinitions).map((role) => ({
      ...role,
      permissions: role.key === "admin" && !role.permissions.includes("audit")
        ? [...role.permissions, "audit"]
        : role.permissions,
    }));
}

function migrateUsers(saved) {
  return (Array.isArray(saved.users) ? saved.users : defaultUsers)
    .map((user) => {
      const fallback = defaultUsers.find((item) => item.id === user.id);
      const permissions = Array.isArray(user.permissions) ? [...user.permissions] : [...(defaultRoles[user.role]?.permissions || [])];
      if (user.role === "admin" && !permissions.includes("audit")) permissions.push("audit");
      return {
        ...user,
        username: user.username || fallback?.username || user.email?.split("@")[0],
        password: user.password || fallback?.password || "1234",
        departmentId: user.departmentId || fallback?.departmentId || null,
        teamId: user.teamId || fallback?.teamId || null,
        permissions,
      };
    });
}

function defaultInboundSources() {
  return Object.fromEntries(Object.keys(inboundSources).map((key) => [key, { enabled: true, token: `mock_${key}_change_me`, received: 0, lastReceivedAt: null }]));
}

export function createInitialState() {
  const saved = loadPersistedState();
  return reactive({
    customers: (Array.isArray(saved.customers) ? saved.customers : customers).map((item) => ({ archived: false, ownerId: 2, ...item })),
    tasks: migrateTasks(saved),
    meetings: Array.isArray(saved.meetings) ? saved.meetings : [],
    users: migrateUsers(saved),
    currentUserId: saved.currentUserId || 1,
    isAuthenticated: false,
    mailOutbox: Array.isArray(saved.mailOutbox) ? saved.mailOutbox : [],
    leads: (Array.isArray(saved.leads) ? saved.leads : defaultLeads).map((item) => ({ ownerId: 3, convertedCustomerId: null, archived: false, disqualificationReason: "", ...item })),
    departments: Array.isArray(saved.departments) ? saved.departments : defaultDepartments,
    teams: Array.isArray(saved.teams) ? saved.teams : defaultTeams,
    tokenSession: null,
    roleDefinitions: migrateRoleDefinitions(saved),
    auditLogs: Array.isArray(saved.auditLogs) ? saved.auditLogs : [],
    syncSettings: {
      ...defaultSyncSettings,
      ...(saved.syncSettings || {}),
      sources: Array.isArray(saved.syncSettings?.sources) ? saved.syncSettings.sources : defaultSyncSettings.sources,
    },
    activities: Array.isArray(saved.activities) ? saved.activities : defaultActivities,
    offers: (Array.isArray(saved.offers) ? saved.offers : defaultOffers).map((item) => ({ ownerId: 2, outcomeReason: "", revisions: [], archived: false, cancelled: false, ...item })),
    meetingJourneys: Array.isArray(saved.meetingJourneys) ? saved.meetingJourneys : defaultMeetingJourneys,
    organization: { id: "local-demo", name: "Demo Firma", productName: "Sales Copilot", brandMark: "S", plan: "local", ...(saved.organization || {}) },
    productUpdates: Array.isArray(saved.productUpdates) ? saved.productUpdates : defaultProductUpdates,
    readProductUpdates: Array.isArray(saved.readProductUpdates) ? saved.readProductUpdates : [],
    inboundSettings: {
      baseUrl: resolveApiBaseUrl(),
      sources: defaultInboundSources(),
      logs: [],
      ...(saved.inboundSettings || {}),
      sources: { ...defaultInboundSources(), ...(saved.inboundSettings?.sources || {}) },
    },
    liveMeetingSessions: Array.isArray(saved.liveMeetingSessions) ? saved.liveMeetingSessions : [],
    clientContext: {
      ipAddress: "127.0.0.1",
      userAgent: "local-mock",
    },
  });
}
