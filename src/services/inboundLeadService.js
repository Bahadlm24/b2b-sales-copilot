export const inboundSources = {
  meta: { label: "Meta Lead Ads", leadSource: "Facebook / Instagram", path: "meta", auth: "X-Hub-Signature-256", note: "Facebook ve Instagram Lead Ads aynı Meta webhook bağlantısını kullanır." },
  google_ads: { label: "Google Ads Lead Form", leadSource: "Google Ads", path: "google-ads", auth: "X-Goog-Webhook-Key", note: "Google Ads lead form asset webhook teslimat adresidir." },
  webform: { label: "Web Form API", leadSource: "Web Form", path: "webform", auth: "X-Form-Key", note: "Landing page veya kurumsal site formları bu adrese POST gönderir." },
};

export function buildInboundUrl(baseUrl, tenantId, sourceKey) {
  const source = inboundSources[sourceKey];
  if (!source) return "";
  return `${String(baseUrl || "").replace(/\/$/, "")}/v1/inbound/${encodeURIComponent(tenantId)}/${source.path}`;
}

export function normalizeInboundLead(sourceKey, payload = {}) {
  const source = inboundSources[sourceKey];
  if (!source) return null;
  const firstName = payload.first_name || payload.firstName || "";
  const lastName = payload.last_name || payload.lastName || "";
  return {
    name: payload.name || payload.full_name || `${firstName} ${lastName}`.trim(),
    company: payload.company || payload.company_name || "",
    phone: payload.phone || payload.phone_number || payload.phoneNumber || "",
    email: payload.email || payload.email_address || "",
    campaign: payload.campaign || payload.campaign_name || payload.form_name || "Harici form",
    source: source.leadSource,
    externalLeadId: payload.lead_id || payload.id || payload.gclid || null,
    rawSource: sourceKey,
  };
}
