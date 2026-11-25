import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE = "http://127.0.0.1:3000/";
const OUT = "/workspace/evaandgabe-site";
const original = [];
const extra = [];

function record(bucket, name, ok, detail) {
  bucket.push({ name, ok, detail: detail || "" });
  console.log((ok ? "PASS" : "FAIL") + "  " + name + (detail ? " — " + String(detail).slice(0, 220) : ""));
}

function rec(name, ok, detail) { record(original, name, ok, detail); }
function rec2(name, ok, detail) { record(extra, name, ok, detail); }

const EVA_TOKEN = "eva-local-demo";
const GABE_TOKEN = "gabe-local-demo";
const INBOUND = "inbound-local-demo";
const REQUEST_TEXT = "Dad needs a Sat Buddy. Claim below and deliver to receive $200.";
const CLAIM_MSG = "You have claimed this task. SatBuddy is needed by 10 PM tonight.";
const DEADLINE = "SatBuddy needed by 10 PM tonight";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new", protocolTimeout: 60000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"]
});

async function freshPage() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluate(() => {
    try { localStorage.removeItem("evaandgabe-tasks"); } catch (e) {}
  });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForSelector("#update-list li");
  return page;
}

async function shot(page, file, scale) {
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: scale || 2 });
  await new Promise((r) => setTimeout(r, 250));
  const dest = path.join(OUT, file);
  await page.screenshot({ path: dest, fullPage: true, type: "png" });
  return dest;
}

const review = await freshPage();

// --- review screenshots first ---
await shot(review, "review-eva.png", 2);
rec2("review-eva.png written", fs.existsSync(path.join(OUT, "review-eva.png")));

await review.click("#tab-gabe");
await review.waitForFunction(() => document.body.classList.contains("is-gabe"));
await new Promise((r) => setTimeout(r, 200));
await shot(review, "review-gabe.png", 2);
rec2("review-gabe.png written", fs.existsSync(path.join(OUT, "review-gabe.png")));

await review.click("#tab-eva");
await review.waitForFunction(() => document.body.classList.contains("is-eva"));
await review.click("[data-claim='u-today']");
await review.waitForFunction(() => (document.querySelector("#update-list")?.innerText || "").includes("You have claimed this task"));
await shot(review, "review-claimed.png", 2);
rec2("review-claimed.png written", fs.existsSync(path.join(OUT, "review-claimed.png")));

const claimedText = await review.$eval("#update-list", (el) => el.innerText);
rec2("claim message after claim", claimedText.includes(CLAIM_MSG), claimedText.slice(0, 280));
rec2("countdown visible after claim", /hr|min left|Time is up/i.test(claimedText), claimedText.slice(0, 280));

// shared claim on Gabe tab
await review.click("#tab-gabe");
await review.waitForFunction(() => document.body.classList.contains("is-gabe"));
const gabeClaim = await review.$eval("#update-list", (el) => el.innerText);
rec2("Gabe tab shows Claimed by Eva", /Claimed by Eva/.test(gabeClaim), gabeClaim.slice(0, 220));

await review.close();

// reset server-side tasks so original checks start clean
await fetch("http://127.0.0.1:3000/api/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ claims: {}, completions: [] })
});

// --- original 20 ---
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: "networkidle0", timeout: 30000 });
await page.evaluate(() => {
  try { localStorage.removeItem("evaandgabe-tasks"); } catch (e) {}
});
await page.goto(BASE, { waitUntil: "networkidle0", timeout: 30000 });

const title = await page.title();
rec("page title", title.includes("Eva") && title.includes("Gabe"), title);

const header = await page.$eval(".wordmark", (el) => el.textContent.trim());
rec("header wordmark", header.replace(/\s+/g, " ").includes("Eva") && header.includes("Gabe"), header);

const evaSelected = await page.$eval("#tab-eva", (el) => el.getAttribute("aria-selected") === "true");
rec("Eva tab selected by default", evaSelected);

const eyebrow = await page.$eval("#calendar-eyebrow", (el) => el.textContent);
rec("Eva calendar label", /Eva/i.test(eyebrow), eyebrow);

const upcoming = await page.$eval("#upcoming-list", (el) => el.innerText);
rec("Eva upcoming has birthday, Christmas, and New Year", /Eva's birthday/.test(upcoming) && /Christmas Day/.test(upcoming) && /New Year's Day/.test(upcoming) && !/Example/i.test(upcoming), upcoming.slice(0, 280));

const phoneOnPage = await page.evaluate(() => {
  const text = document.body.innerText;
  return /\b(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})\b/.test(text);
});
rec("no public phone number shown", !phoneOnPage);

const tcpaChecked = await page.$eval("#tcpa", (el) => el.checked);
rec("TCPA checkbox starts unchecked", tcpaChecked === false);

await page.click('.preset-btn[data-amount="10"]');
await page.waitForSelector("#form-status:not([hidden])");
const presetMsg = await page.$eval("#form-status", (el) => el.textContent);
rec("preset $10 in demo does not claim an email was sent and skips consent", /could not be sent/i.test(presetMsg) && /No email was sent/i.test(presetMsg) && !/has been emailed/i.test(presetMsg), presetMsg);
rec("preset button labels are $5, $10, and hidden $200", (await page.$$eval(".preset-btn", (els) => els.map((e) => e.textContent.trim() + (e.hidden ? ":hidden" : "")))).join("|") === "Dad, I need $5|Dad, I need $10|Dad, I need $200:hidden");


await page.click("#tab-gabe");
await page.waitForFunction(() => document.querySelector("#tab-gabe").getAttribute("aria-selected") === "true");
const gabeEyebrow = await page.$eval("#calendar-eyebrow", (el) => el.textContent);
const gabeUpcoming = await page.$eval("#upcoming-list", (el) => el.innerText);
rec("Gabe tab switches calendar", /Gabe/i.test(gabeEyebrow), gabeEyebrow);
rec("Gabe upcoming has the same three dates", /Eva's birthday/.test(gabeUpcoming) && /Christmas Day/.test(gabeUpcoming) && /New Year's Day/.test(gabeUpcoming) && !/Example/i.test(gabeUpcoming), gabeUpcoming.slice(0, 280));

await page.$eval("#request-text", (el) => {
  el.value = "Hi Dad, can I have a ride after the game?";
});
await page.click("#email-dad-btn");
await page.waitForFunction(() => /would email Dad/i.test(document.querySelector("#form-status")?.textContent || ""));
const emailMsg = await page.$eval("#form-status", (el) => el.textContent);
rec("typed request emails Dad in demo mode", /would email Dad/i.test(emailMsg), emailMsg);

const wishText = await page.$eval("#wish-list", (el) => el.innerText);
rec("wish list shows example items and statuses", /A pair of pants/i.test(wishText) && /A new car/i.test(wishText) && /A trip to Hawaii/i.test(wishText) && /On the way/i.test(wishText) && /Got/i.test(wishText) && !/spaceship/i.test(wishText) && !/Soccer cleats/i.test(wishText), wishText.slice(0, 280));

const parentButtonsBefore = await page.$$eval(".status-btn", (els) => els.length);
rec("status toggles hidden until parent unlock", parentButtonsBefore === 0);

await page.click("#parent-unlock-btn");
await page.waitForSelector("#pin-modal:not([hidden])");
await page.type("#pin-input", "2468");
await page.click("#pin-form button[type=submit]");
await page.waitForSelector("#parent-panel:not([hidden])");
const parentOpen = await page.$eval("#parent-panel", (el) => !el.hidden);
rec("parent PIN unlocks tools", parentOpen);

const statusCount = await page.$$eval(".status-btn", (els) => els.length);
rec("status toggles appear in parent mode", statusCount > 0, String(statusCount));

const firstGot = await page.$('.status-btn[data-status="got"]');
await firstGot.click();
await page.waitForFunction(() => {
  const first = document.querySelector("#wish-list li");
  return first && /Got/i.test(first.querySelector(".status-pill")?.textContent || "");
});
const firstStatus = await page.$eval("#wish-list li .status-pill", (el) => el.textContent.trim());
rec("wish status toggle works", firstStatus.toLowerCase() === "got", firstStatus);

await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
await page.screenshot({ path: path.join(OUT, "preview-desktop.png"), fullPage: true, type: "png" });
rec("desktop screenshot written", fs.existsSync(path.join(OUT, "preview-desktop.png")));

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto(BASE, { waitUntil: "networkidle0" });
await page.screenshot({ path: path.join(OUT, "preview-mobile.png"), fullPage: true, type: "png" });
rec("mobile screenshot written", fs.existsSync(path.join(OUT, "preview-mobile.png")));

await page.click("#tab-gabe");
await page.waitForFunction(() => /Gabe/i.test(document.querySelector("#calendar-eyebrow")?.textContent || ""));
rec("mobile Gabe tab works", true);

// --- new UI checks on a clean desktop page ---
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.evaluate(() => {
  try { localStorage.removeItem("evaandgabe-tasks"); } catch (e) {}
});
await page.goto(BASE, { waitUntil: "networkidle0" });
await page.waitForSelector("#update-list li");

const heading = await page.$eval("#updates-heading", (el) => el.textContent.trim());
rec2("Dad Updates heading", heading === "Dad Updates", heading);
const leftover = await page.evaluate(() => /Updates from Dad/.test(document.body.innerText));
rec2("no leftover Updates from Dad label", leftover === false);

const firstUpdate = await page.$eval("#update-list li", (el) => el.innerText);
const REQUEST_BODY = "Dad needs a Sat Buddy. Claim below and deliver to receive $200.";
rec2("top update is today's SatBuddy request", firstUpdate.includes("Dad request") && firstUpdate.includes("Dad needs a Sat Buddy") && firstUpdate.includes(REQUEST_BODY) && /November 24|Nov 24|2026-11-24/i.test(firstUpdate), firstUpdate.slice(0, 280));
rec2("SatBuddy needed by 10 PM tonight", firstUpdate.includes(DEADLINE), firstUpdate.slice(0, 200));
rec2("Claim button on unclaimed SatBuddy", Boolean(await page.$("[data-claim='u-today']")));
const alertInfo = await page.$eval("#update-list li.is-dad-request", (el) => ({
  beacon: Boolean(el.querySelector(".alert-beacon[aria-hidden='true']")),
  alertText: (el.querySelector(".visually-hidden") || {}).textContent || "",
  heading: (el.querySelector(".dad-request-heading") || {}).textContent || "",
  subline: (el.querySelector(".dad-request-subline") || {}).textContent || "",
  signoff: (el.querySelector(".family-signoff") || {}).textContent || "",
  bodyHasPrefix: /Dad request:/.test((el.querySelector(".update-text") || {}).textContent || "")
}));
rec2("spinning red alert beacon", alertInfo.beacon && alertInfo.alertText.trim() === "Alert", JSON.stringify(alertInfo));
rec2("big Dad request heading and Sat Buddy subline", alertInfo.heading === "Dad request" && alertInfo.subline === "Dad needs a Sat Buddy", JSON.stringify(alertInfo));
rec2("body does not repeat Dad request prefix", alertInfo.bodyHasPrefix === false, JSON.stringify(alertInfo));
rec2("Eva and Gabe signoff at bottom of request", alertInfo.signoff === "Eva and Gabe", alertInfo.signoff);
const ledeGone = await page.evaluate(() => /Calendars,\s*a wish list,\s*and a simple way to ask Dad/i.test(document.body.innerText));
rec2("tagline calendars/wish list/ask Dad removed", ledeGone === false);
const entries = await page.$$eval(".family-entry", (els) => els.map((e) => e.textContent.trim()));
rec2("two smaller Eva then Gabe entries", entries.length === 2 && entries[0] === "Eva, click here" && entries[1] === "Gabe, click here", JSON.stringify(entries));

const imgInfo = await page.$eval("#update-list .update-image", (el) => ({
  alt: el.getAttribute("alt"),
  src: el.getAttribute("src"),
  w: el.clientWidth,
  natural: el.naturalWidth
}));
rec2("sat buddy image on both tabs (Eva)", imgInfo.alt === "Sat Buddy satellite meter" && Number(imgInfo.w) >= 200 && Number(imgInfo.natural) > 0 && imgInfo.src.includes("sat-buddy"), JSON.stringify(imgInfo));

rec2("Customize button visible", Boolean(await page.$("#customize-btn")));
rec2("24 hour change to website button visible", (await page.$eval("#change24-btn", (el) => el.textContent.trim())) === "24 hour change to website");
rec2("calendar request form visible", Boolean(await page.$("#calendar-request-form")) && Boolean(await page.$("#cal-req-text")));
rec2("money buttons visible", (await page.$$eval(".preset-btn", (els) => els.filter((e) => !e.hidden).map((e) => e.getAttribute("data-amount")))).join(",") === "5,10");
rec2("completion record visible", Boolean(await page.$("#completion-record")));
rec2("private login links visible", await page.evaluate(() => /Private calendar login/i.test(document.body.innerText)));

await page.click("#customize-btn");
await page.waitForSelector("#suggest-modal:not([hidden])");
const custPrompt = await page.$eval("#suggest-prompt", (el) => el.textContent.trim());
rec2("Customize prompt", custPrompt === "What else would you like to customize on your website?", custPrompt);
await page.type("#suggest-text", "More flower stickers please");
await page.click("#suggest-submit");
await page.waitForFunction(() => /piper@evaandgabe\.com/i.test(document.querySelector("#suggest-status")?.textContent || ""));
const sugMsg = await page.$eval("#suggest-status", (el) => el.textContent);
rec2("Customize routes to piper@ in demo, no real send", /piper@evaandgabe\.com/i.test(sugMsg) && /no email was sent/i.test(sugMsg) && /Eva/i.test(sugMsg), sugMsg);
await page.click("#suggest-cancel");

await page.click("#change24-btn");
await page.waitForSelector("#suggest-modal:not([hidden])");
const chPrompt = await page.$eval("#suggest-prompt", (el) => el.textContent.trim());
rec2("24 hour change prompt", chPrompt === "Please describe in detail how you would like to change this website.", chPrompt);
await page.click("#suggest-cancel");

// claim + complete + shared record
await page.click("[data-claim='u-today']");
await page.waitForFunction(() => (document.querySelector(".update-claim-msg")?.textContent || "").includes("You have claimed this task"));
const afterClaim = await page.$eval("#update-list", (el) => el.innerText);
rec2("claim message exact wording", afterClaim.includes(CLAIM_MSG), afterClaim.slice(0, 240));
await page.click("[data-mark-done='u-today']");
await page.waitForSelector("#pin-modal:not([hidden])");
await page.click("#pin-input", { clickCount: 3 });
await page.keyboard.press("Backspace");
await page.type("#pin-input", "2468");
await page.click("#pin-form button[type=submit]");
await page.waitForFunction(() => /Money sent to Eva/i.test(document.querySelector("#completion-list")?.innerText || ""));
const compEva = await page.$eval("#completion-list", (el) => el.innerText);
rec2("shared completion after PIN (Eva)", /Completed: SatBuddy/.test(compEva) && /Money sent to Eva/.test(compEva), compEva.slice(0, 220));

await page.click("#tab-gabe");
await page.waitForFunction(() => document.body.classList.contains("is-gabe"));
const compGabe = await page.$eval("#completion-list", (el) => el.innerText);
rec2("Gabe tab shows Eva completion", /Completed: SatBuddy/.test(compGabe) && /Money sent to Eva/.test(compGabe), compGabe.slice(0, 220));
const gabeImg = await page.$eval("#update-list .update-image", (el) => ({ alt: el.getAttribute("alt"), w: el.clientWidth }));
rec2("sat buddy image on both tabs (Gabe)", gabeImg.alt === "Sat Buddy satellite meter" && Number(gabeImg.w) >= 200, JSON.stringify(gabeImg));
const gabeTop = await page.$eval("#update-list li", (el) => el.innerText);
rec2("Gabe tab same top SatBuddy text and deadline", gabeTop.includes("Dad request") && gabeTop.includes("Dad needs a Sat Buddy") && gabeTop.includes(REQUEST_BODY) && gabeTop.includes(DEADLINE), gabeTop.slice(0, 200));
rec2("Eva floral default look", await page.evaluate(() => document.body.getAttribute("data-eva-skin") === "eva-blush-roses"));
rec2("Gabe default look applied", await page.evaluate(() => document.body.classList.contains("is-gabe") && document.body.getAttribute("data-skin") === "gabe-classic-blue-black"));

// API checks (do not print tokens)
const health = await (await fetch("http://127.0.0.1:3000/api/health")).json();
rec2("health is demo mode", health.ok === true && health.mode === "demo" && health.textConfigured === false && health.emailConfigured === false, health.mode);

const ev = await (await fetch("http://127.0.0.1:3000/api/events")).json();
const evTitles = (ev.events || []).map((e) => e.date + " " + e.title).sort();
rec2("GET /api/events has only the three seeded dates", ev.timezone === "America/Denver" && ev.events.length === 3 && evTitles.join("|") === "2026-11-28 Eva's birthday|2026-12-25 Christmas Day|2027-01-01 New Year's Day", JSON.stringify({ timezone: ev.timezone, evTitles }));

const noToken = await fetch("http://127.0.0.1:3000/api/kid/eva/session");
rec2("kid session rejected without token", noToken.status === 401);

const bad = await fetch("http://127.0.0.1:3000/api/kid/eva/session", { headers: { "X-Kid-Token": "wrong-token" } });
rec2("kid session rejected with wrong token", bad.status === 401);

const okEva = await fetch("http://127.0.0.1:3000/api/kid/eva/session", { headers: { "X-Kid-Token": EVA_TOKEN } });
const okEvaBody = await okEva.json();
rec2("Eva demo token accepted", okEva.ok && okEvaBody.kid === "eva", okEva.status);

const cross = await fetch("http://127.0.0.1:3000/api/kid/eva/events", { headers: { "X-Kid-Token": GABE_TOKEN } });
rec2("cross-kid token rejected", cross.status === 401);

const add = await fetch("http://127.0.0.1:3000/api/kid/eva/events", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Kid-Token": EVA_TOKEN },
  body: JSON.stringify({ date: "2026-12-01", title: "Verify add", note: "from checks" })
});
const added = await add.json();
rec2("Eva can add her own event", add.ok && added.event && added.event.kid === "eva" && added.event.title === "Verify add");

const editOther = await fetch("http://127.0.0.1:3000/api/kid/eva/events/e-gabe-1", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Kid-Token": EVA_TOKEN },
  body: JSON.stringify({ title: "should fail" })
});
rec2("cross-kid event edit rejected", editOther.status === 403 || editOther.status === 404, String(editOther.status));

const inboundBad = await fetch("http://127.0.0.1:3000/api/inbound-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: "nope", text: "Hello kids" })
});
rec2("inbound email rejected without valid token", inboundBad.status === 401);

const inboundOk = await fetch("http://127.0.0.1:3000/api/inbound-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: INBOUND, text: "EXAMPLE: inbound check only", date: "2026-11-24" })
});
const inboundBody = await inboundOk.json();
rec2("inbound email accepted with demo token", inboundOk.ok && inboundBody.post && inboundBody.post.text.includes("inbound check only"));

const noTokenPage = await page.goto("http://127.0.0.1:3000/kid/eva", { waitUntil: "networkidle0" });
const noTokText = await page.evaluate(() => document.body.innerText);
rec2("kid page without token asks for private link", /private link/i.test(noTokText), noTokText.slice(0, 160));

await page.goto("http://127.0.0.1:3000/kid/eva?token=" + EVA_TOKEN, { waitUntil: "networkidle0" });
await page.waitForFunction(() => /private calendar/i.test(document.querySelector("#kid-heading")?.textContent || ""));
const stripped = await page.evaluate(() => window.location.search);
rec2("kid login strips token from address bar", stripped === "");
const kidOk = await page.evaluate(() => /You're in/i.test(document.querySelector("#kid-status")?.textContent || ""));
rec2("Eva private login page works with demo token", kidOk);

await browser.close();

function summarize(label, bucket) {
  const failed = bucket.filter((r) => !r.ok);
  console.log("\n" + label + ": " + (bucket.length - failed.length) + "/" + bucket.length + " passed");
  if (failed.length) {
    failed.forEach((f) => console.log("  FAIL  " + f.name + (f.detail ? " — " + f.detail : "")));
  }
  return failed.length;
}

const failA = summarize("Original 20 checks", original);
const failB = summarize("New feature checks", extra);
console.log("\nALL: " + (original.length + extra.length - failA - failB) + "/" + (original.length + extra.length) + " passed");
if (failA || failB) process.exitCode = 1;
