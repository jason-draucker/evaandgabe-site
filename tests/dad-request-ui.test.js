"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const { describe, it, before, after } = require("node:test");
const { app } = require("../server.js");

const ROOT = path.join(__dirname, "..");

describe("Dad request UI (no live email)", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
  const js = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");

  it("removes the calendars / wish list / ask Dad tagline only", () => {
    assert.equal(/Calendars,\s*a wish list,\s*and a simple way to ask Dad/i.test(html), false);
    assert.equal(/calendars, a wish list, and a way to ask Dad/i.test(html), false);
    assert.match(html, /id="calendar-request-form"/);
    assert.match(html, /id="request-form"/);
    assert.match(html, /id="wish-list"/);
  });

  it("has two smaller Eva then Gabe entries and no third family entry", () => {
    const matches = html.match(/class="family-entry[^"]*"/g) || [];
    assert.equal(matches.length, 2);
    assert.match(html, /id="entry-eva"[^>]*>Eva, click here</);
    assert.match(html, /id="entry-gabe"[^>]*>Gabe, click here</);
    assert.equal(/\band Mom\b|\bMom request\b|\/mom/i.test(html), false);
    assert.match(css, /family-entry[^{]*\{[^}]*font-size:\s*0\.85em/);
  });

  it("keeps the Eva / Gabe header title clickable and does not add a third header name", () => {
    assert.match(html, /class="hero-title"/);
    assert.match(html, /id="hero-eva"[^>]*>Eva</);
    assert.match(html, /id="hero-gabe"[^>]*>Gabe</);
    assert.equal(/hero-mom|and Mom|wordmark-mom/i.test(html), false);
    assert.equal(/A place for our family/i.test(html), false);
    assert.equal(/class="header-tag"/.test(html), false);
  });

  it("renders the alert beacon, heading, subline, photo, and signoff for claimable requests", () => {
    assert.match(js, /class="alert-beacon"/);
    assert.match(js, /visually-hidden">Alert</);
    assert.match(js, /Dad request/);
    assert.match(js, /Dad needs a Sat Buddy/);
    assert.match(js, /family-signoff">Eva and Gabe</);
    assert.match(js, /replace\(\/\^\\s\*Dad request:\\s\*\/i/);
    assert.match(css, /@keyframes alert-spin/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /@keyframes alert-pulse/);
    assert.match(css, /--alert-red:\s*#e10600/);
    assert.equal(fs.existsSync(path.join(ROOT, "images", "sat-buddy.jpg")), true);
    const updates = fs.readFileSync(path.join(ROOT, "data", "updates.json"), "utf8");
    assert.match(updates, /Dad needs a Sat Buddy\. Claim below and deliver to receive \$200\./);
    assert.equal(/Apple Pay/i.test(updates), false);
  });

  it("does not add Mom or Diana content in new files", () => {
    const blob = html + "\n" + css + "\n" + js;
    assert.equal(/\bMom\b|\bDiana\b/i.test(blob), false);
    assert.equal(fs.existsSync(path.join(ROOT, "data", "mom.json")), false);
    assert.equal(fs.existsSync(path.join(ROOT, "mom.html")), false);
  });
});

describe("local server routes (no live email)", () => {
  let server;
  let port;
  before(async () => {
    server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    port = server.address().port;
  });
  after(async () => {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  async function get(pathname) {
    const res = await fetch("http://127.0.0.1:" + port + pathname);
    const text = await res.text();
    return { status: res.status, text };
  }

  it("serves the new markup and CSS on / and styles.css", async () => {
    const home = await get("/");
    assert.equal(home.status, 200);
    assert.match(home.text, /family-entries/);
    assert.match(home.text, /id="entry-eva"/);
    assert.equal(/Calendars,\s*a wish list/i.test(home.text), false);
    const styles = await get("/styles.css");
    assert.equal(styles.status, 200);
    assert.match(styles.text, /alert-beacon/);
    const appjs = await get("/app.js");
    assert.equal(appjs.status, 200);
    assert.match(appjs.text, /alert-beacon/);
    const img = await get("/images/sat-buddy.jpg");
    assert.equal(img.status, 200);
  });

  it("returns a normal 404 for /mom", async () => {
    const res = await get("/mom");
    assert.equal(res.status, 404);
  });
});
