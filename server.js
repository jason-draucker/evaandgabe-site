"use strict";

const fs = require("fs");
const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, "data");
const SEED_WISHLIST = path.join(DATA_DIR, "wishlist.json");
const STORE_WISHLIST = path.join(DATA_DIR, "wishlist-store.json");
const SEED_UPDATES = path.join(DATA_DIR, "updates.json");
const STORE_UPDATES = path.join(DATA_DIR, "updates-store.json");
const SEED_EVENTS = path.join(DATA_DIR, "events.json");
const STORE_EVENTS = path.join(DATA_DIR, "events-store.json");
const STORE_TASKS = path.join(DATA_DIR, "tasks-store.json");
const STORE_SUGGESTIONS = path.join(DATA_DIR, "suggestions-store.json");
const STORE_CAL_REQUESTS = path.join(DATA_DIR, "calendar-requests-store.json");
const DEMO_EVA_TOKEN = "eva-local-demo";
const DEMO_GABE_TOKEN = "gabe-local-demo";
const DEMO_INBOUND_TOKEN = "inbound-local-demo";
const DEFAULT_PIN = "2468";
const PORT = Number(process.env.PORT) || 3000;

const BLOCKED_PREFIXES = [
  "/.env",
  "/server.js",
  "/package.json",
  "/package-lock.json",
  "/node_modules",
  "/render.yaml",
  "/.gitignore",
  "/data/wishlist-store.json"
];

function isSet(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

function flagOn(name) {
  const flag = (process.env[name] || "").trim();
  return flag === "1" || flag.toLowerCase() === "true";
}

function demoOnly() {
  return flagOn("DEMO_ONLY");
}

function emailLiveFlag() {
  return flagOn("EMAIL_LIVE");
}

function fromAddress() {
  return isSet("SMTP_FROM") ? process.env.SMTP_FROM.trim() : "Eva and Gabe <noreply@evaandgabe.com>";
}

function parseFrom(from) {
  const match = String(from || "").match(/^(.*)<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  }
  return { email: String(from || "").trim() };
}

function emailProviderReady() {
  return isSet("RESEND_API_KEY") || isSet("SENDGRID_API_KEY") || (isSet("SMTP_HOST") && isSet("SMTP_FROM"));
}

function textConfigured() {
  return (
    !demoOnly() &&
    isSet("TWILIO_ACCOUNT_SID") &&
    isSet("TWILIO_AUTH_TOKEN") &&
    isSet("TWILIO_FROM") &&
    isSet("JASON_CELL")
  );
}

// Live email is on when a provider and JASON_EMAIL are set, and either
// DEMO_ONLY is off, or EMAIL_LIVE=1 with RESEND_API_KEY (overrides demo for email only).
function emailConfigured() {
  if (!isSet("JASON_EMAIL") || !emailProviderReady()) return false;
  if (!demoOnly()) return true;
  return emailLiveFlag() && isSet("RESEND_API_KEY");
}

async function sendEmail(options) {
  const to = options.to;
  const subject = options.subject;
  const text = options.text;
  const toList = Array.isArray(to) ? to : [to];
  const from = fromAddress();

  if (isSet("RESEND_API_KEY")) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY.trim(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from: from, to: toList, subject: subject, text: text })
    });
    if (!response.ok) {
      throw new Error("resend-failed");
    }
    return;
  }

  if (isSet("SENDGRID_API_KEY")) {
    const parsed = parseFrom(from);
    const fromObj = parsed.name ? { email: parsed.email, name: parsed.name } : { email: parsed.email };
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.SENDGRID_API_KEY.trim(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: toList.map(function (email) { return { email: email }; }) }],
        from: fromObj,
        subject: subject,
        content: [{ type: "text/plain", value: text }]
      })
    });
    if (!response.ok) {
      throw new Error("sendgrid-failed");
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_PORT) === "465",
    auth: isSet("SMTP_USER")
      ? { user: process.env.SMTP_USER.trim(), pass: (process.env.SMTP_PASS || "").trim() }
      : undefined
  });
  await transporter.sendMail({
    from: from,
    to: toList.join(", "),
    subject: subject,
    text: text
  });
}

function adminPin() {
  return isSet("ADMIN_PIN") ? process.env.ADMIN_PIN.trim() : DEFAULT_PIN;
}

function pinsMatch(input) {
  const expected = adminPin();
  const got = String(input || "").trim();
  if (!got || !expected || got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ got.charCodeAt(i);
  }
  return diff === 0;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function loadWishlist() {
  if (fs.existsSync(STORE_WISHLIST)) {
    const stored = readJson(STORE_WISHLIST, null);
    if (stored && Array.isArray(stored.items)) return stored;
  }
  const seed = readJson(SEED_WISHLIST, { items: [] });
  return { items: Array.isArray(seed.items) ? seed.items : [] };
}

function saveWishlist(items) {
  writeJson(STORE_WISHLIST, { items: items, updatedAt: new Date().toISOString() });
}

function kidName(kid) {
  return kid === "gabe" ? "Gabe" : "Eva";
}

const AMOUNT_WORDS = { 5: "five", 10: "ten", 20: "twenty", 50: "fifty" };

function moneyRequestText(kid, amount) {
  const words = AMOUNT_WORDS[amount];
  if (!words) return null;
  return kidName(kid) + " wants " + words + " dollars (via evaandgabe.com)";
}

function validKid(kid) {
  return kid === "eva" || kid === "gabe";
}


function envOrDefault(name, fallback) {
  return isSet(name) ? process.env[name].trim() : fallback;
}

function piperEmail() {
  return envOrDefault("PIPER_EMAIL", "piper@evaandgabe.com");
}

function suggestionsInbox() {
  return envOrDefault("SUGGESTIONS_INBOX", piperEmail());
}

function calendarInbox() {
  return envOrDefault("CALENDAR_INBOX", "calendar@evaandgabe.com");
}

function kidToken(kid) {
  return kid === "gabe" ? envOrDefault("GABE_TOKEN", DEMO_GABE_TOKEN) : envOrDefault("EVA_TOKEN", DEMO_EVA_TOKEN);
}

function inboundToken() {
  return envOrDefault("INBOUND_EMAIL_TOKEN", DEMO_INBOUND_TOKEN);
}

function safeEqual(got, expected) {
  const a = Buffer.from(String(got || ""), "utf8");
  const b = Buffer.from(String(expected || ""), "utf8");
  if (a.length !== b.length) {
    const dummy = crypto.createHash("sha256").update(a).digest();
    crypto.timingSafeEqual(dummy, dummy);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function loadSeedOrStore(storeFile, seedFile, fallback) {
  if (fs.existsSync(storeFile)) {
    const stored = readJson(storeFile, null);
    if (stored) return stored;
  }
  return readJson(seedFile, fallback);
}

function loadUpdates() {
  const data = loadSeedOrStore(STORE_UPDATES, SEED_UPDATES, { posts: [] });
  return { posts: Array.isArray(data.posts) ? data.posts : [] };
}

function saveUpdates(posts) {
  writeJson(STORE_UPDATES, { posts: posts, updatedAt: new Date().toISOString() });
}

function loadEvents() {
  const data = loadSeedOrStore(STORE_EVENTS, SEED_EVENTS, { events: [], timezone: "America/Denver" });
  return {
    timezone: data.timezone || "America/Denver",
    events: Array.isArray(data.events) ? data.events : []
  };
}

function saveEvents(bundle) {
  writeJson(STORE_EVENTS, {
    timezone: bundle.timezone || "America/Denver",
    events: bundle.events || [],
    updatedAt: new Date().toISOString()
  });
}

function loadTasks() {
  const data = readJson(STORE_TASKS, { claims: {}, completions: [] });
  return {
    claims: data && data.claims && typeof data.claims === "object" ? data.claims : {},
    completions: Array.isArray(data.completions) ? data.completions : []
  };
}

function saveTasks(tasks) {
  writeJson(STORE_TASKS, {
    claims: tasks.claims || {},
    completions: tasks.completions || [],
    updatedAt: new Date().toISOString()
  });
}

function appendStore(file, entry, key) {
  const current = readJson(file, { [key]: [] });
  const list = Array.isArray(current[key]) ? current[key] : [];
  list.unshift(entry);
  writeJson(file, { [key]: list, updatedAt: new Date().toISOString() });
}

function readKidToken(req) {
  const header = req.get("x-kid-token") || "";
  const auth = req.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  return String(header || bearer || "").trim();
}

function requireKid(req, res) {
  const kid = String(req.params.kid || req.query.kid || req.body && req.body.kid || "").toLowerCase();
  if (!validKid(kid)) {
    res.status(400).json({ ok: false, message: "Unknown kid." });
    return null;
  }
  const token = readKidToken(req);
  if (!token || !safeEqual(token, kidToken(kid))) {
    res.status(401).json({ ok: false, message: "That private link is not valid." });
    return null;
  }
  return kid;
}


const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.use(function blockSensitive(req, res, next) {
  const url = req.path || "";
  if (BLOCKED_PREFIXES.some((prefix) => url === prefix || url.startsWith(prefix + "/"))) {
    return res.status(404).end();
  }
  if (url === "/.env" || url.startsWith("/.env.")) {
    return res.status(404).end();
  }
  next();
});

app.get("/api/health", function (req, res) {
  const text = textConfigured();
  const email = emailConfigured();
  res.json({
    ok: true,
    textConfigured: text,
    emailConfigured: email,
    mode: text || email ? "mixed-or-live" : "demo"
  });
});

app.post("/api/parent-unlock", function (req, res) {
  const pin = req.body && req.body.pin;
  if (!pinsMatch(pin)) {
    return res.status(401).json({ ok: false, message: "That PIN did not match." });
  }
  res.json({ ok: true });
});

app.get("/api/wishlist", function (req, res) {
  res.json(loadWishlist());
});

app.post("/api/wishlist", function (req, res) {
  const body = req.body || {};
  if (!pinsMatch(body.pin)) {
    return res.status(401).json({ ok: false, message: "Parent tools need a valid PIN." });
  }
  if (!Array.isArray(body.items)) {
    return res.status(400).json({ ok: false, message: "A list of items is required." });
  }
  const cleaned = body.items
    .slice(0, 100)
    .map(function (item, index) {
      const status = item && (item.status === "on_the_way" || item.status === "got") ? item.status : "wanted";
      const forWho = item && (item.for === "eva" || item.for === "gabe") ? item.for : "both";
      return {
        id: String((item && item.id) || "w-" + Date.now() + "-" + index).slice(0, 80),
        title: String((item && item.title) || "Untitled").trim().slice(0, 120),
        for: forWho,
        status: status,
        note: String((item && item.note) || "").slice(0, 240)
      };
    })
    .filter(function (item) { return item.title; });
  saveWishlist(cleaned);
  res.json({ ok: true, items: cleaned });
});

app.post("/api/request-text", async function (req, res) {
  const body = req.body || {};
  if (body.tcpaConsent !== true) {
    return res.status(400).json({ ok: false, message: "Consent is required before sending a text." });
  }
  if (!validKid(body.kid)) {
    return res.status(400).json({ ok: false, message: "Please choose Eva or Gabe." });
  }
  const amount = Number(body.amount);
  const textBody = moneyRequestText(body.kid, amount);
  if (!textBody) {
    return res.status(400).json({ ok: false, message: "That amount is not allowed." });
  }

  if (!textConfigured()) {
    console.log("request-text: demo mode (Twilio is not fully configured, or DEMO_ONLY is on). No text sent.");
    return res.json({
      ok: true,
      mode: "demo",
      message: "Demo mode: would text Dad: “" + textBody + "”. No text was sent."
    });
  }

  try {
    const sid = process.env.TWILIO_ACCOUNT_SID.trim();
    const token = process.env.TWILIO_AUTH_TOKEN.trim();
    const from = process.env.TWILIO_FROM.trim();
    const to = process.env.JASON_CELL.trim();
    const url = "https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(sid) + "/Messages.json";
    const params = new URLSearchParams({ To: to, From: from, Body: textBody });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });
    if (!response.ok) {
      console.log("request-text: Twilio returned an error status. No details logged.");
      return res.status(502).json({ ok: false, message: "The text could not be sent right now." });
    }
    console.log("request-text: live send reported success.");
    return res.json({ ok: true, mode: "live", message: "Text sent to Dad." });
  } catch (err) {
    console.log("request-text: send failed. No details logged.");
    return res.status(502).json({ ok: false, message: "The text could not be sent right now." });
  }
});

app.post("/api/request-email", async function (req, res) {
  const body = req.body || {};
  if (body.tcpaConsent !== true) {
    return res.status(400).json({ ok: false, message: "Consent is required before sending an email." });
  }
  if (!validKid(body.kid)) {
    return res.status(400).json({ ok: false, message: "Please choose Eva or Gabe." });
  }
  const message = String(body.message || "").trim().slice(0, 1000);
  if (!message) {
    return res.status(400).json({ ok: false, message: "Please include a short note." });
  }
  const subject = "A note from " + kidName(body.kid) + " on evaandgabe.com";
  const text = "From " + kidName(body.kid) + ":\n\n" + message + "\n";

  if (!emailConfigured()) {
    console.log("request-email: demo mode (email is not fully configured, or DEMO_ONLY is on). No email sent.");
    return res.json({
      ok: true,
      mode: "demo",
      message: "Demo mode: would email Dad — “" + message + "” (from " + kidName(body.kid) + "). No email was sent."
    });
  }

  try {
    await sendEmail({
      to: process.env.JASON_EMAIL.trim(),
      subject: subject,
      text: text
    });
    console.log("request-email: live send reported success.");
    return res.json({ ok: true, mode: "live", message: "Email sent to Dad." });
  } catch (err) {
    console.log("request-email: send failed. No details logged.");
    return res.status(502).json({ ok: false, message: "The email could not be sent right now." });
  }
});


app.get("/api/updates", function (req, res) {
  res.json(loadUpdates());
});

app.get("/api/events", function (req, res) {
  res.json(loadEvents());
});

app.get("/api/tasks", function (req, res) {
  res.json(loadTasks());
});

app.post("/api/tasks", function (req, res) {
  const body = req.body || {};
  const next = {
    claims: body.claims && typeof body.claims === "object" ? body.claims : {},
    completions: Array.isArray(body.completions) ? body.completions : []
  };
  saveTasks(next);
  res.json({ ok: true, ...next });
});

app.post("/api/suggestion", async function (req, res) {
  const body = req.body || {};
  const kid = validKid(body.kid) ? body.kid : null;
  const kind = body.kind === "change24h" ? "change24h" : "customize";
  const message = String(body.message || "").trim();
  if (!kid || !message) {
    return res.status(400).json({ ok: false, message: "Please add your idea first." });
  }
  const to = suggestionsInbox();
  const entry = {
    id: "s-" + Date.now(),
    kid: kid,
    from: kidName(kid),
    kind: kind,
    message: message.slice(0, 2000),
    to: to,
    at: new Date().toISOString()
  };
  appendStore(STORE_SUGGESTIONS, entry, "items");
  if (!emailConfigured()) {
    console.log("suggestion: demo mode. Would email the suggestions inbox. No email sent.");
    return res.json({
      ok: true,
      mode: "demo",
      to: to,
      message: "Demo: would email " + to + " from " + kidName(kid) + ". No email was sent."
    });
  }
  const kindLabel = kind === "change24h" ? "24-hour website change" : "website customize idea";
  try {
    await sendEmail({
      to: to,
      subject: kindLabel.charAt(0).toUpperCase() + kindLabel.slice(1) + " from " + kidName(kid) + " on evaandgabe.com",
      text: "From " + kidName(kid) + ":\nKind: " + kind + "\n\n" + entry.message + "\n"
    });
    console.log("suggestion: live send reported success.");
    return res.json({
      ok: true,
      mode: "live",
      to: to,
      message: "Sent to " + to + "."
    });
  } catch (err) {
    console.log("suggestion: send failed. No details logged.");
    return res.status(502).json({ ok: false, message: "The email could not be sent right now." });
  }
});

app.post("/api/calendar-request", async function (req, res) {
  const body = req.body || {};
  const kid = validKid(body.kid) ? body.kid : null;
  const date = String(body.date || "").trim();
  const note = String(body.text || "").trim().slice(0, 400);
  if (!kid || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !note) {
    return res.status(400).json({ ok: false, message: "Please add a date and a short note." });
  }
  const request = {
    id: "cr-" + Date.now(),
    kid: kid,
    from: kidName(kid),
    date: date,
    text: note,
    to: calendarInbox(),
    at: new Date().toISOString()
  };
  appendStore(STORE_CAL_REQUESTS, request, "items");
  const bundle = loadEvents();
  const event = {
    id: request.id,
    kid: kid,
    date: date,
    time: "",
    title: note,
    note: "Added from the calendar form (demo apply)."
  };
  bundle.events = bundle.events.concat([event]);
  saveEvents(bundle);

  if (!emailConfigured()) {
    console.log("calendar-request: demo mode. Entry applied; no email sent.");
    return res.json({ ok: true, mode: "demo", event: event, message: "It's on the calendar now." });
  }

  try {
    await sendEmail({
      to: calendarInbox(),
      subject: "Calendar request from " + kidName(kid) + " on evaandgabe.com",
      text: "From " + kidName(kid) + ":\nDate: " + date + "\n\n" + note + "\n"
    });
    console.log("calendar-request: live send reported success.");
    return res.json({
      ok: true,
      mode: "live",
      event: event,
      message: "It's on the calendar now, and an email was sent."
    });
  } catch (err) {
    console.log("calendar-request: send failed. No details logged.");
    return res.status(502).json({
      ok: false,
      event: event,
      message: "The calendar entry was saved, but the email could not be sent right now."
    });
  }
});

app.post("/api/inbound-email", function (req, res) {
  const body = req.body || {};
  const token = String(body.token || req.get("x-inbound-token") || "").trim();
  if (!safeEqual(token, inboundToken())) {
    return res.status(401).json({ ok: false, message: "Unauthorized." });
  }
  const text = String(body.text || body["stripped-text"] || body.plain || "").trim();
  if (!text) {
    return res.status(400).json({ ok: false, message: "Missing message text." });
  }
  const date = String(body.date || "").trim();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });
  const post = {
    id: "u-" + Date.now(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today,
    text: text.slice(0, 4000)
  };
  const bundle = loadUpdates();
  bundle.posts.unshift(post);
  saveUpdates(bundle.posts);
  res.json({ ok: true, post: post });
});

app.get("/kid/:kid", function (req, res) {
  if (!validKid(String(req.params.kid || "").toLowerCase())) {
    return res.status(404).end();
  }
  res.sendFile(path.join(ROOT, "kid.html"));
});

app.get("/api/kid/:kid/session", function (req, res) {
  const kid = requireKid(req, res);
  if (!kid) return;
  res.json({ ok: true, kid: kid, name: kidName(kid) });
});

app.get("/api/kid/:kid/events", function (req, res) {
  const kid = requireKid(req, res);
  if (!kid) return;
  const bundle = loadEvents();
  const mine = bundle.events.filter((event) => event.kid === kid);
  res.json({ ok: true, events: mine, timezone: bundle.timezone });
});

app.post("/api/kid/:kid/events", function (req, res) {
  const kid = requireKid(req, res);
  if (!kid) return;
  const body = req.body || {};
  const date = String(body.date || "").trim();
  const title = String(body.title || "").trim().slice(0, 160);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !title) {
    return res.status(400).json({ ok: false, message: "A date and title are required." });
  }
  const bundle = loadEvents();
  const event = {
    id: "k-" + kid + "-" + Date.now(),
    kid: kid,
    date: date,
    time: String(body.time || "").trim().slice(0, 40),
    title: title,
    note: String(body.note || "").trim().slice(0, 400)
  };
  bundle.events = bundle.events.concat([event]);
  saveEvents(bundle);
  res.json({ ok: true, event: event });
});

app.post("/api/kid/:kid/events/:id", function (req, res) {
  const kid = requireKid(req, res);
  if (!kid) return;
  const action = String((req.body && req.body.action) || "").toLowerCase();
  const bundle = loadEvents();
  const idx = bundle.events.findIndex((event) => event.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: "Event not found." });
  if (bundle.events[idx].kid !== kid) {
    return res.status(403).json({ ok: false, message: "You can only change your own events." });
  }
  if (action === "delete") {
    const removed = bundle.events.splice(idx, 1)[0];
    saveEvents(bundle);
    return res.json({ ok: true, removed: removed });
  }
  const body = req.body || {};
  const next = Object.assign({}, bundle.events[idx]);
  if (body.date) {
    const date = String(body.date).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ ok: false, message: "Invalid date." });
    next.date = date;
  }
  if (typeof body.time === "string") next.time = body.time.trim().slice(0, 40);
  if (typeof body.title === "string") {
    const title = body.title.trim().slice(0, 160);
    if (!title) return res.status(400).json({ ok: false, message: "A title is required." });
    next.title = title;
  }
  if (typeof body.note === "string") next.note = body.note.trim().slice(0, 400);
  bundle.events[idx] = next;
  saveEvents(bundle);
  res.json({ ok: true, event: next });
});


app.use(express.static(ROOT, {
  dotfiles: "ignore",
  index: "index.html",
  extensions: ["html"]
}));

function start(port) {
  const listenPort = port == null ? PORT : port;
  return app.listen(listenPort, function () {
    const text = textConfigured();
    const email = emailConfigured();
    console.log("evaandgabe site listening on port " + listenPort);
    console.log("Text endpoint: " + (text ? "live" : "demo mode"));
    console.log("Email endpoint: " + (email ? "live" : "demo mode"));
  });
}

if (require.main === module) {
  start();
}

module.exports = {
  app,
  start,
  demoOnly,
  emailLiveFlag,
  textConfigured,
  emailConfigured,
  fromAddress,
  calendarInbox,
  suggestionsInbox,
  sendEmail
};
