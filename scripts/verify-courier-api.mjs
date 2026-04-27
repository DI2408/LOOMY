/**
 * Smoke test: POST /api/partner/courier-email (run when dev server is up, optional).
 * Usage: node scripts/verify-courier-api.mjs
 */
import http from "node:http";

const port = process.env.VERIFY_COURIER_PORT || "3000";
const path = "/api/partner/courier-email";
const data = JSON.stringify({ courierId: "mikkel" });

const req = http.request(
  {
    hostname: "127.0.0.1",
    port: Number(port),
    path,
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
  },
  (res) => {
    let b = "";
    res.on("data", (c) => (b += c));
    res.on("end", () => {
      if (res.statusCode !== 200) {
        console.error("verify-courier-api: HTTP", res.statusCode, b);
        process.exit(1);
      }
      const j = JSON.parse(b);
      if (!j.email || typeof j.email !== "string") {
        console.error("verify-courier-api: missing email", j);
        process.exit(1);
      }
      console.log("verify-courier-api: OK", j.email);
    });
  },
);
req.on("error", (e) => {
  console.error("verify-courier-api: skip (dev server not up?)", e.message);
  process.exit(0);
});
req.write(data);
req.end();
