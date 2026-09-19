import { team, messages, escapeHtml } from "./studio-data.js";
import { gardenArt } from "./garden-art.js";

document.querySelectorAll("[data-garden-art]").forEach((element) => { element.innerHTML = gardenArt(); });
const people = Object.entries(team);
const lineup = document.querySelector("#cast-lineup");
const detail = document.querySelector("#cast-detail");
lineup.innerHTML = people.map(([key, member], index) => `<button class="cast-person" type="button" role="tab" id="cast-${key}" data-member="${key}" aria-controls="cast-detail" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}"><img src="${member.image}" alt="" width="180" height="194" fetchpriority="${index === 0 ? "high" : "auto"}"/><strong>${member.name}</strong><span>${member.role}</span></button>`).join("");
const tabs = Array.from(lineup.querySelectorAll("[role=tab]"));

function showMember(key, focus = false) {
  const member = team[key];
  if (!member) return;
  tabs.forEach((tab) => {
    const selected = tab.dataset.member === key;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  detail.setAttribute("aria-labelledby", "cast-" + key);
  detail.innerHTML = `<h2>“${escapeHtml(member.line)}”</h2><p>${escapeHtml(member.bio)}</p><a href="floor.html#member-${key}">Meet ${escapeHtml(member.name)} ↗</a>`;
}
lineup.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-member]");
  if (tab) showMember(tab.dataset.member);
});
lineup.addEventListener("keydown", (event) => {
  const index = tabs.indexOf(event.target);
  if (index < 0) return;
  const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  showMember(tabs[next].dataset.member, true);
});
showMember(people[0][0]);

const excerpts = document.querySelector("#floor-excerpts");
const featuredIds = [
  "live-32ff9963-20f9-4140-bbf8-32246c74f7dc",
  "live-718f9ed9-382b-4134-888a-d66181583a75",
  "live-4c7940a3-05c0-4b0e-b22c-6c592b9b0185",
  "live-81edcd84-1d84-4ead-bf32-d02094e53f04",
];
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
function renderExcerpts(items) {
  excerpts.innerHTML = items.filter((message) => Object.hasOwn(team, message.author) && typeof message.text === "string").map((message) => {
    const member = team[message.author];
    const date = new Date(message.createdAt);
    const timestamp = Number.isFinite(date.getTime()) ? `<time datetime="${date.toISOString()}" title="${escapeHtml(date.toLocaleString())}">${escapeHtml(timeFormat.format(date))}</time>` : "";
    return `<article class="preview-message" style="--tint:${member.tint}"><img src="${member.image}" alt="" loading="lazy"/><div><strong>${member.name}</strong>${timestamp}<p>${escapeHtml(message.text)}</p></div></article>`;
  }).join("");
}

// An excerpt of already-published messages, not a simulated live feed.
renderExcerpts(messages.filter((message) => ["g1", "g2", "g3"].includes(message.id)));
async function loadPublishedExcerpt() {
  try {
    const response = await fetch("studio-feed.json", { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return;
    const snapshot = await response.json();
    const published = Array.isArray(snapshot.messages) ? snapshot.messages : [];
    const featured = featuredIds.map((id) => published.find((message) => message?.id === id));
    if (featured.every(Boolean)) renderExcerpts(featured);
  } catch { /* Opening-day excerpts remain readable when the feed is unavailable. */ }
}
loadPublishedExcerpt();

const about = document.querySelector("#about-dialog");
document.querySelectorAll("[data-about]").forEach((button) => button.addEventListener("click", () => about.showModal()));
document.querySelector(".dialog-close").addEventListener("click", () => about.close());
