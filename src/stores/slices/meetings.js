import { analyzeConversation, analyzeTranscript } from "../../services/meetingAnalyzer.js";
import { locale, t } from "../../i18n/localeStore.js";

export function createMeetingsSlice({ state, persist, nextLocalId, changeDetails, audit, recordActivity }) {
  return {
    createMeetingJourney(data) {
      if (!data.entityId || !data.scheduledAt) return { ok: false, message: t("store.journeyRequired") };
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
      if (!journey) return { ok: false, message: t("store.journeyMissing") };
      const before = { status: journey.status, scheduledAt: journey.scheduledAt, result: journey.result, notes: journey.notes, ownerId: journey.ownerId, round: journey.round };
      const nextStatus = changes.status || journey.status;
      if (["Olumlu", "Olumsuz"].includes(nextStatus) && !changes.result?.trim() && !journey.result?.trim()) return { ok: false, message: t("store.journeyResultRequired") };
      if (nextStatus === "Tekrar görüşme planlandı" && !changes.scheduledAt) return { ok: false, message: t("store.journeyDateRequired") };
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
      meeting.insights = analyzeTranscript(meeting.transcript, locale.value);
      meeting.conversationAnalysis = analyzeConversation(meeting.transcript, locale.value);
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
  };
}
