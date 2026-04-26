/**
 * Verifies production build serves HTML with expected LOOMY markers.
 * Run after `npm run build`. Starts next on a random port, curls, exits.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const port = Number(process.env.VERIFY_PORT || "3999");
const host = "127.0.0.1";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function waitForHttpReady(url, maxMs = 45000, intervalMs = 250) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode === 200) resolve();
          else if (Date.now() - start > maxMs) reject(new Error(`HTTP ${res.statusCode}`));
          else setTimeout(tryOnce, intervalMs);
        })
        .on("error", () => {
          if (Date.now() - start > maxMs) reject(new Error("Server did not respond in time"));
          else setTimeout(tryOnce, intervalMs);
        });
    };
    tryOnce();
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

const env = { ...process.env, PORT: String(port), HOSTNAME: host };
const child = spawn("npx", ["next", "start", "-H", host, "-p", String(port)], {
  cwd: root,
  env,
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr?.on("data", (d) => {
  stderr += d.toString();
});

const url = `http://${host}:${port}/`;

try {
  await waitForHttpReady(url);
  const home = await fetchText(url);
  const shopUrl = `http://${host}:${port}/shopping`;
  await waitForHttpReady(shopUrl);
  const shop = await fetchText(shopUrl);
  const checks = [
    ["home: LOOMY", /LOOMY/i.test(home)],
    ["home: hero", /yndlingsbutikker|platform|lager/i.test(home)],
    ["shopping: butikker eller shop", /Butikker|Shop · LOOMY|Indre By/i.test(shop)],
  ];
  for (const [name, ok] of checks) {
    if (!ok) throw new Error(`Verify failed: ${name}`);
  }
  console.log("verify-site: OK —", url, "+ /shopping (HTML checks passed)");
} catch (e) {
  console.error("verify-site:", e.message);
  if (stderr) console.error(stderr.slice(-2000));
  process.exitCode = 1;
} finally {
  child.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 500));
  try {
    child.kill("SIGKILL");
  } catch {
    /* ignore */
  }
}
