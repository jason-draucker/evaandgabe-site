"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const assert = require("node:assert/strict");
const { describe, it, before, after, beforeEach, afterEach } = require("node:test");

const ENV_KEYS = [
  "DEMO_ONLY",
  "EMAIL_LIVE",
  "JASON_EMAIL",
  "RESEND_API_KEY",
  "SENDGRID_API_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM",
  "JASON_CELL",
  "PIPER_EMAIL",
  "SUGGESTIONS_INBOX",
  "CALENDAR_INBOX",
  "PRESET_EMAIL_COOLDOWN_MS"
];

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "evaandgabe-email-"));
process.env.DATA_DIR = tmpDir;
fs.mkdirSync(tmpDir, { recursive: true });

const {
  app,
  demoOnly,
  emailLiveFlag,
  textConfigured,
  emailConfigured,
  fromAddress,
  calendarInbox,
  suggestionsInbox,
  sendEmail
} = require("../server.js");

const realFetch = global.fetch;

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function setEnv(map) {
  clearEnv();
  for (const [key, value] of Object.entries(map)) {
    process.env[key] = value;
  }
}

const TWILIO_READY = {
  TWILIO_ACCOUNT_SID: "ACtestxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  TWILIO_AUTH_TOKEN: "twilio-test-token",
  TWILIO_FROM: "+15555550100",
  JASON_CELL: "+15555550111"
};

const RESEND_READY = {
  JASON_EMAIL: "dad@example.com",
  RESEND_API_KEY: "re_test_placeholder_key",
  SMTP_FROM: "Eva and Gabe <noreply@evaandgabe.com>"
};

function installFetchMock(handler) {
  const calls = [];
  global.fetch = async function (url, opts) {
    const href = String(url);
    if (href.includes("127.0.0.1") || href.includes("localhost")) {
      return realFetch(url, opts);
    }
    calls.push({
      url: href,
      method: opts && opts.method,
      body: opts && opts.body,
      hasAuth: Boolean(opts && opts.headers && (opts.headers.Authorization || opts.headers.authorization))
    });
    return handler(href, opts, calls);
  };
  return calls;
}

async function withServer(fn) {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const port = server.address().port;
    await fn(port);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

async function postJson(port, url, body) {
  const response = await realFetch("http://127.0.0.1:" + port + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await response.json();
  return { status: response.status, json };
}

before(() => {
  clearEnv();
});

after(() => {
  global.fetch = realFetch;
  clearEnv();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  clearEnv();
  global.fetch = realFetch;
});

afterEach(() => {
  global.fetch = realFetch;
  clearEnv();
});

describe("email and text flag logic", () => {
  it("treats EMAIL_LIVE=1 and true as on", () => {
    setEnv({ EMAIL_LIVE: "1" });
    assert.equal(emailLiveFlag(), true);
    setEnv({ EMAIL_LIVE: "true" });
    assert.equal(emailLiveFlag(), true);
    setEnv({ EMAIL_LIVE: "0" });
    assert.equal(emailLiveFlag(), false);
    setEnv({});
    assert.equal(emailLiveFlag(), false);
  });

  it("keeps texts in demo whenever DEMO_ONLY is on, even with EMAIL_LIVE and Twilio keys", () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...TWILIO_READY, ...RESEND_READY });
    assert.equal(demoOnly(), true);
    assert.equal(textConfigured(), false);
  });

  it("enables texts only when DEMO_ONLY is off and Twilio keys are set", () => {
    setEnv({ ...TWILIO_READY });
    assert.equal(textConfigured(), true);
    setEnv({ DEMO_ONLY: "1", ...TWILIO_READY });
    assert.equal(textConfigured(), false);
  });

  it("keeps email in demo when DEMO_ONLY is on and EMAIL_LIVE is unset, even with keys", () => {
    setEnv({ DEMO_ONLY: "1", ...RESEND_READY });
    assert.equal(emailConfigured(), false);
  });

  it("enables live email when EMAIL_LIVE=1, RESEND_API_KEY, and JASON_EMAIL are set, even if DEMO_ONLY=1", () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...RESEND_READY });
    assert.equal(emailConfigured(), true);
    assert.equal(textConfigured(), false);
  });

  it("does not enable live email under DEMO_ONLY without RESEND_API_KEY, even with EMAIL_LIVE and SMTP", () => {
    setEnv({
      DEMO_ONLY: "1",
      EMAIL_LIVE: "1",
      JASON_EMAIL: "dad@example.com",
      SMTP_HOST: "smtp.example.com",
      SMTP_FROM: "Eva and Gabe <noreply@evaandgabe.com>"
    });
    assert.equal(emailConfigured(), false);
  });

  it("does not enable live email under DEMO_ONLY + EMAIL_LIVE if JASON_EMAIL is missing", () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", RESEND_API_KEY: "re_test_placeholder_key" });
    assert.equal(emailConfigured(), false);
  });

  it("enables email when DEMO_ONLY is off and a provider plus JASON_EMAIL are set", () => {
    setEnv({ JASON_EMAIL: "dad@example.com", RESEND_API_KEY: "re_test_placeholder_key" });
    assert.equal(emailConfigured(), true);
    setEnv({
      JASON_EMAIL: "dad@example.com",
      SMTP_HOST: "smtp.example.com",
      SMTP_FROM: "Eva and Gabe <noreply@evaandgabe.com>"
    });
    assert.equal(emailConfigured(), true);
  });

  it("defaults the from address and inboxes", () => {
    setEnv({});
    assert.equal(fromAddress(), "Eva and Gabe <noreply@evaandgabe.com>");
    assert.equal(calendarInbox(), "calendar@evaandgabe.com");
    assert.equal(suggestionsInbox(), "piper@evaandgabe.com");
    setEnv({
      SMTP_FROM: "Custom <from@example.com>",
      CALENDAR_INBOX: "cal@example.com",
      SUGGESTIONS_INBOX: "ideas@example.com"
    });
    assert.equal(fromAddress(), "Custom <from@example.com>");
    assert.equal(calendarInbox(), "cal@example.com");
    assert.equal(suggestionsInbox(), "ideas@example.com");
  });
});

describe("sendEmail (mocked fetch)", () => {
  it("posts to Resend with the from address and recipients", async () => {
    setEnv(RESEND_READY);
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await sendEmail({ to: "dad@example.com", subject: "Hello", text: "Hi there" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    const payload = JSON.parse(calls[0].body);
    assert.equal(payload.from, "Eva and Gabe <noreply@evaandgabe.com>");
    assert.deepEqual(payload.to, ["dad@example.com"]);
    assert.equal(payload.subject, "Hello");
    assert.equal(payload.text, "Hi there");
    assert.equal(calls[0].hasAuth, true);
  });

  it("throws a generic error when Resend returns a failure, without claiming success", async () => {
    setEnv(RESEND_READY);
    installFetchMock(async () => new Response("nope", { status: 500 }));
    await assert.rejects(() => sendEmail({ to: "dad@example.com", subject: "Hello", text: "Hi" }), /resend-failed/);
  });
});

describe("API email vs text behavior", () => {
  it("sends /api/request-email for real when EMAIL_LIVE overrides DEMO_ONLY", async () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...RESEND_READY, ...TWILIO_READY });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/request-email", {
        tcpaConsent: true,
        kid: "eva",
        message: "Need a ride after practice"
      });
      assert.equal(result.status, 200);
      assert.equal(result.json.ok, true);
      assert.equal(result.json.mode, "live");
      assert.match(result.json.message, /Email sent to Dad/);
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    const payload = JSON.parse(calls[0].body);
    assert.deepEqual(payload.to, ["dad@example.com"]);
    assert.match(payload.subject, /Eva/);
    assert.match(payload.text, /Need a ride after practice/);
  });

  it("does not send /api/request-email when DEMO_ONLY is on and EMAIL_LIVE is unset", async () => {
    setEnv({ DEMO_ONLY: "1", ...RESEND_READY });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/request-email", {
        tcpaConsent: true,
        kid: "gabe",
        message: "Need a ride"
      });
      assert.equal(result.status, 200);
      assert.equal(result.json.ok, true);
      assert.equal(result.json.mode, "demo");
      assert.match(result.json.message, /No email was sent/);
    });
    assert.equal(calls.length, 0);
  });

  it("returns a clear failure and does not claim success when Resend errors", async () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...RESEND_READY });
    installFetchMock(async () => new Response("nope", { status: 401 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/request-email", {
        tcpaConsent: true,
        kid: "eva",
        message: "Need a ride"
      });
      assert.equal(result.status, 502);
      assert.equal(result.json.ok, false);
      assert.equal(result.json.message, "The email could not be sent right now.");
      assert.notEqual(result.json.mode, "live");
    });
  });

  it("keeps /api/request-text in demo when DEMO_ONLY=1 even if EMAIL_LIVE=1", async () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...RESEND_READY, ...TWILIO_READY });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/request-text", {
        tcpaConsent: true,
        kid: "eva",
        amount: 10
      });
      assert.equal(result.status, 200);
      assert.equal(result.json.ok, true);
      assert.equal(result.json.mode, "demo");
      assert.match(result.json.message, /No text was sent/);
    });
    assert.equal(calls.length, 0);
  });

  it("emails a calendar request to CALENDAR_INBOX via Resend and still applies the event", async () => {
    setEnv({
      DEMO_ONLY: "1",
      EMAIL_LIVE: "1",
      ...RESEND_READY,
      CALENDAR_INBOX: "calendar@example.com"
    });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/calendar-request", {
        kid: "gabe",
        date: "2026-11-25",
        text: "Soccer practice"
      });
      assert.equal(result.status, 200);
      assert.equal(result.json.ok, true);
      assert.equal(result.json.mode, "live");
      assert.equal(result.json.event.title, "Soccer practice");
      assert.equal(result.json.event.date, "2026-11-25");
      const events = await realFetch("http://127.0.0.1:" + port + "/api/events").then((r) => r.json());
      assert.ok(events.events.some((event) => event.title === "Soccer practice" && event.kid === "gabe"));
    });
    assert.equal(calls.length, 1);
    const payload = JSON.parse(calls[0].body);
    assert.deepEqual(payload.to, ["calendar@example.com"]);
    assert.match(payload.subject, /Gabe/);
    assert.match(payload.text, /Soccer practice/);
  });

  it("still applies a calendar entry if the live email fails, and does not claim success", async () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...RESEND_READY });
    installFetchMock(async () => new Response("nope", { status: 500 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/calendar-request", {
        kid: "eva",
        date: "2026-11-26",
        text: "Band concert"
      });
      assert.equal(result.status, 502);
      assert.equal(result.json.ok, false);
      assert.match(result.json.message, /could not be sent/);
      assert.equal(result.json.event.title, "Band concert");
      const events = await realFetch("http://127.0.0.1:" + port + "/api/events").then((r) => r.json());
      assert.ok(events.events.some((event) => event.title === "Band concert"));
    });
  });

  it("emails customize and 24-hour suggestions to SUGGESTIONS_INBOX / PIPER_EMAIL", async () => {
    setEnv({
      DEMO_ONLY: "1",
      EMAIL_LIVE: "1",
      ...RESEND_READY,
      SUGGESTIONS_INBOX: "ideas@example.com"
    });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const custom = await postJson(port, "/api/suggestion", {
        kid: "eva",
        kind: "customize",
        message: "More flowers please"
      });
      assert.equal(custom.status, 200);
      assert.equal(custom.json.ok, true);
      assert.equal(custom.json.mode, "live");
      assert.equal(custom.json.to, "ideas@example.com");

      const change = await postJson(port, "/api/suggestion", {
        kid: "gabe",
        kind: "change24h",
        message: "Add a sports scoreboard"
      });
      assert.equal(change.status, 200);
      assert.equal(change.json.ok, true);
      assert.equal(change.json.to, "ideas@example.com");
    });
    assert.equal(calls.length, 2);
    const first = JSON.parse(calls[0].body);
    const second = JSON.parse(calls[1].body);
    assert.deepEqual(first.to, ["ideas@example.com"]);
    assert.match(first.subject, /customize/i);
    assert.match(first.text, /More flowers please/);
    assert.match(second.subject, /24-hour/i);
    assert.match(second.text, /sports scoreboard/);
  });

  it("does not email suggestions in demo mode", async () => {
    setEnv({ DEMO_ONLY: "1", ...RESEND_READY });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/suggestion", {
        kid: "eva",
        kind: "customize",
        message: "A new color"
      });
      assert.equal(result.status, 200);
      assert.equal(result.json.mode, "demo");
      assert.match(result.json.message, /No email was sent/);
    });
    assert.equal(calls.length, 0);
  });
});

describe("preset amount email (mocked fetch)", () => {
  it("does not send or claim success in demo mode, and does not require consent", async () => {
    setEnv({ DEMO_ONLY: "1" });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/request-preset-email", { kid: "eva", amount: 5 });
      assert.equal(result.status, 200);
      assert.equal(result.json.ok, true);
      assert.equal(result.json.mode, "demo");
      assert.match(result.json.message, /No email was sent/);
      assert.doesNotMatch(result.json.message, /has been emailed/);
    });
    assert.equal(calls.length, 0);
  });

  it("sends a live $5 email with kid and time in the subject and body", async () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...RESEND_READY, PRESET_EMAIL_COOLDOWN_MS: "0" });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/request-preset-email", { kid: "eva", amount: 5 });
      assert.equal(result.status, 200);
      assert.equal(result.json.ok, true);
      assert.equal(result.json.mode, "live");
      assert.equal(result.json.message, "Your dad has been emailed your request for five dollars.");
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    const payload = JSON.parse(calls[0].body);
    assert.deepEqual(payload.to, ["dad@example.com"]);
    assert.equal(payload.subject, "Eva is asking for $5");
    assert.match(payload.text, /Eva is asking for \$5 \(five dollars\)/);
    assert.match(payload.text, /Sent at /);
  });

  it("sends a live $10 email with the ten-dollars confirmation and rate-limits a repeat", async () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...RESEND_READY, PRESET_EMAIL_COOLDOWN_MS: "60000" });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const first = await postJson(port, "/api/request-preset-email", { kid: "gabe", amount: 10 });
      assert.equal(first.status, 200);
      assert.equal(first.json.message, "Your dad has been emailed your request for ten dollars.");
      const payload = JSON.parse(calls[0].body);
      assert.equal(payload.subject, "Gabe is asking for $10");
      const second = await postJson(port, "/api/request-preset-email", { kid: "gabe", amount: 20 });
      assert.equal(second.status, 429);
      assert.equal(second.json.ok, false);
      assert.match(second.json.message, /wait a minute/i);
    });
    assert.equal(calls.length, 1);
  });

  it("returns an honest error when Resend fails and does not claim the email was sent", async () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...RESEND_READY, PRESET_EMAIL_COOLDOWN_MS: "0" });
    installFetchMock(async () => new Response("nope", { status: 500 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/request-preset-email", { kid: "eva", amount: 50 });
      assert.equal(result.status, 502);
      assert.equal(result.json.ok, false);
      assert.match(result.json.message, /could not be sent/i);
      assert.doesNotMatch(result.json.message, /has been emailed/);
    });
  });

  it("rejects an amount that is not 5, 10, 20, or 50", async () => {
    setEnv({ DEMO_ONLY: "1", EMAIL_LIVE: "1", ...RESEND_READY });
    const calls = installFetchMock(async () => new Response("{}", { status: 200 }));
    await withServer(async (port) => {
      const result = await postJson(port, "/api/request-preset-email", { kid: "eva", amount: 15 });
      assert.equal(result.status, 400);
      assert.equal(result.json.ok, false);
    });
    assert.equal(calls.length, 0);
  });
});
