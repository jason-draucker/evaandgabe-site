import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE = process.env.BASE || "http://127.0.0.1:3000/";
const OUT = "/workspace/evaandgabe-site";
const SHOTS = process.env.SHOTS !== "0";
const results = [];
function rec(name, ok, detail) {
  results.push({ name, ok, detail: detail || "" });
  console.log((ok ? "PASS" : "FAIL") + "  " + name + (detail ? " — " + String(detail).slice(0, 220) : ""));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new", protocolTimeout: 60000,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"]
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(BASE, { waitUntil: "networkidle0", timeout: 45000 });
await page.evaluate(() => { localStorage.removeItem("evaandgabe-skins"); localStorage.removeItem("evaandgabe-tasks"); });
await page.goto(BASE, { waitUntil: "networkidle0", timeout: 45000 });
await page.waitForSelector("#update-list li");

rec("old look picker removed", !(await page.$("#look-picker")) && !(await page.$("#look-swatches")));
const btnText = await page.$eval("#design-btn", (el) => el.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
rec("Eva tab: 'Try a different design' button exists", btnText === "Try a different design", btnText);
const corner = await page.evaluate(() => {
  const b = document.querySelector("#design-btn").getBoundingClientRect();
  const s = document.querySelector(".kids-section").getBoundingClientRect();
  return { rightGap: Math.round(s.right - b.right), topGap: Math.round(b.top - s.top) };
});
rec("button sits in top-right corner of kid area", corner.rightGap < 140 && corner.topGap < 60, JSON.stringify(corner));
rec("Eva default skin is Blush Roses", await page.evaluate(() => document.body.getAttribute("data-skin") === "eva-blush-roses"));

async function openModal() {
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(150);
  await page.click("#design-btn");
  await page.waitForSelector("#skin-modal:not([hidden])");
  await sleep(400);
}
async function modalInfo() {
  return page.evaluate(() => {
    const opts = [...document.querySelectorAll("#skin-modal .skin-option")];
    return {
      count: opts.length,
      thumbs: document.querySelectorAll("#skin-modal .skin-option .skin-thumb").length,
      names: opts.map((o) => o.querySelector(".skin-name").textContent),
      tags: opts.map((o) => o.getAttribute("data-skin-tag")),
      ids: opts.map((o) => o.getAttribute("data-skin-id")),
      title: document.querySelector("#skin-title").textContent,
      focusInModal: document.querySelector("#skin-modal").contains(document.activeElement)
    };
  });
}

await openModal();
const eva = await modalInfo();
rec("Eva modal shows 40 skins", eva.count === 40 && eva.thumbs === 40, eva.count + " options / " + eva.thumbs + " thumbs");
rec("Eva skin names unique", new Set(eva.names).size === 40);
rec("Eva modal title names Eva", /Eva/.test(eva.title), eva.title);
rec("focus moves into modal on open", eva.focusInModal);
rec("Eva list folds in the 4 original florals", ["Blush Roses", "Lavender Wildflowers", "Peach Daisies", "Cherry Blossom Sky"].every((n) => eva.names.includes(n)));
if (SHOTS) await page.screenshot({ path: path.join(OUT, "review-skins-eva-modal.png") });

// keyboard: Esc closes and returns focus
await page.keyboard.press("Escape");
await sleep(150);
const escState = await page.evaluate(() => ({ hidden: document.querySelector("#skin-modal").hidden, focus: document.activeElement && document.activeElement.id }));
rec("Esc closes modal and returns focus to button", escState.hidden && escState.focus === "design-btn", JSON.stringify(escState));

// close button
await openModal();
await page.click("#skin-close");
await sleep(150);
rec("close button closes modal", await page.evaluate(() => document.querySelector("#skin-modal").hidden));

// select an Eva skin
await openModal();
const before = await page.evaluate(() => getComputedStyle(document.querySelector(".kids-section")).backgroundImage + "|" + getComputedStyle(document.querySelector(".kids-section")).backgroundColor);
await page.click('.skin-option[data-skin-id="eva-galaxy-dreams"]');
await sleep(300);
const after = await page.evaluate(() => ({
  skin: document.body.getAttribute("data-skin"),
  bg: getComputedStyle(document.querySelector(".kids-section")).backgroundImage + "|" + getComputedStyle(document.querySelector(".kids-section")).backgroundColor,
  font: getComputedStyle(document.querySelector(".kids-section h2")).fontFamily,
  pressed: document.querySelector('.skin-option[data-skin-id="eva-galaxy-dreams"]').getAttribute("aria-pressed")
}));
rec("selecting Eva skin applies it immediately", after.skin === "eva-galaxy-dreams" && after.bg !== before && /Comfortaa/.test(after.font) && after.pressed === "true", JSON.stringify(after).slice(0, 200));
await page.keyboard.press("Escape");
await page.goto(BASE, { waitUntil: "networkidle0" });
rec("Eva skin persists after reload", await page.evaluate(() => document.body.getAttribute("data-skin") === "eva-galaxy-dreams"));
// reset Eva to default for later screenshots
await page.evaluate(() => localStorage.removeItem("evaandgabe-skins"));
await page.goto(BASE, { waitUntil: "networkidle0" });

// Gabe
await page.click("#tab-gabe");
await page.waitForFunction(() => document.body.classList.contains("is-gabe"));
const gBtn = await page.$eval("#design-btn", (el) => el.textContent.replace(/\s+/g, " ").trim());
rec("Gabe tab: 'Try a different design' button exists", gBtn === "Try a different design", gBtn);
rec("Gabe default skin is Classic Blue/Black", await page.evaluate(() => document.body.getAttribute("data-skin") === "gabe-classic-blue-black"));
await openModal();
const gabe = await modalInfo();
rec("Gabe modal shows 40 skins", gabe.count === 40 && gabe.thumbs === 40, gabe.count + " options / " + gabe.thumbs + " thumbs");
rec("Gabe skin names unique", new Set(gabe.names).size === 40);
rec("Gabe modal title names Gabe", /Gabe/.test(gabe.title), gabe.title);
const ps = gabe.ids.filter((id, i) => gabe.tags[i] === "ps");
const cr = gabe.ids.filter((id, i) => gabe.tags[i] === "cr");
const psLabeled = await page.$$eval('.skin-option[data-skin-tag="ps"] .skin-tag', (els) => els.map((e) => e.textContent));
const crLabeled = await page.$$eval('.skin-option[data-skin-tag="cr"] .skin-tag', (els) => els.map((e) => e.textContent));
rec("Gabe list has PlayStation-inspired skins (>=6)", ps.length >= 6 && psLabeled.every((t) => t === "PlayStation-inspired"), ps.length + " PS");
rec("Gabe list has Clash Royale-inspired skins (>=6)", cr.length >= 6 && crLabeled.every((t) => t === "Clash Royale-inspired"), cr.length + " CR");
rec("Gabe list folds in the 4 original game looks", ["Classic Blue/Black", "Two-Tone Console", "Face-Button Brights", "Blue Glow"].every((n) => gabe.names.includes(n)));
const wot = gabe.ids.filter((id, i) => gabe.tags[i] === "wot");
const wotLabeled = await page.$$eval('.skin-option[data-skin-tag="wot"] .skin-tag', (els) => els.map((e) => e.textContent));
rec("Gabe list has World of Tanks-inspired camo skins (>=4)", wot.length >= 4 && wotLabeled.every((t) => t === "World of Tanks-inspired"), wot.length + " WoT");
rec("Eva and Gabe skin sets are different", eva.ids.every((id) => !gabe.ids.includes(id)));
if (SHOTS) await page.screenshot({ path: path.join(OUT, "review-skins-gabe-modal.png") });

// keyboard selection: arrow + Enter
await page.focus('.skin-option[data-skin-id="gabe-classic-blue-black"]');
await page.keyboard.press("ArrowRight");
await page.keyboard.press("Enter");
await sleep(250);
const kb = await page.evaluate(() => document.body.getAttribute("data-skin"));
rec("keyboard (arrow + Enter) selects a skin", kb === "gabe-ps-two-tone", kb);

// Apply PlayStation skin
await page.click('.skin-option[data-skin-id="gabe-dualsense-cosmic-red"]');
await sleep(300);
const psState = await page.evaluate(() => ({
  skin: document.body.getAttribute("data-skin"),
  shapes: document.querySelectorAll("#skin-motif .m-shape").length,
  accent: getComputedStyle(document.querySelector(".kids-section")).getPropertyValue("--accent").trim()
}));
rec("PlayStation skin applies (CSS shapes motif)", psState.skin === "gabe-dualsense-cosmic-red" && psState.shapes === 4, JSON.stringify(psState));
await page.keyboard.press("Escape");
await sleep(200);
if (SHOTS) {
  await page.evaluate(() => window.scrollTo(0, document.querySelector(".kids-section").getBoundingClientRect().top + window.scrollY - document.querySelector(".site-header").offsetHeight - 8));
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, "review-skins-gabe-playstation.png") });
}

await openModal();
await page.click('.skin-option[data-skin-id="gabe-cr-royal-arena"]');
await sleep(300);
const crState = await page.evaluate(() => ({
  skin: document.body.getAttribute("data-skin"),
  card: document.body.getAttribute("data-skin-card"),
  crown: Boolean(document.querySelector("#skin-motif .m-crown")),
  border: getComputedStyle(document.querySelector(".kids-section .card")).borderTopWidth
}));
rec("Clash Royale skin applies (card frame + crown motif)", crState.skin === "gabe-cr-royal-arena" && crState.card === "frame" && crState.crown && crState.border === "3px", JSON.stringify(crState));
await page.keyboard.press("Escape");
await sleep(200);
if (SHOTS) {
  await page.evaluate(() => window.scrollTo(0, document.querySelector(".kids-section").getBoundingClientRect().top + window.scrollY - document.querySelector(".site-header").offsetHeight - 8));
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, "review-skins-gabe-clashroyale.png") });
}

// per-kid persistence: Eva unaffected
await page.click("#tab-eva");
await sleep(200);
rec("skins are per kid (Eva still default after Gabe changes)", await page.evaluate(() => document.body.getAttribute("data-skin") === "eva-blush-roses"));
await page.click("#tab-gabe");
await sleep(200);
rec("Gabe keeps his chosen skin when switching back", await page.evaluate(() => document.body.getAttribute("data-skin") === "gabe-cr-royal-arena"));

// everything else still present under a non-default skin
const others = await page.evaluate(() => ({
  updates: /Dad Updates/.test(document.querySelector("#updates-heading").textContent),
  img: Boolean(document.querySelector("#update-list .update-image[src*='sat-buddy']")),
  cal: Boolean(document.querySelector("#calendar-request-form")),
  presets: document.querySelectorAll(".preset-btn").length,
  customize: Boolean(document.querySelector("#customize-btn")),
  change24: Boolean(document.querySelector("#change24-btn")),
  claim: Boolean(document.querySelector("[data-claim], [data-mark-done], .update-claim-msg, .claim-row"))
}));
rec("other features still present with a skin applied", others.updates && others.img && others.cal && others.presets >= 4 && others.customize && others.change24 && others.claim, JSON.stringify(others));

// mobile: modal grid scrolls
const m = await browser.newPage();
await m.setViewport({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await m.goto(BASE, { waitUntil: "networkidle0" });
await m.click("#design-btn");
await m.waitForSelector("#skin-modal:not([hidden])");
await sleep(300);
const mob = await m.evaluate(() => {
  const g = document.querySelector("#skin-grid");
  const card = document.querySelector(".skin-modal-card").getBoundingClientRect();
  return { scrollable: g.scrollHeight > g.clientHeight, fits: card.width <= window.innerWidth && card.height <= window.innerHeight, count: g.querySelectorAll(".skin-option").length };
});
rec("mobile: modal fits screen and grid scrolls", mob.scrollable && mob.fits && mob.count === 40, JSON.stringify(mob));
if (SHOTS) await m.screenshot({ path: path.join(OUT, "review-skins-mobile-modal.png") });
await m.close();
await page.bringToFront();

// Instant color request on Eva's Ask Dad note box
await page.evaluate(() => { localStorage.removeItem("evaandgabe-skins"); localStorage.removeItem("evaandgabe-colors"); });
await page.goto(BASE, { waitUntil: "networkidle0" });
const fontBefore = await page.$eval(".kids-section h2", (el) => getComputedStyle(el).fontFamily);
const radiusBefore = await page.$eval(".kids-section .card", (el) => getComputedStyle(el).borderRadius);
await page.type("#request-text", "Hi Dad, can I have a ride after the game?");
await sleep(900);
rec("non-color note does not change colors", await page.evaluate(() => document.body.getAttribute("data-color-request") === "" && document.body.getAttribute("data-skin") === "eva-blush-roses"));
await page.$eval("#request-text", (el) => { el.value = ""; });
await page.type("#request-text", "I want it to be all dark red");
await sleep(900);
function hueLum(rgbStr) { return rgbStr; }
const cr1 = await page.evaluate(() => {
  const sec = document.querySelector(".kids-section");
  const cs = getComputedStyle(sec);
  const parse = (c) => { const d = document.createElement("div"); d.style.color = c; document.body.appendChild(d); const v = getComputedStyle(d).color.match(/\d+/g).map(Number); d.remove(); return v; };
  const L = (v) => { const a = v.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const surf = parse(cs.getPropertyValue("--surface").trim());
  const ink = parse(cs.getPropertyValue("--ink").trim());
  const acc = parse(cs.getPropertyValue("--accent").trim());
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  return {
    label: document.body.getAttribute("data-color-request"),
    surf, bgImg: cs.backgroundImage.slice(0, 90),
    redDominant: surf[0] > surf[1] * 1.6 && surf[0] > surf[2] * 1.6,
    surfLum: +L(surf).toFixed(3),
    inkContrast: +ratio(ink, surf).toFixed(2), accentContrast: +ratio(acc, surf).toFixed(2),
    status: document.querySelector("#color-status").hidden ? "" : document.querySelector("#color-status-text").textContent,
    text: document.querySelector("#request-text").value
  };
});
rec("'I want it to be all dark red' gives Eva a dark red theme", cr1.label === "dark red" && cr1.redDominant && cr1.surfLum < 0.08, JSON.stringify(cr1).slice(0, 220));
rec("dark red theme keeps readable contrast (text >= 7, accent >= 4.5)", cr1.inkContrast >= 7 && cr1.accentContrast >= 4.5, "text " + cr1.inkContrast + " / accent " + cr1.accentContrast);
rec("color status shown and note text kept for sending", /dark red/.test(cr1.status) && cr1.text === "I want it to be all dark red", cr1.status);
rec("only colors changed (fonts and card shape same)", (await page.$eval(".kids-section h2", (el) => getComputedStyle(el).fontFamily)) === fontBefore && (await page.$eval(".kids-section .card", (el) => getComputedStyle(el).borderRadius)) === radiusBefore);
if (SHOTS) {
  await page.evaluate(() => window.scrollTo(0, document.querySelector(".kids-section").getBoundingClientRect().top + window.scrollY - document.querySelector(".site-header").offsetHeight - 8));
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, "review-skins-eva-darkred.png") });
}
await page.goto(BASE, { waitUntil: "networkidle0" });
rec("Eva color request persists after reload", await page.evaluate(() => document.body.getAttribute("data-color-request") === "dark red"));
await page.click("#tab-gabe");
await sleep(200);
rec("color request does not touch Gabe's view", await page.evaluate(() => document.body.getAttribute("data-color-request") === "" && document.body.getAttribute("data-skin") === "gabe-classic-blue-black"));
await page.click("#tab-eva");
await sleep(200);
await page.click("#color-undo");
await sleep(200);
rec("Undo colors restores Eva's skin colors", await page.evaluate(() => document.body.getAttribute("data-color-request") === "" && document.querySelector("#color-status").hidden));

// Center title "Eva / Gabe" with clickable names
await page.evaluate(() => { localStorage.removeItem("evaandgabe-skins"); });
await page.goto(BASE, { waitUntil: "networkidle0" });
const heroText = await page.$eval(".hero h1", (el) => el.textContent.replace(/\s+/g, " ").trim());
rec("center title reads 'Eva / Gabe'", heroText === "Eva / Gabe", heroText);
rec("page <title> still sensible", /Eva/.test(await page.title()) && /Gabe/.test(await page.title()), await page.title());
rec("header wordmark unchanged", (await page.$eval(".wordmark", (el) => el.textContent.trim())) === "Eva & Gabe");
await page.click("#hero-gabe");
await sleep(200);
const hg = await page.evaluate(() => ({ gabe: document.body.classList.contains("is-gabe"), tab: document.querySelector("#tab-gabe").getAttribute("aria-selected"), pressed: document.querySelector("#hero-gabe").getAttribute("aria-pressed"), other: document.querySelector("#hero-eva").getAttribute("aria-pressed"), cur: document.querySelector("#hero-gabe").getAttribute("aria-current"), skin: document.body.getAttribute("data-skin") }));
rec("clicking 'Gabe' in title switches to Gabe's tab", hg.gabe && hg.tab === "true" && hg.pressed === "true" && hg.other === "false" && hg.cur === "true" && hg.skin === "gabe-classic-blue-black", JSON.stringify(hg));
await page.focus("#hero-eva");
await page.keyboard.press("Enter");
await sleep(200);
const he = await page.evaluate(() => ({ eva: document.body.classList.contains("is-eva"), tab: document.querySelector("#tab-eva").getAttribute("aria-selected"), pressed: document.querySelector("#hero-eva").getAttribute("aria-pressed") }));
rec("keyboard Enter on 'Eva' in title switches to Eva's tab", he.eva && he.tab === "true" && he.pressed === "true", JSON.stringify(he));
await page.click("#tab-gabe");
await sleep(150);
rec("tabs keep title buttons in sync", await page.evaluate(() => document.querySelector("#hero-gabe").getAttribute("aria-pressed") === "true"));
if (SHOTS) { await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200); await page.screenshot({ path: path.join(OUT, "review-skins-title-gabe.png") }); }

rec("no page JavaScript errors", errors.length === 0, errors.join(" | "));

console.log("\nEVA SKINS: " + eva.names.join(" | "));
console.log("GABE SKINS: " + gabe.names.map((n, i) => n + (gabe.tags[i] ? " [" + gabe.tags[i] + "]" : "")).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log("\nSkin checks: " + (results.length - failed.length) + "/" + results.length + " passed");
if (failed.length) process.exitCode = 1;
