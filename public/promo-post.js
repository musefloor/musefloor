import { cleanHeadline, destination } from "./promo-model.js";

export function makePostKit(headline, takeId, extension) {
  if (typeof takeId !== "string" || takeId.length < 1 || takeId.length > 64 || /[^a-z0-9-]/.test(takeId) || !["mp4", "webm"].includes(extension)) throw new Error("Invalid take details.");
  const title = cleanHeadline(headline);
  const basename = `musefloor-lantern-${takeId}`;
  const caption = `${title}\n\nCatch a jarful of fireflies. Try the same round with a fresh jar.\n\n${destination}`;
  const description = `A silent Lantern Catch promo with the headline “${title}”. A jar moves beneath falling fireflies in a dusk scene and catches six lights in a scripted example. The final card reads “Your turn” and invites viewers to play the same round.`;
  const text = `MUSEFLOOR / LANTERN CATCH\nVideo: ${basename}.${extension}\nFormat: 720 × 900, approximately 10 seconds, silent\n\nCAPTION\n${caption}\n\nVISUAL DESCRIPTION\n${description}\n\nReview the recorded file before sharing. This is scripted example play, not a player recording. These notes belong to this take, not later headline edits. Nothing has been posted automatically.\n`;
  return Object.freeze({ headline: title, basename, caption, description, text });
}

export function setupPostKit(root, view) {
  const get = id => root.querySelector("#" + id);
  const buttons = ["copy-caption", "copy-description", "download-post-notes"];
  const downloads = new Map();
  let kit = null, revision = 0, operation = 0, pending = null;
  const status = text => { get("post-status").textContent = text; };
  const controls = () => { for (const id of buttons) get(id).disabled = !kit || pending !== null; };
  const invalidate = () => {
    revision++; operation++;
    if (pending !== null) view.clearTimeout(pending);
    pending = null;
  };
  async function copy(field) {
    if (!kit || pending !== null) return;
    const currentRevision = revision, currentOperation = ++operation, text = kit[field];
    const fallback = "Copy was not confirmed. Select the text below and copy it manually, or download the notes.";
    let clipboard;
    try { clipboard = view.navigator?.clipboard; if (!clipboard?.writeText) { status(fallback); return; } }
    catch { status(fallback); return; }
    const finish = message => {
      if (revision !== currentRevision || operation !== currentOperation) return;
      if (pending !== null) view.clearTimeout(pending);
      pending = null; operation++; controls(); status(message);
    };
    pending = view.setTimeout(() => finish(fallback), 5000);
    controls(); status("Copying…");
    try {
      await clipboard.writeText(text);
      finish(field === "caption" ? "Caption copied. Nothing has been posted." : "Visual description copied. Add it when sharing the video.");
    } catch { finish(fallback); }
  }
  get("copy-caption").addEventListener("click", () => copy("caption"));
  get("copy-description").addEventListener("click", () => copy("description"));
  get("download-post-notes").addEventListener("click", () => {
    if (!kit || pending !== null) return;
    let url, link;
    try {
      url = view.URL.createObjectURL(new view.Blob([kit.text], { type: "text/plain;charset=utf-8" }));
      link = root.createElement("a"); link.href = url; link.download = `${kit.basename}.txt`;
      root.body.append(link); link.click();
      status("Post notes download requested. The video is a separate download above.");
    } catch { status("The notes download could not be started. You can still select and copy the text below."); }
    finally {
      link?.remove();
      if (url) downloads.set(url, view.setTimeout(() => { view.URL.revokeObjectURL(url); downloads.delete(url); }, 1000));
    }
  });
  controls();
  return {
    show(next) {
      invalidate(); kit = next;
      get("post-caption").value = kit.caption;
      get("post-description").value = kit.description;
      get("post-filename").textContent = `${kit.basename}.txt`;
      status("Notes match the recorded take. Later headline edits do not change them."); controls();
    },
    clear() {
      invalidate(); kit = null;
      for (const [url, timeout] of downloads) { view.clearTimeout(timeout); view.URL.revokeObjectURL(url); }
      downloads.clear();
      get("post-caption").value = ""; get("post-description").value = "";
      get("post-filename").textContent = ""; status(""); controls();
    },
  };
}
