async function request(path, options = {}) {
  const { settings = {} } = await chrome.storage.local.get("settings");
  if (settings.mode === "mock") return null;
  const { timeoutMs = 5000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(settings.accessToken ? { Authorization: `Bearer ${settings.accessToken}` } : {}),
        ...(fetchOptions.headers || {})
      }
    });
    if (!response.ok) throw new Error(`API isteği başarısız (${response.status})`);
    return response.status === 204 ? null : response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("API yanıt süresi aşıldı");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getCustomers(query = "") {
  const { settings = {}, mockCustomers = [] } = await chrome.storage.local.get(["settings", "mockCustomers"]);
  if (settings.mode === "mock") {
    const normalized = query.toLocaleLowerCase("tr-TR");
    return mockCustomers.filter((item) => `${item.name} ${item.contact}`.toLocaleLowerCase("tr-TR").includes(normalized));
  }
  const result = await request(`/customers?active=true&search=${encodeURIComponent(query)}`);
  return result.items || result;
}

export async function analyzeWithApi(payload) {
  return request("/meetings/analyze", { method: "POST", body: JSON.stringify(payload), timeoutMs: 4000 });
}

export async function saveMeeting(payload) {
  const { settings = {}, mockMeetings = [] } = await chrome.storage.local.get(["settings", "mockMeetings"]);
  if (settings.mode === "mock") {
    const record = { ...payload, id: crypto.randomUUID(), createdAt: new Date().toISOString(), syncStatus: "mock-saved" };
    await chrome.storage.local.set({ mockMeetings: [record, ...mockMeetings] });
    return record;
  }
  return request("/meetings", { method: "POST", body: JSON.stringify(payload) });
}
