(function () {
  "use strict";

  var TZ = "America/Denver";
  var STORAGE_KEY = "evaandgabe-wishlist";
  var PARENT_KEY = "evaandgabe-parent";
  var DEMO_PIN = "2468";
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var STATUS_LABELS = { wanted: "Wanted", on_the_way: "On the way", got: "Got" };
  var FOR_LABELS = { eva: "Eva", gabe: "Gabe", both: "Both" };
  var AMOUNT_WORDS = { 5: "five", 10: "ten", 20: "twenty", 50: "fifty" };

  function moneyRequestText(kidName, amount) {
    var words = AMOUNT_WORDS[amount];
    if (!words) return "";
    return kidName + " wants " + words + " dollars (via evaandgabe.com)";
  }

  var SKINS_KEY = "evaandgabe-skins";
  var SKIN_LIB = window.EG_SKINS || { EVA_SKINS: [], GABE_SKINS: [], DEFAULTS: { eva: "", gabe: "" } };

  var state = {
    kid: "eva",
    year: null,
    month: null, // 0-based
    selectedDate: null,
    events: [],
    wishlist: [],
    api: false,
    parent: false,
    updates: [],
    tasks: { claims: {}, completions: [] },
    skins: { eva: SKIN_LIB.DEFAULTS.eva, gabe: SKIN_LIB.DEFAULTS.gabe },
    colorReq: { eva: null }
  };
  var COLORS_KEY = "evaandgabe-colors";
  var COLOR_LIB = window.EG_COLOR || null;
  var TASKS_KEY = "evaandgabe-tasks";
  var CLAIM_MSG = "You have claimed this task. SatBuddy is needed by 10 PM tonight.";

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function todayParts() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "numeric",
      day: "numeric"
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) {
      if (p.type !== "literal") map[p.type] = p.value;
    });
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day)
    };
  }

  function toISODate(year, month1, day) {
    return (
      String(year) +
      "-" +
      String(month1).padStart(2, "0") +
      "-" +
      String(day).padStart(2, "0")
    );
  }

  function todayISO() {
    var t = todayParts();
    return toISODate(t.year, t.month, t.day);
  }

  function formatNiceDate(iso) {
    var bits = iso.split("-");
    var date = new Date(Date.UTC(Number(bits[0]), Number(bits[1]) - 1, Number(bits[2])));
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }).format(date);
  }

  function isExample(title) {
    return /^EXAMPLE:/i.test(title || "");
  }

  function kidEvents(list, kid) {
    return (list || []).filter(function (ev) {
      return ev.kid === kid || ev.kid === "both";
    });
  }

  function eventsOn(iso) {
    return kidEvents(state.events, state.kid).filter(function (ev) {
      return ev.date === iso;
    });
  }

  function showStatus(node, message, kind) {
    if (!node) return;
    node.hidden = false;
    node.textContent = message;
    node.classList.remove("is-ok", "is-error");
    if (kind) node.classList.add(kind);
  }

  function titleWithTag(title) {
    if (!isExample(title)) return escapeHtml(title);
    var rest = title.replace(/^EXAMPLE:\s*/i, "");
    return escapeHtml(rest) + ' <span class="example-tag">Example</span>';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setKid(kid) {
    state.kid = kid === "gabe" ? "gabe" : "eva";
    document.body.classList.toggle("is-gabe", state.kid === "gabe");
    document.body.classList.toggle("is-eva", state.kid === "eva");
    els.requestKid.value = state.kid;
    els.tabEva.classList.toggle("is-active", state.kid === "eva");
    els.tabGabe.classList.toggle("is-active", state.kid === "gabe");
    els.tabEva.setAttribute("aria-selected", state.kid === "eva" ? "true" : "false");
    els.tabGabe.setAttribute("aria-selected", state.kid === "gabe" ? "true" : "false");
    Array.prototype.forEach.call(document.querySelectorAll(".hero-kid, .family-entry"), function (b) {
      var on = b.getAttribute("data-kid") === state.kid;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    els.kidPanel.setAttribute("aria-labelledby", state.kid === "eva" ? "tab-eva" : "tab-gabe");
    els.calendarEyebrow.textContent = state.kid === "eva" ? "Eva's calendar" : "Gabe's calendar";
    els.requestHeading.textContent = state.kid === "eva" ? "Eva, need something?" : "Gabe, need something?";
    renderCalendar();
    renderUpcoming();
    applyLooks();
    renderUpdates();
    renderCompletions();
  }

  function monthLabel(year, month0) {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(Date.UTC(year, month0, 1))
    );
  }

  function renderCalendar() {
    var year = state.year;
    var month0 = state.month;
    els.calMonth.textContent = monthLabel(year, month0);
    var first = new Date(Date.UTC(year, month0, 1));
    var startDow = first.getUTCDay();
    var daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
    var today = todayISO();
    var html = WEEKDAYS.map(function (d) {
      return '<div class="cal-dow">' + d + "</div>";
    }).join("");

    for (var i = 0; i < startDow; i += 1) {
      html += '<div class="cal-day is-muted" aria-hidden="true"></div>';
    }
    for (var day = 1; day <= daysInMonth; day += 1) {
      var iso = toISODate(year, month0 + 1, day);
      var evs = eventsOn(iso);
      var classes = ["cal-day"];
      if (iso === today) classes.push("is-today");
      if (evs.length) classes.push("has-event");
      if (state.selectedDate === iso) classes.push("is-selected");
      var label = formatNiceDate(iso);
      if (evs.length) label += ", " + evs.length + (evs.length === 1 ? " event" : " events");
      html +=
        '<button type="button" class="' +
        classes.join(" ") +
        '" data-date="' +
        iso +
        '" aria-label="' +
        escapeHtml(label) +
        '"><span>' +
        day +
        "</span>" +
        (evs.length ? '<span class="cal-dot"></span>' : "") +
        "</button>";
    }
    els.calGrid.innerHTML = html;
    renderDayDetail();
  }

  function renderDayDetail() {
    var iso = state.selectedDate;
    if (!iso) {
      els.calDayDetail.hidden = true;
      els.calDayDetail.innerHTML = "";
      return;
    }
    var evs = eventsOn(iso);
    var html = "<strong>" + escapeHtml(formatNiceDate(iso)) + "</strong>";
    if (!evs.length) {
      html += "<p>No events on this day.</p>";
    } else {
      html += "<ul>" + evs.map(function (ev) {
        var time = ev.time ? " · " + escapeHtml(ev.time) : "";
        return "<li>" + titleWithTag(ev.title) + time + "</li>";
      }).join("") + "</ul>";
    }
    els.calDayDetail.innerHTML = html;
    els.calDayDetail.hidden = false;
  }

  function renderUpcoming() {
    var today = todayISO();
    var upcoming = kidEvents(state.events, state.kid)
      .filter(function (ev) { return ev.date >= today; })
      .sort(function (a, b) {
        if (a.date === b.date) return (a.time || "").localeCompare(b.time || "");
        return a.date.localeCompare(b.date);
      })
      .slice(0, 6);

    if (!upcoming.length) {
      els.upcomingList.innerHTML = "<li>No upcoming events in the calendar file yet.</li>";
      return;
    }
    els.upcomingList.innerHTML = upcoming.map(function (ev) {
      var time = ev.time ? " · " + escapeHtml(ev.time) : "";
      return (
        "<li><span class=\"event-date\">" +
        escapeHtml(formatNiceDate(ev.date)) +
        time +
        "</span><p class=\"event-title\">" +
        titleWithTag(ev.title) +
        "</p></li>"
      );
    }).join("");
  }

  function renderWishlist() {
    if (!state.wishlist.length) {
      els.wishList.innerHTML = "<li>No wishes yet.</li>";
      return;
    }
    els.wishList.innerHTML = state.wishlist.map(function (item) {
      var status = STATUS_LABELS[item.status] || item.status;
      var tools = "";
      if (state.parent) {
        tools =
          '<div class="status-actions">' +
          buttonFor(item, "wanted", "Wanted") +
          buttonFor(item, "on_the_way", "On the way") +
          buttonFor(item, "got", "Got") +
          '<button type="button" class="wish-delete" data-delete="' +
          escapeHtml(item.id) +
          '">Remove</button></div>';
      }
      return (
        '<li><div class="wish-row"><div><p class="event-title">' +
        titleWithTag(item.title) +
        '</p><p class="wish-meta">For ' +
        escapeHtml(FOR_LABELS[item.for] || item.for) +
        "</p></div><span class=\"status-pill " +
        escapeHtml(item.status) +
        '">' +
        escapeHtml(status) +
        "</span></div>" +
        tools +
        "</li>"
      );
    }).join("");
  }

  function buttonFor(item, status, label) {
    var current = item.status === status ? " is-current" : "";
    return (
      '<button type="button" class="status-btn' +
      current +
      '" data-id="' +
      escapeHtml(item.id) +
      '" data-status="' +
      status +
      '">' +
      label +
      "</button>"
    );
  }

  function persistLocalWishlist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.wishlist }));
    } catch (err) {
      /* ignore quota / private mode */
    }
  }

  async function loadEvents() {
    if (state.api) {
      try {
        var apiRes = await fetch("/api/events", { cache: "no-store" });
        if (apiRes.ok) {
          var apiData = await apiRes.json();
          if (apiData && Array.isArray(apiData.events)) {
            state.events = apiData.events;
            return;
          }
        }
      } catch (err) {}
    }
    try {
      var res = await fetch("data/events.json", { cache: "no-store" });
      if (!res.ok) throw new Error("events missing");
      var data = await res.json();
      state.events = data.events || [];
    } catch (err) {
      state.events = [];
    }
  }

  async function detectApi() {
    try {
      var res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) return false;
      var data = await res.json();
      return Boolean(data && data.ok);
    } catch (err) {
      return false;
    }
  }

  async function loadWishlist() {
    if (state.api) {
      try {
        var res = await fetch("/api/wishlist", { cache: "no-store" });
        if (res.ok) {
          var data = await res.json();
          if (data && Array.isArray(data.items)) {
            state.wishlist = data.items;
            persistLocalWishlist();
            return;
          }
        }
      } catch (err) {
        /* fall through to local */
      }
    }
    try {
      var cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.items)) {
          state.wishlist = parsed.items;
          return;
        }
      }
    } catch (err) {
      /* ignore */
    }
    try {
      var seedRes = await fetch("data/wishlist.json", { cache: "no-store" });
      var seed = await seedRes.json();
      state.wishlist = seed.items || [];
      persistLocalWishlist();
    } catch (err) {
      state.wishlist = [];
    }
  }

  function consentOk() {
    return Boolean(els.tcpa.checked);
  }

  function requireConsent() {
    if (consentOk()) {
      els.consentBox.classList.remove("is-needed");
      return true;
    }
    els.consentBox.classList.add("is-needed");
    els.tcpa.focus();
    showStatus(els.formStatus, "Please check the consent box before sending a request to Dad.", "is-error");
    return false;
  }

  async function sendRequest(kind, payload) {
    if (!requireConsent()) return;
    var kidName = state.kid === "eva" ? "Eva" : "Gabe";
    payload.kid = state.kid;
    payload.tcpaConsent = true;

    if (!state.api) {
      if (kind === "text") {
        showStatus(
          els.formStatus,
          "Demo: would text Dad: “" + moneyRequestText(kidName, payload.amount) + "”. No text was sent.",
          "is-ok"
        );
      } else {
        showStatus(
          els.formStatus,
          "Demo: would email Dad — “" + payload.message + "” (from " + kidName + "). No email was sent.",
          "is-ok"
        );
      }
      return;
    }

    try {
      var path = kind === "text" ? "/api/request-text" : "/api/request-email";
      var res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (!res.ok || !data.ok) {
        showStatus(els.formStatus, data.message || "That request could not be sent. Please try again.", "is-error");
        return;
      }
      if (data.mode === "demo") {
        showStatus(els.formStatus, data.message || "Demo mode: the message was not sent.", "is-ok");
      } else {
        showStatus(els.formStatus, data.message || "Sent to Dad.", "is-ok");
      }
    } catch (err) {
      showStatus(els.formStatus, "Could not reach the server. Please try again.", "is-error");
    }
  }

  var PRESET_WORDS = { 5: "five", 10: "ten", 200: "two hundred" };

  function holdsActiveSatBuddyClaim() {
    expireStaleClaims();
    var post = (state.updates || []).filter(function (p) {
      return p.claimable && (p.taskName === "SatBuddy" || p.id === "u-today");
    })[0];
    var id = post && post.id ? post.id : "u-today";
    var claim = (state.tasks.claims || {})[id];
    if (!claim || claim.claimedBy !== state.kid) return false;
    if (claim.expiresAt && Date.parse(claim.expiresAt) <= Date.now()) return false;
    return true;
  }

  function updatePresetVisibility() {
    var btn = document.querySelector('.preset-btn[data-amount="200"]');
    if (!btn) return;
    btn.hidden = !holdsActiveSatBuddyClaim();
  }

  var presetLockUntil = 0;

  function lockPresetButtons(ms) {
    presetLockUntil = Date.now() + ms;
    document.querySelectorAll(".preset-btn").forEach(function (btn) { btn.disabled = true; });
    setTimeout(function () {
      if (Date.now() >= presetLockUntil) {
        document.querySelectorAll(".preset-btn").forEach(function (btn) { btn.disabled = false; });
      }
    }, ms);
  }

  async function sendPresetEmail(amount) {
    if (Date.now() < presetLockUntil) return;
    var words = PRESET_WORDS[amount];
    if (!words) return;
    lockPresetButtons(60000);
    if (!state.api) {
      showStatus(els.formStatus, "The email could not be sent right now. No email was sent.", "is-error");
      return;
    }
    try {
      var res = await fetch("/api/request-preset-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kid: state.kid, amount: amount })
      });
      var data = {};
      try { data = await res.json(); } catch (err) { data = {}; }
      if (res.status === 429) {
        showStatus(els.formStatus, data.message || "Please wait a minute before sending another request.", "is-error");
        return;
      }
      if (!res.ok || !data.ok || data.mode !== "live") {
        showStatus(els.formStatus, data.message || "The email could not be sent right now.", "is-error");
        return;
      }
      showStatus(els.formStatus, data.message || ("Your dad has been emailed your request for " + words + " dollars."), "is-ok");
    } catch (err) {
      showStatus(els.formStatus, "The email could not be sent right now.", "is-error");
    }
  }

  async function saveWishlist(nextItems, note) {
    state.wishlist = nextItems;
    persistLocalWishlist();
    renderWishlist();
    if (state.api && state.parent) {
      try {
        var pin = sessionStorage.getItem(PARENT_KEY) || "";
        var res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: pin, items: nextItems })
        });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok || !data.ok) {
          showStatus(els.wishStatus, data.message || "Saved on this device, but the server did not accept the change.", "is-error");
          return;
        }
      } catch (err) {
        showStatus(els.wishStatus, "Saved on this device. The server could not be reached.", "is-error");
        return;
      }
    }
    if (note) showStatus(els.wishStatus, note, "is-ok");
  }

  function setParentMode(on, pin) {
    state.parent = Boolean(on);
    if (on && pin) {
      try {
        sessionStorage.setItem(PARENT_KEY, pin);
      } catch (err) {
        /* ignore */
      }
    }
    if (!on) {
      try {
        sessionStorage.removeItem(PARENT_KEY);
      } catch (err) {
        /* ignore */
      }
    }
    els.parentUnlockBtn.hidden = state.parent;
    els.parentLockBtn.hidden = !state.parent;
    els.parentPanel.hidden = !state.parent;
    renderWishlist();
  }

  async function tryUnlock(pin) {
    var trimmed = String(pin || "").trim();
    if (!trimmed) return false;
    if (state.api) {
      try {
        var res = await fetch("/api/parent-unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: trimmed })
        });
        var data = await res.json().catch(function () { return {}; });
        return Boolean(res.ok && data.ok);
      } catch (err) {
        return trimmed === DEMO_PIN;
      }
    }
    return trimmed === DEMO_PIN;
  }

  function openPinModal() {
    els.pinModal.hidden = false;
    els.pinStatus.hidden = true;
    els.pinInput.value = "";
    els.pinInput.focus();
  }

  function closePinModal() {
    els.pinModal.hidden = true;
    els.pinInput.value = "";
  }


  function skinList(kid) {
    return kid === "gabe" ? SKIN_LIB.GABE_SKINS : SKIN_LIB.EVA_SKINS;
  }

  function findSkin(kid, id) {
    var list = skinList(kid);
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    var fallback = SKIN_LIB.DEFAULTS[kid];
    for (var j = 0; j < list.length; j++) if (list[j].id === fallback) return list[j];
    return list[0] || null;
  }

  function loadSkins() {
    try {
      var saved = JSON.parse(localStorage.getItem(SKINS_KEY) || "{}");
      if (saved && typeof saved === "object") {
        if (saved.eva && findSkin("eva", saved.eva).id === saved.eva) state.skins.eva = saved.eva;
        if (saved.gabe && findSkin("gabe", saved.gabe).id === saved.gabe) state.skins.gabe = saved.gabe;
      }
    } catch (err) {}
  }

  function saveSkins() {
    try { localStorage.setItem(SKINS_KEY, JSON.stringify(state.skins)); } catch (err) {}
  }

  function loadColorReq() {
    try {
      var saved = JSON.parse(localStorage.getItem(COLORS_KEY) || "{}");
      if (saved && saved.eva && COLOR_LIB && COLOR_LIB.theme(saved.eva)) state.colorReq.eva = saved.eva;
    } catch (err) {}
  }

  function saveColorReq() {
    try { localStorage.setItem(COLORS_KEY, JSON.stringify(state.colorReq)); } catch (err) {}
  }

  // Only palette keys can be overridden by a color request. Fonts, radius, card and header styles stay from the skin.
  var COLOR_KEYS = ["bg", "surface", "bg2", "ink", "soft", "line", "accent", "accentDark", "accentSoft", "gold", "onAccent", "dark"];

  function effectiveSkin(kid) {
    var skin = findSkin(kid, state.skins[kid]);
    var spec = kid === "eva" ? state.colorReq.eva : null;
    var pal = spec && COLOR_LIB ? COLOR_LIB.theme(spec) : null;
    if (!skin || !pal) return skin;
    var out = {};
    Object.keys(skin).forEach(function (k) { out[k] = skin[k]; });
    COLOR_KEYS.forEach(function (k) { if (k in pal) out[k] = pal[k]; });
    out.colorLabel = spec.label;
    return out;
  }

  function showColorStatus() {
    var box = $("color-status");
    if (!box) return;
    var spec = state.colorReq.eva;
    if (state.kid !== "eva" || !spec) { box.hidden = true; return; }
    $("color-status-text").textContent = "Colors changed to " + spec.label + ". Only the colors change. Your note still goes to Dad when you send it.";
    box.hidden = false;
  }

  var colorTimer = null;
  function onRequestTyping() {
    if (state.kid !== "eva" || !COLOR_LIB || !els.requestText) return;
    clearTimeout(colorTimer);
    colorTimer = setTimeout(function () {
      var spec = COLOR_LIB.parse(els.requestText.value);
      if (!spec || !COLOR_LIB.theme(spec)) return;
      var cur = state.colorReq.eva;
      if (cur && cur.color === spec.color && cur.mod === spec.mod) return;
      state.colorReq.eva = { color: spec.color, mod: spec.mod, label: spec.label };
      saveColorReq();
      applyLooks();
    }, 450);
  }

  var SKIN_VARS = {
    bg: "--sk-bg", surface: "--sk-surface", bg2: "--sk-bg2", ink: "--sk-ink", soft: "--sk-soft", line: "--sk-line",
    accent: "--sk-accent", accentDark: "--sk-accent-dark", accentSoft: "--sk-accent-soft", gold: "--sk-gold",
    onAccent: "--sk-on-accent", head: "--sk-head", body: "--sk-body", radius: "--sk-radius"
  };

  function skinStyle(skin) {
    return Object.keys(SKIN_VARS).map(function (k) { return SKIN_VARS[k] + ":" + skin[k]; }).join(";");
  }

  function motifMarkup(motif) {
    var glyphs = {
      flowers: ["✿", "❀", "✿"], blossoms: ["❀", "✿", "❀"], hearts: ["♥", "♡", "♥"], stars: ["✦", "✧", "✦"],
      moon: ["☾", "✦", "✧"], sun: ["☀", "✺", "☀"], leaves: ["❦", "❧", "❦"], waves: ["〰", "〰", "〰"],
      snow: ["❄", "❅", "❆"], sparkle: ["✧", "✦", "✧"], music: ["♪", "♫", "♪"]
    };
    if (motif === "ps") return '<span class="m-shape m-triangle"></span><span class="m-shape m-circle"></span><span class="m-shape m-cross"></span><span class="m-shape m-square"></span>';
    if (motif === "cr") return '<span class="m-shape m-crown"></span><span class="m-shape m-drop"></span><span class="m-shape m-shield"></span>';
    if (motif === "tank") return '<span class="m-shape m-tank"></span>';
    if (motif === "ball") return '<span class="m-shape m-ball"></span>';
    if (motif === "bolt") return '<span class="m-shape m-bolt"></span><span class="m-shape m-bolt"></span>';
    if (motif === "pixel") return '<span class="m-shape m-pixel"></span>';
    var g = glyphs[motif];
    if (!g) return "";
    return g.map(function (c) { return '<span class="g">' + c + "</span>"; }).join("");
  }

  function applyLooks() {
    var skin = effectiveSkin(state.kid);
    if (!skin) return;
    var section = document.querySelector(".kids-section");
    if (section) section.setAttribute("style", skinStyle(skin));
    var b = document.body;
    b.setAttribute("data-skin", skin.id);
    b.setAttribute("data-skin-card", skin.card);
    b.setAttribute("data-skin-head", skin.headStyle);
    b.setAttribute("data-skin-motif", skin.motif);
    b.setAttribute("data-skin-dark", skin.dark ? "true" : "false");
    b.setAttribute("data-skin-upper", skin.upper ? "true" : "false");
    b.setAttribute("data-eva-skin", state.skins.eva);
    b.setAttribute("data-gabe-skin", state.skins.gabe);
    var motif = $("skin-motif");
    if (motif) motif.innerHTML = motifMarkup(skin.motif);
    var btn = $("design-btn");
    if (btn) btn.setAttribute("aria-label", "Try a different design for " + (state.kid === "gabe" ? "Gabe" : "Eva") + ". Current design: " + skin.name);
    b.setAttribute("data-color-request", skin.colorLabel || "");
    showColorStatus();
    if (els.skinModal && !els.skinModal.hidden) renderSkinGrid();
  }

  function skinTagLabel(skin) {
    if (skin.tag === "ps") return "PlayStation-inspired";
    if (skin.tag === "cr") return "Clash Royale-inspired";
    if (skin.tag === "wot") return "World of Tanks-inspired";
    return "";
  }

  function renderSkinGrid() {
    var grid = $("skin-grid");
    if (!grid) return;
    var list = skinList(state.kid);
    var current = state.skins[state.kid];
    var kidName = state.kid === "gabe" ? "Gabe" : "Eva";
    var title = $("skin-title");
    if (title) title.textContent = "Pick a design for " + kidName;
    var count = $("skin-count");
    if (count) count.textContent = String(list.length);
    grid.innerHTML = list.map(function (skin) {
      var on = skin.id === current;
      var tag = skinTagLabel(skin);
      return '<li><button type="button" class="skin-option" data-skin-id="' + escapeHtml(skin.id) + '" data-skin-tag="' + escapeHtml(skin.tag) + '" aria-pressed="' + (on ? "true" : "false") + '" title="' + escapeHtml(skin.desc) + '">' +
        '<span class="skin-thumb" aria-hidden="true" style="' + escapeHtml(skinStyle(skin)) + '" data-card="' + skin.card + '" data-head="' + skin.headStyle + '" data-upper="' + (skin.upper ? "true" : "false") + '">' +
          '<span class="t-motif">' + motifMarkup(skin.motif) + '</span>' +
          '<span class="t-bar"></span>' +
          '<span class="t-card a"><span class="t-head">Aa ' + escapeHtml(skin.name.split(" ")[0]) + '</span><span class="t-line"></span><span class="t-line short"></span><span class="t-btn"></span></span>' +
          '<span class="t-card b"><span class="t-dot"></span><span class="t-line"></span></span>' +
        '</span>' +
        '<span class="skin-name">' + escapeHtml(skin.name) + '</span>' +
        (tag ? '<span class="skin-tag">' + tag + '</span>' : '') +
        (on ? '<span class="skin-current-note">In use</span>' : '') +
      '</button></li>';
    }).join("");
  }

  var skinReturnFocus = null;

  function openSkinModal() {
    if (!els.skinModal) return;
    skinReturnFocus = document.activeElement;
    renderSkinGrid();
    els.skinModal.hidden = false;
    document.body.style.overflow = "hidden";
    var current = els.skinModal.querySelector('.skin-option[aria-pressed="true"]') || els.skinModal.querySelector(".skin-option");
    if (current) { current.focus(); current.scrollIntoView({ block: "nearest" }); }
  }

  function closeSkinModal() {
    if (!els.skinModal || els.skinModal.hidden) return;
    els.skinModal.hidden = true;
    document.body.style.overflow = "";
    if (skinReturnFocus && typeof skinReturnFocus.focus === "function") skinReturnFocus.focus();
    else if (els.designBtn) els.designBtn.focus();
  }

  function chooseSkin(id) {
    var skin = findSkin(state.kid, id);
    if (!skin || skin.id !== id) return;
    state.skins[state.kid] = id;
    saveSkins();
    if (state.kid === "eva" && state.colorReq.eva) { state.colorReq.eva = null; saveColorReq(); }
    applyLooks();
    renderSkinGrid();
    var btn = els.skinModal && els.skinModal.querySelector('.skin-option[data-skin-id="' + id + '"]');
    if (btn) btn.focus();
  }

  function loadTasksLocal() {
    try {
      var raw = localStorage.getItem(TASKS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          state.tasks = { claims: parsed.claims || {}, completions: parsed.completions || [] };
          return;
        }
      }
    } catch (err) {}
    state.tasks = { claims: {}, completions: [] };
  }

  function saveTasksLocal() {
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(state.tasks)); } catch (err) {}
  }

  async function persistTasks() {
    saveTasksLocal();
    if (!state.api) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.tasks)
      });
    } catch (err) {}
  }

  function expireStaleClaims() {
    var now = Date.now();
    var claims = state.tasks.claims || {};
    Object.keys(claims).forEach(function (id) {
      var c = claims[id];
      if (!c || c.verified) return;
      if (c.expiresAt && Date.parse(c.expiresAt) <= now) {
        delete claims[id];
      }
    });
  }

  function postDeadline(post) {
    if (post && post.neededBy) return post.neededBy;
    return "2026-11-24T22:00:00-07:00";
  }

  function remainingLabel(expiresAt) {
    var ms = Date.parse(expiresAt) - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return "Time is up";
    var mins = Math.round(ms / 60000);
    if (mins >= 60) {
      var h = Math.floor(mins / 60);
      var m = mins % 60;
      return h + " hr " + m + " min left";
    }
    return mins + " min left";
  }

  function formatNeededBy() {
    return "SatBuddy needed by 10 PM tonight";
  }

  function claimMessage() {
    return CLAIM_MSG;
  }

  function renderUpdates() {
    var list = els.updateList;
    if (!list) return;
    expireStaleClaims();
    var posts = (state.updates || []).slice().sort(function (a, b) {
      if (a.date === b.date) return (a.id || "").localeCompare(b.id || "");
      return b.date.localeCompare(a.date);
    });
    if (!posts.length) {
      list.innerHTML = "<li>No updates yet.</li>";
      return;
    }
    list.innerHTML = posts.map(function (post) {
      var isRequest = Boolean(post.claimable || post.taskName);
      var img = "";
      if (post.image) {
        var alt = escapeHtml(post.alt || "Update image");
        var imgClass = isRequest ? "update-image dad-request-photo" : "update-image";
        img = '<img class="' + imgClass + '" src="' + escapeHtml(post.image) + '" alt="' + alt + '">';
      }
      var rawText = post.text || "";
      var bodyText = isRequest ? rawText.replace(/^\s*Dad request:\s*/i, "") : rawText;
      var body;
      if (isExample(bodyText)) body = titleWithTag(bodyText);
      else body = escapeHtml(bodyText);
      var claimHtml = "";
      if (post.claimable) {
        var claim = (state.tasks.claims || {})[post.id];
        var deadline = '<p class="deadline">' + escapeHtml(post.neededByLabel || formatNeededBy()) + "</p>";
        if (claim && claim.verified) {
          claimHtml = deadline;
        } else if (claim && claim.claimedBy) {
          var who = claim.claimedBy === "eva" ? "Eva" : "Gabe";
          var mine = claim.claimedBy === state.kid;
          var msg = mine ? '<p class="update-claim-msg">' + escapeHtml(claimMessage()) + "</p>" : "";
          var cd = claim.expiresAt ? '<p class="countdown">' + escapeHtml(remainingLabel(claim.expiresAt)) + "</p>" : "";
          var doneBtn = mine ? '<button type="button" class="btn" data-mark-done="' + escapeHtml(post.id) + '">Mark done</button>' : "";
          claimHtml = deadline + msg + '<p class="claim-meta">Claimed by ' + who + "</p>" + cd + '<div class="claim-row">' + doneBtn + "</div>";
        } else {
          claimHtml = deadline + '<div class="claim-row"><button type="button" class="btn" data-claim="' + escapeHtml(post.id) + '">Claim</button></div>';
        }
      }
      if (isRequest) {
        var subline = /sat\s*buddy/i.test(String(post.taskName || "") + " " + rawText) ? "Dad needs a Sat Buddy" : "";
        var subHtml = subline ? '<p class="dad-request-subline">' + escapeHtml(subline) + "</p>" : "";
        var banner =
          '<div class="dad-request-banner">' +
          '<span class="alert-beacon" aria-hidden="true"><span class="alert-beacon-orbit"></span><span class="alert-beacon-dot"></span></span>' +
          '<span class="visually-hidden">Alert</span>' +
          '<div class="dad-request-headings">' +
          '<h3 class="dad-request-heading">Dad request</h3>' +
          subHtml +
          "</div></div>";
        return (
          "<li class='is-dad-request" + (post.image ? " has-image" : "") + "'>" +
          banner +
          img +
          '<span class="update-date">' + escapeHtml(formatNiceDate(post.date)) + "</span>" +
          '<p class="update-text">' + body + "</p>" +
          claimHtml +
          '<p class="family-signoff">Eva and Gabe</p>' +
          "</li>"
        );
      }
      var cls = post.image ? " has-image" : "";
      return (
        "<li class='" + cls + "'>" +
        img +
        '<span class="update-date">' + escapeHtml(formatNiceDate(post.date)) + "</span>" +
        '<p class="update-text">' + body + "</p>" +
        claimHtml +
        "</li>"
      );
    }).join("");
    updatePresetVisibility();
  }

  function renderCompletions() {
    var list = $("completion-list");
    if (!list) return;
    var rows = state.tasks.completions || [];
    if (!rows.length) {
      list.innerHTML = '<li class="empty-note">No completed tasks yet.</li>';
      return;
    }
    list.innerHTML = rows.map(function (row) {
      var who = row.kid === "eva" ? "Eva" : "Gabe";
      var name = escapeHtml(row.taskName || "Task");
      return "<li>Completed: " + name + " — Money sent to " + who + " (status only; no real payment was sent)</li>";
    }).join("");
  }

  async function loadUpdates() {
    if (state.api) {
      try {
        var res = await fetch("/api/updates", { cache: "no-store" });
        if (res.ok) {
          var data = await res.json();
          if (data && Array.isArray(data.posts)) { state.updates = data.posts; return; }
        }
      } catch (err) {}
    }
    try {
      var res2 = await fetch("data/updates.json", { cache: "no-store" });
      var data2 = await res2.json();
      state.updates = data2.posts || [];
    } catch (err) { state.updates = []; }
  }

  async function loadTasks() {
    loadTasksLocal();
    if (state.api) {
      try {
        var res = await fetch("/api/tasks", { cache: "no-store" });
        if (res.ok) {
          var data = await res.json();
          if (data && data.claims) state.tasks = { claims: data.claims || {}, completions: data.completions || [] };
        }
      } catch (err) {}
    }
    expireStaleClaims();
    saveTasksLocal();
  }

  function claimTask(id) {
    expireStaleClaims();
    var post = (state.updates || []).filter(function (p) { return p.id === id; })[0];
    if (!post || !post.claimable) return;
    if (state.tasks.claims[id] && state.tasks.claims[id].claimedBy) {
      showStatus($("claim-status"), "That task is already claimed.", "is-error");
      return;
    }
    state.tasks.claims[id] = {
      claimedBy: state.kid,
      claimedAt: new Date().toISOString(),
      expiresAt: postDeadline(post),
      verified: false,
      markedDone: false,
      taskName: post.taskName || "SatBuddy"
    };
    persistTasks();
    renderUpdates();
    renderCompletions();
    showStatus($("claim-status"), claimMessage(), "is-ok");
  }

  function markDone(id) {
    var claim = state.tasks.claims[id];
    if (!claim || claim.claimedBy !== state.kid) {
      showStatus($("claim-status"), "Only the kid who claimed this can mark it done.", "is-error");
      return;
    }
    expireStaleClaims();
    if (!state.tasks.claims[id]) {
      showStatus($("claim-status"), "The claim ran out of time.", "is-error");
      renderUpdates();
      return;
    }
    claim.markedDone = true;
    persistTasks();
    renderUpdates();
    showStatus($("claim-status"), "Marked done. A parent PIN check is needed to finish it. No real money is sent.", "is-ok");
    openPinForVerify(id);
  }

  var pendingVerifyId = null;
  function openPinForVerify(id) {
    pendingVerifyId = id;
    if ($("pin-modal")) {
      $("pin-modal").hidden = false;
      if ($("pin-input")) { $("pin-input").value = ""; $("pin-input").focus(); }
    }
  }

  function verifyDone(id) {
    var claim = state.tasks.claims[id];
    if (!claim || !claim.markedDone) return;
    claim.verified = true;
    state.tasks.completions = (state.tasks.completions || []).filter(function (row) { return row.id !== id; });
    state.tasks.completions.unshift({
      id: id,
      taskName: claim.taskName || "SatBuddy",
      kid: claim.claimedBy,
      at: new Date().toISOString()
    });
    persistTasks();
    renderUpdates();
    renderCompletions();
    var who = claim.claimedBy === "eva" ? "Eva" : "Gabe";
    showStatus($("claim-status"), "Completed: " + (claim.taskName || "SatBuddy") + " — Money sent to " + who + " (status only; no real payment was sent).", "is-ok");
  }

  function expireClaimNow(id) {
    if (state.tasks.claims[id] && !state.tasks.claims[id].verified) {
      delete state.tasks.claims[id];
      persistTasks();
      renderUpdates();
      showStatus($("claim-status"), "The claim ended. Either kid can claim it now.", "is-ok");
    }
  }

  function resetTasks() {
    state.tasks = { claims: {}, completions: [] };
    persistTasks();
    renderUpdates();
    renderCompletions();
    showStatus($("claim-status"), "Tasks reset for testing.", "is-ok");
  }


  function cacheEls() {
    els.tabEva = $("tab-eva");
    els.tabGabe = $("tab-gabe");
    els.kidPanel = $("kid-panel");
    els.calendarEyebrow = $("calendar-eyebrow");
    els.requestHeading = $("request-heading");
    els.requestKid = $("request-kid");
    els.calPrev = $("cal-prev");
    els.calNext = $("cal-next");
    els.calMonth = $("cal-month");
    els.calGrid = $("cal-grid");
    els.calDayDetail = $("cal-day-detail");
    els.upcomingList = $("upcoming-list");
    els.requestForm = $("request-form");
    els.requestText = $("request-text");
    els.tcpa = $("tcpa");
    els.consentBox = $("consent-box");
    els.formStatus = $("form-status");
    els.wishList = $("wish-list");
    els.wishStatus = $("wish-status");
    els.parentUnlockBtn = $("parent-unlock-btn");
    els.parentLockBtn = $("parent-lock-btn");
    els.parentPanel = $("parent-panel");
    els.addWishForm = $("add-wish-form");
    els.pinModal = $("pin-modal");
    els.pinForm = $("pin-form");
    els.pinInput = $("pin-input");
    els.pinStatus = $("pin-status");
    els.pinCancel = $("pin-cancel");
    els.year = $("year");
    els.updateList = $("update-list");
    els.designBtn = $("design-btn");
    els.skinModal = $("skin-modal");
    els.skinGrid = $("skin-grid");
    els.skinClose = $("skin-close");
    els.customizeBtn = $("customize-btn");
    els.change24Btn = $("change24-btn");
    els.suggestModal = $("suggest-modal");
    els.suggestForm = $("suggest-form");
    els.suggestTitle = $("suggest-title");
    els.suggestPrompt = $("suggest-prompt");
    els.suggestKind = $("suggest-kind");
    els.suggestText = $("suggest-text");
    els.suggestStatus = $("suggest-status");
    els.suggestCancel = $("suggest-cancel");
    els.calReqForm = $("calendar-request-form");
    els.calReqDate = $("cal-req-date");
    els.calReqText = $("cal-req-text");
    els.calReqStatus = $("cal-req-status");
  }

  function bind() {
    els.tabEva.addEventListener("click", function () { setKid("eva"); });
    els.tabGabe.addEventListener("click", function () { setKid("gabe"); });
    Array.prototype.forEach.call(document.querySelectorAll(".hero-kid, .family-entry"), function (b) {
      b.addEventListener("click", function () { setKid(b.getAttribute("data-kid")); });
    });

    if (els.designBtn) els.designBtn.addEventListener("click", openSkinModal);
    if (els.requestText) els.requestText.addEventListener("input", onRequestTyping);
    var colorUndo = $("color-undo");
    if (colorUndo) colorUndo.addEventListener("click", function () { state.colorReq.eva = null; saveColorReq(); applyLooks(); });
    if (els.skinClose) els.skinClose.addEventListener("click", closeSkinModal);
    if (els.skinModal) {
      els.skinModal.addEventListener("click", function (event) {
        if (event.target === els.skinModal) { closeSkinModal(); return; }
        var opt = event.target.closest("[data-skin-id]");
        if (opt) chooseSkin(opt.getAttribute("data-skin-id"));
      });
      els.skinModal.addEventListener("keydown", function (event) {
        if (event.key === "Escape") { event.preventDefault(); closeSkinModal(); return; }
        if (event.key === "Tab") {
          var focusables = Array.prototype.slice.call(els.skinModal.querySelectorAll("button"));
          if (!focusables.length) return;
          var first = focusables[0];
          var last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          return;
        }
        var arrows = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: "down", ArrowUp: "up" };
        if (!(event.key in arrows)) return;
        var opts = Array.prototype.slice.call(els.skinModal.querySelectorAll(".skin-option"));
        var idx = opts.indexOf(document.activeElement);
        if (idx < 0) return;
        var step = arrows[event.key];
        if (step === "down" || step === "up") {
          var top0 = opts[idx].getBoundingClientRect().top;
          var cols = opts.filter(function (o) { return Math.abs(o.getBoundingClientRect().top - top0) < 2; }).length || 1;
          step = step === "down" ? cols : -cols;
        }
        var next = opts[idx + step];
        if (next) { event.preventDefault(); next.focus(); }
      });
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && els.skinModal && !els.skinModal.hidden) closeSkinModal();
    });

    if (els.updateList) {
      els.updateList.addEventListener("click", function (event) {
        var claimBtn = event.target.closest("[data-claim]");
        if (claimBtn) { claimTask(claimBtn.getAttribute("data-claim")); return; }
        var doneBtn = event.target.closest("[data-mark-done]");
        if (doneBtn) { markDone(doneBtn.getAttribute("data-mark-done")); }
      });
    }
    var expireBtn = $("expire-claim-btn");
    if (expireBtn) expireBtn.addEventListener("click", function () { expireClaimNow("u-today"); });
    var resetBtn = $("reset-tasks-btn");
    if (resetBtn) resetBtn.addEventListener("click", resetTasks);

    function openSuggest(kind) {
      if (!els.suggestModal) return;
      els.suggestKind.value = kind;
      if (kind === "change24h") {
        els.suggestTitle.textContent = "24 hour change to website";
        els.suggestPrompt.textContent = "Please describe in detail how you would like to change this website.";
      } else {
        els.suggestTitle.textContent = "Customize";
        els.suggestPrompt.textContent = "What else would you like to customize on your website?";
      }
      els.suggestText.value = "";
      els.suggestStatus.hidden = true;
      els.suggestModal.hidden = false;
      els.suggestText.focus();
    }
    if (els.customizeBtn) els.customizeBtn.addEventListener("click", function () { openSuggest("customize"); });
    if (els.change24Btn) els.change24Btn.addEventListener("click", function () { openSuggest("change24h"); });
    if (els.suggestCancel) els.suggestCancel.addEventListener("click", function () { els.suggestModal.hidden = true; });
    if (els.suggestModal) els.suggestModal.addEventListener("click", function (event) {
      if (event.target === els.suggestModal) els.suggestModal.hidden = true;
    });
    if (els.suggestForm) {
      els.suggestForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var message = (els.suggestText.value || "").trim();
        if (!message) return;
        var kind = els.suggestKind.value || "customize";
        var payload = { kid: state.kid, kind: kind, message: message };
        if (!state.api) {
          showStatus(els.suggestStatus, "Demo: would email piper@evaandgabe.com from " + (state.kid === "eva" ? "Eva" : "Gabe") + ". No email was sent.", "is-ok");
          return;
        }
        try {
          var res = await fetch("/api/suggestion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          var data = await res.json().catch(function () { return {}; });
          showStatus(els.suggestStatus, data.message || (data.ok ? "Sent to piper@evaandgabe.com." : "Could not send."), data.ok ? "is-ok" : "is-error");
        } catch (err) {
          showStatus(els.suggestStatus, "Could not reach the server.", "is-error");
        }
      });
    }

    if (els.calReqForm) {
      if (els.calReqDate && !els.calReqDate.value) els.calReqDate.value = todayISO();
      els.calReqForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        var date = (els.calReqDate.value || "").trim();
        var text = (els.calReqText.value || "").trim();
        if (!date || !text) {
          showStatus(els.calReqStatus, "Please add a date and a short note.", "is-error");
          return;
        }
        showStatus(els.calReqStatus, "Sent to the calendar inbox. It should show up on your calendar in a moment.", "is-ok");
        var apply = async function () {
          if (state.api) {
            try {
              var res = await fetch("/api/calendar-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kid: state.kid, date: date, text: text })
              });
              var data = await res.json().catch(function () { return {}; });
              if (data && data.event) {
                state.events = (state.events || []).concat([data.event]);
              } else {
                await loadEvents();
              }
            } catch (err) {}
          } else {
            state.events = (state.events || []).concat([{
              id: "local-" + Date.now(),
              kid: state.kid,
              date: date,
              time: "",
              title: text,
              note: "Added from the calendar form (demo)."
            }]);
          }
          els.calReqText.value = "";
          renderCalendar();
          renderUpcoming();
          showStatus(els.calReqStatus, "It's on the calendar now.", "is-ok");
        };
        setTimeout(apply, 2000);
      });
    }

    els.calPrev.addEventListener("click", function () {
      state.month -= 1;
      if (state.month < 0) {
        state.month = 11;
        state.year -= 1;
      }
      renderCalendar();
    });
    els.calNext.addEventListener("click", function () {
      state.month += 1;
      if (state.month > 11) {
        state.month = 0;
        state.year += 1;
      }
      renderCalendar();
    });
    els.calGrid.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-date]");
      if (!btn) return;
      state.selectedDate = btn.getAttribute("data-date");
      renderCalendar();
    });

    document.querySelectorAll(".preset-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var amount = Number(btn.getAttribute("data-amount"));
        sendPresetEmail(amount);
      });
    });

    els.requestForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = (els.requestText.value || "").trim();
      if (!message) {
        showStatus(els.formStatus, "Type a short note before emailing Dad.", "is-error");
        els.requestText.focus();
        return;
      }
      sendRequest("email", { message: message });
    });

    els.tcpa.addEventListener("change", function () {
      if (els.tcpa.checked) els.consentBox.classList.remove("is-needed");
    });

    els.parentUnlockBtn.addEventListener("click", openPinModal);
    els.parentLockBtn.addEventListener("click", function () {
      setParentMode(false);
      showStatus(els.wishStatus, "Parent tools are locked.", "is-ok");
    });
    els.pinCancel.addEventListener("click", closePinModal);
    els.pinModal.addEventListener("click", function (event) {
      if (event.target === els.pinModal) closePinModal();
    });
    els.pinForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var ok = await tryUnlock(els.pinInput.value);
      if (!ok) {
        showStatus(els.pinStatus, "That PIN did not match.", "is-error");
        return;
      }
      setParentMode(true, els.pinInput.value.trim());
      closePinModal();
      if (pendingVerifyId) {
        var vid = pendingVerifyId;
        pendingVerifyId = null;
        verifyDone(vid);
      } else {
        showStatus(els.wishStatus, "Parent tools are unlocked. You can mark items or add a wish.", "is-ok");
      }
    });

    els.addWishForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!state.parent) return;
      var title = ($("wish-title").value || "").trim();
      var forWho = $("wish-for").value || "both";
      if (!title) return;
      var item = {
        id: "w-" + Date.now(),
        title: title,
        for: forWho,
        status: "wanted",
        note: ""
      };
      $("wish-title").value = "";
      saveWishlist(state.wishlist.concat([item]), "Added to the wish list.");
    });

    els.wishList.addEventListener("click", function (event) {
      if (!state.parent) return;
      var del = event.target.closest("[data-delete]");
      if (del) {
        var id = del.getAttribute("data-delete");
        saveWishlist(
          state.wishlist.filter(function (item) { return item.id !== id; }),
          "Removed from the wish list."
        );
        return;
      }
      var statusBtn = event.target.closest("[data-status]");
      if (!statusBtn) return;
      var wishId = statusBtn.getAttribute("data-id");
      var status = statusBtn.getAttribute("data-status");
      saveWishlist(
        state.wishlist.map(function (item) {
          if (item.id !== wishId) return item;
          return Object.assign({}, item, { status: status });
        }),
        "Updated to “" + (STATUS_LABELS[status] || status) + ".”"
      );
    });
  }

  async function init() {
    cacheEls();
    if (els.year) els.year.textContent = String(todayParts().year);
    var today = todayParts();
    state.year = today.year;
    state.month = today.month - 1;
    bind();
    loadSkins();
    loadColorReq();
    applyLooks();
    state.api = await detectApi();
    await loadEvents();
    await loadWishlist();
    await loadUpdates();
    await loadTasks();
    setInterval(function () { expireStaleClaims(); renderUpdates(); }, 30000);
    var savedPin = "";
    try {
      savedPin = sessionStorage.getItem(PARENT_KEY) || "";
    } catch (err) {
      savedPin = "";
    }
    if (savedPin && (await tryUnlock(savedPin))) {
      setParentMode(true, savedPin);
    } else {
      setParentMode(false);
    }
    setKid("eva");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
