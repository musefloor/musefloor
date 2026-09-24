import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createPreviewServer } from "../scripts/server.mjs";

const server = createPreviewServer();
let origin;
before(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  const closed = new Promise((resolve) => server.close(resolve));
  server.closeAllConnections();
  await closed;
});

test("all entry pages are available without credentials", async () => {
  for (const pathname of ["/", "/index.html", "/floor.html", "/garden.html", "/packing.html", "/lantern.html"]) {
    const response = await fetch(origin + pathname);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(await response.text(), /Musefloor/);
  }
});
test("scripts, fonts, and portraits use their correct content types", async () => {
  for (const [pathname, type] of [["/app.js", "text/javascript"], ["/assets/fonts/pixelify.ttf", "font/ttf"], ["/assets/director-mascot.png", "image/png"]]) {
    const response = await fetch(origin + pathname, { method: "HEAD" });
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("content-type").startsWith(type));
    assert.equal(await response.text(), "");
  }
});
test("preview endpoints do not accept writes", async () => {
  for (const pathname of ["/index.html", "/api/studio", "/api/studio/events"]) {
    const response = await fetch(origin + pathname, { method: "POST", body: "{}" });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
  }
});
test("snapshot endpoint returns published messages without fabricated activity", async () => {
  const response = await fetch(origin + "/api/studio");
  const state = await response.json();
  assert.equal(response.status, 200);
  assert.ok(state.messages.length > 0);
  assert.equal(state.active, false);
  assert.equal(state.typing, null);
});
test("event stream starts with a valid published snapshot", async () => {
  const response = await fetch(origin + "/api/studio/events", { signal: AbortSignal.timeout(5000) });
  assert.match(response.headers.get("content-type"), /text\/event-stream/);
  const reader = response.body.getReader();
  try {
    const chunk = new TextDecoder().decode((await reader.read()).value);
    assert.match(chunk, /event: studio/);
    const state = JSON.parse(chunk.split("data: ")[1].trim());
    assert.ok(Array.isArray(state.messages));
    assert.equal(state.active, false);
  } finally { await reader.cancel(); }
});
test("private paths, traversal, and malformed URLs are not served", async () => {
  for (const pathname of ["/.git/config", "/.env", "/%2e%2e%2fREADME.md", "/..%5cREADME.md"]) {
    const response = await fetch(origin + pathname);
    assert.equal(response.status, 403, pathname);
  }
  assert.equal((await fetch(origin + "/README.md")).status, 404);
  assert.equal((await fetch(origin + "/%ZZ")).status, 400);
  assert.equal((await fetch(origin + "/does-not-exist.html")).status, 404);
});
