function inRange(value, from, to) {
  if (!from && !to) return true;
  if (!value) return false;
  const key = new Date(value).toISOString().slice(0, 10);
  return (!from || key >= from) && (!to || key <= to);
}

const ownerMatch = (item, ownerId) => ownerId === "all" || Number(item.ownerId) === Number(ownerId);
const sum = (items, selector) => items.reduce((total, item) => total + Number(selector(item) || 0), 0);

export function buildSalesReport(state, filters = {}) {
  const normalized = { from: "", to: "", ownerId: "all", source: "all", ...filters };
  const leads = state.leads.filter((item) => ownerMatch(item, normalized.ownerId)
    && (normalized.source === "all" || item.source === normalized.source)
    && inRange(item.createdAt, normalized.from, normalized.to));
  const leadIds = new Set(leads.map((item) => item.id));
  const customers = state.customers.filter((item) => ownerMatch(item, normalized.ownerId)
    && inRange(item.createdAt || item.convertedAt || item.lastContactDate, normalized.from, normalized.to));
  const meetings = state.meetings.filter((item) => ownerMatch(item, normalized.ownerId)
    && inRange(item.meetingDate || item.createdAt, normalized.from, normalized.to));
  const journeys = state.meetingJourneys.filter((item) => ownerMatch(item, normalized.ownerId)
    && (item.entityType !== "lead" || !leadIds.size || leadIds.has(item.entityId) || leadIds.has(item.sourceLeadId))
    && inRange(item.updatedAt || item.createdAt || item.scheduledAt, normalized.from, normalized.to));
  const offers = state.offers.filter((item) => ownerMatch(item, normalized.ownerId)
    && inRange(item.closedAt || item.updatedAt || item.createdAt, normalized.from, normalized.to));
  const wonOffers = offers.filter((item) => !item.archived && !item.cancelled && item.status === "Kazanıldı");
  const lostOffers = offers.filter((item) => !item.archived && (item.cancelled || item.status === "Kaybedildi"));
  const converted = leads.filter((item) => item.convertedCustomerId || item.status === "Müşteriye dönüştü");
  const uninterested = leads.filter((item) => item.status === "Uygun değil");
  const passive = leads.filter((item) => item.archived);
  const active = leads.filter((item) => !item.archived && !item.convertedCustomerId && item.status !== "Uygun değil");
  const responded = leads.filter((item) => !["Yeni", "Uygun değil"].includes(item.status));
  const heldJourneys = journeys.filter((item) => ["Görüşme sağlandı", "Tekrar görüşme planlandı", "Karar aşaması", "Olumlu", "Olumsuz"].includes(item.status));
  const positiveJourneys = journeys.filter((item) => item.status === "Olumlu");
  const negativeJourneys = journeys.filter((item) => item.status === "Olumsuz");
  const revenue = sum(wonOffers, (item) => item.numericAmount);
  const pipeline = sum(offers.filter((item) => !item.archived && !item.cancelled && !["Kazanıldı", "Kaybedildi"].includes(item.status)), (item) => item.numericAmount);
  const averageMeetingScore = Math.round(sum(meetings.filter((item) => item.conversationAnalysis), (item) => item.conversationAnalysis.overallScore) / (meetings.filter((item) => item.conversationAnalysis).length || 1));
  const users = state.users.filter((item) => item.active).filter((item) => normalized.ownerId === "all" || item.id === Number(normalized.ownerId));
  const personnel = users.map((user) => {
    const userLeads = leads.filter((item) => item.ownerId === user.id);
    const userWon = wonOffers.filter((item) => item.ownerId === user.id);
    const userMeetings = meetings.filter((item) => item.ownerId === user.id);
    return { id: user.id, name: user.name, leads: userLeads.length, responses: userLeads.filter((item) => item.status !== "Yeni").length, conversions: userLeads.filter((item) => item.convertedCustomerId).length, meetings: userMeetings.length, wonDeals: userWon.length, revenue: sum(userWon, (item) => item.numericAmount), averageScore: Math.round(sum(userMeetings.filter((item) => item.conversationAnalysis), (item) => item.conversationAnalysis.overallScore) / (userMeetings.filter((item) => item.conversationAnalysis).length || 1)) };
  });
  const sourcePerformance = [...new Set(leads.map((item) => item.source))].map((source) => {
    const sourceLeads = leads.filter((item) => item.source === source);
    const sourceConverted = sourceLeads.filter((item) => item.convertedCustomerId).length;
    return { source, leads: sourceLeads.length, responses: sourceLeads.filter((item) => item.status !== "Yeni").length, conversions: sourceConverted, rate: Math.round(sourceConverted / (sourceLeads.length || 1) * 100) };
  }).sort((a, b) => b.conversions - a.conversions || b.leads - a.leads);
  return {
    totals: { leads: leads.length, active: active.length, passive: passive.length, uninterested: uninterested.length, responded: responded.length, converted: converted.length, customers: customers.filter((item) => !item.archived).length, meetings: meetings.length, heldMeetings: heldJourneys.length, positive: positiveJourneys.length, negative: negativeJourneys.length, wonDeals: wonOffers.length, lostDeals: lostOffers.length, revenue, pipeline, averageMeetingScore, responseRate: Math.round(responded.length / (leads.length || 1) * 100), conversionRate: Math.round(converted.length / (leads.length || 1) * 100), winRate: Math.round(wonOffers.length / ((wonOffers.length + lostOffers.length) || 1) * 100) },
    funnel: [{ label: "Toplam data", value: leads.length }, { label: "Dönüş yapan", value: responded.length }, { label: "Görüşme sağlandı", value: heldJourneys.length }, { label: "Müşteri olan", value: converted.length }, { label: "Kazanılan satış", value: wonOffers.length }],
    personnel, sourcePerformance,
  };
}
