let collecting = false;
let observer = null;
let scanTimer = null;
let popupTimer = null;
let currentPopup = null;
const popupQueue = [];
const recentKeys = new Map();
const pendingBySpeaker = new Map();
const emittedBySpeaker = new Map();

const platform = location.hostname === "meet.google.com" ? "google-meet"
  : location.hostname.includes("teams") ? "microsoft-teams" : "zoom";
const adapters = {
  "google-meet": {
    label: "Google Meet",
    captions: ["[data-caption-text]", ".ygicle.VbkSUe", ".ygicle"],
    container: "[data-participant-id], .a4cQT, .nMcdL, .TBMuR",
    speaker: "[data-self-name], .NWpY1d, .zs7s8d"
  },
  "microsoft-teams": {
    label: "Microsoft Teams",
    captions: ["[data-tid='closed-caption-text']", "[data-tid='caption-text']", "[data-tid*='closed-caption'] [dir='auto']"],
    container: "[data-tid*='closed-caption'], [data-tid*='caption']",
    speaker: "[data-tid*='speaker'], [data-tid*='display-name'], strong"
  },
  zoom: {
    label: "Zoom",
    captions: [".live-transcription-subtitle__item", ".new-LT-item", "[class*='live-transcription'] [class*='text']", "[aria-live='polite'] [class*='caption']"],
    container: "[class*='live-transcription'], [class*='caption']",
    speaker: "[class*='speaker'], [class*='display-name'], strong"
  }
};
const adapter = adapters[platform];
const captionSelectors = adapter.captions;

function cleanSpeaker(value) {
  return String(value || "Konuşmacı")
    .replace(/\b(arrow_downward|scroll to bottom|en alta git)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "Konuşmacı";
}

function cleanCaptionText(value, speaker) {
  let text = String(value || "")
    .replace(/\b(arrow_downward|keyboard_arrow_down|expand_more)\b/gi, " ")
    .replace(/\b(en alta git|alta kaydır|scroll to bottom|jump to bottom)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const escapedSpeaker = speaker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  text = text.replace(new RegExp(`^${escapedSpeaker}[,:]?\\s*`, "i"), "").trim();
  // Meet sometimes prepends the localized self label to the caption text.
  text = text.replace(/^(siz|you)[,:]?\s*/i, "").trim();
  return text;
}

function captionFromTarget(target) {
  if (!target) return null;
  const container = target.closest(adapter.container) || target.parentElement;
  const speakerNode = container?.querySelector?.(adapter.speaker);
  const rawSpeaker = cleanSpeaker(speakerNode?.textContent);
  const role = /^(siz|you|ben|me)$/i.test(rawSpeaker) || speakerNode?.hasAttribute?.("data-self-name") ? "sales" : "participant";
  const speaker = rawSpeaker;
  const text = cleanCaptionText(target.textContent, speaker);
  if (!text || text.length < 2) return null;
  return { speaker, role, text, platform, capturedAt: new Date().toISOString() };
}

function readCaptions(node) {
  if (!(node instanceof Element)) return [];
  const selector = captionSelectors.join(",");
  const targets = node.matches(selector) ? [node] : [...node.querySelectorAll(selector)];
  // Multiple selectors may address the same nested caption; keep the deepest text leaves.
  return targets
    .filter((target) => !target.querySelector(selector))
    .map(captionFromTarget)
    .filter(Boolean);
}

function queueCaption(caption) {
  if (emittedBySpeaker.get(caption.speaker) === caption.text) return;
  const existing = pendingBySpeaker.get(caption.speaker);
  if (existing?.text === caption.text) return;
  if (existing?.timer) clearTimeout(existing.timer);
  const firstSeenAt = existing?.firstSeenAt || Date.now();
  const flush = () => {
    const pending = pendingBySpeaker.get(caption.speaker);
    if (!pending || !collecting) return;
    const key = `${pending.speaker}:${pending.text.toLocaleLowerCase("tr-TR")}`;
    const now = Date.now();
    if (now - (recentKeys.get(key) || 0) >= 10000) {
      recentKeys.set(key, now);
      emittedBySpeaker.set(pending.speaker, pending.text);
      chrome.runtime.sendMessage({
        type: "MEETING_CAPTION",
        caption: { speaker: pending.speaker, role: pending.role, text: pending.text, platform, capturedAt: new Date().toISOString() }
      });
    }
    pendingBySpeaker.delete(caption.speaker);
    for (const [savedKey, timestamp] of recentKeys) if (now - timestamp > 30000) recentKeys.delete(savedKey);
  };
  const elapsed = Date.now() - firstSeenAt;
  const timer = setTimeout(flush, elapsed >= 1600 ? 0 : 450);
  pendingBySpeaker.set(caption.speaker, { ...caption, firstSeenAt, timer });
}

function scanCaptions() {
  if (!collecting) return 0;
  const nodes = document.querySelectorAll(captionSelectors.join(","));
  const leaves = [...nodes].filter((node) => !node.querySelector(captionSelectors.join(",")));
  const latestBySpeaker = new Map();
  for (const node of leaves) {
    const caption = captionFromTarget(node);
    if (caption) latestBySpeaker.set(caption.speaker, caption);
  }
  for (const caption of latestBySpeaker.values()) queueCaption(caption);
  return leaves.length;
}

function startObserver() {
  observer?.disconnect();
  observer = new MutationObserver((mutations) => {
    if (!collecting) return;
    for (const mutation of mutations) {
      const element = mutation.type === "characterData" ? mutation.target.parentElement : mutation.target;
      for (const caption of readCaptions(element)) queueCaption(caption);
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        for (const caption of readCaptions(node)) queueCaption(caption);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  clearInterval(scanTimer);
  scanTimer = setInterval(() => {
    const visibleCaptionNodes = scanCaptions();
    chrome.runtime.sendMessage({ type: "MEETING_CAPTURE_HEALTH", visibleCaptionNodes });
  }, 800);
  scanCaptions();
}

function stopCapture() {
  collecting = false;
  observer?.disconnect();
  observer = null;
  clearInterval(scanTimer);
  scanTimer = null;
  for (const pending of pendingBySpeaker.values()) clearTimeout(pending.timer);
  pendingBySpeaker.clear();
  popupQueue.length = 0;
  closeCoachPopup();
  renderCaptureControl();
}

function renderCaptureControl() {
  let control = document.getElementById("sales-copilot-capture-control");
  if (!control) {
    control = document.createElement("button");
    control.id = "sales-copilot-capture-control";
    control.style.cssText = "position:fixed;z-index:2147483646;top:12px;left:50%;transform:translateX(-50%);padding:8px 12px;border:1px solid #4c7562;border-radius:999px;background:#13221c;color:#f4f8f6;font:600 11px Arial,sans-serif;box-shadow:0 8px 25px rgba(0,0,0,.3);cursor:pointer";
    control.addEventListener("click", async () => {
      if (collecting) {
        stopCapture();
        await chrome.storage.local.get("settings").then(({ settings = {} }) => chrome.storage.local.set({ settings: { ...settings, autoStart: false } }));
        chrome.runtime.sendMessage({ type: "AUTO_CAPTURE_TOGGLED", collecting: false, platform, url: location.href });
        return;
      }
      const { settings = {} } = await chrome.storage.local.get("settings");
      let consentAcknowledged = Boolean(settings.consentAcknowledged);
      if (!consentAcknowledged) consentAcknowledged = confirm("Katılımcıları toplantı notlarının işlendiği konusunda bilgilendirdiğinizi onaylıyor musunuz?");
      if (!consentAcknowledged) return;
      await chrome.storage.local.set({ settings: { ...settings, autoStart: true, consentAcknowledged: true } });
      collecting = true;
      startObserver();
      renderCaptureControl();
      chrome.runtime.sendMessage({ type: "AUTO_CAPTURE_TOGGLED", collecting: true, platform, url: location.href });
    });
    document.documentElement.appendChild(control);
  }
  control.textContent = collecting ? `Sales Copilot aktif · Durdur (${adapter.label})` : `Sales Copilot kapalı · Başlat (${adapter.label})`;
  control.style.borderColor = collecting ? "#63b68c" : "#8b6b58";
}

function closeCoachPopup() {
  clearTimeout(popupTimer);
  const popup = document.getElementById("sales-copilot-live-alert");
  if (!popup) {
    currentPopup = null;
    showNextPopup();
    return;
  }
  popup.style.opacity = "0";
  popup.style.transform = "translateY(-8px)";
  popup.style.transition = "opacity .2s ease,transform .2s ease";
  setTimeout(() => {
    popup.remove();
    currentPopup = null;
    showNextPopup();
  }, 220);
}

function sendPopupFeedback(alert, feedback) {
  if (!alert.id) return;
  chrome.runtime.sendMessage({ type: "COACH_FEEDBACK", interactionId: alert.id, feedback });
}

function showNextPopup() {
  if (currentPopup || !popupQueue.length) return;
  const { alert, duration } = popupQueue.shift();
  currentPopup = alert;
  const popup = document.createElement("aside");
  popup.id = "sales-copilot-live-alert";
  popup.setAttribute("role", "status");
  popup.setAttribute("aria-live", "polite");
  const accent = alert.kind === "question" ? "#69a7d0" : alert.kind === "request" ? "#e1a548" : "#78a98a";
  popup.style.cssText = `position:fixed;z-index:2147483647;top:20px;right:20px;width:min(390px,calc(100vw - 40px));padding:16px;border:1px solid ${accent};border-radius:14px;background:#13221c;color:#f4f8f6;box-shadow:0 18px 55px rgba(0,0,0,.38);font-family:Arial,sans-serif;animation:salesCopilotIn .2s ease-out`;
  const style = document.createElement("style");
  style.textContent = "@keyframes salesCopilotIn{from{opacity:0;transform:translateY(-10px) scale(.98)}to{opacity:1;transform:none}}";
  const label = document.createElement("small");
  label.textContent = `SALES COPILOT · ${alert.speaker || "Konuşmacı"}`;
  label.style.cssText = `display:block;margin-bottom:7px;color:${accent};font-size:10px;font-weight:700;letter-spacing:.08em`;
  const title = document.createElement("strong");
  title.textContent = alert.title;
  title.style.cssText = "display:block;margin-bottom:7px;font-size:14px";
  const answer = document.createElement("p");
  answer.textContent = alert.answer || alert.message;
  answer.style.cssText = "margin:0 0 9px;font-size:12px;line-height:1.5";
  const followUp = document.createElement("p");
  followUp.textContent = `→ ${alert.followUpQuestion || alert.message}`;
  followUp.style.cssText = "margin:0 0 9px;color:#c8e2d3;font-size:11px;line-height:1.45";
  const source = document.createElement("small");
  source.textContent = alert.sourceTitle ? `Kaynak: ${alert.sourceTitle} · Güven: ${alert.confidence}` : `Doğrulanmış kaynak yok · Güven: ${alert.confidence || "low"}`;
  source.style.cssText = "display:block;margin-bottom:10px;color:#9db2a8;font-size:9px";
  const controls = document.createElement("div");
  controls.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
  const button = (text, action) => {
    const element = document.createElement("button");
    element.textContent = text;
    element.style.cssText = "padding:6px 8px;border:0;border-radius:7px;background:#263b32;color:#f4f8f6;font-size:10px;cursor:pointer";
    element.addEventListener("click", action);
    return element;
  };
  const pin = button("Sabitle", () => { clearTimeout(popupTimer); pin.textContent = "Sabitlendi"; });
  const copy = button("Kopyala", async () => { await navigator.clipboard.writeText(alert.answer || alert.message); copy.textContent = "Kopyalandı"; });
  const useful = button("İşe yaradı", () => { sendPopupFeedback(alert, "useful"); closeCoachPopup(); });
  const wrong = button("Yanlıştı", () => { sendPopupFeedback(alert, "incorrect"); closeCoachPopup(); });
  const close = button("Kapat", closeCoachPopup);
  controls.append(pin, copy, useful, wrong, close);
  popup.append(style, label, title, answer, followUp, source, controls);
  document.documentElement.appendChild(popup);
  popupTimer = setTimeout(closeCoachPopup, Math.max(2000, Math.min(Number(duration) || 3000, 5000)));
}

function queueCoachPopup(alert, duration = 3000) {
  if (popupQueue.some((item) => item.alert.id === alert.id) || currentPopup?.id === alert.id) return;
  popupQueue.push({ alert, duration });
  showNextPopup();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "START_CAPTURE") {
    collecting = true;
    recentKeys.clear();
    pendingBySpeaker.clear();
    emittedBySpeaker.clear();
    startObserver();
    renderCaptureControl();
    sendResponse({ ok: true, meetingUrl: location.href, visibleCaptionNodes: scanCaptions() });
  }
  if (message.type === "STOP_CAPTURE") {
    stopCapture();
    sendResponse({ ok: true });
  }
  if (message.type === "CAPTURE_STATUS") sendResponse({ collecting, meetingUrl: location.href });
  if (message.type === "SHOW_COACH_POPUP") {
    queueCoachPopup(message.alert || {}, message.duration);
    sendResponse({ ok: true });
  }
  return true;
});

renderCaptureControl();
chrome.storage.local.get("settings").then(({ settings = {} }) => {
  if (settings.autoStart !== false && settings.consentAcknowledged) {
    collecting = true;
    startObserver();
    renderCaptureControl();
    chrome.runtime.sendMessage({ type: "AUTO_CAPTURE_TOGGLED", collecting: true, platform, url: location.href });
  }
});
chrome.runtime.sendMessage({ type: "MEETING_PAGE_STATUS", ready: true, platform, url: location.href });
