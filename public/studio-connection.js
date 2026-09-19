import { studioDatabaseUrl } from "./studio-config.js";

// Firebase streams a snapshot followed by path updates. No publishing credential
// belongs in this client; the database grants visitors read access only.
export function patchSnapshot(snapshot, path, data) {
  const keys = path.split("/").filter(Boolean);
  if (keys.some((key) => ["__proto__", "prototype", "constructor"].includes(key))) throw new Error("Invalid update path");
  if (!keys.length) return data;
  const result = snapshot && typeof snapshot === "object" ? snapshot : {};
  let target = result;
  keys.slice(0, -1).forEach((key) => {
    if (!target[key] || typeof target[key] !== "object") target[key] = {};
    target = target[key];
  });
  if (data === null) delete target[keys.at(-1)]; else target[keys.at(-1)] = data;
  return result;
}

export function normalizeSnapshot(snapshot, now = Date.now()) {
  const data = snapshot || {};
  const active = Date.parse(data.activeUntil) > now;
  return {
    sessionId: data.sessionId || "muse-floor-v1",
    active,
    typing: active && Date.parse(data.typing?.until) > now ? data.typing : null,
    messages: Array.isArray(data.messages) ? data.messages : Object.entries(data.messages || {}).sort(([a], [b]) => Number(a) - Number(b)).map(([, message]) => message),
  };
}

export function watchStudio({ onState, onConnection }) {
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  let stream;
  let raw;
  let received = false;
  let lastProjection = "";
  let connection = "connecting";
  const setConnection = (value) => { connection = value; onConnection(value); };
  const emit = () => {
    const state = normalizeSnapshot(raw);
    const projection = JSON.stringify(state);
    if (projection !== lastProjection) { lastProjection = projection; onState(state); }
  };
  const fallback = async () => {
    if (received) return;
    try {
      const response = await fetch("studio-feed.json", { cache: "no-store" });
      if (!response.ok) return;
      const saved = await response.json();
      if (!received) { raw = saved; emit(); setConnection("offline"); }
    } catch { /* Existing opening notes remain available offline. */ }
  };
  const connect = () => {
    stream?.close();
    if (document.hidden) { setConnection("waiting"); return; }
    setConnection("connecting");
    stream = new EventSource(local ? "/api/studio/events" : studioDatabaseUrl);
    if (local) {
      stream.addEventListener("studio", (event) => {
        try { received = true; onState(JSON.parse(event.data)); setConnection("connected"); }
        catch { setConnection("offline"); }
      });
    } else {
      const update = (event, patch) => {
        try {
          const change = JSON.parse(event.data);
          if (patch) Object.entries(change.data || {}).forEach(([key, value]) => { raw = patchSnapshot(raw, change.path + "/" + key, value); });
          else raw = patchSnapshot(raw, change.path, change.data);
          received = true;
          emit();
          setConnection("connected");
        } catch { setConnection("offline"); }
      };
      stream.addEventListener("put", (event) => update(event, false));
      stream.addEventListener("patch", (event) => update(event, true));
      for (const name of ["cancel", "auth_revoked"]) stream.addEventListener(name, () => { stream.close(); setConnection("offline"); fallback(); });
    }
    stream.addEventListener("error", () => { setConnection("offline"); fallback(); });
  };
  const visibility = () => { if (document.hidden) { stream?.close(); setConnection("waiting"); } else connect(); };
  const timer = setInterval(() => { if (!local && received && connection === "connected") emit(); }, 1000);
  document.addEventListener("visibilitychange", visibility);
  const pagehide = () => stream?.close();
  const pageshow = (event) => { if (event.persisted) connect(); };
  window.addEventListener("pagehide", pagehide);
  window.addEventListener("pageshow", pageshow);
  connect();
  if (document.hidden) fallback();
  return () => {
    stream?.close(); clearInterval(timer);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("pagehide", pagehide);
    window.removeEventListener("pageshow", pageshow);
  };
}
