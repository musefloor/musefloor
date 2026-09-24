const defaultPort = 4173;

export function parsePreviewPort(args, environmentPort) {
  if (args.length > 1 || args.some((arg) => !/^--port=\d+$/.test(arg))) {
    throw new Error("Usage: npm run dev -- --port=4173");
  }
  const port = Number(args[0]?.split("=")[1] ?? environmentPort ?? defaultPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Choose a port between 1 and 65535.");
  }
  return port;
}

export function previewListenError(error, port) {
  if (error.code !== "EADDRINUSE") return error.message;
  const alternative = port < 65535 ? port + 1 : defaultPort;
  return `Port ${port} is in use. Try npm run dev -- --port=${alternative}`;
}
