import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parsePreviewPort, previewListenError } from "../scripts/preview-options.mjs";

test("preview port uses the default, environment, then explicit option", () => {
  assert.equal(parsePreviewPort([], undefined), 4173);
  assert.equal(parsePreviewPort([], "5000"), 5000);
  assert.equal(parsePreviewPort(["--port=4174"], "5000"), 4174);
  assert.equal(parsePreviewPort(["--port=4174"], "invalid"), 4174);
  for (const port of [1, 65535]) {
    assert.equal(parsePreviewPort([`--port=${port}`]), port);
  }
});

test("unknown, malformed, and duplicate options show usage", () => {
  for (const args of [["--host=0.0.0.0"], ["--port"], ["--port=1.5"], ["--port=-1"], ["--port=abc"], ["--port=4173", "--port=4174"]]) {
    assert.throws(() => parsePreviewPort(args), /Usage:/);
  }
});

test("invalid environment ports and out-of-range options cannot start a server", () => {
  for (const port of ["", "0", "-1", "65536", "1.5", "Infinity", "NaN", "localhost"])
    assert.throws(() => parsePreviewPort([], port), /between 1 and 65535/);
  for (const arg of ["--port=0", "--port=65536", "--port=999999999999999999999"])
    assert.throws(() => parsePreviewPort([arg]), /between 1 and 65535/);
});

test("busy-port guidance always suggests a valid port", () => {
  const error = { code: "EADDRINUSE" };
  assert.match(previewListenError(error, 4173), /--port=4174$/);
  assert.match(previewListenError(error, 65535), /--port=4173$/);
  assert.equal(previewListenError({ code: "EACCES", message: "Permission denied" }, 80), "Permission denied");
});

test("the preview command exits cleanly with actionable validation errors", () => {
  const command = fileURLToPath(new URL("../scripts/serve.mjs", import.meta.url));
  for (const [args, port, expected] of [
    [["--unknown"], "4173", /Usage:/],
    [["--port=65536"], "4173", /between 1 and 65535/],
    [[], "invalid", /between 1 and 65535/],
  ]) {
    const result = spawnSync(process.execPath, [command, ...args], {
      env: { ...process.env, PORT: port }, encoding: "utf8", timeout: 10000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.match(result.stderr, expected);
    assert.equal(result.stdout, "");
    assert.doesNotMatch(result.stderr, /at file:|Error:/);
  }
});
