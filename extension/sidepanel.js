import { analyzeWithApi, getCustomers, saveMeeting } from "./api-client.js";
import { analyzeTranscript, buildLiveAlert, summarizeMeeting } from "./meeting-intelligence.js";
import { findKnowledge, loadKnowledgeBase } from "./knowledge-base.js";
import { applySidepanelCopy, uiText } from "./ui-i18n.js";

const $ = (id) => document.getElementById(id);
let customers = [];
let segments = [];
let suggestions = [];
let activeTabId = null;
let startedAt = null;
let remoteAnalysisTimer = null;
let remoteAnalysisSequence = 0;
let languagePreference = "auto";
let lastAlertKey = "";
let lastAlertAt = 0;
let knowledgeArticles = [];
let qaInteractions = [];
let popupEnabled = true;
let popupDuration = 3000;
let participantOnly = false;
let lastSavedPayload = null;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

async function findMeetTab() {
  const tabs = await chrome.tabs.query({ url: ["https://meet.google.com/*", "https://teams.microsoft.com/*", "https://teams.live.com/*", "https://teams.cloud.microsoft/*", "https://*.zoom.us/*"] });
  return tabs.find((tab) => tab.active) || tabs[0] || null;
}
const isMeetingUrl = (url = "") => /^https:\/\/(meet\.google\.com|teams\.(microsoft|live|cloud)\.com|([^.]+\.)*zoom\.us)\//i.test(url);
const platformFromUrl = (url = "") => url.includes("meet.google.com") ? "google-meet" : url.includes("teams.") ? "microsoft-teams" : "zoom";

async function loadSettings() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  $("mode").value = settings.mode || "mock";
  languagePreference = settings.language || "auto";
  $("language").value = languagePreference;
  applySidepanelCopy(languagePreference);
  if ($("suggestions").classList.contains("empty")) $("suggestions").textContent = uiText("suggestionsEmpty", languagePreference);
  if ($("captions").classList.contains("empty")) $("captions").textContent = uiText("captionsEmpty", languagePreference);
  if ($("qaHistory").classList.contains("empty")) $("qaHistory").textContent = uiText("qaEmpty", languagePreference);
  if ($("customerCard").classList.contains("empty")) $("customerCard").textContent = uiText("pickCustomer", languagePreference);
  popupEnabled = settings.popupEnabled !== false;
  popupDuration = Number(settings.popupDuration) || 3000;
  participantOnly = Boolean(settings.participantOnly);
  $("autoStart").checked = settings.autoStart !== false;
  $("popupEnabled").checked = popupEnabled;
  $("popupDuration").value = String(popupDuration);
  $("participantOnly").checked = participantOnly;
  $("apiBaseUrl").value = settings.apiBaseUrl || "http://localhost:3000/api";
  $("accessToken").value = settings.accessToken || "";
}

async function loadCustomers(query = "") {
  try {
    customers = await getCustomers(query);
    $("customerSelect").innerHTML = `<option value="">${uiText("selectCustomer", languagePreference)}</option>` + customers.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("");
  } catch (error) { setStatus(error.message, true); }
}

function selectedCustomer() { return customers.find((item) => String(item.id) === $("customerSelect").value); }
function renderCustomer() {
  const customer = selectedCustomer();
  $("customerCard").classList.toggle("empty", !customer);
  $("customerCard").innerHTML = customer ? `<strong>${escapeHtml(customer.name)}</strong><span>${escapeHtml(customer.contact || uiText("noContact", languagePreference))}</span><small>${escapeHtml(customer.stage || uiText("noStage", languagePreference))} · ${uiText("score", languagePreference)} ${escapeHtml(customer.score ?? "—")}</small>` : uiText("pickCustomer", languagePreference);
}
function setStatus(text, error = false) { $("status").textContent = text; $("status").classList.toggle("error", error); }

function renderUpdate(update) {
  const hidden = !update?.available || update.dismissedVersion === update.latestVersion;
  $("updateBanner").classList.toggle("hidden", hidden);
  if (hidden) return;
  $("updateTitle").textContent = uiText("versionReady", languagePreference, { version: update.latestVersion });
  $("updateText").textContent = update.unsupported
    ? uiText("unsupported", languagePreference, { current: update.currentVersion })
    : `${update.title || uiText("updateDefault", languagePreference)}`;
}

async function loadUpdateStatus() {
  const { extensionUpdate } = await chrome.storage.local.get("extensionUpdate");
  renderUpdate(extensionUpdate);
}

function renderLive(showPopup = false) {
  $("captionCount").textContent = segments.length;
  $("captions").classList.toggle("empty", !segments.length);
  $("captions").innerHTML = segments.slice(-30).map((item) => `<p><strong>${escapeHtml(item.speaker)}</strong>${escapeHtml(item.text)}</p>`).join("") || uiText("captionsEmpty", languagePreference);
  suggestions = analyzeTranscript(segments, languagePreference);
  $("suggestionCount").textContent = suggestions.length;
  $("suggestions").classList.remove("empty");
  $("suggestions").innerHTML = suggestions.map((item) => `<article><small>${escapeHtml(item.title)}</small><p>${escapeHtml(item.question)}</p></article>`).join("");
  if (showPopup) showMeetPopup();
  scheduleRemoteAnalysis();
}

function renderQaHistory() {
  $("qaCount").textContent = qaInteractions.length;
  $("qaHistory").classList.toggle("empty", !qaInteractions.length);
  $("qaHistory").innerHTML = qaInteractions.slice().reverse().map((item) => `<article><small>${escapeHtml(item.speaker)} · ${escapeHtml(item.intent)}</small><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.answer)}</p><span>${escapeHtml(item.sourceTitle || uiText("noSource", languagePreference))} · ${escapeHtml(item.confidence)}${item.feedback ? ` · ${escapeHtml(item.feedback)}` : ""}</span></article>`).join("") || uiText("qaEmpty", languagePreference);
}

function showMeetPopup() {
  const caption = segments.at(-1);
  const alert = caption ? buildLiveAlert(caption, suggestions, languagePreference) : null;
  if (!alert || !activeTabId || !popupEnabled || (participantOnly && caption.role !== "participant")) return;
  const key = `${alert.kind}:${alert.message}`;
  const now = Date.now();
  if (key === lastAlertKey && now - lastAlertAt < 8000) return;
  lastAlertKey = key;
  lastAlertAt = now;
  const knowledge = findKnowledge(knowledgeArticles, caption.text, suggestions[0]?.id, alert.language);
  const interaction = {
    id: crypto.randomUUID(),
    question: caption.text,
    speaker: caption.speaker,
    speakerRole: caption.role || "unknown",
    detectedAt: new Date().toISOString(),
    intent: suggestions[0]?.id || "context",
    answer: knowledge?.answer || (alert.language === "en"
      ? "No verified answer was found. Confirm the scope and offer to follow up with the relevant specialist."
      : "Doğrulanmış bir cevap bulunamadı. Kapsamı netleştirip ilgili uzmandan teyitli dönüş yapmayı önerin."),
    followUpQuestion: knowledge?.followUpQuestion || alert.message,
    source: knowledge?.source || null,
    sourceTitle: knowledge?.sourceTitle || null,
    confidence: knowledge?.confidence || "low",
    feedback: null
  };
  qaInteractions.push(interaction);
  renderQaHistory();
  chrome.runtime.sendMessage({ type: "SESSION_UPDATE", changes: { qaInteractions } });
  chrome.tabs.sendMessage(activeTabId, {
    type: "SHOW_COACH_POPUP",
    alert: { ...alert, ...interaction },
    duration: popupDuration
  }).catch(() => {});
}

function scheduleRemoteAnalysis() {
  clearTimeout(remoteAnalysisTimer);
  if (!segments.length) return;
  const requestSequence = ++remoteAnalysisSequence;
  remoteAnalysisTimer = setTimeout(async () => {
    try {
      const result = await analyzeWithApi({ customerId: selectedCustomer()?.id, language: detectCurrentLanguage(), transcriptSegments: segments.slice(-40) });
      if (requestSequence === remoteAnalysisSequence && result?.insights?.length) {
        suggestions = result.insights;
        $("suggestionCount").textContent = suggestions.length;
        $("suggestions").innerHTML = suggestions.map((item) => `<article><small>${escapeHtml(item.title || item.eyebrow)}</small><p>${escapeHtml(item.question || item.text)}</p></article>`).join("");
      }
    } catch (error) {
      if (requestSequence === remoteAnalysisSequence) setStatus(uiText("apiDelay", languagePreference, { error: error.message }), true);
    }
  }, 450);
}

function detectCurrentLanguage() {
  return suggestions[0]?.language || (languagePreference === "auto" ? "tr" : languagePreference);
}

async function startMeeting() {
  const customer = selectedCustomer();
  if (!customer) return setStatus(uiText("pickFirst", languagePreference), true);
  if (!$("consent").checked) return setStatus(uiText("consentRequired", languagePreference), true);
  const savedSettings = await chrome.storage.local.get("settings");
  await chrome.storage.local.set({ settings: { ...savedSettings.settings, consentAcknowledged: true } });
  const tab = await findMeetTab();
  if (!tab) return setStatus(uiText("noMeeting", languagePreference), true);
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "START_CAPTURE" });
    if (!response?.ok) throw new Error(uiText("captureFailed", languagePreference));
    activeTabId = tab.id;
    startedAt = new Date().toISOString();
    segments = [];
    qaInteractions = [];
    renderQaHistory();
    suggestions = analyzeTranscript([], languagePreference);
    renderLive();
    $("startMeeting").disabled = true;
    $("stopMeeting").disabled = false;
    $("resultPanel").classList.add("hidden");
    chrome.runtime.sendMessage({ type: "SESSION_START", session: { tabId: activeTabId, customerId: customer.id, platform: platformFromUrl(tab.url), meetingUrl: tab.url, startedAt, segments: [], qaInteractions: [], languagePreference } });
    setStatus(response.visibleCaptionNodes > 0
      ? uiText("capturingFound", languagePreference)
      : uiText("capturingHidden", languagePreference));
  } catch { setStatus(uiText("retry", languagePreference), true); }
}

async function stopMeeting() {
  if (activeTabId) await chrome.tabs.sendMessage(activeTabId, { type: "STOP_CAPTURE" }).catch(() => {});
  const customer = selectedCustomer();
  if (!customer) return setStatus(uiText("saveCustomerFirst", languagePreference), true);
  const result = summarizeMeeting(segments, suggestions, languagePreference);
  const meetingTab = activeTabId ? await chrome.tabs.get(activeTabId).catch(() => null) : null;
  const payload = {
    customerId: customer.id,
    source: `chrome-extension-${platformFromUrl(meetingTab?.url)}`,
    meetingUrl: meetingTab?.url || null,
    startedAt,
    endedAt: new Date().toISOString(),
    ownerId: null,
    consentConfirmed: true,
    transcriptSegments: segments,
    qaInteractions,
    insights: suggestions,
    ...result
  };
  try {
    const saved = await saveMeeting(payload);
    lastSavedPayload = { ...payload, savedRecord: saved };
    $("summary").textContent = result.summary;
    $("actionsList").innerHTML = result.actionItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${uiText("noActions", languagePreference)}</li>`;
    $("resultPanel").classList.remove("hidden");
    $("saveState").textContent = saved.syncStatus === "mock-saved" ? uiText("mockSaved", languagePreference) : uiText("saved", languagePreference);
    setStatus(uiText("completed", languagePreference));
  } catch (error) { setStatus(uiText("saveFailed", languagePreference, { error: error.message }), true); }
  activeTabId = null;
  chrome.runtime.sendMessage({ type: "SESSION_STOP" });
  $("startMeeting").disabled = false;
  $("stopMeeting").disabled = true;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "EXTENSION_UPDATE_STATUS") renderUpdate(message.update);
  if (message.type === "MEETING_CAPTION" && message.tabId === activeTabId) {
    const previous = segments.at(-1);
    const extendsPrevious = previous
      && previous.speaker === message.caption.speaker
      && message.caption.text.startsWith(previous.text)
      && new Date(message.caption.capturedAt) - new Date(previous.capturedAt) < 6000;
    if (extendsPrevious) {
      segments[segments.length - 1] = message.caption;
      renderLive();
    } else if (!previous || previous.speaker !== message.caption.speaker || previous.text !== message.caption.text) {
      segments.push(message.caption);
      renderLive();
    }
  }
  if (message.type === "COACH_INTERACTION" && message.tabId === activeTabId) {
    if (!qaInteractions.some((item) => item.id === message.interaction.id)) qaInteractions.push(message.interaction);
    if (message.suggestions?.length) suggestions = message.suggestions;
    renderQaHistory();
  }
  if (message.type === "COACH_FEEDBACK" && message.tabId === activeTabId) {
    const interaction = qaInteractions.find((item) => item.id === message.interactionId);
    if (interaction) {
      interaction.feedback = message.feedback;
      interaction.feedbackAt = new Date().toISOString();
      renderQaHistory();
      chrome.runtime.sendMessage({ type: "SESSION_UPDATE", changes: { qaInteractions } });
    }
  }
  if (message.type === "MEETING_CAPTURE_HEALTH" && message.tabId === activeTabId && !segments.length) {
    setStatus(message.visibleCaptionNodes > 0
      ? uiText("captionsFound", languagePreference)
      : uiText("captionsMissing", languagePreference),
      message.visibleCaptionNodes === 0);
  }
});

$("dismissUpdate").addEventListener("click", async () => {
  const { extensionUpdate } = await chrome.storage.local.get("extensionUpdate");
  if (!extensionUpdate) return;
  const dismissed = { ...extensionUpdate, dismissedVersion: extensionUpdate.latestVersion };
  await chrome.storage.local.set({ extensionUpdate: dismissed });
  renderUpdate(dismissed);
});

$("settingsToggle").addEventListener("click", () => $("settingsPanel").classList.toggle("hidden"));
$("saveSettings").addEventListener("click", async () => {
  const previous = await chrome.storage.local.get("settings");
  const settings = { ...previous.settings, mode: $("mode").value, language: $("language").value, autoStart: $("autoStart").checked, popupEnabled: $("popupEnabled").checked, popupDuration: Number($("popupDuration").value), participantOnly: $("participantOnly").checked, apiBaseUrl: $("apiBaseUrl").value.trim(), accessToken: $("accessToken").value.trim() };
  if (settings.mode === "api") {
    const origin = new URL(settings.apiBaseUrl).origin + "/*";
    const allowed = await chrome.permissions.request({ origins: [origin] });
    if (!allowed) return setStatus(uiText("apiDenied", languagePreference), true);
  }
  await chrome.storage.local.set({ settings });
  languagePreference = settings.language;
  applySidepanelCopy(languagePreference);
  popupEnabled = settings.popupEnabled;
  popupDuration = settings.popupDuration;
  participantOnly = settings.participantOnly;
  await loadCustomers();
  setStatus(uiText("settingsSaved", languagePreference));
});
$("customerSearch").addEventListener("input", (event) => loadCustomers(event.target.value));
$("customerSelect").addEventListener("change", renderCustomer);
$("startMeeting").addEventListener("click", startMeeting);
$("stopMeeting").addEventListener("click", stopMeeting);
$("exportJson").addEventListener("click", () => {
  if (!lastSavedPayload) return setStatus(uiText("noExport", languagePreference), true);
  const blob = new Blob([JSON.stringify(lastSavedPayload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sales-copilot-meeting-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

async function restoreSession() {
  const { activeMeetingSession } = await chrome.storage.session.get("activeMeetingSession");
  if (!activeMeetingSession) return false;
  const tab = await chrome.tabs.get(activeMeetingSession.tabId).catch(() => null);
  if (!isMeetingUrl(tab?.url)) {
    await chrome.storage.session.remove("activeMeetingSession");
    return false;
  }
  activeTabId = activeMeetingSession.tabId;
  startedAt = activeMeetingSession.startedAt;
  segments = activeMeetingSession.segments || [];
  qaInteractions = activeMeetingSession.qaInteractions || [];
  languagePreference = activeMeetingSession.languagePreference || languagePreference;
  $("customerSelect").value = String(activeMeetingSession.customerId || "");
  renderCustomer();
  renderLive();
  renderQaHistory();
  $("startMeeting").disabled = true;
  $("stopMeeting").disabled = false;
  setStatus(uiText("restored", languagePreference));
  return true;
}

await loadSettings();
await loadUpdateStatus();
knowledgeArticles = await loadKnowledgeBase().catch(() => []);
await loadCustomers();
const meetTab = await findMeetTab();
if (!await restoreSession()) setStatus(meetTab ? uiText("meetingFound", languagePreference) : uiText("waitingMeeting", languagePreference));
