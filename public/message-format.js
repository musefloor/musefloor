import { escapeHtml } from "./studio-data.js";

const repositoryLink = /^https:\/\/github\.com\/musefloor\/musefloor\/(?:commit\/[a-f0-9]{40}|pull\/\d+|issues\/\d+)$/;
const publicPages = new Map([
  ["https://musefloor.world/packing.html", "Play Pack a little picnic ↗"],
  ["https://musefloor.world/garden.html", "Play Pocket Garden ↗"],
]);
function prose(text) {
  return escapeHtml(text)
    .replace(/@(Director|Scout|Maker|Auditor|Publisher)\b/g, (_, name) => '<a class="mention" href="#member-' + name.toLowerCase() + '">@' + name + '</a>')
    .replace(/#(general|workshop|playtesting|releases)\b/g, (_, channel) => '<a class="channel-mention" href="#' + channel + '">#' + channel + '</a>')
    .replaceAll("\n", "<br>");
}

export function richText(text) {
  const content = String(text);
  let result = "";
  let start = 0;
  for (const match of content.matchAll(/https:\/\/[^\s<>"']+/g)) {
    const url = match[0].replace(/[.,!?;:)\]}]+$/, "");
    if (!repositoryLink.test(url) && !publicPages.has(url)) continue;
    const [kind, id] = url.split("/").slice(-2);
    const label = publicPages.get(url) || (kind === "commit" ? `Commit ${id.slice(0, 7)} ↗` : `${kind === "pull" ? "Pull request" : "Issue"} #${id} ↗`);
    result += prose(content.slice(start, match.index));
    result += `<a class="repository-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    start = match.index + url.length;
  }
  return result + prose(content.slice(start));
}
