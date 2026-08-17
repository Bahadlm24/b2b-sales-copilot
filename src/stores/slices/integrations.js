import { formatPhoneNumber } from "../../services/phoneFormatter.js";
import { normalizeInboundLead } from "../../services/inboundLeadService.js";
import { isSyncDue, nextSyncTime } from "../../services/syncScheduler.js";

export function createIntegrationsSlice({ state, persist, nextLocalId, changeDetails, audit }, store) {
  return {
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
          const record = store.addLead({ ...lead, phone });
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
  };
}
