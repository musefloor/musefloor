import { createPreviewServer } from "./server.mjs";
import { parsePreviewPort, previewListenError } from "./preview-options.mjs";

let port;
try {
  port = parsePreviewPort(process.argv.slice(2), process.env.PORT);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const server = createPreviewServer();
server.on("error", (error) => {
  console.error(previewListenError(error, port));
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => console.log(`Musefloor: http://127.0.0.1:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { server.close(); server.closeAllConnections(); });
}
