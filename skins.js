/* Eva & Gabe design skins: 40 per kid.
   All artwork is original CSS (gradients and generic shapes). No official logos,
   characters, or trademarked images. "Inspired" skins borrow only general colors and moods. */
(function (root) {
  "use strict";

  var F = {
    fraunces: '"Fraunces", Georgia, serif',
    source: '"Source Sans 3", system-ui, sans-serif',
    rajdhani: '"Rajdhani", "Source Sans 3", sans-serif',
    playfair: '"Playfair Display", Georgia, serif',
    quicksand: '"Quicksand", system-ui, sans-serif',
    pacifico: '"Pacifico", cursive',
    dancing: '"Dancing Script", cursive',
    nunito: '"Nunito", system-ui, sans-serif',
    poppins: '"Poppins", system-ui, sans-serif',
    lora: '"Lora", Georgia, serif',
    comfortaa: '"Comfortaa", system-ui, sans-serif',
    caveat: '"Caveat", cursive',
    montserrat: '"Montserrat", system-ui, sans-serif',
    josefin: '"Josefin Sans", system-ui, sans-serif',
    dmserif: '"DM Serif Display", Georgia, serif',
    abril: '"Abril Fatface", Georgia, serif',
    baloo: '"Baloo 2", system-ui, sans-serif',
    righteous: '"Righteous", system-ui, sans-serif',
    marker: '"Permanent Marker", cursive',
    orbitron: '"Orbitron", system-ui, sans-serif',
    bebas: '"Bebas Neue", Impact, sans-serif',
    oswald: '"Oswald", Impact, sans-serif',
    russo: '"Russo One", system-ui, sans-serif',
    teko: '"Teko", Impact, sans-serif',
    blackops: '"Black Ops One", Impact, sans-serif',
    bungee: '"Bungee", Impact, sans-serif',
    lilita: '"Lilita One", Impact, sans-serif',
    press: '"Press Start 2P", monospace',
    exo: '"Exo 2", system-ui, sans-serif',
    space: '"Space Grotesk", system-ui, sans-serif'
  };

  // card: soft | flat | outline | glass | frame | neon | paper | brutal
  // headStyle: plain | band | underline | pill | banner
  // motif: flowers | blossoms | hearts | stars | moon | sun | leaves | waves | snow | sparkle | music
  //        ps (circle/cross/square/triangle drawn in CSS) | cr (crown, elixir drop, shield drawn in CSS)
  //        tank (generic CSS tank silhouette) | ball | bolt | pixel | none
  function sk(id, name, desc, o) {
    return {
      id: id, name: name, desc: desc,
      bg: o.bg, surface: o.surface, bg2: o.bg2 || o.surface, ink: o.ink, soft: o.soft, line: o.line,
      accent: o.accent, accentDark: o.accentDark || o.accent, accentSoft: o.accentSoft || o.line,
      gold: o.gold || o.accent, onAccent: o.onAccent || "#ffffff",
      head: o.head || F.fraunces, body: o.body || F.source,
      radius: o.radius || "16px", card: o.card || "soft", headStyle: o.headStyle || "plain",
      motif: o.motif || "none", upper: Boolean(o.upper), dark: Boolean(o.dark), tag: o.tag || ""
    };
  }

  var LIGHT = { surface: "#fffdfb", ink: "#2a231c", soft: "#5c5248" };

  function L(extra) { var o = {}; var k; for (k in LIGHT) o[k] = LIGHT[k]; for (k in extra) o[k] = extra[k]; return o; }

  var EVA_SKINS = [
    sk("eva-blush-roses", "Blush Roses", "Soft pink roses (the original look)", L({
      bg: "radial-gradient(circle at 12% 18%, #f8c9d4 0, transparent 32%), radial-gradient(circle at 92% 8%, #f3d6c8 0, transparent 28%), linear-gradient(180deg, #fdeef2 0%, #f7e4ea 100%)",
      line: "#f0c8d2", accent: "#c45c78", accentDark: "#9a3f5c", accentSoft: "#f6d5de", gold: "#d4a0b0", motif: "flowers" })),
    sk("eva-lavender-wildflowers", "Lavender Wildflowers", "Lilac meadow with purple accents", L({
      bg: "radial-gradient(circle at 85% 15%, #dcc6f3 0, transparent 30%), linear-gradient(180deg, #f3eafc 0%, #e4d7f5 100%)",
      line: "#d9c6ee", accent: "#7a4aa8", accentDark: "#5c357f", accentSoft: "#e8d7f8", gold: "#b392d4", motif: "flowers", head: F.lora, body: F.nunito })),
    sk("eva-peach-daisies", "Peach Daisies", "Warm peach with daisy cheer", L({
      bg: "radial-gradient(circle at 10% 90%, #ffe2c4 0, transparent 30%), linear-gradient(180deg, #fff3e8 0%, #f8dcc8 100%)",
      line: "#f2d2bb", accent: "#d36b3a", accentDark: "#a04d26", accentSoft: "#fde0cd", gold: "#e8b07a", motif: "blossoms", head: F.fraunces, body: F.quicksand })),
    sk("eva-cherry-blossom-sky", "Cherry Blossom Sky", "Pink blossoms on soft blue", L({
      bg: "radial-gradient(circle at 90% 10%, #f9d3e0 0, transparent 26%), linear-gradient(180deg, #eef6fd 0%, #d7e8f7 100%)",
      line: "#cfe0f1", accent: "#4a7cb5", accentDark: "#315a89", accentSoft: "#d5e6f6", gold: "#e8a0b8", motif: "blossoms" })),
    sk("eva-cottagecore-meadow", "Cottagecore Meadow", "Sage green, cream, and pressed leaves", L({
      bg: "linear-gradient(180deg, #f4f1e4 0%, #e3e8d2 100%)", surface: "#fffcf2",
      line: "#d6dcc2", accent: "#5f7d4e", accentDark: "#445c37", accentSoft: "#e2ead6", gold: "#b89b5e",
      head: F.lora, body: F.nunito, card: "paper", motif: "leaves", radius: "10px" })),
    sk("eva-sunset-glow", "Sunset Glow", "Orange-to-pink sunset with frosted cards", L({
      bg: "linear-gradient(160deg, #ffb27a 0%, #ff7aa2 55%, #a77bf3 100%)", surface: "rgba(255,255,255,0.78)",
      line: "rgba(255,255,255,0.7)", accent: "#e2466f", accentDark: "#b02c52", accentSoft: "#ffd9e3", gold: "#ffb27a",
      head: F.poppins, body: F.poppins, card: "glass", motif: "sun", radius: "20px" })),
    sk("eva-ocean-breeze", "Ocean Breeze", "Aqua water and sea-foam cards", L({
      bg: "linear-gradient(180deg, #e2f7fb 0%, #b7e6f0 100%)", line: "#bfe3ea",
      accent: "#1b8ca6", accentDark: "#126a7e", accentSoft: "#d2f0f6", gold: "#58c4d8",
      head: F.quicksand, body: F.quicksand, motif: "waves", radius: "22px" })),
    sk("eva-galaxy-dreams", "Galaxy Dreams", "Deep purple night with tiny stars", {
      bg: "radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 70% 20%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 40% 80%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 85% 65%, #fff 50%, transparent 51%), radial-gradient(circle at 75% 15%, #6b3fa0 0, transparent 45%), linear-gradient(180deg, #1c1238 0%, #0f0b24 100%)",
      surface: "rgba(40, 28, 78, 0.82)", bg2: "#2a1f52", ink: "#f2ecff", soft: "#c8bce6", line: "#4a3a80",
      accent: "#b388ff", accentDark: "#8c5ee8", accentSoft: "#3a2a6a", gold: "#ffd1f0", onAccent: "#1c1238",
      head: F.comfortaa, body: F.nunito, card: "glass", motif: "stars", dark: true, radius: "18px" }),
    sk("eva-pastel-rainbow", "Pastel Rainbow", "Soft rainbow stripes with outlined cards", L({
      bg: "linear-gradient(120deg, #ffd6e0 0%, #ffe9c7 25%, #fdfcc8 45%, #d4f5d9 65%, #cfe6ff 85%, #e5d4ff 100%)",
      line: "#e3cfe8", accent: "#9b5de5", accentDark: "#7239c2", accentSoft: "#efe2ff", gold: "#f15bb5",
      head: F.baloo, body: F.baloo, card: "outline", motif: "hearts", radius: "20px" })),
    sk("eva-boho-terracotta", "Boho Terracotta", "Terracotta, sand, and sunshine", L({
      bg: "linear-gradient(180deg, #f6e7d8 0%, #ecd3bb 100%)", surface: "#fff8f0",
      line: "#e2c6aa", accent: "#b85c38", accentDark: "#8a4027", accentSoft: "#f3d9c6", gold: "#d9a05b",
      head: F.dmserif, body: F.josefin, card: "paper", motif: "sun", radius: "6px", headStyle: "underline" })),
    sk("eva-minimal-white", "Minimal White", "Clean white and black, lots of space", L({
      bg: "#ffffff", surface: "#ffffff", bg2: "#f6f6f6", ink: "#111111", soft: "#555555", line: "#e5e5e5",
      accent: "#111111", accentDark: "#000000", accentSoft: "#efefef", gold: "#999999",
      head: F.josefin, body: F.josefin, card: "flat", motif: "none", radius: "4px", upper: true })),
    sk("eva-mint-chip", "Mint Chip", "Mint green with chocolate accents", L({
      bg: "radial-gradient(#6b4a3a 1.2px, transparent 1.6px) 0 0 / 26px 26px, linear-gradient(180deg, #e3f8ee 0%, #c9efdd 100%)",
      line: "#b9e2cd", accent: "#3fa47a", accentDark: "#2b7a59", accentSoft: "#d5f3e5", gold: "#6b4a3a",
      head: F.nunito, body: F.nunito, card: "outline", motif: "hearts", radius: "14px" })),
    sk("eva-lemonade", "Pink Lemonade", "Sunny yellow with pink pops", L({
      bg: "linear-gradient(180deg, #fff9d6 0%, #ffe9a8 100%)", line: "#f5dc8a",
      accent: "#e8457c", accentDark: "#b82d5d", accentSoft: "#ffe0ea", gold: "#f2b705",
      head: F.pacifico, body: F.quicksand, motif: "sun", radius: "18px" })),
    sk("eva-strawberry-milk", "Strawberry Milk", "Pink polka dots and cream", L({
      bg: "radial-gradient(#ffb3c7 2.5px, transparent 3px) 0 0 / 22px 22px, #fff1f4", line: "#f6cbd7",
      accent: "#e35d86", accentDark: "#b53f64", accentSoft: "#ffe0e9", gold: "#ff9eb8",
      head: F.baloo, body: F.baloo, motif: "hearts", radius: "22px", headStyle: "pill" })),
    sk("eva-cotton-candy", "Cotton Candy", "Pink and baby-blue swirl", L({
      bg: "linear-gradient(135deg, #ffc8e4 0%, #c8e7ff 100%)", surface: "rgba(255,255,255,0.8)",
      line: "rgba(255,255,255,0.85)", accent: "#e055a8", accentDark: "#b23a85", accentSoft: "#ffe0f1", gold: "#7cc4ff",
      head: F.comfortaa, body: F.comfortaa, card: "glass", motif: "sparkle", radius: "24px" })),
    sk("eva-moonlit-garden", "Moonlit Garden", "Night garden in deep green and silver", {
      bg: "radial-gradient(circle at 85% 12%, rgba(240, 240, 210, 0.35) 0, transparent 18%), linear-gradient(180deg, #13261f 0%, #0c1a1f 100%)",
      surface: "rgba(26, 48, 42, 0.85)", bg2: "#1e3a33", ink: "#eef5ee", soft: "#b7cbbf", line: "#2f5248",
      accent: "#9fd8b8", accentDark: "#6fb993", accentSoft: "#244a3f", gold: "#e9e4b8", onAccent: "#0c1a1f",
      head: F.playfair, body: F.lora, card: "glass", motif: "moon", dark: true }),
    sk("eva-vintage-tea-party", "Vintage Tea Party", "Cream stripes and rosy teacup charm", L({
      bg: "repeating-linear-gradient(90deg, #fbf3e6 0 22px, #f6e6d6 22px 44px)", surface: "#fffaf3",
      line: "#e8d3bd", accent: "#a8566a", accentDark: "#7f3d4e", accentSoft: "#f3dde2", gold: "#c9a36b",
      head: F.playfair, body: F.lora, card: "paper", headStyle: "band", motif: "blossoms", radius: "8px" })),
    sk("eva-sunflower-field", "Sunflower Field", "Golden sunflowers and leafy green", L({
      bg: "linear-gradient(180deg, #fff6c9 0%, #e8f2c4 100%)", line: "#e6e0a4",
      accent: "#c98a00", accentDark: "#8f6200", accentSoft: "#fdf0bf", gold: "#6f9a3a",
      head: F.caveat, body: F.nunito, motif: "flowers", radius: "16px" })),
    sk("eva-lilac-mist", "Lilac Mist", "Quiet lilac, simple and calm", L({
      bg: "#f5f0fb", surface: "#ffffff", line: "#e6dcf3", accent: "#8a6bbf", accentDark: "#6a4d9c", accentSoft: "#eee6fa", gold: "#c5b3e6",
      head: F.quicksand, body: F.quicksand, card: "flat", motif: "none", radius: "12px" })),
    sk("eva-coral-reef", "Coral Reef", "Coral pink and tropical teal", L({
      bg: "linear-gradient(180deg, #ffe9e2 0%, #d8f3ef 100%)", line: "#f1d1c7",
      accent: "#ef6f5e", accentDark: "#c24e3f", accentSoft: "#ffe0d9", gold: "#2bb3a3",
      head: F.poppins, body: F.poppins, motif: "waves", radius: "18px", headStyle: "underline" })),
    sk("eva-autumn-leaves", "Autumn Leaves", "Rust, mustard, and cozy sweaters", L({
      bg: "linear-gradient(180deg, #fbefe1 0%, #f0d9bd 100%)", line: "#e5c8a6",
      accent: "#b5502b", accentDark: "#8a3a1d", accentSoft: "#f5dccb", gold: "#d39b2a",
      head: F.lora, body: F.source, card: "paper", motif: "leaves", radius: "10px" })),
    sk("eva-winter-frost", "Winter Frost", "Icy blue with frosted glass", L({
      bg: "linear-gradient(180deg, #f2f8ff 0%, #d6e6f7 100%)", surface: "rgba(255,255,255,0.82)",
      line: "#cfe0f2", accent: "#3a78c2", accentDark: "#275a96", accentSoft: "#dceafa", gold: "#9cc6ee",
      head: F.montserrat, body: F.montserrat, card: "glass", motif: "snow", radius: "14px" })),
    sk("eva-butterfly-garden", "Butterfly Garden", "Spring green with violet flutter", L({
      bg: "radial-gradient(circle at 20% 15%, #f0d8ff 0, transparent 28%), linear-gradient(180deg, #f0fbe9 0%, #dcf0d0 100%)",
      line: "#cfe6c2", accent: "#8a4fc0", accentDark: "#6a3796", accentSoft: "#efe0fb", gold: "#7cb85a",
      head: F.dancing, body: F.nunito, motif: "sparkle", radius: "18px" })),
    sk("eva-matcha-latte", "Matcha Latte", "Muted matcha and oat milk", L({
      bg: "#efeadc", surface: "#fbf8ef", line: "#ddd5bf", accent: "#6f8f52", accentDark: "#516b3a", accentSoft: "#e3ead5", gold: "#a89070",
      head: F.dmserif, body: F.source, card: "flat", motif: "leaves", radius: "8px" })),
    sk("eva-bubblegum-pop", "Bubblegum Pop", "Hot pink and lemon, bold outlines", L({
      bg: "linear-gradient(135deg, #ff8ad1 0%, #ffe066 100%)", surface: "#ffffff", ink: "#1f1033", soft: "#4a3560", line: "#1f1033",
      accent: "#ff3ea5", accentDark: "#c21f7c", accentSoft: "#ffe0f2", gold: "#ffe066",
      head: F.righteous, body: F.poppins, card: "brutal", motif: "hearts", radius: "12px" })),
    sk("eva-starry-night", "Starry Night", "Midnight blue with golden stars", {
      bg: "radial-gradient(1.5px 1.5px at 15% 25%, #ffe9a8 50%, transparent 51%), radial-gradient(1.5px 1.5px at 60% 15%, #ffe9a8 50%, transparent 51%), radial-gradient(1px 1px at 80% 60%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 35% 70%, #fff 50%, transparent 51%), linear-gradient(180deg, #14224a 0%, #0b1430 100%)",
      surface: "#1b2c5a", bg2: "#22356a", ink: "#f4f1e6", soft: "#c3c9de", line: "#33478a",
      accent: "#f5c84c", accentDark: "#d9a520", accentSoft: "#2a3d78", gold: "#f5c84c", onAccent: "#14224a",
      head: F.playfair, body: F.source, motif: "stars", dark: true }),
    sk("eva-peony-blush", "Peony Blush", "Deep peony pink with bold headings", L({
      bg: "radial-gradient(circle at 90% 85%, #ffc2d6 0, transparent 30%), linear-gradient(180deg, #fff0f5 0%, #ffdbe7 100%)",
      line: "#f6c4d5", accent: "#d6336c", accentDark: "#a61e4d", accentSoft: "#ffdeeb", gold: "#f783ac",
      head: F.abril, body: F.source, motif: "flowers", radius: "14px", headStyle: "underline" })),
    sk("eva-golden-hour", "Golden Hour", "Warm gold light and cream", L({
      bg: "radial-gradient(circle at 80% 0%, #ffd98a 0, transparent 40%), linear-gradient(180deg, #fff8e8 0%, #fbe8c4 100%)",
      line: "#efd9a8", accent: "#c27c0e", accentDark: "#8f5a06", accentSoft: "#fbeac2", gold: "#e0a21b", motif: "sun" })),
    sk("eva-seashell-sand", "Seashell Sand", "Beach sand and seashell coral", L({
      bg: "linear-gradient(180deg, #fbf4ea 0%, #f1e2cd 100%)", line: "#e6d3b9",
      accent: "#d9775f", accentDark: "#a85743", accentSoft: "#f8e0d6", gold: "#7fb7be",
      head: F.lora, body: F.quicksand, motif: "waves", radius: "20px" })),
    sk("eva-aurora-lights", "Aurora Lights", "Northern lights in teal and violet", {
      bg: "radial-gradient(ellipse at 20% 0%, rgba(64, 255, 200, 0.35), transparent 50%), radial-gradient(ellipse at 80% 10%, rgba(170, 100, 255, 0.4), transparent 50%), linear-gradient(180deg, #0c1b2a 0%, #0a1020 100%)",
      surface: "rgba(18, 36, 54, 0.85)", bg2: "#172f45", ink: "#eafcff", soft: "#b4d3dd", line: "#2a4e66",
      accent: "#4ff0c8", accentDark: "#22c9a2", accentSoft: "#1d3d52", gold: "#b78cff", onAccent: "#0a1020",
      head: F.montserrat, body: F.montserrat, card: "neon", motif: "stars", dark: true, radius: "14px" }),
    sk("eva-retro-groove", "Retro 70s Groove", "Orange, mustard, and brown stripes", L({
      bg: "repeating-linear-gradient(180deg, #ffe2b0 0 18px, #ffd08a 18px 36px, #ffbd7a 36px 54px, #ffe2b0 54px 72px)", surface: "#fff6e6",
      ink: "#3b2414", soft: "#6b4a33", line: "#3b2414", accent: "#d9531e", accentDark: "#a63a10", accentSoft: "#ffe0c2", gold: "#e0a526",
      head: F.righteous, body: F.nunito, card: "brutal", headStyle: "band", motif: "sun", radius: "18px" })),
    sk("eva-polka-picnic", "Polka Dot Picnic", "Red and white picnic dots", L({
      bg: "radial-gradient(#ffffff 3px, transparent 3.5px) 0 0 / 20px 20px, #ffd6d6", line: "#f3b8b8",
      accent: "#d63c3c", accentDark: "#a52626", accentSoft: "#ffe2e2", gold: "#ff8c8c",
      head: F.baloo, body: F.baloo, card: "outline", motif: "hearts", radius: "16px", headStyle: "pill" })),
    sk("eva-midnight-lavender", "Midnight Lavender", "Dark purple with lavender glow", {
      bg: "radial-gradient(circle at 15% 10%, rgba(190, 150, 255, 0.28), transparent 40%), linear-gradient(180deg, #221a33 0%, #171124 100%)",
      surface: "#2b2140", bg2: "#352851", ink: "#f3edff", soft: "#c9bce3", line: "#47386a",
      accent: "#c9a7ff", accentDark: "#a27ce8", accentSoft: "#3a2d58", gold: "#ffc6e8", onAccent: "#171124",
      head: F.comfortaa, body: F.nunito, motif: "moon", dark: true, radius: "20px" }),
    sk("eva-watercolor-wash", "Watercolor Wash", "Soft paint blooms in pastel", L({
      bg: "radial-gradient(circle at 15% 20%, rgba(255, 182, 193, 0.55) 0, transparent 30%), radial-gradient(circle at 80% 30%, rgba(173, 216, 230, 0.6) 0, transparent 32%), radial-gradient(circle at 45% 85%, rgba(221, 200, 255, 0.55) 0, transparent 30%), #fffaf6",
      line: "#eadbe4", accent: "#c05c8f", accentDark: "#93406b", accentSoft: "#f6dfeb", gold: "#88b8d8",
      head: F.caveat, body: F.nunito, card: "paper", motif: "sparkle", radius: "12px" })),
    sk("eva-rose-gold-glam", "Rose Gold Glam", "Rose gold shimmer and blush glass", L({
      bg: "linear-gradient(135deg, #f7d9d0 0%, #e8b4a8 50%, #f3d3c6 100%)", surface: "rgba(255,250,248,0.82)",
      line: "rgba(255,255,255,0.75)", accent: "#b76e79", accentDark: "#8c4f59", accentSoft: "#f8e1e1", gold: "#d4a373",
      head: F.playfair, body: F.montserrat, card: "glass", motif: "sparkle", radius: "16px", headStyle: "underline" })),
    sk("eva-tropical-paradise", "Tropical Paradise", "Palm green, hibiscus pink, and mango", L({
      bg: "linear-gradient(160deg, #d8f7d2 0%, #fff1c2 50%, #ffd1e0 100%)", line: "#cfe9c4",
      accent: "#e0377a", accentDark: "#b0215c", accentSoft: "#ffe0ec", gold: "#2f9e5b",
      head: F.poppins, body: F.poppins, motif: "leaves", radius: "18px", headStyle: "pill" })),
    sk("eva-scrapbook-notes", "Scrapbook Notes", "Kraft paper, grid lines, and marker titles", L({
      bg: "linear-gradient(#e7d3b0 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(90deg, #e7d3b0 1px, transparent 1px) 0 0 / 22px 22px, #f5e8cf",
      surface: "#fffdf6", line: "#d9c29a", accent: "#2f6fb0", accentDark: "#1f4f82", accentSoft: "#dbe8f6", gold: "#e46a6a",
      head: F.marker, body: F.nunito, card: "paper", headStyle: "underline", motif: "hearts", radius: "4px" })),
    sk("eva-ballet-pink", "Ballet Pink", "Barely-there pink, airy and simple", L({
      bg: "#fff5f7", surface: "#ffffff", line: "#f6dde3", accent: "#d47a93", accentDark: "#a85b72", accentSoft: "#fbe7ec", gold: "#ecb6c4",
      head: F.josefin, body: F.josefin, card: "flat", motif: "none", radius: "24px" })),
    sk("eva-berry-smoothie", "Berry Smoothie", "Blackberry, raspberry, and cream", L({
      bg: "linear-gradient(180deg, #fbe6f1 0%, #ead1f2 100%)", line: "#e2c3e3",
      accent: "#9c2a72", accentDark: "#741d54", accentSoft: "#f3d6ea", gold: "#d85ca3",
      head: F.poppins, body: F.nunito, headStyle: "band", motif: "hearts", radius: "16px" })),
    sk("eva-spring-tulips", "Spring Tulips", "Red and pink tulips on fresh green", L({
      bg: "linear-gradient(180deg, #fff3f3 0%, #e7f6df 100%)", line: "#f0d6d6",
      accent: "#d9384f", accentDark: "#a8253a", accentSoft: "#ffe1e5", gold: "#5aa04a",
      head: F.fraunces, body: F.quicksand, motif: "blossoms", radius: "16px" }))
  ];

  function D(extra) {
    var o = { surface: "#171a24", bg2: "#1d2130", ink: "#e8eef6", soft: "#b7c3d6", line: "#2a3550", dark: true, head: F.rajdhani, body: F.rajdhani, upper: true };
    for (var k in extra) o[k] = extra[k];
    return o;
  }

  var GABE_SKINS = [
    // --- PlayStation-inspired (generic console colors and CSS-drawn circle/cross/square/triangle) ---
    sk("gabe-classic-blue-black", "Classic Blue/Black", "PlayStation-inspired: dark console black with blue glow (the original look)", D({
      bg: "radial-gradient(circle at 80% 0%, rgba(0, 112, 209, 0.35), transparent 40%), linear-gradient(180deg, #14141c 0%, #0b0b12 100%)",
      accent: "#0070d1", accentDark: "#004e99", accentSoft: "#16385f", gold: "#00a2ff", motif: "ps", card: "neon", tag: "ps" })),
    sk("gabe-ps-two-tone", "Two-Tone Console", "PlayStation-inspired: white shell over black core", D({
      bg: "linear-gradient(180deg, #ececef 0%, #ececef 22%, #1a1a1f 58%)", surface: "#202027", bg2: "#2a2a33", line: "#3a3a46",
      accent: "#0070d1", accentDark: "#00539c", accentSoft: "#1d2a3d", gold: "#9fb6d6", motif: "ps", tag: "ps", radius: "18px" })),
    sk("gabe-ps-face-buttons", "Face-Button Brights", "PlayStation-inspired: bright button colors on black", D({
      bg: "#0a0a0d", surface: "#15151b", bg2: "#1d1d25", line: "#2b2b36",
      accent: "#e74c3c", accentDark: "#c0392b", accentSoft: "#3a1a1a", gold: "#2ecc71", motif: "ps", tag: "ps", card: "outline" })),
    sk("gabe-ps-blue-glow", "Blue Glow", "PlayStation-inspired: navy with cyan light bar glow", D({
      bg: "radial-gradient(circle at 50% 0%, rgba(0, 220, 255, 0.28), transparent 42%), #0a1628", surface: "#0f2036", bg2: "#132843", line: "#1f3d60",
      ink: "#e8f6ff", accent: "#00d4ff", accentDark: "#0891b2", accentSoft: "#123a52", gold: "#67e8f9", onAccent: "#04121f", motif: "ps", tag: "ps", card: "neon" })),
    sk("gabe-ps-nextgen-white", "Next-Gen White & Black", "PlayStation-inspired: PS5-style white panels, black middle, blue accents", {
      bg: "linear-gradient(90deg, #f4f5f8 0%, #f4f5f8 18%, #101114 18%, #101114 82%, #f4f5f8 82%)",
      surface: "#ffffff", bg2: "#f1f3f7", ink: "#101114", soft: "#4a4f5c", line: "#d9dde6",
      accent: "#2e6bff", accentDark: "#1a4fd1", accentSoft: "#e3ebff", gold: "#7aa2ff",
      head: F.exo, body: F.exo, card: "soft", radius: "22px", motif: "ps", upper: true, tag: "ps" }),
    sk("gabe-ps-retro-gray", "Retro Gray Console", "PlayStation-inspired: classic 90s gray console with colored shapes", {
      bg: "linear-gradient(180deg, #c9c9cf 0%, #a9a9b2 100%)", surface: "#dcdce2", bg2: "#e6e6eb", ink: "#1f1f26", soft: "#4a4a55", line: "#8e8e99",
      accent: "#3a3a8c", accentDark: "#25255e", accentSoft: "#d0d0e6", gold: "#c23b3b",
      head: F.russo, body: F.source, card: "brutal", radius: "6px", motif: "ps", tag: "ps" }),
    sk("gabe-ps-slim-blue", "Slim Blue", "PlayStation-inspired: PS4-era deep blue and matte black", D({
      bg: "linear-gradient(135deg, #003791 0%, #001a4d 55%, #050a18 100%)", surface: "#0b1a3d", bg2: "#10244f", line: "#1d3a78",
      accent: "#2f8cff", accentDark: "#1366d6", accentSoft: "#14306a", gold: "#8fc1ff", motif: "ps", tag: "ps", headStyle: "band" })),
    sk("gabe-dualsense-cosmic-red", "Controller Cosmic Red", "PlayStation-inspired: DualSense-style deep red and black", D({
      bg: "radial-gradient(circle at 20% 10%, rgba(220, 30, 60, 0.45), transparent 45%), linear-gradient(180deg, #1a0a0e 0%, #0d0507 100%)",
      surface: "#22101a", bg2: "#2c1420", line: "#4a1f2c", accent: "#e1203f", accentDark: "#a8142c", accentSoft: "#3d1420", gold: "#ff6b81",
      motif: "ps", tag: "ps", head: F.exo, body: F.exo })),
    sk("gabe-dualsense-midnight", "Controller Midnight Black", "PlayStation-inspired: DualSense-style midnight black with soft gray", D({
      bg: "linear-gradient(180deg, #17181c 0%, #0b0c0f 100%)", surface: "#1f2026", bg2: "#272830", line: "#363844",
      accent: "#9aa3b5", accentDark: "#6c7486", accentSoft: "#2c2f39", gold: "#d7dbe5", onAccent: "#0b0c0f",
      motif: "ps", tag: "ps", card: "flat", head: F.exo, body: F.exo })),
    sk("gabe-dualsense-starlight", "Controller Starlight Blue", "PlayStation-inspired: DualSense-style starlight blue and white", {
      bg: "radial-gradient(circle at 85% 10%, rgba(120, 170, 255, 0.45), transparent 45%), linear-gradient(180deg, #e8f0ff 0%, #c9d9f7 100%)",
      surface: "#ffffff", bg2: "#eef3ff", ink: "#0f1d3a", soft: "#3d4f73", line: "#bccbea",
      accent: "#3d6fd9", accentDark: "#2a52aa", accentSoft: "#dbe6ff", gold: "#93b4f5",
      head: F.exo, body: F.exo, radius: "20px", motif: "ps", upper: true, tag: "ps" }),
    sk("gabe-dualsense-galactic-purple", "Controller Galactic Purple", "PlayStation-inspired: DualSense-style galactic purple", D({
      bg: "radial-gradient(circle at 75% 15%, rgba(140, 90, 255, 0.45), transparent 45%), linear-gradient(180deg, #160f2b 0%, #0b0818 100%)",
      surface: "#1f1738", bg2: "#281e48", line: "#3b2d6a", accent: "#8c5cff", accentDark: "#6a3ee0", accentSoft: "#2e2357", gold: "#c3a6ff",
      motif: "ps", tag: "ps", card: "glass", head: F.exo, body: F.exo })),
    sk("gabe-ps-controller-grid", "Controller Shape Grid", "PlayStation-inspired: repeating circle, cross, square, triangle pattern", D({
      bg: "radial-gradient(circle, transparent 5px, rgba(231,76,60,0.35) 5.5px, rgba(231,76,60,0.35) 7px, transparent 7.5px) 0 0 / 56px 56px, linear-gradient(45deg, transparent 46%, rgba(52,152,219,0.35) 46%, rgba(52,152,219,0.35) 54%, transparent 54%) 28px 28px / 56px 56px, linear-gradient(-45deg, transparent 46%, rgba(52,152,219,0.35) 46%, rgba(52,152,219,0.35) 54%, transparent 54%) 28px 28px / 56px 56px, #0d0f16",
      accent: "#3498db", accentDark: "#2275ad", accentSoft: "#16304a", gold: "#2ecc71", motif: "ps", tag: "ps", card: "outline", head: F.russo })),

    // --- Clash Royale-inspired (generic arena colors, card frames, CSS crown/drop/shield) ---
    sk("gabe-cr-royal-arena", "Royal Arena", "Clash Royale-inspired: sunny arena grass, stone path, gold trim", {
      bg: "linear-gradient(180deg, #7fc8ff 0%, #7fc8ff 18%, #5fb34a 18%, #4c9a3a 70%, #c9a46a 70%, #b48e55 100%)",
      surface: "#fff7e6", bg2: "#fff1d1", ink: "#2b1d0e", soft: "#5c4630", line: "#e0b85a",
      accent: "#2a6fdb", accentDark: "#1b4ea3", accentSoft: "#dbe7ff", gold: "#f2b705",
      head: F.lilita, body: F.nunito, card: "frame", headStyle: "banner", radius: "14px", motif: "cr", tag: "cr" }),
    sk("gabe-cr-clan-blue-red", "Clan Blue vs Red", "Clash Royale-inspired: blue side vs red side battle colors", {
      bg: "linear-gradient(90deg, #2a6fdb 0%, #2a6fdb 49.5%, #f4d35e 49.5%, #f4d35e 50.5%, #d63a3a 50.5%, #d63a3a 100%)",
      surface: "#ffffff", bg2: "#f2f5ff", ink: "#1b1b2a", soft: "#45475c", line: "#f4d35e",
      accent: "#2a6fdb", accentDark: "#1b4ea3", accentSoft: "#dbe7ff", gold: "#d63a3a",
      head: F.lilita, body: F.nunito, card: "frame", headStyle: "banner", radius: "14px", motif: "cr", tag: "cr" }),
    sk("gabe-cr-trophy-road", "Trophy Road Gold", "Clash Royale-inspired: gold trophy road on royal blue", {
      bg: "repeating-linear-gradient(90deg, transparent 0 60px, rgba(255, 215, 90, 0.25) 60px 64px), linear-gradient(180deg, #1d3f8f 0%, #122a63 100%)",
      surface: "#fff6d8", bg2: "#ffefbf", ink: "#2a1c05", soft: "#5e4718", line: "#d9a521",
      accent: "#d99a00", accentDark: "#a87600", accentSoft: "#ffe9a8", gold: "#ffd34d", onAccent: "#2a1c05",
      head: F.lilita, body: F.nunito, card: "frame", headStyle: "banner", radius: "12px", motif: "cr", tag: "cr" }),
    sk("gabe-cr-legendary-card", "Legendary Card", "Clash Royale-inspired: rainbow-edged legendary card frames", D({
      bg: "radial-gradient(circle at 50% 0%, rgba(255, 200, 255, 0.25), transparent 45%), linear-gradient(180deg, #2a1a4a 0%, #160c2c 100%)",
      surface: "#2e1f55", bg2: "#3a2868", line: "#7a5cd6", accent: "#ff7ad9", accentDark: "#d94fb3", accentSoft: "#43306f", gold: "#7ef0ff",
      head: F.lilita, body: F.nunito, card: "frame", headStyle: "banner", motif: "cr", tag: "cr", upper: false, radius: "14px" })),
    sk("gabe-cr-elixir-purple", "Elixir Purple", "Clash Royale-inspired: glowing pink-purple elixir", D({
      bg: "radial-gradient(circle at 20% 80%, rgba(230, 80, 255, 0.4), transparent 40%), linear-gradient(180deg, #3b0f56 0%, #1f0733 100%)",
      surface: "#3a1458", bg2: "#47196b", line: "#8a3cc2", accent: "#e553ff", accentDark: "#b62ed4", accentSoft: "#4e1d72", gold: "#ff9cf0",
      head: F.lilita, body: F.nunito, card: "frame", motif: "cr", tag: "cr", upper: false })),
    sk("gabe-cr-spooky-arena", "Spooky Town Arena", "Clash Royale-inspired: dusk arena in orange and purple", D({
      bg: "radial-gradient(circle at 80% 15%, rgba(255, 140, 40, 0.5), transparent 30%), linear-gradient(180deg, #2b1640 0%, #140a20 100%)",
      surface: "#2a1838", bg2: "#341f46", line: "#5a3470", accent: "#ff8c28", accentDark: "#d66a0e", accentSoft: "#43254f", gold: "#ffcf5a", onAccent: "#140a20",
      head: F.lilita, body: F.nunito, card: "frame", headStyle: "banner", motif: "cr", tag: "cr", upper: false })),
    sk("gabe-cr-frozen-peak", "Frozen Peak Arena", "Clash Royale-inspired: icy arena with snowy towers", {
      bg: "linear-gradient(180deg, #dff3ff 0%, #a9d8f5 60%, #7fbfe8 100%)", surface: "#ffffff", bg2: "#eef8ff", ink: "#0e2a44", soft: "#3a5a78", line: "#8cc8ee",
      accent: "#1f8bd6", accentDark: "#146aa6", accentSoft: "#d6eeff", gold: "#f2b705",
      head: F.lilita, body: F.nunito, card: "frame", headStyle: "banner", radius: "14px", motif: "cr", tag: "cr" }),
    sk("gabe-cr-kings-tower", "King's Tower", "Clash Royale-inspired: stone tower walls and gold crown trim", D({
      bg: "linear-gradient(#5c5f6a 2px, transparent 2px) 0 0 / 48px 24px, linear-gradient(90deg, #5c5f6a 2px, transparent 2px) 0 0 / 48px 48px, linear-gradient(90deg, #5c5f6a 2px, transparent 2px) 24px 24px / 48px 48px, #3e414b",
      surface: "#2d3038", bg2: "#363a44", line: "#d9a521", accent: "#f2b705", accentDark: "#c48f00", accentSoft: "#3f3a2a", gold: "#ffd34d", onAccent: "#1d1a10",
      head: F.lilita, body: F.nunito, card: "frame", headStyle: "banner", motif: "cr", tag: "cr", upper: false })),
    sk("gabe-cr-champion-arena", "Champion Arena", "Clash Royale-inspired: black and gold champion style", D({
      bg: "radial-gradient(circle at 50% -10%, rgba(255, 205, 60, 0.4), transparent 45%), linear-gradient(180deg, #16130b 0%, #0b0905 100%)",
      surface: "#1d1a10", bg2: "#262113", line: "#a8820f", accent: "#ffc53d", accentDark: "#d49a00", accentSoft: "#3a3014", gold: "#fff0b3", onAccent: "#16130b",
      head: F.lilita, body: F.nunito, card: "frame", headStyle: "banner", motif: "cr", tag: "cr", upper: false })),

    // --- Gaming, sports, and bold styles ---
    sk("gabe-wot-olive-drab", "Olive Drab Armor", "World of Tanks-inspired: olive drab armor plates with rivets and stencil type", D({
      bg: "radial-gradient(circle, rgba(0,0,0,0.35) 2px, transparent 2.5px) 0 0 / 34px 34px, linear-gradient(180deg, #4b5320 0%, #363c17 100%)",
      surface: "#2c3114", bg2: "#353b19", line: "#5e6830", accent: "#c9b458", accentDark: "#9c8a35", accentSoft: "#3a4020", gold: "#e3d68c", onAccent: "#1c1f0c",
      head: F.blackops, body: F.rajdhani, card: "brutal", radius: "2px", motif: "tank", tag: "wot" })),
    sk("gabe-neon-arcade", "Neon Arcade", "Black cabinet with magenta and cyan neon", D({
      bg: "linear-gradient(rgba(255, 0, 200, 0.12) 1px, transparent 1px) 0 0 / 100% 28px, #08060f", surface: "#120d22", bg2: "#1a1330", line: "#ff2bd6",
      accent: "#ff2bd6", accentDark: "#c414a5", accentSoft: "#2a1240", gold: "#2bf3ff",
      head: F.press, body: F.space, card: "neon", radius: "4px", motif: "pixel" })),
    sk("gabe-cyber-grid", "Cyber Grid", "Synthwave sunset and glowing grid", D({
      bg: "linear-gradient(rgba(0, 240, 255, 0.25) 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(90deg, rgba(0, 240, 255, 0.25) 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(180deg, #2b0b4a 0%, #120526 60%, #05020d 100%)",
      surface: "rgba(22, 8, 44, 0.88)", bg2: "#22103f", line: "#5b2a9a", accent: "#00f0ff", accentDark: "#00b8c4", accentSoft: "#26124a", gold: "#ff4fd8", onAccent: "#05020d",
      head: F.orbitron, body: F.exo, card: "neon", radius: "6px", motif: "bolt" })),
    sk("gabe-pixel-retro", "Pixel Retro", "8-bit green screen and blocky type", D({
      bg: "linear-gradient(rgba(0, 0, 0, 0.18) 50%, transparent 50%) 0 0 / 100% 4px, #0f2a12", surface: "#123516", bg2: "#174019", line: "#3fbf4a",
      ink: "#c8ffb8", soft: "#8fdc85", accent: "#5cff6a", accentDark: "#2fd13f", accentSoft: "#1d4d22", gold: "#e6ff5c", onAccent: "#0f2a12",
      head: F.press, body: F.space, card: "brutal", radius: "0px", motif: "pixel" })),
    sk("gabe-hoops-court", "Hoops Court", "Basketball orange on hardwood", {
      bg: "repeating-linear-gradient(90deg, #d9a066 0 40px, #cf9358 40px 80px, #dba870 80px 120px)", surface: "#fff8ef", bg2: "#fff0de", ink: "#2b1a0c", soft: "#5e4128", line: "#1d1d1d",
      accent: "#f26b1d", accentDark: "#c24f0c", accentSoft: "#ffe0cc", gold: "#1d1d1d",
      head: F.bebas, body: F.oswald, card: "brutal", radius: "8px", motif: "ball", upper: true }),
    sk("gabe-gridiron", "Gridiron", "Football field green with white yard lines", {
      bg: "repeating-linear-gradient(90deg, #2f7d32 0 58px, rgba(255,255,255,0.85) 58px 61px), #2f7d32", surface: "#ffffff", bg2: "#f1f7f1", ink: "#13240f", soft: "#3e5539", line: "#d8e6d4",
      accent: "#6b3e1e", accentDark: "#4e2c13", accentSoft: "#f0e2d6", gold: "#2f7d32",
      head: F.oswald, body: F.oswald, headStyle: "band", radius: "6px", motif: "none", upper: true }),
    sk("gabe-stadium-lights", "Stadium Lights", "Night game navy with white floodlights", D({
      bg: "radial-gradient(ellipse at 15% 0%, rgba(255,255,255,0.35), transparent 35%), radial-gradient(ellipse at 85% 0%, rgba(255,255,255,0.35), transparent 35%), linear-gradient(180deg, #0f1f3d 0%, #081226 100%)",
      surface: "#13264a", bg2: "#183059", line: "#2a4a80", accent: "#ffffff", accentDark: "#d6deeb", accentSoft: "#1d3866", gold: "#ffcc00", onAccent: "#0f1f3d",
      head: F.bebas, body: F.oswald, headStyle: "underline", motif: "stars" })),
    sk("gabe-soccer-pitch", "Soccer Pitch", "Striped grass pitch and white kit", {
      bg: "repeating-linear-gradient(180deg, #3a9a3f 0 44px, #348c39 44px 88px)", surface: "#ffffff", bg2: "#f2f8f2", ink: "#102a12", soft: "#3b5a3d", line: "#cfe3cf",
      accent: "#1e7a2a", accentDark: "#145a1e", accentSoft: "#dff0e0", gold: "#111111",
      head: F.teko, body: F.source, radius: "10px", motif: "ball", upper: true }),
    sk("gabe-hockey-ice", "Hockey Ice", "Rink white with red and blue lines", {
      bg: "linear-gradient(90deg, transparent 0 32%, #d62b2b 32% 33%, transparent 33% 66%, #2457c5 66% 67%, transparent 67%), linear-gradient(180deg, #f6fbff 0%, #e2eef8 100%)",
      surface: "#ffffff", bg2: "#f0f6fc", ink: "#0d1b2e", soft: "#3a4b63", line: "#c9d9ea",
      accent: "#2457c5", accentDark: "#183e93", accentSoft: "#dde7fa", gold: "#d62b2b",
      head: F.russo, body: F.source, card: "outline", radius: "8px", motif: "none", upper: true }),
    sk("gabe-racing-stripes", "Racing Stripes", "Red, black, and white race-day stripes", D({
      bg: "linear-gradient(90deg, transparent 0 44%, #e10600 44% 48%, #ffffff 48% 50%, #e10600 50% 54%, transparent 54%), linear-gradient(180deg, #151515 0%, #0a0a0a 100%)",
      surface: "#1c1c1c", bg2: "#252525", line: "#3a3a3a", accent: "#e10600", accentDark: "#a80400", accentSoft: "#3a1414", gold: "#ffffff", onAccent: "#ffffff",
      head: F.russo, body: F.exo, card: "flat", radius: "4px", motif: "bolt", headStyle: "band" })),
    sk("gabe-wot-woodland-camo", "Woodland Tank Camo", "World of Tanks-inspired: green and brown woodland tank camo", D({
      bg: "radial-gradient(circle at 20% 30%, #4b5a2a 0 12%, transparent 13%), radial-gradient(circle at 70% 20%, #3a2e1e 0 10%, transparent 11%), radial-gradient(circle at 45% 75%, #2d3a1c 0 14%, transparent 15%), radial-gradient(circle at 85% 70%, #5b6b34 0 9%, transparent 10%), radial-gradient(circle at 10% 85%, #1f2412 0 8%, transparent 9%), #3f4a26",
      surface: "#252b18", bg2: "#2e351e", line: "#56613a", ink: "#eef0e0", soft: "#c4c9a6", accent: "#c7a04a", accentDark: "#9c7a2c", accentSoft: "#38401f", gold: "#e0c97a", onAccent: "#1b1f10",
      head: F.blackops, body: F.rajdhani, card: "flat", radius: "4px", motif: "tank", tag: "wot" })),
    sk("gabe-carbon-fiber", "Carbon Fiber", "Woven carbon texture with silver", D({
      bg: "linear-gradient(45deg, #1c1c1c 25%, transparent 25%, transparent 75%, #1c1c1c 75%) 0 0 / 12px 12px, linear-gradient(45deg, #1c1c1c 25%, transparent 25%, transparent 75%, #1c1c1c 75%) 6px 6px / 12px 12px, #262626",
      surface: "#1a1a1a", bg2: "#222222", line: "#3c3c3c", accent: "#c0c6cf", accentDark: "#8f96a1", accentSoft: "#2e2e2e", gold: "#f2f4f7", onAccent: "#111111",
      head: F.exo, body: F.exo, card: "outline", radius: "8px", motif: "none" })),
    sk("gabe-lava-core", "Lava Core", "Volcanic black with molten orange", D({
      bg: "radial-gradient(circle at 50% 110%, rgba(255, 90, 0, 0.6), transparent 50%), linear-gradient(180deg, #160b07 0%, #0b0503 100%)",
      surface: "#1f110b", bg2: "#2a170f", line: "#5a2a14", accent: "#ff5a00", accentDark: "#cc4600", accentSoft: "#3a1a0c", gold: "#ffc14d",
      head: F.bungee, body: F.rajdhani, card: "neon", radius: "10px", motif: "bolt" })),
    sk("gabe-deep-space", "Deep Space", "Black space, blue nebula, and starfield", D({
      bg: "radial-gradient(1px 1px at 10% 20%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 55% 35%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 80% 75%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 30% 85%, #fff 50%, transparent 51%), radial-gradient(circle at 70% 20%, rgba(60, 110, 255, 0.35), transparent 40%), #05060d",
      surface: "rgba(14, 18, 36, 0.9)", bg2: "#141a33", line: "#26305a", accent: "#5b8cff", accentDark: "#3b6be0", accentSoft: "#1a2246", gold: "#b5c8ff",
      head: F.orbitron, body: F.exo, card: "glass", radius: "12px", motif: "stars" })),
    sk("gabe-wot-winter-white", "Winter White Camo", "World of Tanks-inspired: snowy white and gray winter camo", {
      bg: "radial-gradient(ellipse at 20% 30%, #c9cfd6 0 12%, transparent 13%), radial-gradient(ellipse at 75% 20%, #aab2bc 0 9%, transparent 10%), radial-gradient(ellipse at 50% 80%, #d8dde2 0 14%, transparent 15%), radial-gradient(ellipse at 88% 72%, #8d96a1 0 7%, transparent 8%), #f2f4f6",
      surface: "#ffffff", bg2: "#f1f3f6", ink: "#1b222b", soft: "#46505c", line: "#9aa4b0",
      accent: "#3d4a5a", accentDark: "#28323e", accentSoft: "#e2e7ec", gold: "#7d8a99",
      head: F.blackops, body: F.oswald, card: "outline", radius: "4px", motif: "tank", upper: true, tag: "wot" }),
    sk("gabe-wot-desert-tan", "Desert Tan Camo", "World of Tanks-inspired: desert tan and sand camo", {
      bg: "radial-gradient(ellipse at 25% 35%, #b89a6a 0 14%, transparent 15%), radial-gradient(ellipse at 70% 25%, #8f7550 0 10%, transparent 11%), radial-gradient(ellipse at 55% 80%, #c9b18a 0 13%, transparent 14%), radial-gradient(ellipse at 90% 70%, #a08560 0 9%, transparent 10%), #d6c29a",
      surface: "#f6efe0", bg2: "#efe4cc", ink: "#2e2414", soft: "#5a4a30", line: "#7a6440",
      accent: "#7a5a2a", accentDark: "#5a411c", accentSoft: "#eadcc0", gold: "#a8823e",
      head: F.blackops, body: F.oswald, card: "brutal", radius: "2px", motif: "tank", upper: true, tag: "wot" }),
    sk("gabe-graffiti-street", "Graffiti Street", "Concrete gray with spray-paint color", {
      bg: "radial-gradient(circle at 10% 20%, rgba(255, 60, 120, 0.35) 0, transparent 18%), radial-gradient(circle at 85% 30%, rgba(60, 200, 255, 0.35) 0, transparent 18%), radial-gradient(circle at 60% 85%, rgba(255, 220, 0, 0.35) 0, transparent 16%), #8d8f93",
      surface: "#f2f2f2", bg2: "#e6e6e6", ink: "#151515", soft: "#3e3e3e", line: "#151515",
      accent: "#ff2e7e", accentDark: "#c9145c", accentSoft: "#ffd6e6", gold: "#00c2ff",
      head: F.marker, body: F.space, card: "brutal", radius: "2px", motif: "bolt" }),
    sk("gabe-wot-commander-hud", "Tank Commander HUD", "World of Tanks-inspired: dark green gunsight HUD with crosshair lines", D({
      bg: "linear-gradient(90deg, transparent calc(50% - 1px), rgba(140, 255, 120, 0.35) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)), linear-gradient(0deg, transparent calc(50% - 1px), rgba(140, 255, 120, 0.35) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)), radial-gradient(circle, transparent 0 22%, rgba(140,255,120,0.25) 22% 22.6%, transparent 22.6%), #0c1a0e",
      surface: "#112414", bg2: "#16301a", line: "#2f6a34", ink: "#dcffd4", soft: "#a6d99c", accent: "#8cff78", accentDark: "#5fd14c", accentSoft: "#1c3d20", gold: "#ffd166", onAccent: "#0c1a0e",
      head: F.blackops, body: F.space, card: "neon", radius: "2px", motif: "tank", tag: "wot" })),
    sk("gabe-wot-urban-gray", "Urban Gray Camo", "World of Tanks-inspired: blocky gray urban digital camo", D({
      bg: "linear-gradient(90deg, #5d6168 0 25%, transparent 25% 50%, #3c3f45 50% 75%, transparent 75%) 0 0 / 48px 24px, linear-gradient(90deg, transparent 0 25%, #6e737b 25% 50%, transparent 50% 75%, #45484f 75%) 12px 12px / 48px 24px, #50545b",
      surface: "#2a2d32", bg2: "#33363c", line: "#5d6168", accent: "#d0d4da", accentDark: "#a3a8b0", accentSoft: "#3a3d43", gold: "#f0b429", onAccent: "#16181b",
      head: F.blackops, body: F.rajdhani, card: "flat", radius: "2px", motif: "tank", tag: "wot" }))
  ];

  var DEFAULTS = { eva: "eva-blush-roses", gabe: "gabe-classic-blue-black" };

  var api = { EVA_SKINS: EVA_SKINS, GABE_SKINS: GABE_SKINS, DEFAULTS: DEFAULTS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EG_SKINS = api;
})(typeof window !== "undefined" ? window : globalThis);
