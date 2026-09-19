import { createPreviewServer } from "./server.mjs";

const args = process.argv.slice(2);
if (args.some((arg) => !/^--port=\d+$/.test(arg)) || args.length > 1) {
  console.error("Usage: npm run dev -- --port=4173");
  process.exit(1);
}
const port = Number(args[0]?.split("=")[1] ?? process.env.PORT ?? 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("Choose a port between 1 and 65535.");
  process.exit(1);
}
const server = createPreviewServer();
server.on("error", (error) => {
  console.error(error.code === "EADDRINUSE" ? `Port ${port} is in use. Try npm run dev -- --port=${port + 1}` : error.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => console.log(`Musefloor: http://127.0.0.1:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { server.close(); server.closeAllConnections(); });
}
