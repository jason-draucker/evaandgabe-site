import { createRequire } from "module";
const require = createRequire(import.meta.url);
const C = require("/workspace/evaandgabe-site/color-request.js");
let pass = 0, fail = 0;
function t(name, ok, d) { (ok ? pass++ : fail++); console.log((ok ? "PASS" : "FAIL") + "  " + name + (d ? " — " + d : "")); }
const p = C.parse("I want it to be all dark red");
t("parse dark red", p && p.color === "red" && p.mod === "dark" && p.label === "dark red", JSON.stringify(p));
const th = C.theme(p);
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
const s = rgb(th.surface);
t("dark red theme is dark and red", th.dark && s[0] > s[1] * 1.6 && s[0] > s[2] * 1.6 && s[0] < 140, th.surface + " " + th.bg);
t("text contrast >= 7", C.contrast(th.ink, th.surface) >= 7, C.contrast(th.ink, th.surface).toFixed(2));
t("accent contrast >= 4.5", C.contrast(th.accent, th.surface) >= 4.5);
t("button text contrast >= 4.5", C.contrast(th.onAccent, th.accent) >= 4.5);
t("no color in plain note", C.parse("Hi Dad, can I have a ride after the game?") === null);
t("no color in money note", C.parse("Dad, I need $20 for lunch") === null);
const cases = ["make it neon green", "can the site be pastel purple", "make everything light blue", "turn it navy", "I want it all black", "white theme please", "make it mint", "I want a gold theme", "change it to lavender", "make it bright orange", "teal please make it teal", "make it maroon"];
for (const c of cases) {
  const q = C.parse(c); const x = q && C.theme(q);
  t("parse+contrast: " + c, x && C.contrast(x.ink, x.surface) >= 7 && C.contrast(x.accent, x.surface) >= 4.5 && C.contrast(x.onAccent, x.accent) >= 4.5, q && q.label);
}
const theme = C.theme(C.parse("make it pink"));
t("theme only has palette keys", Object.keys(theme).every((k) => ["bg","surface","bg2","ink","soft","line","accent","accentDark","accentSoft","gold","onAccent","dark"].includes(k)));
console.log("\nColor unit checks: " + pass + "/" + (pass + fail) + " passed");
if (fail) process.exitCode = 1;
