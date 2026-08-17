import { formatPhoneNumber } from "../../services/phoneFormatter.js";

export function createLeadsSlice({ state, persist, nextLocalId, changeDetails, audit, recordActivity }, store) {
  return {
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
    convertLeadToCustomer(id) {
      const lead = state.leads.find((item) => item.id === Number(id));
      if (!lead) return { ok: false, message: "Lead bulunamadı." };
      if (lead.convertedCustomerId) return { ok: false, message: "Bu lead daha önce müşteriye dönüştürüldü.", customerId: lead.convertedCustomerId };
      const result = store.addCustomer({
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
  };
}
