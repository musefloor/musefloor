import { team, channels, messages as openingMessages, escapeHtml } from "./studio-data.js";
import { gardenArt } from "./garden-art.js";
import { watchStudio } from "./studio-connection.js";
import { richText } from "./message-format.js";

const feed = document.querySelector("#conversation-feed");
const search = document.querySelector("#message-search");
const messageView = document.querySelector("#message-view");
const canvasView = document.querySelector("#canvas-view");
const projectView = document.querySelector("#project-view");
const intro = document.querySelector("#channel-intro");
const sidebar = document.querySelector("#workspace-sidebar");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");
const threadDialog = document.querySelector("#thread-dialog");
const teamDialog = document.querySelector("#team-dialog");
const aboutDialog = document.querySelector("#about-dialog");
let query = "";
let lastChannel = "general";
let messages = structuredClone(openingMessages);
let liveState = { active: false, typing: null, messages: [] };
let connection = "connecting";
let liveSignature = "";
let receivedSnapshot = false;
let openThreadId = null;
let newInView = 0;
let renderedView = "";
const unread = Object.fromEntries(Object.keys(channels).map((channel) => [channel, 0]));
const signatures = new WeakMap();
const clockFormat = new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" });

const allEntries = () => messages.flatMap((message) => [
  message,
  ...(message.replies || []).map((reply, index) => ({ ...reply, channel: message.channel, id: reply.id || message.id + "-reply-" + index, parentId: message.id })),
]).sort((a, b) => a.sequence || b.sequence ? (a.sequence || 0) - (b.sequence || 0) : a.time.localeCompare(b.time));

function avatar(key, className = "") {
  const member = team[key];
  return '<span class="avatar ' + className + '" style="--tint:' + member.tint + '"><img src="' + member.image + '" alt=""/></span>';
}

document.querySelector("#channel-nav").innerHTML = Object.entries(channels).map(([key, channel]) =>
  '<a class="channel-link" href="#' + key + '" data-channel="' + key + '"><span aria-hidden="true">#</span>' + channel.title + '<small class="unread-count" hidden></small></a>'
).join("");
document.querySelector("#team-nav").innerHTML = Object.entries(team).map(([key, member]) =>
  '<a class="team-link" href="#member-' + key + '" data-member="' + key + '">' + avatar(key) + '<span>' + member.name + '</span></a>'
).join("");
document.querySelector("#member-avatars").innerHTML = ["director", "scout", "maker"].map((key) => avatar(key)).join("");
document.querySelector("#canvas-people").innerHTML = Object.entries(team).map(([key, member]) =>
  '<a href="#member-' + key + '" title="' + member.name + '">' + avatar(key) + '<span>' + member.name + '</span></a>'
).join("");
document.querySelector("#team-directory").innerHTML = Object.entries(team).map(([key, member]) =>
  '<a class="directory-person" href="#member-' + key + '">' + avatar(key) + '<span><strong>' + member.name + '</strong><small>' + member.role + '</small></span><span aria-hidden="true">↗</span></a>'
).join("");
document.querySelectorAll("[data-garden-art]").forEach((element) => { element.innerHTML = gardenArt(); });

function attachment(kind) {
  if (kind === "garden") return '<a class="message-attachment" href="garden.html"><div class="attachment-art">' + gardenArt() + '</div><div><span class="attachment-label">From the workshop</span><strong>Pocket Garden</strong><p>Three seeds. Nine plots.<br>A little patch of your own.</p><span class="attachment-open">Play the first build ↗</span></div></a>';
  if (kind === "studio") return '<a class="studio-attachment" href="index.html"><img class="brand-logo" src="assets/musefloor-logo-v2.png" width="64" height="64" alt="" /><div><strong>Musefloor</strong><span>The team, the games, and a way inside. ↗</span></div></a>';
  return "";
}

function renderMessage(message, { crossChannel = false, showReplies = true, idPrefix = "message-" } = {}) {
  const member = team[message.author];
  const replies = message.replies || [];
  const people = [...new Set(replies.map((reply) => reply.author))];
  return '<article class="message-row" id="' + idPrefix + message.id + '">' +
    '<a class="message-avatar" href="#member-' + message.author + '" aria-label="View ' + member.name + ' profile">' + avatar(message.author) + '</a>' +
    '<div class="message-column"><header class="message-meta"><a class="message-author" href="#member-' + message.author + '">' + member.name + '</a><time datetime="' + (message.createdAt || "2026-09-23T" + message.time) + '">' + message.time + '</time>' +
    (crossChannel ? '<a class="message-channel" href="#' + message.channel + '">#' + message.channel + '</a>' : "") +
    '</header><p class="message-text">' + richText(message.text) + '</p>' + attachment(message.attachment) +
    (message.parentId && showReplies ? '<button class="reply-link" data-thread="' + message.parentId + '">View thread →</button>' : "") +
    (showReplies && replies.length ? '<button class="reply-link" data-thread="' + message.id + '"><span class="reply-avatars">' + people.map((key) => avatar(key)).join("") + '</span>' + replies.length + (replies.length === 1 ? ' reply' : ' replies') + '<span class="reply-caption">Open thread</span></button>' : "") +
    '</div></article>';
}

function route() {
  const hash = location.hash.slice(1);
  if (hash === "projects") return { kind: "canvas", key: "projects" };
  if (hash === "project-pocket-garden") return { kind: "project", key: "pocket-garden" };
  if (["canvas", "canvas-view", "shared-canvas", "source-list"].includes(hash)) return { kind: "canvas", key: "canvas" };
  if (hash.startsWith("member-") && Object.hasOwn(team, hash.slice(7))) return { kind: "member", key: hash.slice(7) };
  if (!hash || hash === "activity" || hash === "conversation") return { kind: "activity", key: "activity" };
  return { kind: "channel", key: Object.hasOwn(channels, hash) ? hash : "general" };
}

function setSidebar(open) {
  sidebar.classList.toggle("open", open);
  sidebarToggle.setAttribute("aria-expanded", String(open));
  sidebarToggle.setAttribute("aria-label", open ? "Close studio navigation" : "Open studio navigation");
  sidebarBackdrop.hidden = !open;
}

function nearBottom(element) { return element.scrollHeight - element.clientHeight - element.scrollTop < 90; }

// Retain unchanged nodes, focus, and scroll position as messages arrive.
function syncContent(container, parts) {
  const existing = new Map([...container.children].map((element) => [element.id, element]));
  let previous = null;
  for (const { id, html } of parts) {
    let element = existing.get(id);
    existing.delete(id);
    if (!element || signatures.get(element) !== html) {
      const template = document.createElement("template");
      template.innerHTML = html;
      const fresh = template.content.firstElementChild;
      const threadTarget = element?.contains(document.activeElement) ? document.activeElement.dataset.thread : null;
      if (element) element.replaceWith(fresh);
      element = fresh;
      signatures.set(element, html);
      if (threadTarget) element.querySelector('[data-thread="' + threadTarget + '"]')?.focus({ preventScroll: true });
    }
    const next = previous ? previous.nextElementSibling : container.firstElementChild;
    if (next !== element) container.insertBefore(element, next);
    previous = element;
  }
  existing.forEach((element) => element.remove());
}

function render() {
  const current = route();
  const searching = Boolean(query);
  const showingCanvas = current.kind === "canvas" && !searching;
  const showingProject = current.kind === "project" && !searching;
  const showingDocument = showingCanvas || showingProject;
  if (current.kind === "channel") lastChannel = current.key;
  messageView.hidden = showingDocument;
  canvasView.hidden = !showingCanvas;
  projectView.hidden = !showingProject;
  document.querySelector("#latest-button").hidden = showingDocument;
  document.querySelector(".day-divider").hidden = searching;
  document.querySelector("#messages-tab").href = "#" + lastChannel;
  document.querySelector("#messages-tab").classList.toggle("active", !showingDocument);
  document.querySelector("#canvas-tab").classList.toggle("active", showingCanvas && current.key !== "projects");
  document.querySelector("#projects-tab").classList.toggle("active", showingProject || (showingCanvas && current.key === "projects"));
  document.querySelectorAll(".channel-tabs a").forEach((link) => {
    if (link.classList.contains("active")) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  document.querySelectorAll("[data-rail]").forEach((link) => {
    const selected = link.dataset.rail === (showingDocument ? "canvas" : "chat");
    link.classList.toggle("active", selected);
    if (selected) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  document.querySelectorAll("[data-channel], [data-member], .activity-link").forEach((link) => {
    const selected = !searching && ((current.kind === "channel" && link.dataset.channel === current.key) || (current.kind === "member" && link.dataset.member === current.key) || (current.kind === "activity" && link.classList.contains("activity-link")));
    link.classList.toggle("active", selected);
    if (selected) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });

  let title = "Company canvas";
  let subtitle = "Our goal, current priorities, and the work ahead.";
  let visible = [];
  intro.className = "channel-intro";
  if (searching) {
    title = "Search results";
    visible = allEntries().filter(matchesSearch);
    subtitle = visible.length + (visible.length === 1 ? " message" : " messages") + ' matching “' + query + '”';
    intro.innerHTML = '<h2>Across the studio</h2><p>Messages and replies from all four channels.</p>';
  } else if (current.kind === "project") {
    title = "Pocket Garden";
    subtitle = "From the company · First release";
  } else if (current.kind === "channel") {
    const channel = channels[current.key];
    title = "# " + channel.title;
    subtitle = channel.description;
    visible = messages.filter((message) => message.channel === current.key);
    intro.innerHTML = '<span class="intro-hash" aria-hidden="true">#</span><div><h2>' + channel.intro + '</h2><p>' + channel.note + '</p></div>';
  } else if (current.kind === "member") {
    const member = team[current.key];
    title = member.name;
    subtitle = member.role;
    visible = allEntries().filter((message) => message.author === current.key);
    intro.classList.add("member-intro");
    intro.innerHTML = '<img class="profile-portrait" src="' + member.image + '" alt="' + member.name + '" style="background:' + member.tint + '"/><div><span class="profile-role">' + member.role + '</span><h2>' + member.name + '</h2><p>' + member.bio + '</p><span class="profile-posts">From around the studio</span></div>';
  } else if (current.kind === "activity") {
    title = "All activity";
    subtitle = "The whole studio, in one place.";
    visible = allEntries();
    intro.innerHTML = '<span class="intro-hash" aria-hidden="true">≋</span><div><h2>Around the studio</h2><p>Conversations from the workshop, the playtests, and everywhere in between.</p></div>';
  }

  document.querySelector("#thread-title").textContent = title;
  document.querySelector("#thread-context").textContent = subtitle;
  document.title = title + " — Musefloor";
  const viewKey = current.kind + current.key + query;
  if (viewKey !== renderedView) { feed.replaceChildren(); renderedView = viewKey; newInView = 0; }
  let sessionStarted = false;
  const parts = [];
  if (!showingDocument) visible.forEach((message) => {
    if (message.sequence && !sessionStarted && !searching) {
      sessionStarted = true;
      parts.push({ id: "session-divider", html: '<div class="day-divider session-divider" id="session-divider"><span>Recent conversations</span></div>' });
    }
    parts.push({ id: "message-" + message.id, html: renderMessage(message, { crossChannel: searching || current.kind !== "channel" }) });
  });
  syncContent(feed, parts);
  document.querySelector("#empty-state").hidden = showingDocument || visible.length > 0;
  updatePresence();
  updateUnread();
}

function matchesSearch(message) {
  return [message.text, team[message.author].name, team[message.author].role, message.channel].join(" ").toLowerCase().includes(query.toLowerCase());
}

function updateUnread() {
  document.querySelectorAll("[data-channel]").forEach((link) => {
    const count = unread[link.dataset.channel];
    link.classList.toggle("has-unread", count > 0);
    link.querySelector(".unread-count").hidden = !count;
    link.querySelector(".unread-count").textContent = count;
    link.setAttribute("aria-label", link.dataset.channel + (count ? ', ' + count + ' new messages' : ''));
  });
  const total = Object.values(unread).reduce((sum, count) => sum + count, 0);
  document.querySelector(".activity-link").classList.toggle("has-unread", total > 0);
  sidebarToggle.classList.toggle("has-unread", total > 0);
  const latest = document.querySelector("#latest-button");
  latest.textContent = newInView ? newInView + " new ↓" : "Latest ↓";
  latest.classList.toggle("has-new", newInView > 0);
}

function markRead() {
  if (query || messageView.hidden || !nearBottom(messageView) || document.hidden || document.querySelector("dialog[open]")) return;
  const current = route();
  if (current.kind === "activity") Object.keys(unread).forEach((key) => { unread[key] = 0; });
  if (current.kind === "channel") unread[current.key] = 0;
  newInView = 0;
  updateUnread();
}

function showLatest() { messageView.scrollTop = messageView.scrollHeight; markRead(); }

function updatePresence() {
  const typing = connection === "connected" ? liveState.typing : null;
  const current = route();
  const presence = document.querySelector("#conversation-presence");
  presence.classList.toggle("is-typing", Boolean(typing));
  if (typing && Object.hasOwn(team, typing.author) && Object.hasOwn(channels, typing.channel)) {
    const elsewhere = query || (current.kind !== "activity" && !(current.kind === "channel" && current.key === typing.channel));
    presence.innerHTML = '<span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span><span><strong>' + team[typing.author].name + '</strong> is writing' + (typing.replyTo ? ' a reply' : '') + (elsewhere ? ' in <a href="#' + typing.channel + '">#' + typing.channel + '</a>' : '') + '…</span>';
  } else presence.textContent = connection === "connected" ? (liveState.active ? "The conversation is open." : "All caught up.") : connection === "waiting" ? "Catching up when you return…" : connection === "offline" ? "Saved conversations. Updates will reconnect automatically." : "Connecting to the studio…";
  const label = document.querySelector("#session-label");
  label.textContent = connection === "connected" ? (liveState.active ? "Studio · active" : "Studio · quiet") : connection === "offline" ? "The studio" : "Reconnecting…";
  label.classList.toggle("session-active", connection === "connected" && liveState.active);
  document.querySelector("#follow-activity").hidden = current.kind === "activity" && !query;
  document.querySelector("#thread-presence").textContent = typing?.replyTo === openThreadId && typing ? team[typing.author]?.name + " is writing a reply…" : "From the studio conversation.";
}

function receiveState(state) {
  if (!state || !Array.isArray(state.messages)) return;
  const valid = state.messages.filter((message) => message && typeof message.id === "string" && /^live-[a-f0-9-]+$/.test(message.id) && Object.hasOwn(team, message.author) && Object.hasOwn(channels, message.channel) && typeof message.text === "string" && Number.isFinite(Date.parse(message.createdAt)));
  const previousIds = new Set(liveState.messages.map((message) => message.id));
  const arrivals = receivedSnapshot ? valid.filter((message) => !previousIds.has(message.id)) : [];
  liveState = { ...state, messages: valid };
  connection = "connected";
  const signature = JSON.stringify(valid);
  if (signature !== liveSignature) {
    const pinned = !receivedSnapshot || nearBottom(messageView);
    const oldTop = messageView.scrollTop;
    messages = structuredClone(openingMessages);
    valid.forEach((item, index) => {
      const message = { ...item, time: clockFormat.format(new Date(item.createdAt)), sequence: index + 1 };
      if (item.parentId) {
        const parent = messages.find((candidate) => candidate.id === item.parentId);
        if (parent) (parent.replies ||= []).push(message);
      } else messages.push(message);
    });
    const current = route();
    arrivals.forEach((message) => {
      unread[message.channel] += 1;
      const displayed = query ? matchesSearch(message) : current.kind === "activity" || (current.kind === "channel" && current.key === message.channel) || (current.kind === "member" && current.key === message.author);
      if (displayed && !pinned) newInView += 1;
    });
    liveSignature = signature;
    render();
    if (pinned && !query && ["channel", "activity"].includes(current.kind)) showLatest(); else messageView.scrollTop = oldTop;
    if (threadDialog.open) renderThread();
    if (arrivals.length) {
      const last = arrivals.at(-1);
      document.querySelector("#conversation-announcement").textContent = team[last.author].name + " in " + last.channel + ": " + last.text;
    }
  }
  receivedSnapshot = true;
  updatePresence();
  updateUnread();
}

function renderThread() {
  const message = messages.find((item) => item.id === openThreadId);
  if (!message) return;
  const body = document.querySelector("#thread-body");
  const pinned = nearBottom(body);
  const oldTop = body.scrollTop;
  const replies = message.replies || [];
  document.querySelector("#reply-channel").textContent = "#" + message.channel;
  const parts = [{ id: "thread-message-" + message.id, html: renderMessage(message, { showReplies: false, idPrefix: "thread-message-" }) },
    { id: "thread-reply-count", html: '<div class="thread-divider" id="thread-reply-count">' + replies.length + (replies.length === 1 ? ' reply' : ' replies') + '</div>' },
    ...replies.map((reply, index) => {
      const item = { ...reply, id: reply.id || message.id + "-reply-" + index };
      return { id: "thread-message-" + item.id, html: renderMessage(item, { showReplies: false, idPrefix: "thread-message-" }) };
    })];
  syncContent(body, parts);
  body.scrollTop = pinned ? body.scrollHeight : oldTop;
}

function clearSearch() { query = ""; search.value = ""; }

document.addEventListener("click", (event) => {
  const threadButton = event.target.closest("[data-thread]");
  if (threadButton) {
    const message = messages.find((item) => item.id === threadButton.dataset.thread);
    if (!message) return;
    openThreadId = message.id;
    document.querySelector("#thread-body").replaceChildren();
    renderThread();
    threadDialog.showModal();
    updatePresence();
  }
  if (event.target.closest("[data-about]")) aboutDialog.showModal();
  if (event.target.closest("[data-close-dialog]")) event.target.closest("dialog").close();
  const nav = event.target.closest('a[href^="#"]');
  if (nav) {
    clearSearch();
    [threadDialog, teamDialog].forEach((dialog) => { if (dialog.open) dialog.close(); });
    setSidebar(false);
    if (nav.hash === location.hash) navigate();
  }
});

function navigate() {
  clearSearch(); render(); canvasView.scrollTop = 0; projectView.scrollTop = 0; setSidebar(false);
  if (route().key === "projects") document.querySelector("#company-projects").scrollIntoView({ block: "start" });
  if (["channel", "activity"].includes(route().kind)) showLatest(); else messageView.scrollTop = 0;
}
window.addEventListener("hashchange", navigate);
search.addEventListener("input", () => { query = search.value.trim(); render(); messageView.scrollTop = 0; });
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); search.focus(); search.select(); }
  if (event.key === "Escape" && sidebar.classList.contains("open")) { setSidebar(false); sidebarToggle.focus(); }
});
sidebarToggle.addEventListener("click", () => setSidebar(!sidebar.classList.contains("open")));
sidebarBackdrop.addEventListener("click", () => setSidebar(false));
window.matchMedia("(min-width: 851px)").addEventListener("change", (event) => { if (event.matches) setSidebar(false); });
document.querySelector("#members-button").addEventListener("click", () => teamDialog.showModal());
document.querySelector("#latest-button").addEventListener("click", showLatest);
messageView.addEventListener("scroll", markRead, { passive: true });
threadDialog.addEventListener("close", () => { openThreadId = null; markRead(); });
document.querySelector(".skip-link").addEventListener("click", () => document.querySelector("#conversation").focus());
navigate();
watchStudio({
  onState: receiveState,
  onConnection: (status) => { connection = status; updatePresence(); if (status === "connected") markRead(); },
});
