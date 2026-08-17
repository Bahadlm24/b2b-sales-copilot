import { formatPhoneNumber } from "../../services/phoneFormatter.js";
import { dateLocale, t } from "../../i18n/localeStore.js";

export function createCustomersSlice({ state, persist, nextLocalId, changeDetails, audit, recordActivity }) {
  return {
    addCustomer(customer) {
      const phone = formatPhoneNumber(customer.phone);
      if (!customer.name?.trim() || !phone) {
        return { ok: false, message: t("store.companyPhoneRequired") };
      }
      if (state.customers.some((item) => formatPhoneNumber(item.phone) === phone)) {
        return { ok: false, message: t("store.customerPhoneExists") };
      }
      const now = new Date();
      const name = customer.name.trim();
      const record = {
        id: nextLocalId(),
        name,
        initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toLocaleUpperCase("tr-TR"),
        contact: customer.contact?.trim() || t("store.noContact"),
        role: customer.role?.trim() || t("store.noRole"),
        stage: customer.stage || "İlk görüşme",
        score: Number(customer.score) || 50,
        lastContact: now.toLocaleDateString(dateLocale.value, { day: "numeric", month: "long", year: "numeric" }),
        lastContactDate: now.toISOString().slice(0, 10),
        sector: customer.sector?.trim() || t("store.unspecified"),
        city: customer.city?.trim() || t("store.unspecified"),
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
      if (!customer) return { ok: false, message: t("store.customerMissing") };
      const name = changes.name?.trim();
      const phone = changes.phone ? formatPhoneNumber(changes.phone) : customer.phone;
      if (!name || !phone) return { ok: false, message: t("store.companyPhoneRequired") };
      if (state.customers.some((item) => item.id !== customer.id && formatPhoneNumber(item.phone) === phone)) {
        return { ok: false, message: t("store.customerPhoneOther") };
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
        contact: changes.contact?.trim() || t("store.noContact"),
        role: changes.role?.trim() || t("store.noRole"),
        phone,
        email: changes.email?.trim() || "",
        sector: changes.sector?.trim() || t("store.unspecified"),
        city: changes.city?.trim() || t("store.unspecified"),
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
  };
}
