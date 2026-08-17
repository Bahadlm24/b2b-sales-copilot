import { t } from "../i18n/localeStore.js";

export const roles = {
  admin: {
    label: "Sistem Yöneticisi",
    permissions: ["dashboard", "leads", "meeting", "meetings", "tasks", "customers", "offers", "analytics", "users", "audit"],
  },
  manager: {
    label: "Satış Yöneticisi",
    permissions: ["dashboard", "leads", "meeting", "meetings", "tasks", "customers", "offers", "analytics"],
  },
  representative: {
    label: "Satış Temsilcisi",
    permissions: ["dashboard", "leads", "meeting", "meetings", "tasks", "customers", "offers"],
  },
  analyst: {
    label: "Satış Analisti",
    permissions: ["dashboard", "leads", "customers", "offers", "analytics"],
  },
};

export const permissionCatalog = [
  { key: "dashboard", label: "Genel Bakış" },
  { key: "leads", label: "Lead Havuzu" },
  { key: "meeting", label: "Toplantı Asistanı" },
  { key: "meetings", label: "Toplantı Geçmişi" },
  { key: "tasks", label: "Takipler" },
  { key: "customers", label: "Müşteriler" },
  { key: "offers", label: "Teklifler" },
  { key: "analytics", label: "Analizler" },
  { key: "users", label: "Kullanıcı Yönetimi" },
  { key: "settings", label: "Ayarlar" },
  { key: "audit", label: "Audit Geçmişi" },
];

roles.admin.permissions.push("settings");

export function hasPermission(role, permission) {
  return roles[role]?.permissions.includes(permission) ?? false;
}

export function roleLabel(role) {
  const translated = t(`roles.${role}`);
  if (translated !== `roles.${role}`) return translated;
  return roles[role]?.label ?? t("roles.unknown");
}
