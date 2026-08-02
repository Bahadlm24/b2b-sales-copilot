import { analyzeTranscript, buildLiveAlert } from "./meeting-intelligence.js";
import { findKnowledge, loadKnowledgeBase } from "./knowledge-base.js";

const knowledgePromise = loadKnowledgeBase().catch(() => []);
const UPDATE_ALARM = "sales-copilot-update-check";
const UPDATE_URL = "https://sales-copilot-demo.vlexy.chatgpt.site/api/extension/version";

const compareVersions = (left, right) => {
  const a = String(left).split(".").map(Number);
  const b = String(right).split(".").map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) > (b[index] || 0) ? 1 : -1;
  }
  return 0;
};

async function checkExtensionUpdate() {
  try {
    const response = await fetch(UPDATE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Sürüm servisi ${response.status} döndürdü`);
    const release = await response.json();
    const currentVersion = chrome.runtime.getManifest().version;
    const update = { ...release, currentVersion, available: compareVersions(currentVersion, release.latestVersion) < 0, unsupported: compareVersions(currentVersion, release.minimumSupportedVersion) < 0, checkedAt: new Date().toISOString() };
    await chrome.storage.local.set({ extensionUpdate: update });
    chrome.runtime.sendMessage({ type: "EXTENSION_UPDATE_STATUS", update }).catch(() => {});
  } catch (error) {
    await chrome.storage.local.set({ extensionUpdateError: { message: error.message, checkedAt: new Date().toISOString() } });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  const saved = await chrome.storage.local.get(["settings", "mockCustomers"]);
  if (!saved.settings) {
    await chrome.storage.local.set({
      settings: { mode: "mock", language: "auto", autoStart: true, consentAcknowledged: false, popupEnabled: true, popupDuration: 3000, participantOnly: false, apiBaseUrl: "http://localhost:3000/api", accessToken: "" },
    });
  }
  if (!saved.mockCustomers) {
    await chrome.storage.local.set({
      mockCustomers: [
        { id: 1, name: "Atlas Endüstri A.Ş.", contact: "Mert Yalçın", stage: "Teklif değerlendiriliyor", score: 74 },
        { id: 2, name: "Nova Lojistik", contact: "Selin Acar", stage: "İlk görüşme", score: 52 },
        { id: 3, name: "Marmara Teknoloji", contact: "Can Erdem", stage: "Karar aşaması", score: 88 }
      ]
    });
  }
  await chrome.alarms.create(UPDATE_ALARM, { delayInMinutes: 1, periodInMinutes: 60 });
  await checkExtensionUpdate();
});

chrome.runtime.onStartup.addListener(() => checkExtensionUpdate());
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_ALARM) checkExtensionUpdate();
});

async function processCaption(tabId, caption) {
  const [{ activeMeetingSession }, { settings = {} }, articles] = await Promise.all([
    chrome.storage.session.get("activeMeetingSession"),
    chrome.storage.local.get("settings"),
    knowledgePromise
  ]);
  if (!activeMeetingSession || activeMeetingSession.tabId !== tabId) return;
  const segments = activeMeetingSession.segments || [];
  const previous = segments.at(-1);
  const extendsPrevious = previous && previous.speaker === caption.speaker
    && caption.text.startsWith(previous.text)
    && new Date(caption.capturedAt) - new Date(previous.capturedAt) < 6000;
  if (extendsPrevious) segments[segments.length - 1] = caption;
  else if (!previous || previous.speaker !== caption.speaker || previous.text !== caption.text) segments.push(caption);
  activeMeetingSession.segments = segments;
  activeMeetingSession.updatedAt = new Date().toISOString();

  const suggestions = analyzeTranscript(segments, settings.language || "auto");
  const alert = buildLiveAlert(caption, suggestions, settings.language || "auto");
  if (alert && settings.popupEnabled !== false && (!settings.participantOnly || caption.role === "participant")) {
    const alertKey = `${alert.kind}:${alert.message}`;
    const now = Date.now();
    if (alertKey !== activeMeetingSession.lastAlertKey || now - (activeMeetingSession.lastAlertAt || 0) >= 8000) {
      const knowledge = findKnowledge(articles, caption.text, suggestions[0]?.id, alert.language);
      const interaction = {
        id: crypto.randomUUID(), question: caption.text, speaker: caption.speaker,
        speakerRole: caption.role || "unknown", detectedAt: new Date().toISOString(),
        intent: suggestions[0]?.id || "context",
        answer: knowledge?.answer || (alert.language === "en" ? "No verified answer was found. Confirm the scope and follow up with the relevant specialist." : "Doğrulanmış bir cevap bulunamadı. Kapsamı netleştirip ilgili uzmandan teyitli dönüş yapın."),
        followUpQuestion: knowledge?.followUpQuestion || alert.message,
        source: knowledge?.source || null, sourceTitle: knowledge?.sourceTitle || null,
        confidence: knowledge?.confidence || "low", feedback: null
      };
      activeMeetingSession.qaInteractions = [...(activeMeetingSession.qaInteractions || []), interaction];
      activeMeetingSession.lastAlertKey = alertKey;
      activeMeetingSession.lastAlertAt = now;
      chrome.tabs.sendMessage(tabId, { type: "SHOW_COACH_POPUP", alert: { ...alert, ...interaction }, duration: settings.popupDuration || 3000 }).catch(() => {});
      chrome.runtime.sendMessage({ type: "COACH_INTERACTION", tabId, interaction, suggestions }).catch(() => {});
    }
  }
  await chrome.storage.session.set({ activeMeetingSession });
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.tab && ["MEETING_CAPTION", "MEETING_PAGE_STATUS", "MEETING_CAPTURE_HEALTH", "COACH_FEEDBACK"].includes(message.type)) {
    chrome.runtime.sendMessage({ ...message, tabId: sender.tab?.id }).catch(() => {});
  }
  if (message.type === "MEETING_CAPTION" && sender.tab) {
    processCaption(sender.tab.id, message.caption).catch(() => {});
  }
  if (message.type === "AUTO_CAPTURE_TOGGLED" && sender.tab && message.collecting) {
    chrome.storage.session.get("activeMeetingSession").then(({ activeMeetingSession }) => {
      if (activeMeetingSession?.tabId === sender.tab.id) return;
      chrome.storage.session.set({ activeMeetingSession: { tabId: sender.tab.id, customerId: null, platform: message.platform, meetingUrl: message.url, startedAt: new Date().toISOString(), segments: [], qaInteractions: [], languagePreference: "auto", autoStarted: true } });
    });
  }
  if (message.type === "COACH_FEEDBACK" && sender.tab) {
    chrome.storage.session.get("activeMeetingSession").then(({ activeMeetingSession }) => {
      const interaction = activeMeetingSession?.qaInteractions?.find((item) => item.id === message.interactionId);
      if (!interaction) return;
      interaction.feedback = message.feedback;
      interaction.feedbackAt = new Date().toISOString();
      chrome.storage.session.set({ activeMeetingSession });
    });
  }
  if (message.type === "SESSION_START") {
    chrome.storage.session.set({ activeMeetingSession: message.session });
  }
  if (message.type === "SESSION_UPDATE") {
    chrome.storage.session.get("activeMeetingSession").then(({ activeMeetingSession }) => {
      if (activeMeetingSession) chrome.storage.session.set({ activeMeetingSession: { ...activeMeetingSession, ...message.changes } });
    });
  }
  if (message.type === "SESSION_STOP") chrome.storage.session.remove("activeMeetingSession");
});
