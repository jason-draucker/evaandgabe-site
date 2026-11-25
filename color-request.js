/* Instant color requests for Eva: "I want it to be all dark red" -> a dark red palette.
   Only colors change (background, cards, text, accent). Fonts, layout and content stay as-is.
   Parsing is local in the browser; nothing is sent anywhere by this file. */
(function (root) {
  "use strict";

  // base hue / saturation / lightness
  var COLORS = {
    "red": [0, 75, 48], "crimson": [348, 80, 45], "scarlet": [5, 85, 48], "cherry": [350, 80, 42],
    "maroon": [0, 62, 26], "burgundy": [345, 60, 28], "wine": [340, 55, 30],
    "pink": [335, 78, 68], "hot pink": [328, 95, 58], "bubblegum": [330, 85, 72], "rose": [345, 65, 58], "blush": [350, 65, 82],
    "coral": [10, 85, 64], "salmon": [8, 80, 70], "peach": [24, 90, 78],
    "orange": [26, 92, 52], "tangerine": [28, 95, 55], "rust": [16, 65, 40],
    "yellow": [50, 95, 52], "lemon": [54, 95, 60], "gold": [44, 85, 48], "golden": [44, 85, 48], "mustard": [45, 75, 45],
    "green": [130, 55, 38], "lime": [88, 75, 48], "mint": [155, 55, 72], "sage": [100, 22, 58], "olive": [70, 40, 32],
    "emerald": [145, 65, 36], "forest green": [130, 45, 24], "jade": [158, 55, 40],
    "teal": [178, 70, 33], "turquoise": [174, 70, 48], "aqua": [185, 85, 50], "cyan": [188, 90, 48],
    "blue": [215, 80, 50], "sky blue": [200, 80, 68], "baby blue": [205, 75, 78], "royal blue": [225, 75, 48],
    "navy": [225, 65, 20], "cobalt": [218, 85, 42], "indigo": [250, 55, 38],
    "purple": [275, 60, 46], "violet": [270, 70, 58], "lavender": [265, 60, 80], "lilac": [282, 45, 74],
    "magenta": [310, 80, 48], "fuchsia": [312, 85, 52], "plum": [300, 35, 33], "grape": [285, 50, 38],
    "brown": [25, 45, 30], "chocolate": [22, 50, 26], "tan": [34, 40, 64], "beige": [40, 40, 84], "cream": [45, 70, 92],
    "black": [0, 0, 6], "white": [0, 0, 98], "gray": [0, 0, 50], "grey": [0, 0, 50], "silver": [0, 0, 74], "charcoal": [0, 0, 20]
  };
  var ALIASES = { "light blue": ["light", "blue"], "dark blue": ["dark", "blue"], "rose gold": null };
  var MODS = {
    "dark": "dark", "deep": "dark", "midnight": "dark", "darker": "dark",
    "light": "light", "lighter": "light", "pale": "pastel", "pastel": "pastel", "soft": "pastel",
    "neon": "neon", "glow": "neon", "glowing": "neon", "electric": "neon",
    "bright": "bright", "vivid": "bright", "hot": "bright"
  };
  var INTENT = /\b(colou?r|colou?rs|theme|site|website|page|background|it|all|everything|make|turn|change|paint|want|wish|like)\b/;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function parse(text) {
    if (!text || typeof text !== "string") return null;
    var t = " " + text.toLowerCase().replace(/[^a-z\s-]/g, " ").replace(/-/g, " ").replace(/\s+/g, " ") + " ";
    if (!INTENT.test(t)) return null;
    // find the LAST color mentioned (so "not blue, make it red" picks red), preferring two-word names
    var names = Object.keys(COLORS).sort(function (a, b) { return b.length - a.length; });
    var best = null;
    names.forEach(function (name) {
      var re = new RegExp("\\s" + name + "(s)?\\s", "g");
      var m;
      while ((m = re.exec(t))) {
        var idx = m.index;
        var overlaps = best && idx < best.idx + best.name.length + 1 && best.idx < idx + name.length + 1;
        if (!best || (idx > best.idx && !overlaps) || (overlaps && name.length > best.name.length)) best = { name: name, idx: idx };
        re.lastIndex = idx + 1;
      }
    });
    if (!best) return null;
    // modifier: word(s) right before the color
    var before = t.slice(0, best.idx).trim().split(" ").slice(-2);
    var mod = "";
    for (var i = before.length - 1; i >= 0; i--) { if (MODS[before[i]]) { mod = MODS[before[i]]; break; } }
    if (!mod && best.name === "hot pink") return { color: best.name, mod: "bright", label: "hot pink" };
    var label = (mod ? (Object.keys(MODS).filter(function (k) { return MODS[k] === mod && before.indexOf(k) >= 0; })[0] || mod) + " " : "") + best.name;
    return { color: best.name, mod: mod, label: label };
  }

  // --- color math ---
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function hex(h, s, l) {
    return "#" + hslToRgb(h, clamp(s, 0, 100), clamp(l, 0, 100)).map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
  }
  function lum(hx) {
    var v = [1, 3, 5].map(function (i) { var c = parseInt(hx.substr(i, 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  // move lightness until the color reaches the contrast target against bgHex
  function fit(h, s, l, bgHex, target, dir) {
    var c = hex(h, s, l), n = 0;
    while (contrast(c, bgHex) < target && n < 60) { l += dir; c = hex(h, s, l); n++; }
    return c;
  }
  function onColor(bgHex) { return contrast("#ffffff", bgHex) >= contrast("#141414", bgHex) ? "#ffffff" : "#141414"; }

  function theme(spec) {
    if (!spec || !COLORS[spec.color]) return null;
    var base = COLORS[spec.color], h = base[0], s = base[1], l = base[2];
    var gray = s === 0;
    var mod = spec.mod;
    var dark = mod === "dark" || mod === "neon" || (!mod && l < 32) || (mod === "bright" ? false : false);
    if (mod === "light" || mod === "pastel" || mod === "bright") dark = false;
    var o = {};
    if (dark) {
      var bs = gray ? 0 : clamp(s * (mod === "neon" ? 0.5 : 0.75), 0, 70);
      var bl = mod === "neon" ? 7 : (spec.color === "black" ? 6 : clamp(Math.min(l, 30) * 0.55 + 4, 8, 18));
      o.bg = "linear-gradient(180deg, " + hex(h, bs, bl + 4) + " 0%, " + hex(h, bs, bl) + " 100%)";
      o.surface = hex(h, bs * 0.85, bl + 7);
      o.bg2 = hex(h, bs * 0.8, bl + 11);
      o.line = hex(h, bs * 0.7, bl + 20);
      o.ink = fit(h, gray ? 0 : 30, 94, o.surface, 7, 1);
      o.soft = fit(h, gray ? 0 : 22, 78, o.surface, 4.5, 2);
      var as = gray ? 0 : (mod === "neon" ? 100 : clamp(Math.max(s, 65), 0, 95));
      o.accent = fit(h, as, mod === "neon" ? 58 : 60, o.surface, 4.5, 2);
      o.accentDark = hex(h, as, 45);
      o.accentSoft = hex(h, bs * 0.8, bl + 16);
      o.gold = fit(h + (gray ? 0 : 20), gray ? 0 : 80, 76, o.surface, 3, 2);
    } else {
      var ts = gray ? 0 : (mod === "pastel" ? clamp(s * 0.6, 0, 60) : mod === "bright" ? 95 : clamp(s, 0, 85));
      var top = mod === "pastel" ? 93 : mod === "bright" ? 88 : 95;
      var bot = mod === "pastel" ? 86 : mod === "bright" ? 74 : 88;
      if (spec.color === "white") { top = 100; bot = 96; }
      o.bg = "linear-gradient(180deg, " + hex(h, ts, top) + " 0%, " + hex(h, ts, bot) + " 100%)";
      o.surface = hex(h, gray ? 0 : 70, 99);
      o.bg2 = hex(h, gray ? 0 : clamp(ts, 0, 60), 96);
      o.line = hex(h, gray ? 0 : clamp(ts * 0.6, 0, 50), 84);
      o.ink = fit(h, gray ? 0 : 30, 16, o.surface, 9, -1);
      o.soft = fit(h, gray ? 0 : 15, 38, o.surface, 5.5, -2);
      var as2 = gray ? 0 : (mod === "bright" ? 95 : clamp(Math.max(s, 55), 0, 90));
      o.accent = fit(h, as2, mod === "pastel" ? 50 : 44, o.surface, 4.5, -2);
      o.accentDark = fit(h, as2, 34, o.surface, 7, -2);
      o.accentSoft = hex(h, gray ? 0 : clamp(ts, 0, 70), 90);
      o.gold = hex(h + (gray ? 0 : 25), gray ? 0 : 70, 60);
    }
    o.onAccent = onColor(o.accent);
    o.dark = dark;
    return o;
  }

  var api = { parse: parse, theme: theme, contrast: contrast, COLORS: COLORS, MODS: MODS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EG_COLOR = api;
})(typeof window !== "undefined" ? window : globalThis);
