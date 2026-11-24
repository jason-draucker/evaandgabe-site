(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var parts = window.location.pathname.split("/").filter(Boolean);
  var kid = (parts[1] || "").toLowerCase();
  var token = params.get("token") || "";

  if (window.location.search.indexOf("token=") !== -1) {
    var clean = window.location.pathname;
    window.history.replaceState({}, document.title, clean);
  }

  var statusEl = document.getElementById("kid-status");
  var appEl = document.getElementById("kid-app");
  var heading = document.getElementById("kid-heading");
  var listEl = document.getElementById("kid-event-list");

  function showStatus(text, kind) {
    statusEl.hidden = false;
    statusEl.textContent = text;
    statusEl.classList.remove("is-ok", "is-error");
    if (kind) statusEl.classList.add(kind);
  }

  function headers() {
    return { "Content-Type": "application/json", "X-Kid-Token": token };
  }

  function api(path, options) {
    options = options || {};
    options.headers = Object.assign({}, headers(), options.headers || {});
    return fetch(path, options);
  }

  async function boot() {
    if (kid !== "eva" && kid !== "gabe") {
      showStatus("This private page was not found.", "is-error");
      return;
    }
    if (!token) {
      showStatus("You need your private link from Dad to use this page.", "is-error");
      return;
    }
    var res = await api("/api/kid/" + kid + "/session");
    if (!res.ok) {
      showStatus("That private link is not valid.", "is-error");
      return;
    }
    var data = await res.json();
    heading.textContent = data.name + "'s private calendar";
    document.body.classList.add(kid === "gabe" ? "is-gabe" : "is-eva");
    appEl.hidden = false;
    showStatus("You're in. Only your events can be changed here.", "is-ok");
    await refresh();
  }

  async function refresh() {
    var res = await api("/api/kid/" + kid + "/events");
    if (!res.ok) return;
    var data = await res.json();
    var events = (data.events || []).slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    if (!events.length) {
      listEl.innerHTML = "<li>No events yet.</li>";
      return;
    }
    listEl.innerHTML = events.map(function (event) {
      return (
        "<li data-id=\"" + event.id + "\">" +
        "<strong>" + escapeHtml(event.date) + (event.time ? " · " + escapeHtml(event.time) : "") + "</strong>" +
        "<p>" + escapeHtml(event.title || "") + "</p>" +
        (event.note ? "<p class=\"card-sub\">" + escapeHtml(event.note) + "</p>" : "") +
        "<div class=\"action-row\">" +
        "<button type=\"button\" class=\"btn btn-quiet\" data-edit>Edit</button>" +
        "<button type=\"button\" class=\"btn btn-quiet\" data-delete>Delete</button>" +
        "</div></li>"
      );
    }).join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.getElementById("add-event-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    var body = {
      date: document.getElementById("event-date").value,
      time: document.getElementById("event-time").value,
      title: document.getElementById("event-title").value,
      note: document.getElementById("event-note").value
    };
    var res = await api("/api/kid/" + kid + "/events", { method: "POST", body: JSON.stringify(body) });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      showStatus(data.message || "Could not save that event.", "is-error");
      return;
    }
    document.getElementById("event-title").value = "";
    document.getElementById("event-note").value = "";
    showStatus("Event saved. It will also show on your public tab.", "is-ok");
    await refresh();
  });

  listEl.addEventListener("click", async function (event) {
    var item = event.target.closest("li[data-id]");
    if (!item) return;
    var id = item.getAttribute("data-id");
    if (event.target.closest("[data-delete]")) {
      var res = await api("/api/kid/" + kid + "/events/" + encodeURIComponent(id), {
        method: "POST",
        body: JSON.stringify({ action: "delete" })
      });
      if (res.ok) { showStatus("Event removed.", "is-ok"); await refresh(); }
      else showStatus("Could not delete that event.", "is-error");
      return;
    }
    if (event.target.closest("[data-edit]")) {
      var title = window.prompt("New title");
      if (!title) return;
      var res2 = await api("/api/kid/" + kid + "/events/" + encodeURIComponent(id), {
        method: "POST",
        body: JSON.stringify({ title: title })
      });
      if (res2.ok) { showStatus("Event updated.", "is-ok"); await refresh(); }
      else showStatus("Could not update that event.", "is-error");
    }
  });

  boot().catch(function () {
    showStatus("Could not reach the server.", "is-error");
  });
})();
