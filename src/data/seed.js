import { customers, offers as defaultOffers } from "./mockData.js";
import { roles as defaultRoles } from "../services/authorization.js";
import { nextSyncTime } from "../services/syncScheduler.js";

export { customers, defaultOffers, defaultRoles };

export const defaultTasks = [
  { id: 1, customerId: 1, title: "Revize teklif kapsamını paylaş", dueDate: "2026-08-03", priority: "Yüksek", completed: false },
  { id: 2, customerId: 3, title: "Karar verici toplantısını planla", dueDate: "2026-08-05", priority: "Yüksek", completed: false },
  { id: 3, customerId: 4, title: "Finans entegrasyonu dokümanını gönder", dueDate: "2026-08-07", priority: "Orta", completed: false },
  { id: 4, customerId: 2, title: "İhtiyaç analizi notlarını tamamla", dueDate: "2026-08-08", priority: "Düşük", completed: true },
];

export const defaultUsers = [
  { id: 1, username: "admin", password: "1234", name: "Bahadır Perveli", email: "admin@salescopilot.local", role: "admin", departmentId: 1, teamId: 1, active: true },
  { id: 2, username: "elif", password: "1234", name: "Elif Demir", email: "elif@salescopilot.local", role: "manager", departmentId: 1, teamId: 1, active: true },
  { id: 3, username: "kerem", password: "1234", name: "Kerem Aydın", email: "kerem@salescopilot.local", role: "representative", departmentId: 1, teamId: 2, active: true },
  { id: 4, username: "zeynep", password: "1234", name: "Zeynep Şahin", email: "zeynep@salescopilot.local", role: "analyst", departmentId: 2, teamId: 3, active: true },
];

export const defaultDepartments = [{ id: 1, name: "Satış" }, { id: 2, name: "Satış Operasyonları" }];

export const defaultTeams = [
  { id: 1, departmentId: 1, name: "Kurumsal Satış" },
  { id: 2, departmentId: 1, name: "Yeni Müşteri Kazanımı" },
  { id: 3, departmentId: 2, name: "Raporlama ve Analiz" },
];

export const defaultRoleDefinitions = Object.entries(defaultRoles).map(([key, role]) => ({
  key,
  label: role.label,
  permissions: [...role.permissions],
}));

export const defaultLeads = [
  { id: 1, name: "Ayşe Yılmaz", company: "Rota Perakende", phone: "+90 530 505 66 48", email: "ayse@rotaperakende.com", source: "Facebook", campaign: "Q3 Dönüşüm Formu", status: "Yeni", score: 72, createdAt: "2026-07-30T08:25:00.000Z" },
  { id: 2, name: "John Miller", company: "Northstar GmbH", phone: "+49 151 23456789", email: "john@northstar.de", source: "Instagram", campaign: "EU Growth", status: "İletişime geçildi", score: 64, createdAt: "2026-07-29T13:10:00.000Z" },
  { id: 3, name: "Deniz Arslan", company: "Arslan Makine", phone: "+90 532 444 21 09", email: "deniz@arslanmakine.com", source: "Web Form", campaign: "Demo Talebi", status: "Nitelikli", score: 86, createdAt: "2026-07-29T09:40:00.000Z" },
  { id: 4, name: "Melis Kaya", company: "Kaya Yapı", phone: "+90 212 555 10 90", email: "melis@kayayapi.com", source: "Google Ads", campaign: "Kurumsal Yazılım", status: "Yeni", score: 58, createdAt: "2026-07-28T15:05:00.000Z" },
];

export const defaultSyncSettings = {
  frequency: "hourly",
  enabled: true,
  lastSyncAt: null,
  nextSyncAt: nextSyncTime("hourly"),
  sources: ["Meta", "Instagram", "Google Ads", "Web Form"],
};

export const defaultActivities = [
  { id: 1, entityType: "customer", entityId: 1, actorId: 2, actorName: "Elif Demir", type: "meeting", title: "İhtiyaç analizi görüşmesi yapıldı", description: "Entegrasyon ve geçiş planı konuşuldu.", createdAt: "2026-07-28T11:30:00.000Z" },
  { id: 2, entityType: "customer", entityId: 1, actorId: 1, actorName: "Bahadır Perveli", type: "offer", title: "Teklif revizyonu istendi", description: "Entegrasyon ve eğitim kapsamı güncellenecek.", createdAt: "2026-07-29T09:15:00.000Z" },
  { id: 3, entityType: "lead", entityId: 1, actorId: 3, actorName: "Kerem Aydın", type: "call", title: "İlk arama yapıldı", description: "Karar verici bilgisi alındı, demo talep edildi.", createdAt: "2026-07-30T10:05:00.000Z" },
];

export const defaultMeetingJourneys = [
  { id: 101, entityType: "lead", entityId: 3, ownerId: 3, status: "Görüşme planlandı", round: 1, scheduledAt: "2026-08-04T10:00", result: "", notes: "Demo ve ihtiyaç analizi", history: [{ status: "Görüşme planlandı", at: "2026-08-01T09:00:00.000Z", round: 1 }] },
  { id: 102, entityType: "customer", entityId: 1, ownerId: 2, status: "Tekrar görüşme planlandı", round: 2, scheduledAt: "2026-08-05T14:30", result: "", notes: "Karar verici ve entegrasyon kapsamı", history: [{ status: "Görüşme sağlandı", at: "2026-07-28T11:30:00.000Z", round: 1 }, { status: "Tekrar görüşme planlandı", at: "2026-07-29T09:15:00.000Z", round: 2 }] },
];

export const defaultProductUpdates = [
  { id: "0.6.0", version: "0.6.0", title: "Meet, Teams ve Zoom desteği", message: "Toplantı eklentisi çoklu platform ve otomatik başlatma desteği kazandı.", publishedAt: "2026-08-02T12:00:00.000Z" },
];
