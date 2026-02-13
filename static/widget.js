/**
 * Cami Customer Service Widget
 * 
 * Drop on any site:
 *   <script src="https://usecami.com/static/widget.js" data-key="cami_xxx"></script>
 *
 * Options (data attributes on the script tag):
 *   data-key       - Required. Business API key.
 *   data-position  - "right" (default) or "left".
 *   data-color     - Primary brand color (hex). Default: #6C5CE7.
 *   data-title     - Chat header title. Default: fetched from widget config.
 *   data-welcome   - Welcome message. Default: fetched from widget config.
 *   data-api            - API base URL. Default: https://api.usecami.com
 *   data-hide-branding  - "true" to remove "Powered by Cami" footer (enterprise).
 *   data-business-id    - Business UUID (enables feedback submission).
 *
 * ~14KB unminified, zero dependencies.
 */
(function () {
  "use strict";

  // ── Config from script tag ──
  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var API_KEY = scriptTag.getAttribute("data-key") || "";
  var POSITION = scriptTag.getAttribute("data-position") || "right";
  var BRAND_COLOR = scriptTag.getAttribute("data-color") || "#6C5CE7";
  var TITLE = scriptTag.getAttribute("data-title") || "";
  var WELCOME = scriptTag.getAttribute("data-welcome") || "";
  var API_BASE = scriptTag.getAttribute("data-api") || "";
  var HIDE_BRANDING = scriptTag.getAttribute("data-hide-branding") === "true";

  // Auto-detect API base from script src if not set
  if (!API_BASE) {
    try {
      var src = scriptTag.src || "";
      var url = new URL(src);
      API_BASE = url.origin;
    } catch (e) {
      API_BASE = "https://api.usecami.com";
    }
  }

  // ── State ──
  var isOpen = false;
  var messages = [];
  var sessionId = "cw_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  var configLoaded = false;

  // ── Styles ──
  function injectStyles() {
    var css = "\n" +
      "#cami-widget-bubble{position:fixed;bottom:24px;" + POSITION + ":24px;width:60px;height:60px;border-radius:50%;background:" + BRAND_COLOR + ";cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;z-index:99999;transition:transform 0.2s;}\n" +
      "#cami-widget-bubble:hover{transform:scale(1.08);}\n" +
      "#cami-widget-bubble svg{width:28px;height:28px;fill:#fff;}\n" +
      "#cami-widget-panel{position:fixed;bottom:100px;" + POSITION + ":24px;width:380px;max-width:calc(100vw - 48px);height:520px;max-height:calc(100vh - 140px);border-radius:16px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,0.18);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}\n" +
      "#cami-widget-panel.open{display:flex;}\n" +
      "#cami-w-header{background:" + BRAND_COLOR + ";color:#fff;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;}\n" +
      "#cami-w-header h3{margin:0;font-size:15px;font-weight:600;}\n" +
      "#cami-w-header button{background:none;border:none;color:#fff;cursor:pointer;font-size:20px;padding:0 4px;opacity:0.8;}\n" +
      "#cami-w-header button:hover{opacity:1;}\n" +
      "#cami-w-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}\n" +
      ".cami-w-msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.45;word-wrap:break-word;}\n" +
      ".cami-w-msg.user{align-self:flex-end;background:" + BRAND_COLOR + ";color:#fff;border-bottom-right-radius:4px;}\n" +
      ".cami-w-msg.assistant{align-self:flex-start;background:#f1f0f5;color:#2d3436;border-bottom-left-radius:4px;}\n" +
      ".cami-w-msg.typing{color:#999;font-style:italic;}\n" +
      "#cami-w-input-row{display:flex;padding:12px;border-top:1px solid #eee;gap:8px;}\n" +
      "#cami-w-input{flex:1;border:1px solid #ddd;border-radius:24px;padding:10px 16px;font-size:14px;outline:none;font-family:inherit;}\n" +
      "#cami-w-input:focus{border-color:" + BRAND_COLOR + ";}\n" +
      "#cami-w-send{background:" + BRAND_COLOR + ";border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;}\n" +
      "#cami-w-send:hover{opacity:0.9;}\n" +
      "#cami-w-send svg{width:18px;height:18px;fill:#fff;}\n" +
      "#cami-w-powered{text-align:center;padding:6px;font-size:11px;color:#aaa;}\n" +
      "#cami-w-powered a{color:#888;text-decoration:none;}\n" +
      "#cami-w-powered a:hover{text-decoration:underline;}\n" +
      ".cami-w-feedback{display:flex;gap:4px;margin-top:6px;}\n" +
      ".cami-w-fb-btn{background:none;border:1px solid #ddd;border-radius:6px;padding:2px 8px;font-size:13px;cursor:pointer;color:#999;transition:all 0.15s;line-height:1;}\n" +
      ".cami-w-fb-btn:hover{border-color:" + BRAND_COLOR + ";color:" + BRAND_COLOR + ";}\n" +
      ".cami-w-fb-btn.selected{border-color:" + BRAND_COLOR + ";color:" + BRAND_COLOR + ";font-weight:600;}\n" +
      ".cami-w-fb-btn.selected.pos{border-color:#27ae60;color:#27ae60;}\n" +
      ".cami-w-fb-btn.selected.neg{border-color:#c0392b;color:#c0392b;}\n" +
      "@media(max-width:480px){#cami-widget-panel{width:calc(100vw - 16px);" + POSITION + ":8px;bottom:90px;height:calc(100vh - 110px);border-radius:12px;}#cami-widget-bubble{bottom:16px;" + POSITION + ":16px;width:54px;height:54px;}}\n";

    var style = document.createElement("style");
    style.id = "cami-widget-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── DOM ──
  function buildWidget() {
    // Bubble
    var bubble = document.createElement("div");
    bubble.id = "cami-widget-bubble";
    bubble.setAttribute("aria-label", "Open chat");
    bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';
    bubble.onclick = togglePanel;
    document.body.appendChild(bubble);

    // Panel
    var panel = document.createElement("div");
    panel.id = "cami-widget-panel";
    panel.innerHTML =
      '<div id="cami-w-header"><h3>' + escapeHtml(TITLE || "Customer Support") + '</h3><button onclick="document.getElementById(\'cami-widget-panel\').classList.remove(\'open\');document.getElementById(\'cami-widget-bubble\').style.display=\'flex\';" aria-label="Close">&times;</button></div>' +
      '<div id="cami-w-messages"></div>' +
      '<div id="cami-w-input-row"><input id="cami-w-input" placeholder="Type a message..." autocomplete="off" /><button id="cami-w-send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div>' +
      (HIDE_BRANDING ? '' : '<div id="cami-w-powered">Powered by <a href="https://usecami.com" target="_blank" rel="noopener">Cami</a></div>');
    document.body.appendChild(panel);

    // Input events
    var input = document.getElementById("cami-w-input");
    var sendBtn = document.getElementById("cami-w-send");
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    sendBtn.addEventListener("click", sendMessage);
  }

  function togglePanel() {
    var panel = document.getElementById("cami-widget-panel");
    var bubble = document.getElementById("cami-widget-bubble");
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add("open");
      bubble.style.display = "none";
      if (!configLoaded) {
        loadConfig();
      }
      if (messages.length === 0 && WELCOME) {
        addMessage("assistant", WELCOME);
      }
      var input = document.getElementById("cami-w-input");
      if (input) setTimeout(function () { input.focus(); }, 100);
    } else {
      panel.classList.remove("open");
      bubble.style.display = "flex";
    }
  }

  // ── Config ──
  function loadConfig() {
    configLoaded = true;
    if (!API_KEY) return;
    var keyPrefix = API_KEY.slice(0, 12);
    fetch(API_BASE + "/api/v1/widget-config?key=" + encodeURIComponent(keyPrefix))
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        if (cfg.title && !scriptTag.getAttribute("data-title")) {
          TITLE = cfg.title;
          var h3 = document.querySelector("#cami-w-header h3");
          if (h3) h3.textContent = cfg.title;
        }
        if (cfg.welcome && !WELCOME && messages.length === 0) {
          WELCOME = cfg.welcome;
          addMessage("assistant", WELCOME);
        }
        if (cfg.color && !scriptTag.getAttribute("data-color")) {
          BRAND_COLOR = cfg.color;
          // Re-inject styles would be heavy — skip for runtime config
        }
        // Server-side hide_branding flag (enterprise white-label)
        if (cfg.hide_branding && !scriptTag.getAttribute("data-hide-branding")) {
          var powered = document.getElementById("cami-w-powered");
          if (powered) powered.style.display = "none";
        }
      })
      .catch(function () { /* config fetch optional */ });
  }

  // ── Messages ──
  var msgIndex = 0;
  function addMessage(role, text) {
    messages.push({ role: role, content: text });
    var container = document.getElementById("cami-w-messages");
    if (!container) return;
    var div = document.createElement("div");
    div.className = "cami-w-msg " + role;
    div.textContent = text;
    // Add feedback buttons for assistant messages (not typing, not welcome-only)
    if (role === "assistant" && messages.length > 1) {
      var idx = msgIndex++;
      var fbRow = document.createElement("div");
      fbRow.className = "cami-w-feedback";
      var thumbUp = document.createElement("button");
      thumbUp.className = "cami-w-fb-btn";
      thumbUp.textContent = "\uD83D\uDC4D";
      thumbUp.title = "Helpful";
      var thumbDown = document.createElement("button");
      thumbDown.className = "cami-w-fb-btn";
      thumbDown.textContent = "\uD83D\uDC4E";
      thumbDown.title = "Not helpful";
      function handleFeedback(rating, btn, other) {
        btn.classList.add("selected", rating === "positive" ? "pos" : "neg");
        other.classList.remove("selected", "pos", "neg");
        other.disabled = true;
        btn.disabled = true;
        submitFeedback(sessionId, idx, rating);
      }
      thumbUp.onclick = function() { handleFeedback("positive", thumbUp, thumbDown); };
      thumbDown.onclick = function() { handleFeedback("negative", thumbDown, thumbUp); };
      fbRow.appendChild(thumbUp);
      fbRow.appendChild(thumbDown);
      div.appendChild(fbRow);
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function submitFeedback(sid, mi, rating) {
    // Extract business_id from the API key prefix or a data attribute
    var bizId = scriptTag.getAttribute("data-business-id") || "";
    if (!bizId) return; // no business context = skip
    try {
      fetch(API_BASE + "/customer-service/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + API_KEY },
        body: JSON.stringify({
          business_id: bizId,
          session_id: sid,
          message_index: mi,
          rating: rating,
        }),
      });
    } catch (_) {}
  }

  function addTyping() {
    var container = document.getElementById("cami-w-messages");
    if (!container) return null;
    var div = document.createElement("div");
    div.className = "cami-w-msg assistant typing";
    div.id = "cami-w-typing";
    div.textContent = "Thinking...";
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function removeTyping() {
    var el = document.getElementById("cami-w-typing");
    if (el) el.remove();
  }

  // ── Send ──
  function sendMessage() {
    var input = document.getElementById("cami-w-input");
    var text = (input.value || "").trim();
    if (!text) return;
    input.value = "";
    addMessage("user", text);

    var typingEl = addTyping();

    var history = messages.slice(-10).map(function (m) {
      return { role: m.role, content: m.content };
    });

    fetch(API_BASE + "/api/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY,
      },
      body: JSON.stringify({
        message: text,
        conversation_history: history,
        session_id: sessionId,
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        removeTyping();
        addMessage("assistant", data.response || "I'm sorry, I couldn't process that. Please try again.");
      })
      .catch(function (err) {
        removeTyping();
        addMessage("assistant", "Sorry, something went wrong. Please try again.");
        console.error("[Cami Widget]", err);
      });
  }

  // ── Util ──
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Init ──
  function init() {
    if (document.getElementById("cami-widget-bubble")) return; // already initialized
    injectStyles();
    buildWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
