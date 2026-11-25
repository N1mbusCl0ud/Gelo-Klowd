// api/visitors.js  (Vercel serverless function)
// Counts visits (and the visitor's COUNTRY only) and stores guestbook signatures.
// Data lives in Upstash Redis. See README.md for the 2-minute setup.
// Privacy: no IP addresses and no personal details are stored. For rate limiting we keep a
// one-way hash of the IP for 30 seconds, then it disappears.

const crypto = require("crypto");

// These variables are added automatically when you connect Upstash Redis to your Vercel project
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Sends a list of Redis commands in one request and returns each command's result
async function redis(commands) {
  const r = await fetch(REDIS_URL + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + REDIS_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(commands)
  });
  if (!r.ok) throw new Error("redis error");
  return (await r.json()).map(x => x.result);
}

// Reads the numbers and the latest 30 signatures
async function summary() {
  const [visits, countries, entries] = await redis([
    ["GET", "klowd:visits"],
    ["HGETALL", "klowd:countries"],
    ["LRANGE", "klowd:entries", "0", "29"]
  ]);
  const byCountry = {};
  for (let i = 0; i < (countries || []).length; i += 2) byCountry[countries[i]] = Number(countries[i + 1]);
  const list = (entries || []).map(e => { try { return JSON.parse(e); } catch (err) { return null; } }).filter(Boolean);
  return { visits: Number(visits || 0), countries: byCountry, entries: list };
}

// Removes control characters and < > so a signature can never contain HTML
const clean = (text, max) => String(text || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: "Storage is not set up yet." });

  try {
    if (req.method === "GET") return res.status(200).json(await summary());
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    // Vercel tells us the visitor's country in this header
    const country = String(req.headers["x-vercel-ip-country"] || "").toUpperCase().slice(0, 2);
    const validCountry = /^[A-Z]{2}$/.test(country) ? country : "";

    // A visitor opened the site: add 1 to the total and to their country
    if (body.action === "visit") {
      const commands = [["INCR", "klowd:visits"]];
      if (validCountry) commands.push(["HINCRBY", "klowd:countries", validCountry, "1"]);
      await redis(commands);
      return res.status(200).json(await summary());
    }

    // A visitor signed the guestbook
    if (body.action === "sign") {
      const name = clean(body.name, 40);
      const message = clean(body.message, 200);
      if (!name) return res.status(400).json({ error: "Please enter your name." });

      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
      const key = "klowd:rl:" + crypto.createHash("sha256").update(ip + "|klowd").digest("hex").slice(0, 24);
      const [ok] = await redis([["SET", key, "1", "NX", "EX", "30"]]);   // only works once every 30 seconds
      if (ok !== "OK") return res.status(429).json({ error: "Easy there! Please wait a few seconds before signing again." });

      const entry = JSON.stringify({ name, message, country: validCountry, ts: Date.now() });
      await redis([["LPUSH", "klowd:entries", entry], ["LTRIM", "klowd:entries", "0", "49"]]);   // keep the latest 50
      return res.status(200).json(await summary());
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong." });
  }
};
