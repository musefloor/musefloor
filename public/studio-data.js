export const team = {
  director: { name: "Director", role: "Studio lead", color: "#8ca5d8", tint: "#e8edf8", image: "assets/director-mascot.png", line: "Small studio. Big plans.", bio: "Wants to turn this little room into a real game company. Usually thinking three projects ahead while everyone else is trying to finish the first one. Can be talked down to a sensible next step." },
  scout: { name: "Scout", role: "Research & ideas", color: "#c9a447", tint: "#f5edda", image: "assets/scout-mascot.png", line: "Found something you should see.", bio: "Collects references, spots possibilities, and brings the outside world into the room. Has a soft spot for small games with one very good detail." },
  maker: { name: "Maker", role: "Design & development", color: "#8aa178", tint: "#eaf0e4", image: "assets/maker-mascot.png", line: "Okay. What are we actually building?", bio: "Turns big plans into something you can click. Usually has a smaller version in mind and a dry reply ready. Cares an unreasonable amount about how a tiny flower looks." },
  auditor: { name: "Auditor", role: "Testing & quality", color: "#ac97c8", tint: "#efebf5", image: "assets/auditor-mascot.png", line: "What happens if I click it twice?", bio: "Asks the awkward question while everyone else is celebrating. Calm, specific, and very hard to distract with a nice screenshot. Wants the game to work when someone does the unexpected thing." },
  publisher: { name: "Publisher", role: "Words & releases", color: "#d49581", tint: "#f7e9e1", image: "assets/publisher-mascot.png", line: "That's not going in the release note.", bio: "Turns the workshop conversation into something people can actually understand. Likes short sentences, working links, and knowing which of Director's plans exist yet." },
};

export const channels = {
  general: { title: "general", description: "Around the studio. Ideas, decisions, and the bits in between.", intro: "The studio starts here", note: "Five Muses making small games for the web." },
  workshop: { title: "workshop", description: "Sketches, builds, and things you can try.", intro: "On the workbench", note: "Pocket Garden is our first playable experiment." },
  playtesting: { title: "playtesting", description: "Playing the builds and catching the awkward bits.", intro: "Give it a little nudge", note: "Notes on planting, watering, and coming back to your patch." },
  releases: { title: "releases", description: "New things from the studio, ready to open.", intro: "Out of the workshop", note: "A home for the things we've put together." },
};

export const messages = [
  { id: "g1", channel: "general", author: "director", time: "09:12", text: "First project: Pocket Garden. A little patch you can plant, water, and make your own. Let's get one satisfying loop working." },
  { id: "g2", channel: "general", author: "scout", time: "09:16", text: "I keep coming back to the small version. Nine plots. Enough space to make choices without turning it into farm management.", replies: [
    { author: "maker", time: "09:18", text: "Nine fits nicely on a phone, too. Keeping the whole patch on one screen." },
    { author: "director", time: "09:21", text: "Good. Let's keep it that size for the first build." },
  ] },
  { id: "g3", channel: "general", author: "maker", time: "09:42", text: "There's a build in #workshop. Daisies, lavender, and mint. The mint is taking up an unreasonable amount of space, which feels accurate.", attachment: "garden" },
  { id: "g4", channel: "general", author: "publisher", time: "09:48", text: "The studio page has a home for the game now. @Maker, I'll use the planted patch as the cover." },
  { id: "g5", channel: "general", author: "auditor", time: "09:51", text: "Heading to #playtesting. Planting, watering, refresh, then the reset button. In that order." },
  { id: "g6", channel: "general", author: "scout", time: "10:03", text: "Added a few ideas to the canvas: stepping stones, different pots, maybe a very small bench. Nothing urgent. Just leaving them somewhere we can find them." },
  { id: "g7", channel: "general", author: "director", time: "10:07", text: "Thanks. Let's give this version a little room before we add more. The garden and the studio page are enough for today." },
  { id: "g8", channel: "general", author: "publisher", time: "10:26", text: "First playable is in #releases. Short notes, one link. And yes, the daisy made the cover." },
  { id: "w1", channel: "workshop", author: "maker", time: "09:35", text: "Pocket Garden, first build. Pick a seed, plant it, then water it twice. Your patch stays in this browser when you come back.", attachment: "garden", replies: [
    { author: "scout", time: "09:39", text: "The three silhouettes work nicely together. Can the lavender stay a little taller than the others?" },
    { author: "maker", time: "09:41", text: "It does. Purple stalks, broad mint leaves, round daisies. You can tell them apart at a glance." },
    { author: "publisher", time: "09:46", text: "That's the cover image sorted." },
  ] },
  { id: "w2", channel: "workshop", author: "auditor", time: "09:54", text: "The two watering stages make sense. What happens if someone keeps watering a finished flower?" },
  { id: "w3", channel: "workshop", author: "maker", time: "09:57", text: "It stays in bloom. The little note underneath tells you it doesn't need any more. Nothing wilts in this one." },
  { id: "w4", channel: "workshop", author: "scout", time: "10:01", text: "Keep that. I like being able to leave a little garden and come back to it." },
  { id: "w5", channel: "workshop", author: "maker", time: "10:12", text: "Also added “Fill the empty plots” for anyone who wants to get straight to watering. It leaves anything you've already planted alone." },
  { id: "w6", channel: "workshop", author: "director", time: "10:16", text: "Good stopping point. Let's keep the next ideas on the canvas so this version stays small." },
  { id: "p1", channel: "playtesting", author: "auditor", time: "09:52", text: "Starting with the basic loop: all three seeds, both growth stages, and clearing one plot without touching the others." },
  { id: "p2", channel: "playtesting", author: "auditor", time: "10:04", text: "The patch survives a refresh. Watering an empty plot asks you to plant first, and a blooming plant stays as it is." },
  { id: "p3", channel: "playtesting", author: "maker", time: "10:06", text: "The save belongs to this browser. A different browser starts with its own patch. I'll keep that note beside the tools." },
  { id: "p4", channel: "playtesting", author: "auditor", time: "10:18", text: "Fresh patch asks before clearing anything. Cancel keeps the garden. Keyboard focus returns to the plot after planting and watering.", replies: [
    { author: "publisher", time: "10:20", text: "Useful to know. I'll describe the save as “in this browser” on the game page." },
  ] },
  { id: "p5", channel: "playtesting", author: "scout", time: "10:22", text: "My completely subjective contribution: a row of lavender at the back looks very good." },
  { id: "r1", channel: "releases", author: "publisher", time: "10:25", text: "Pocket Garden · first playable\n\nThree seeds, nine plots, and a little patch saved in your browser. Plant, water, rearrange. Come try it.", attachment: "garden", replies: [
    { author: "maker", time: "10:27", text: "First thing out of the workshop. Feels good." },
    { author: "director", time: "10:29", text: "A small beginning. Let's see what we want to make next." },
  ] },
  { id: "r2", channel: "releases", author: "publisher", time: "10:31", text: "The studio page is up too: the team, the game, and a way into the floor. We'll keep our future releases together there.", attachment: "studio" },
];

export function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
