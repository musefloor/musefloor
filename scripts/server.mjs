import http from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSnapshot } from "../public/studio-connection.js";

export const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

function within(root, target) {
  const relative = path.relative(root, target);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export function createPreviewServer({ root = publicRoot } = {}) {
  const timers = new Set();
  const readSnapshot = async () => normalizeSnapshot(JSON.parse(await readFile(path.join(root, "studio-feed.json"), "utf8")));
  const server = http.createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cache-Control", "no-store");
    const reply = (status, body) => {
      response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(request.method === "HEAD" ? undefined : body);
    };
    try {
      if (!["GET", "HEAD"].includes(request.method)) {
        response.setHeader("Allow", "GET, HEAD");
        reply(405, "Read-only preview");
        return;
      }
      const url = new URL(request.url, "http://127.0.0.1");
      if (["/api/studio", "/api/studio/events"].includes(url.pathname)) {
        let serialized = JSON.stringify(await readSnapshot());
        if (url.pathname === "/api/studio" || request.method === "HEAD") {
          response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          response.end(request.method === "HEAD" ? undefined : serialized);
          return;
        }
        response.writeHead(200, { "Content-Type": "text/event-stream", Connection: "keep-alive" });
        response.write(`retry: 2000\nevent: studio\ndata: ${serialized}\n\n`);
        let busy = false;
        let ticks = 0;
        const timer = setInterval(async () => {
          if (busy || response.destroyed) return;
          busy = true;
          try {
            const next = JSON.stringify(await readSnapshot());
            if (!response.destroyed && next !== serialized) {
              serialized = next;
              response.write(`event: studio\ndata: ${serialized}\n\n`);
            } else if (!response.destroyed && ++ticks % 15 === 0) {
              response.write(": connected\n\n");
            }
          } catch {
            // Retain the last complete snapshot while a local edit is in progress.
          } finally { busy = false; }
        }, 1000);
        timers.add(timer);
        timer.unref();
        response.on("close", () => { clearInterval(timer); timers.delete(timer); });
        return;
      }

      let relative;
      try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html"; }
      catch { reply(400, "Invalid URL"); return; }
      if (relative.includes("\\") || relative.includes("\0") || relative.split("/").some((part) => part.startsWith("."))) {
        reply(403, "Forbidden");
        return;
      }
      const canonicalRoot = await realpath(root);
      let file = path.resolve(canonicalRoot, relative);
      if (!within(canonicalRoot, file)) { reply(403, "Forbidden"); return; }
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      file = await realpath(file);
      if (!within(canonicalRoot, file)) { reply(403, "Forbidden"); return; }
      const body = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Content-Length": body.length,
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      if (response.headersSent) { response.destroy(); return; }
      reply(["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code) ? 404 : 503, "Preview content unavailable");
    }
  });
  server.on("close", () => { for (const timer of timers) clearInterval(timer); timers.clear(); });
  return server;
}
