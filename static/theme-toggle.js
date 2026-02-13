/* Cami — site-wide dark / light mode toggle
   Reads localStorage('cami-theme'). Falls back to 'light'.
   Places toggle next to hamburger on nav pages, or floating on chat pages. */

(function () {
  'use strict';

  function applyTheme(t) {
    if (t === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function makeButton(className) {
    var btn = document.createElement('button');
    btn.className = className;
    btn.setAttribute('aria-label', 'Toggle dark / light mode');
    btn.innerHTML =
      '<span class="icon-moon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>' +
      '<span class="icon-sun" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></span>';
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('cami-theme', next); } catch (_) {}
    });
    return btn;
  }

  function init() {
    var hamburger = document.getElementById('nav-hamburger');
    /* Page already has its own toggle (e.g. try.html) — skip */
    if (document.querySelector('.try-nav-toggle')) return;

    /* Wire up existing header toggle button (chat/app pages) */
    var headerToggle = document.getElementById('themeToggleHeader');
    if (headerToggle) {
      headerToggle.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('cami-theme', next); } catch (_) {}
      });
    }

    if (hamburger && hamburger.parentNode) {
      /* Check if toggle already exists (some pages define it in HTML) */
      var existingToggle = document.getElementById('theme-toggle-nav') || 
                           hamburger.parentNode.querySelector('.theme-toggle-nav');
      if (existingToggle) {
        /* Wire up existing toggle */
        existingToggle.addEventListener('click', function () {
          var next = currentTheme() === 'dark' ? 'light' : 'dark';
          applyTheme(next);
          try { localStorage.setItem('cami-theme', next); } catch (_) {}
        });
      } else {
        /* Regular pages: place toggle next to hamburger in a flex group */
        var wrapper = document.createElement('div');
        wrapper.className = 'nav-right-group';
        hamburger.parentNode.insertBefore(wrapper, hamburger);
        wrapper.appendChild(makeButton('theme-toggle-nav'));
        wrapper.appendChild(hamburger);
      }
    }

    /* Chat / app pages: floating button for desktop (hidden on mobile via CSS) */
    if (!hamburger) {
      document.body.appendChild(makeButton('theme-toggle'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Railway warmup ────────────────────────────────────────────────────
     Fire a lightweight GET to the analyze endpoint as soon as ANY page
     loads. This wakes Railway from cold-start so that the first real
     chat message doesn't wait ~30-50 s for the container to boot.
     The request is fire-and-forget (no error handling needed). */
  try {
    fetch('/customer-service/analyze', { method: 'GET', mode: 'cors', cache: 'no-store' }).catch(function () {});
  } catch (_) {}
})();
