import { computed, reactive } from "vue";
import { customers, offers as defaultOffers } from "../data/mockData.js";
import { permissionCatalog, roles as defaultRoles } from "../services/authorization.js";
import { formatPhoneNumber } from "../services/phoneFormatter.js";
import { isTokenValid, issueTokenSession, refreshTokenSession } from "../services/tokenService.js";
import { createAuditEntry } from "../services/auditLogger.js";
import { isSyncDue, nextSyncTime } from "../services/syncScheduler.js";
import { analyzeConversation, analyzeTranscript } from "../services/meetingAnalyzer.js";
import { inboundSources, normalizeInboundLead } from "../services/inboundLeadService.js";

const STORAGE_KEY = "sales-copilot-state-v1";
let lastGeneratedId = Date.now();
function nextLocalId() {
  lastGeneratedId = Math.max(Date.now(), lastGeneratedId + 1);
  return lastGeneratedId;
}
const defaultTasks = [
  { id: 1, customerId: 1, title: "Revize teklif kapsamını paylaş", dueDate: "2026-08-03", priority: "Yüksek", completed: false },
  { id: 2, customerId: 3, title: "Karar verici toplantısını planla", dueDate: "2026-08-05", priority: "Yüksek", completed: false },
  { id: 3, customerId: 4, title: "Finans entegrasyonu dokümanını gönder", dueDate: "2026-08-07", priority: "Orta", completed: false },
  { id: 4, customerId: 2, title: "İhtiyaç analizi notlarını tamamla", dueDate: "2026-08-08", priority: "Düşük", completed: true },
];
const defaultUsers = [
  { id: 1, username: "admin", password: "1234", name: "Bahadır Perveli", email: "admin@salescopilot.local", role: "admin", departmentId: 1, teamId: 1, active: true },
  { id: 2, username: "elif", password: "1234", name: "Elif Demir", email: "elif@salescopilot.local", role: "manager", departmentId: 1, teamId: 1, active: true },
  { id: 3, username: "kerem", password: "1234", name: "Kerem Aydın", email: "kerem@salescopilot.local", role: "representative", departmentId: 1, teamId: 2, active: true },
  { id: 4, username: "zeynep", password: "1234", name: "Zeynep Şahin", email: "zeynep@salescopilot.local", role: "analyst", departmentId: 2, teamId: 3, active: true },
];
const defaultDepartments = [{ id: 1, name: "Satış" }, { id: 2, name: "Satış Operasyonları" }];
const defaultTeams = [
  { id: 1, departmentId: 1, name: "Kurumsal Satış" },
  { id: 2, departmentId: 1, name: "Yeni Müşteri Kazanımı" },
  { id: 3, departmentId: 2, name: "Raporlama ve Analiz" },
];
const defaultRoleDefinitions = Object.entries(defaultRoles).map(([key, role]) => ({
  key,
  label: role.label,
  permissions: [...role.permissions],
}));
const defaultLeads = [
  { id: 1, name: "Ayşe Yılmaz", company: "Rota Perakende", phone: "+90 530 505 66 48", email: "ayse@rotaperakende.com", source: "Facebook", campaign: "Q3 Dönüşüm Formu", status: "Yeni", score: 72, createdAt: "2026-07-30T08:25:00.000Z" },
  { id: 2, name: "John Miller", company: "Northstar GmbH", phone: "+49 151 23456789", email: "john@northstar.de", source: "Instagram", campaign: "EU Growth", status: "İletişime geçildi", score: 64, createdAt: "2026-07-29T13:10:00.000Z" },
  { id: 3, name: "Deniz Arslan", company: "Arslan Makine", phone: "+90 532 444 21 09", email: "deniz@arslanmakine.com", source: "Web Form", campaign: "Demo Talebi", status: "Nitelikli", score: 86, createdAt: "2026-07-29T09:40:00.000Z" },
  { id: 4, name: "Melis Kaya", company: "Kaya Yapı", phone: "+90 212 555 10 90", email: "melis@kayayapi.com", source: "Google Ads", campaign: "Kurumsal Yazılım", status: "Yeni", score: 58, createdAt: "2026-07-28T15:05:00.000Z" },
];
const defaultSyncSettings = {
  frequency: "hourly",
  enabled: true,
  lastSyncAt: null,
  nextSyncAt: nextSyncTime("hourly"),
  sources: ["Meta", "Instagram", "Google Ads", "Web Form"],
};
const defaultActivities = [
  { id: 1, entityType: "customer", entityId: 1, actorId: 2, actorName: "Elif Demir", type: "meeting", title: "İhtiyaç analizi görüşmesi yapıldı", description: "Entegrasyon ve geçiş planı konuşuldu.", createdAt: "2026-07-28T11:30:00.000Z" },
  { id: 2, entityType: "customer", entityId: 1, actorId: 1, actorName: "Bahadır Perveli", type: "offer", title: "Teklif revizyonu istendi", description: "Entegrasyon ve eğitim kapsamı güncellenecek.", createdAt: "2026-07-29T09:15:00.000Z" },
  { id: 3, entityType: "lead", entityId: 1, actorId: 3, actorName: "Kerem Aydın", type: "call", title: "İlk arama yapıldı", description: "Karar verici bilgisi alındı, demo talep edildi.", createdAt: "2026-07-30T10:05:00.000Z" },
];
const defaultMeetingJourneys = [
  { id: 101, entityType: "lead", entityId: 3, ownerId: 3, status: "Görüşme planlandı", round: 1, scheduledAt: "2026-08-04T10:00", result: "", notes: "Demo ve ihtiyaç analizi", history: [{ status: "Görüşme planlandı", at: "2026-08-01T09:00:00.000Z", round: 1 }] },
  { id: 102, entityType: "customer", entityId: 1, ownerId: 2, status: "Tekrar görüşme planlandı", round: 2, scheduledAt: "2026-08-05T14:30", result: "", notes: "Karar verici ve entegrasyon kapsamı", history: [{ status: "Görüşme sağlandı", at: "2026-07-28T11:30:00.000Z", round: 1 }, { status: "Tekrar görüşme planlandı", at: "2026-07-29T09:15:00.000Z", round: 2 }] },
];
const defaultProductUpdates = [
  { id: "0.6.0", version: "0.6.0", title: "Meet, Teams ve Zoom desteği", message: "Toplantı eklentisi çoklu platform ve otomatik başlatma desteği kazandı.", publishedAt: "2026-08-02T12:00:00.000Z" },
];

function loadState() {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

const saved = loadState();
const migratedTasks = (Array.isArray(saved.tasks) ? saved.tasks : defaultTasks).map((task) => ({
  ...task,
  status: task.status || (task.completed ? "Tamamlandı" : "Bekliyor"),
  completed: task.status ? task.status === "Tamamlandı" : Boolean(task.completed),
  ownerId: task.ownerId || 2,
}));
const migratedRoleDefinitions = (Array.isArray(saved.roleDefinitions) && saved.roleDefinitions.length
  ? saved.roleDefinitions
  : defaultRoleDefinitions).map((role) => ({
    ...role,
    permissions: role.key === "admin" && !role.permissions.includes("audit")
      ? [...role.permissions, "audit"]
      : role.permissions,
  }));
const migratedUsers = (Array.isArray(saved.users) ? saved.users : defaultUsers)
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
const state = reactive({
  customers: (Array.isArray(saved.customers) ? saved.customers : customers).map((item) => ({ archived: false, ownerId: 2, ...item })),
  tasks: migratedTasks,
  meetings: Array.isArray(saved.meetings) ? saved.meetings : [],
  users: migratedUsers,
  currentUserId: saved.currentUserId || 1,
  isAuthenticated: false,
  mailOutbox: Array.isArray(saved.mailOutbox) ? saved.mailOutbox : [],
  leads: (Array.isArray(saved.leads) ? saved.leads : defaultLeads).map((item) => ({ ownerId: 3, convertedCustomerId: null, archived: false, disqualificationReason: "", ...item })),
  departments: Array.isArray(saved.departments) ? saved.departments : defaultDepartments,
  teams: Array.isArray(saved.teams) ? saved.teams : defaultTeams,
  tokenSession: null,
  roleDefinitions: migratedRoleDefinitions,
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
    baseUrl: "http://localhost:3000/api",
    sources: Object.fromEntries(Object.keys(inboundSources).map((key) => [key, { enabled: true, token: `mock_${key}_change_me`, received: 0, lastReceivedAt: null }])),
    logs: [],
    ...(saved.inboundSettings || {}),
    sources: { ...Object.fromEntries(Object.keys(inboundSources).map((key) => [key, { enabled: true, token: `mock_${key}_change_me`, received: 0, lastReceivedAt: null }])), ...(saved.inboundSettings?.sources || {}) },
  },
  liveMeetingSessions: Array.isArray(saved.liveMeetingSessions) ? saved.liveMeetingSessions : [],
  clientContext: {
    ipAddress: "127.0.0.1",
    userAgent: "local-mock",
  },
});

function persist() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    tasks: state.tasks,
    customers: state.customers,
    meetings: state.meetings,
    users: state.users,
    currentUserId: state.currentUserId,
    mailOutbox: state.mailOutbox,
    leads: state.leads,
    departments: state.departments,
    teams: state.teams,
    roleDefinitions: state.roleDefinitions,
    auditLogs: state.auditLogs,
    syncSettings: state.syncSettings,
    activities: state.activities,
    offers: state.offers,
    meetingJourneys: state.meetingJourneys,
    organization: state.organization,
    productUpdates: state.productUpdates,
    readProductUpdates: state.readProductUpdates,
    inboundSettings: state.inboundSettings,
    liveMeetingSessions: state.liveMeetingSessions,
  }));
}

function audit(
  action,
  resource,
  resourceId = null,
  details = {},
  status = "success",
  actor = null,
  response = null,
) {
  const currentUser = state.users.find((user) => user.id === state.currentUserId);
  state.auditLogs.unshift(createAuditEntry({
    actorId: actor?.id ?? currentUser?.id ?? null,
    actorName: actor?.name ?? currentUser?.name ?? "Sistem",
    action,
    resource,
    resourceId,
    status,
    details,
    ipAddress: state.clientContext.ipAddress,
    userAgent: state.clientContext.userAgent,
    response: response || {
      statusCode: status === "success" ? 200 : 400,
      message: status === "success" ? "İşlem başarılı" : "İşlem başarısız",
    },
  }));
  if (state.auditLogs.length > 2000) state.auditLogs.length = 2000;
  persist();
}

function recordActivity(entityType, entityId, type, title, description = "") {
  const currentUser = state.users.find((user) => user.id === state.currentUserId);
  const activity = {
    id: nextLocalId(),
    entityType,
    entityId: Number(entityId),
    actorId: currentUser?.id ?? null,
    actorName: currentUser?.name ?? "Sistem",
    type,
    title,
    description,
    createdAt: new Date().toISOString(),
  };
  state.activities.unshift(activity);
  if (entityType === "customer") {
    const customer = state.customers.find((item) => item.id === Number(entityId));
    if (customer) {
      const now = new Date();
      customer.lastContactDate = now.toISOString().slice(0, 10);
      customer.lastContact = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    }
  }
  return activity;
}

function changeDetails(before, after) {
  const changedFields = Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
  return { changedFields, before, after };
}

export const salesStore = {
  state,
  customers: state.customers,
  offers: state.offers,
  openTasks: computed(() => state.tasks.filter((task) => !task.completed)),
  completedTasks: computed(() => state.tasks.filter((task) => task.completed)),
  activeOffers: computed(() => state.offers.filter((offer) => !offer.archived && !offer.cancelled && !["Kazanıldı", "Kaybedildi"].includes(offer.status))),
  pipelineValue: computed(() => state.offers.filter((offer) => !offer.archived && !offer.cancelled && !["Kazanıldı", "Kaybedildi"].includes(offer.status)).reduce((sum, offer) => sum + offer.numericAmount, 0)),
  weightedPipeline: computed(() => state.offers.filter((offer) => !offer.archived && !offer.cancelled && !["Kazanıldı", "Kaybedildi"].includes(offer.status)).reduce((sum, offer) => sum + offer.numericAmount * offer.probability / 100, 0)),
  wonRevenue: computed(() => state.offers.filter((offer) => !offer.archived && offer.status === "Kazanıldı").reduce((sum, offer) => sum + offer.numericAmount, 0)),
  currentUser: computed(() => state.users.find((user) => user.id === state.currentUserId) || state.users[0]),
  isAuthenticated: computed(() => state.isAuthenticated && Boolean(state.tokenSession?.accessToken)),
  can(permission) {
    const user = state.users.find((item) => item.id === state.currentUserId);
    return Boolean(user?.active && user.permissions?.includes(permission));
  },
  roleLabel(roleKey) {
    return state.roleDefinitions.find((role) => role.key === roleKey)?.label || "Tanımsız rol";
  },
  setClientContext(context) {
    state.clientContext = {
      ipAddress: context.ipAddress || "127.0.0.1",
      userAgent: context.userAgent || "local-mock",
    };
  },
  customerName(customerId) {
    return state.customers.find((customer) => customer.id === Number(customerId))?.name || "Bilinmeyen müşteri";
  },
  userName(userId) {
    return state.users.find((user) => user.id === Number(userId))?.name || "Atanmamış";
  },
  journeyEntityName(journey) {
    return journey.entityType === "lead"
      ? state.leads.find((item) => item.id === Number(journey.entityId))?.company || state.leads.find((item) => item.id === Number(journey.entityId))?.name || "Bilinmeyen lead"
      : this.customerName(journey.entityId);
  },
  createMeetingJourney(data) {
    if (!data.entityId || !data.scheduledAt) return { ok: false, message: "Kayıt ve toplantı tarihi zorunludur." };
    const record = {
      id: nextLocalId(), entityType: data.entityType === "lead" ? "lead" : "customer",
      entityId: Number(data.entityId), ownerId: Number(data.ownerId) || state.currentUserId,
      status: "Görüşme planlandı", round: 1, scheduledAt: data.scheduledAt,
      result: "", notes: data.notes?.trim() || "", createdAt: new Date().toISOString(),
      history: [{ status: "Görüşme planlandı", at: new Date().toISOString(), round: 1 }],
    };
    state.meetingJourneys.unshift(record);
    recordActivity(record.entityType, record.entityId, "meeting", "Görüşme planlandı", `${record.scheduledAt} · ${record.notes}`);
    audit("meeting_journey.created", "meeting_journey", record.id, { entityType: record.entityType, entityId: record.entityId, ownerId: record.ownerId });
    persist();
    return { ok: true, journey: record };
  },
  updateMeetingJourney(id, changes) {
    const journey = state.meetingJourneys.find((item) => item.id === Number(id));
    if (!journey) return { ok: false, message: "Takip kaydı bulunamadı." };
    const before = { status: journey.status, scheduledAt: journey.scheduledAt, result: journey.result, notes: journey.notes, ownerId: journey.ownerId, round: journey.round };
    const nextStatus = changes.status || journey.status;
    if (["Olumlu", "Olumsuz"].includes(nextStatus) && !changes.result?.trim() && !journey.result?.trim()) return { ok: false, message: "Nihai karar için sonuç açıklaması zorunludur." };
    if (nextStatus === "Tekrar görüşme planlandı" && !changes.scheduledAt) return { ok: false, message: "Yeni toplantı tarihi zorunludur." };
    if (nextStatus === "Tekrar görüşme planlandı" && journey.status !== "Tekrar görüşme planlandı") journey.round += 1;
    Object.assign(journey, {
      status: nextStatus,
      scheduledAt: changes.scheduledAt ?? journey.scheduledAt,
      result: changes.result?.trim() ?? journey.result,
      notes: changes.notes?.trim() ?? journey.notes,
      ownerId: Number(changes.ownerId) || journey.ownerId,
      updatedAt: new Date().toISOString(),
    });
    journey.history ||= [];
    journey.history.push({ status: journey.status, at: journey.updatedAt, round: journey.round, result: journey.result });
    recordActivity(journey.entityType, journey.entityId, "meeting", `Toplantı takibi: ${journey.status}`, journey.result || journey.notes);
    audit("meeting_journey.updated", "meeting_journey", journey.id, changeDetails(before, { status: journey.status, scheduledAt: journey.scheduledAt, result: journey.result, notes: journey.notes, ownerId: journey.ownerId, round: journey.round }));
    persist();
    return { ok: true, journey };
  },
  linkJourneyToCustomer(id, customerId) {
    const journey = state.meetingJourneys.find((item) => item.id === Number(id));
    if (!journey || journey.entityType !== "lead") return false;
    const before = { entityType: journey.entityType, entityId: journey.entityId };
    journey.sourceLeadId = journey.entityId;
    journey.entityType = "customer";
    journey.entityId = Number(customerId);
    audit("meeting_journey.converted", "meeting_journey", journey.id, changeDetails(before, { entityType: journey.entityType, entityId: journey.entityId }));
    persist();
    return true;
  },
  markProductUpdateRead(version) {
    if (!state.readProductUpdates.includes(version)) state.readProductUpdates.push(version);
    persist();
  },
  updateOrganizationBranding(changes) {
    const name = changes.name?.trim();
    const productName = changes.productName?.trim();
    const brandMark = changes.brandMark?.trim().slice(0, 3).toLocaleUpperCase("tr-TR");
    if (!name || !productName || !brandMark) return { ok: false, message: "Firma adı, ürün adı ve logo harfi zorunludur." };
    const before = { name: state.organization.name, productName: state.organization.productName, brandMark: state.organization.brandMark };
    Object.assign(state.organization, { name, productName, brandMark });
    audit("organization.branding_updated", "organization", state.organization.id, changeDetails(before, { name, productName, brandMark }));
    persist();
    return { ok: true, message: "Firma ve ürün görünümü güncellendi." };
  },
  setInboundBaseUrl(url) {
    if (!/^https?:\/\//i.test(url)) return false;
    state.inboundSettings.baseUrl = url.replace(/\/$/, "");
    audit("integration.base_url_updated", "integration", null, { baseUrl: state.inboundSettings.baseUrl });
    persist();
    return true;
  },
  toggleInboundSource(sourceKey, enabled) {
    const source = state.inboundSettings.sources[sourceKey];
    if (!source) return false;
    source.enabled = Boolean(enabled);
    audit("integration.source_toggled", "integration", sourceKey, { enabled: source.enabled });
    persist();
    return true;
  },
  rotateInboundToken(sourceKey) {
    const source = state.inboundSettings.sources[sourceKey];
    if (!source) return null;
    source.token = `wh_${sourceKey}_${crypto.randomUUID().replaceAll("-", "")}`;
    audit("integration.token_rotated", "integration", sourceKey, { rotated: true });
    persist();
    return source.token;
  },
  receiveInboundLead(sourceKey, payload, token) {
    const config = state.inboundSettings.sources[sourceKey];
    const receivedAt = new Date().toISOString();
    const log = { id: nextLocalId(), sourceKey, receivedAt, status: "rejected", message: "", externalLeadId: payload?.lead_id || payload?.id || null };
    if (!config?.enabled) log.message = "Kaynak bağlantısı pasif.";
    else if (token !== config.token) log.message = "Webhook anahtarı geçersiz.";
    else {
      const lead = normalizeInboundLead(sourceKey, payload);
      const phone = formatPhoneNumber(lead?.phone);
      if (!phone) log.message = "Telefon alanı zorunludur.";
      else if (state.leads.some((item) => formatPhoneNumber(item.phone) === phone) || state.customers.some((item) => formatPhoneNumber(item.phone) === phone)) log.message = "Bu telefon numarası zaten kayıtlı; mükerrer data alınmadı.";
      else {
        const record = this.addLead({ ...lead, phone });
        record.inboundReceivedAt = receivedAt;
        record.externalLeadId = lead.externalLeadId;
        config.received += 1;
        config.lastReceivedAt = receivedAt;
        log.status = "accepted";
        log.message = "Lead havuzuna eklendi.";
        log.leadId = record.id;
      }
    }
    state.inboundSettings.logs.unshift(log);
    if (state.inboundSettings.logs.length > 200) state.inboundSettings.logs.length = 200;
    audit("integration.webhook_received", "integration", sourceKey, { status: log.status, message: log.message, externalLeadId: log.externalLeadId }, log.status === "accepted" ? "success" : "failed");
    persist();
    return { ok: log.status === "accepted", message: log.message, log };
  },
  upsertLiveMeetingSession(session) {
    if (!session?.customerId || !Array.isArray(session.segments)) return false;
    const existing = state.liveMeetingSessions.find((item) => item.sessionId === session.sessionId);
    const record = { ...session, customerId: Number(session.customerId), updatedAt: session.updatedAt || new Date().toISOString() };
    if (existing) Object.assign(existing, record);
    else state.liveMeetingSessions.unshift(record);
    if (state.liveMeetingSessions.length > 20) state.liveMeetingSessions.length = 20;
    persist();
    return true;
  },
  activitiesFor(entityType, entityId) {
    return state.activities
      .filter((activity) => activity.entityType === entityType && activity.entityId === Number(entityId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  addTask(task) {
    const record = { ...task, id: nextLocalId(), ownerId: Number(task.ownerId) || state.currentUserId, status: "Bekliyor", completed: false };
    state.tasks.unshift(record);
    recordActivity("customer", record.customerId, "task", "Takip görevi oluşturuldu", record.title);
    audit("task.created", "task", record.id, { title: record.title });
    persist();
  },
  toggleTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (task) {
      const before = { status: task.status, completed: task.completed };
      task.completed = !task.completed;
      task.status = task.completed ? "Tamamlandı" : "Bekliyor";
      recordActivity("customer", task.customerId, "task", task.completed ? "Takip görevi tamamlandı" : "Takip görevi yeniden açıldı", task.title);
      audit("task.status_changed", "task", task.id, changeDetails(before, { status: task.status, completed: task.completed }));
      persist();
    }
  },
  updateTaskStatus(id, status) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task || !["Bekliyor", "Devam ediyor", "Tamamlandı"].includes(status)) return;
    const before = { status: task.status, completed: task.completed };
    task.status = status;
    task.completed = status === "Tamamlandı";
    recordActivity("customer", task.customerId, "task", "Görev aşaması güncellendi", `${task.title}: ${status}`);
    audit("task.status_changed", "task", task.id, changeDetails(before, { status: task.status, completed: task.completed }));
    persist();
  },
  updateTask(id, changes) {
    const task = state.tasks.find((item) => item.id === Number(id));
    if (!task || !changes.title?.trim() || !changes.dueDate) return false;
    const before = { title: task.title, dueDate: task.dueDate, priority: task.priority, ownerId: task.ownerId, customerId: task.customerId };
    Object.assign(task, {
      title: changes.title.trim(),
      dueDate: changes.dueDate,
      priority: changes.priority || task.priority,
      ownerId: Number(changes.ownerId) || task.ownerId || state.currentUserId,
      customerId: Number(changes.customerId) || task.customerId,
      updatedAt: new Date().toISOString(),
    });
    const after = { title: task.title, dueDate: task.dueDate, priority: task.priority, ownerId: task.ownerId, customerId: task.customerId };
    recordActivity("customer", task.customerId, "task", "Takip görevi güncellendi", task.title);
    audit("task.updated", "task", task.id, changeDetails(before, after));
    persist();
    return true;
  },
  removeTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    state.tasks = state.tasks.filter((item) => item.id !== id);
    if (task) recordActivity("customer", task.customerId, "task", "Takip görevi silindi", task.title);
    audit("task.deleted", "task", id);
    persist();
  },
  saveMeeting(meeting) {
    const record = {
      ...meeting,
      id: nextLocalId(),
      ownerId: Number(meeting.ownerId) || state.currentUserId,
      meetingDate: meeting.meetingDate || new Date().toISOString().slice(0, 16),
      createdAt: new Date().toISOString(),
    };
    state.meetings.unshift(record);
    recordActivity("customer", record.customerId, "meeting", "Toplantı analizi kaydedildi", `${record.wordCount} kelime ve ${record.insights?.length || 0} içgörü`);
    audit("meeting.analyzed", "meeting", record.id, { customerId: record.customerId, wordCount: record.wordCount });
    persist();
    return record;
  },
  updateMeeting(id, transcript) {
    const meeting = state.meetings.find((item) => item.id === id);
    if (!meeting || !transcript.trim()) return false;
    const before = { transcript: meeting.transcript, wordCount: meeting.wordCount };
    meeting.transcript = transcript.trim();
    meeting.wordCount = meeting.transcript.split(/\s+/).length;
    meeting.insights = analyzeTranscript(meeting.transcript);
    meeting.conversationAnalysis = analyzeConversation(meeting.transcript);
    meeting.updatedAt = new Date().toISOString();
    recordActivity("customer", meeting.customerId, "meeting", "Toplantı notu güncellendi", `${meeting.wordCount} kelime`);
    audit("meeting.updated", "meeting", id, changeDetails(before, { transcript: meeting.transcript, wordCount: meeting.wordCount, overallScore: meeting.conversationAnalysis.overallScore }));
    persist();
    return true;
  },
  deleteMeeting(id) {
    const meeting = state.meetings.find((item) => item.id === id);
    if (!meeting) return false;
    state.meetings = state.meetings.filter((item) => item.id !== id);
    recordActivity("customer", meeting.customerId, "meeting", "Toplantı kaydı silindi");
    audit("meeting.deleted", "meeting", id, { customerId: meeting.customerId });
    persist();
    return true;
  },
  addUser(user) {
    const normalizedEmail = user.email.trim().toLowerCase();
    const normalizedUsername = user.username.trim().toLowerCase();
    if (state.users.some((item) => item.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, message: "Bu e-posta adresi zaten kullanılıyor." };
    }
    if (state.users.some((item) => item.username.toLowerCase() === normalizedUsername)) {
      return { ok: false, message: "Bu kullanıcı adı zaten kullanılıyor." };
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
  switchUser(id) {
    const user = state.users.find((item) => item.id === Number(id) && item.active);
    if (user) {
      state.currentUserId = user.id;
      persist();
    }
  },
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
  addLead(lead) {
    const record = {
      ...lead,
      id: nextLocalId(),
      phone: formatPhoneNumber(lead.phone),
      score: Number(lead.score) || 50,
      status: "Yeni",
      ownerId: Number(lead.ownerId) || state.currentUserId,
      convertedCustomerId: null,
      createdAt: new Date().toISOString(),
    };
    state.leads.unshift(record);
    recordActivity("lead", record.id, "lead", "Potansiyel müşteri oluşturuldu", `${record.source} kaynağından eklendi`);
    audit("lead.created", "lead", record.id, { source: record.source, phone: record.phone });
    persist();
    return record;
  },
  addCustomer(customer) {
    const phone = formatPhoneNumber(customer.phone);
    if (!customer.name?.trim() || !phone) {
      return { ok: false, message: "Firma adı ve telefon zorunludur." };
    }
    if (state.customers.some((item) => formatPhoneNumber(item.phone) === phone)) {
      return { ok: false, message: "Bu telefon numarasıyla kayıtlı bir müşteri zaten var." };
    }
    const now = new Date();
    const name = customer.name.trim();
    const record = {
      id: nextLocalId(),
      name,
      initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toLocaleUpperCase("tr-TR"),
      contact: customer.contact?.trim() || "Yetkili belirtilmedi",
      role: customer.role?.trim() || "Görev belirtilmedi",
      stage: customer.stage || "İlk görüşme",
      score: Number(customer.score) || 50,
      lastContact: now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
      lastContactDate: now.toISOString().slice(0, 10),
      sector: customer.sector?.trim() || "Belirtilmedi",
      city: customer.city?.trim() || "Belirtilmedi",
      phone,
      email: customer.email?.trim() || "",
      revenue: customer.revenue?.trim() || "₺0",
      createdAt: now.toISOString(),
      ownerId: Number(customer.ownerId) || state.currentUserId,
      archived: false,
    };
    state.customers.unshift(record);
    recordActivity("customer", record.id, "customer", "Müşteri manuel olarak oluşturuldu", `${record.name} · ${record.phone}`);
    audit("customer.created", "customer", record.id, { name: record.name, phone: record.phone });
    persist();
    return { ok: true, customer: record };
  },
  updateCustomer(id, changes) {
    const customer = state.customers.find((item) => item.id === Number(id));
    if (!customer) return { ok: false, message: "Müşteri kaydı bulunamadı." };
    const name = changes.name?.trim();
    const phone = changes.phone ? formatPhoneNumber(changes.phone) : customer.phone;
    if (!name || !phone) return { ok: false, message: "Firma adı ve telefon zorunludur." };
    if (state.customers.some((item) => item.id !== customer.id && formatPhoneNumber(item.phone) === phone)) {
      return { ok: false, message: "Bu telefon numarası başka bir müşteride kayıtlı." };
    }
    const before = {
      name: customer.name,
      contact: customer.contact,
      role: customer.role,
      phone: customer.phone,
      email: customer.email,
      sector: customer.sector,
      city: customer.city,
      stage: customer.stage,
      score: customer.score,
      revenue: customer.revenue,
      ownerId: customer.ownerId,
    };
    Object.assign(customer, {
      name,
      initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toLocaleUpperCase("tr-TR"),
      contact: changes.contact?.trim() || "Yetkili belirtilmedi",
      role: changes.role?.trim() || "Görev belirtilmedi",
      phone,
      email: changes.email?.trim() || "",
      sector: changes.sector?.trim() || "Belirtilmedi",
      city: changes.city?.trim() || "Belirtilmedi",
      stage: changes.stage || customer.stage,
      score: Number(changes.score ?? customer.score),
      revenue: changes.revenue?.trim() || "₺0",
      ownerId: Number(changes.ownerId) || customer.ownerId || state.currentUserId,
      updatedAt: new Date().toISOString(),
    });
    const after = {
      name: customer.name,
      contact: customer.contact,
      role: customer.role,
      phone: customer.phone,
      email: customer.email,
      sector: customer.sector,
      city: customer.city,
      stage: customer.stage,
      score: customer.score,
      revenue: customer.revenue,
      ownerId: customer.ownerId,
    };
    const { changedFields } = changeDetails(before, after);
    if (!changedFields.length) return { ok: true, customer, unchanged: true };
    recordActivity("customer", customer.id, "customer", "Müşteri bilgileri güncellendi", changedFields.join(", "));
    audit("customer.updated", "customer", customer.id, {
      changedFields,
      before,
      after,
    });
    persist();
    return { ok: true, customer };
  },
  archiveCustomer(id, archived = true) {
    const customer = state.customers.find((item) => item.id === Number(id));
    if (!customer) return false;
    const before = { archived: Boolean(customer.archived) };
    customer.archived = Boolean(archived);
    customer.archivedAt = customer.archived ? new Date().toISOString() : null;
    recordActivity("customer", customer.id, "customer", customer.archived ? "Müşteri arşivlendi" : "Müşteri yeniden aktifleştirildi");
    audit("customer.archive_changed", "customer", customer.id, changeDetails(before, { archived: customer.archived }));
    persist();
    return true;
  },
  convertLeadToCustomer(id) {
    const lead = state.leads.find((item) => item.id === Number(id));
    if (!lead) return { ok: false, message: "Lead bulunamadı." };
    if (lead.convertedCustomerId) return { ok: false, message: "Bu lead daha önce müşteriye dönüştürüldü.", customerId: lead.convertedCustomerId };
    const result = this.addCustomer({
      name: lead.company?.trim() || lead.name?.trim() || "İsimsiz müşteri",
      contact: lead.name,
      phone: lead.phone,
      email: lead.email,
      score: lead.score,
      stage: "İlk görüşme",
      ownerId: lead.ownerId,
    });
    if (!result.ok) return result;
    const before = { status: lead.status, convertedCustomerId: lead.convertedCustomerId };
    lead.status = "Müşteriye dönüştü";
    lead.convertedCustomerId = result.customer.id;
    lead.convertedAt = new Date().toISOString();
    recordActivity("lead", lead.id, "conversion", "Lead müşteriye dönüştürüldü", result.customer.name);
    audit("lead.converted", "lead", lead.id, {
      ...changeDetails(before, { status: lead.status, convertedCustomerId: lead.convertedCustomerId }),
      customerId: result.customer.id,
    });
    persist();
    return { ok: true, customer: result.customer };
  },
  updateLeadStatus(id, status) {
    const lead = state.leads.find((item) => item.id === id);
    if (lead) {
      if (status === "Müşteriye dönüştü" && !lead.convertedCustomerId) return false;
      if (status === "Uygun değil" && !lead.disqualificationReason?.trim()) return false;
      const previousStatus = lead.status;
      lead.status = status;
      recordActivity("lead", lead.id, "status", "Lead durumu güncellendi", `${previousStatus} → ${status}`);
      audit("lead.status_changed", "lead", id, changeDetails({ status: previousStatus }, { status: lead.status }));
      persist();
      return true;
    }
    return false;
  },
  updateLead(id, changes) {
    const lead = state.leads.find((item) => item.id === Number(id));
    if (!lead) return false;
    if (changes.status === "Uygun değil" && !changes.disqualificationReason?.trim()) return false;
    const before = {
      name: lead.name, company: lead.company, email: lead.email, phone: lead.phone,
      score: lead.score, status: lead.status, ownerId: lead.ownerId, disqualificationReason: lead.disqualificationReason,
    };
    Object.assign(lead, {
      name: changes.name?.trim() ?? lead.name,
      company: changes.company?.trim() ?? lead.company,
      email: changes.email?.trim() ?? lead.email,
      phone: changes.phone ? formatPhoneNumber(changes.phone) : lead.phone,
      score: Number(changes.score ?? lead.score),
      status: changes.status === "Müşteriye dönüştü" && !lead.convertedCustomerId ? lead.status : changes.status || lead.status,
      ownerId: Number(changes.ownerId) || lead.ownerId || state.currentUserId,
      disqualificationReason: changes.status === "Uygun değil"
        ? changes.disqualificationReason?.trim() || lead.disqualificationReason || ""
        : "",
      updatedAt: new Date().toISOString(),
    });
    recordActivity("lead", lead.id, "lead", "Lead bilgileri güncellendi", `${lead.name || "İsimsiz lead"} · ${lead.status}`);
    const after = {
      name: lead.name, company: lead.company, email: lead.email, phone: lead.phone,
      score: lead.score, status: lead.status, ownerId: lead.ownerId, disqualificationReason: lead.disqualificationReason,
    };
    audit("lead.updated", "lead", lead.id, changeDetails(before, after));
    persist();
    return true;
  },
  archiveLead(id, archived = true) {
    const lead = state.leads.find((item) => item.id === Number(id));
    if (!lead) return false;
    const before = { archived: Boolean(lead.archived) };
    lead.archived = Boolean(archived);
    lead.archivedAt = lead.archived ? new Date().toISOString() : null;
    audit("lead.archive_changed", "lead", lead.id, changeDetails(before, { archived: lead.archived }));
    persist();
    return true;
  },
  updateOffer(id, changes) {
    const offer = state.offers.find((item) => item.id === Number(id));
    if (!offer) return false;
    const before = {
      title: offer.title, status: offer.status, probability: offer.probability,
      validUntil: offer.validUntil, numericAmount: offer.numericAmount, amount: offer.amount,
      ownerId: offer.ownerId, outcomeReason: offer.outcomeReason || "",
    };
    const numericAmount = Number(changes.numericAmount ?? offer.numericAmount);
    if (["Kazanıldı", "Kaybedildi"].includes(changes.status) && !changes.outcomeReason?.trim()) return false;
    Object.assign(offer, {
      title: changes.title?.trim() || offer.title,
      status: changes.status || offer.status,
      probability: Number(changes.probability ?? offer.probability),
      validUntil: changes.validUntil?.trim() || offer.validUntil,
      numericAmount,
      amount: new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(numericAmount),
      ownerId: Number(changes.ownerId) || offer.ownerId || state.currentUserId,
      outcomeReason: ["Kazanıldı", "Kaybedildi"].includes(changes.status)
        ? changes.outcomeReason?.trim() || offer.outcomeReason || ""
        : "",
      updatedAt: new Date().toISOString(),
    });
    recordActivity("customer", offer.customerId, "offer", "Teklif güncellendi", `${offer.no} · ${offer.status} · %${offer.probability}`);
    const after = {
      title: offer.title, status: offer.status, probability: offer.probability,
      validUntil: offer.validUntil, numericAmount: offer.numericAmount, amount: offer.amount,
      ownerId: offer.ownerId, outcomeReason: offer.outcomeReason,
    };
    const revision = { id: nextLocalId(), createdAt: new Date().toISOString(), actorName: state.users.find((user) => user.id === state.currentUserId)?.name || "Sistem", ...changeDetails(before, after) };
    if (revision.changedFields.length) offer.revisions.unshift(revision);
    audit("offer.updated", "offer", offer.id, changeDetails(before, after));
    persist();
    return true;
  },
  archiveOffer(id, archived = true) {
    const offer = state.offers.find((item) => item.id === Number(id));
    if (!offer) return false;
    const before = { archived: Boolean(offer.archived) };
    offer.archived = Boolean(archived);
    offer.archivedAt = offer.archived ? new Date().toISOString() : null;
    audit("offer.archive_changed", "offer", offer.id, changeDetails(before, { archived: offer.archived }));
    persist();
    return true;
  },
  cancelOffer(id, reason) {
    const offer = state.offers.find((item) => item.id === Number(id));
    if (!offer || !reason?.trim()) return false;
    const before = { cancelled: Boolean(offer.cancelled), status: offer.status, outcomeReason: offer.outcomeReason };
    offer.cancelled = true;
    offer.status = "İptal";
    offer.outcomeReason = reason.trim();
    offer.updatedAt = new Date().toISOString();
    const after = { cancelled: offer.cancelled, status: offer.status, outcomeReason: offer.outcomeReason };
    offer.revisions.unshift({ id: nextLocalId(), createdAt: offer.updatedAt, actorName: state.users.find((user) => user.id === state.currentUserId)?.name || "Sistem", ...changeDetails(before, after) });
    recordActivity("customer", offer.customerId, "offer", "Teklif iptal edildi", offer.outcomeReason);
    audit("offer.cancelled", "offer", offer.id, changeDetails(before, after));
    persist();
    return true;
  },
  addOffer(offer) {
    const customer = state.customers.find((item) => item.id === Number(offer.customerId) && !item.archived);
    const numericAmount = Number(offer.numericAmount);
    if (!customer || !offer.title?.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return { ok: false, message: "Müşteri, teklif başlığı ve sıfırdan büyük tutar zorunludur." };
    }
    const year = new Date().getFullYear();
    const sequence = String(state.offers.length + 1).padStart(4, "0");
    const record = {
      id: nextLocalId(),
      customerId: customer.id,
      customer: customer.name,
      no: `TKL-${year}-${sequence}`,
      title: offer.title.trim(),
      amount: new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(numericAmount),
      numericAmount,
      status: "Hazırlanıyor",
      validUntil: offer.validUntil,
      probability: Number(offer.probability) || 50,
      ownerId: Number(offer.ownerId) || state.currentUserId,
      outcomeReason: "",
      revisions: [],
      createdAt: new Date().toISOString(),
    };
    state.offers.unshift(record);
    recordActivity("customer", customer.id, "offer", "Yeni teklif oluşturuldu", `${record.no} · ${record.amount}`);
    audit("offer.created", "offer", record.id, { customerId: customer.id, title: record.title, numericAmount });
    persist();
    return { ok: true, offer: record };
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
  setSyncFrequency(frequency) {
    if (!["hourly", "daily"].includes(frequency)) return;
    const before = { frequency: state.syncSettings.frequency, nextSyncAt: state.syncSettings.nextSyncAt };
    state.syncSettings.frequency = frequency;
    state.syncSettings.nextSyncAt = nextSyncTime(frequency);
    audit("sync.schedule_changed", "integration", null, changeDetails(before, { frequency: state.syncSettings.frequency, nextSyncAt: state.syncSettings.nextSyncAt }));
    persist();
  },
  toggleSync(enabled) {
    const before = { enabled: state.syncSettings.enabled, nextSyncAt: state.syncSettings.nextSyncAt };
    state.syncSettings.enabled = Boolean(enabled);
    if (enabled) state.syncSettings.nextSyncAt = nextSyncTime(state.syncSettings.frequency);
    audit("sync.status_changed", "integration", null, changeDetails(before, { enabled: state.syncSettings.enabled, nextSyncAt: state.syncSettings.nextSyncAt }));
    persist();
  },
  syncExternalLeads(now = Date.now(), manual = false) {
    if (!manual && (!state.syncSettings.enabled || !isSyncDue(state.syncSettings.nextSyncAt, now))) return false;
    const syncedAt = new Date(now).toISOString();
    const externalSources = new Set(["Facebook", "Instagram", "Google Ads", "Web Form"]);
    let updated = 0;
    for (const lead of state.leads) {
      if (externalSources.has(lead.source)) {
        lead.lastSyncedAt = syncedAt;
        updated += 1;
      }
    }
    state.syncSettings.lastSyncAt = now;
    state.syncSettings.nextSyncAt = nextSyncTime(state.syncSettings.frequency, now);
    audit("sync.completed", "integration", null, {
      sources: state.syncSettings.sources,
      mode: manual ? "manual" : "scheduled",
      imported: 0,
      updated,
    });
    return true;
  },
  recordRequest(method, path, status = "success") {
    audit(
      "request.completed",
      "http",
      path,
      { method, path },
      status,
      null,
      {
        statusCode: status === "success" ? 200 : 500,
        message: status === "success" ? "İstek tamamlandı" : "İstek tamamlanamadı",
      },
    );
  },
  addActivity(entityType, entityId, title, description = "") {
    const activity = recordActivity(entityType, entityId, "note", title, description);
    audit("activity.created", entityType, entityId, { activityId: activity.id, title });
    persist();
    return activity;
  },
};
