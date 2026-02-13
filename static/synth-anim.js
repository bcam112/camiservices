/**
 * Cami Synthesis Animations — SITE-WIDE
 * Ambient energy particles, card entrance effects, section fade-ups,
 * and energy lines canvas. Works on every page automatically.
 * Lightweight, non-blocking. Respects prefers-reduced-motion.
 */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* ── Utility: all card-like elements ── */
    var CARD_SELECTOR = [
        '.feature-card', '.agent-card', '.cs-diff-card', '.cs-tier',
        '.clinical-tier', '.stat-card', '.dash-card', '.card',
        '.chart-card', '.auth-card', '.task-card', '.provider-card',
        '.trial-wall-card', '.min-cap-card', '.min-stat-card',
        '.min-step', '.roadmap-phase',
        '[class*="-card"]', '[class*="_card"]'
    ].join(', ');

    /* ── Utility: all section-like containers ── */
    var SECTION_SELECTOR = [
        'section', '.hero', '.features', '.agent-grid', '.cs-diff',
        '.cs-tiers', '.clinical-tiers', '.circular-layout',
        '.min-pitch', '.min-how', '.min-caps', '.min-live',
        '.min-arch', '.roadmap-content', '.dash-container',
        '[class*="section"]', '[class*="grid"]', '[class*="tiers"]'
    ].join(', ');

    /* ── Floating particles around sections that contain cards ── */
    function spawnParticles(container, count) {
        if (!container || container.querySelector('.synth-particles')) return;
        var wrap = document.createElement('div');
        wrap.className = 'synth-particles';
        for (var i = 0; i < count; i++) {
            var p = document.createElement('div');
            p.className = 'synth-particle';
            var left = Math.random() * 100;
            var top = Math.random() * 100;
            var duration = 5 + Math.random() * 8;
            var delay = Math.random() * duration;
            var size = 2 + Math.random() * 3;
            p.style.left = left + '%';
            p.style.top = top + '%';
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.setProperty('--duration', duration + 's');
            p.style.setProperty('--delay', '-' + delay + 's');
            wrap.appendChild(p);
        }
        container.style.position = container.style.position || 'relative';
        container.appendChild(wrap);
    }

    /* ── Card entrance observer — flash of light when cards scroll in ── */
    function observeCardEntrance() {
        var cards = document.querySelectorAll(CARD_SELECTOR);
        if (!cards.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('synth-visible');
                    entry.target.style.animation = 'card-entrance-flash 0.8s ease-out';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(function (card) { observer.observe(card); });
    }

    /* ── Section fade-up observer — sections slide up as they enter ── */
    function observeSectionEntrance() {
        var sections = document.querySelectorAll(SECTION_SELECTOR);
        if (!sections.length) return;

        // Add the fade-up class to sections that are below the fold
        sections.forEach(function (section) {
            var rect = section.getBoundingClientRect();
            if (rect.top > window.innerHeight * 0.85) {
                section.classList.add('synth-fade-up');
            }
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('synth-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });

        document.querySelectorAll('.synth-fade-up').forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ── Auto-apply glow text to main headings ── */
    function applyGlowText() {
        var headings = document.querySelectorAll(
            '.hero h1, .hero h2, .tagline, ' +
            '.dash-hero h1, .admin-nav .nav-title, ' +
            '[class*="hero"] h1, [class*="hero"] h2'
        );
        headings.forEach(function (h) {
            if (!h.classList.contains('synth-glow-text') && !h.classList.contains('tagline')) {
                h.classList.add('synth-glow-text');
            }
        });
    }

    /* ── Auto-spawn particles on sections with cards ── */
    function autoParticles() {
        // Explicitly listed sections + any section containing cards
        var explicit = [
            '.circular-layout', '.agent-grid', '.cs-diff', '.cs-tiers',
            '.clinical-tiers', '.features', '.min-caps', '.min-live',
            '.roadmap-content'
        ];

        var particleSections = new Set();

        explicit.forEach(function (sel) {
            var el = document.querySelector(sel);
            if (el) particleSections.add(el);
        });

        // Find any section that contains 3+ cards (likely a grid)
        var sections = document.querySelectorAll('section, [class*="grid"], [class*="tiers"], [class*="features"]');
        sections.forEach(function (sec) {
            var cardCount = sec.querySelectorAll(CARD_SELECTOR).length;
            if (cardCount >= 3) particleSections.add(sec);
        });

        particleSections.forEach(function (el) {
            spawnParticles(el, 12);
        });

        // Also add particles to hero sections for ambient energy
        var heroes = document.querySelectorAll('.hero, [class*="hero"]');
        heroes.forEach(function (h) { spawnParticles(h, 8); });
    }

    /* ── Energy lines canvas between cards (homepage circular layout) ── */
    function initEnergyLines() {
        var circular = document.querySelector('.circular-layout');
        if (!circular) return;

        var canvas = document.createElement('canvas');
        canvas.className = 'synth-energy-canvas';
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
        canvas.setAttribute('aria-hidden', 'true');
        circular.style.position = circular.style.position || 'relative';
        circular.insertBefore(canvas, circular.firstChild);

        var ctx = canvas.getContext('2d');
        var w = 0, h = 0;
        var particles = [];
        var PARTICLE_COUNT = 18;

        function resize() {
            w = circular.offsetWidth;
            h = circular.offsetHeight;
            canvas.width = w;
            canvas.height = h;
            if (particles.length === 0) seedParticles();
        }

        function seedParticles() {
            var cx = w / 2, cy = h / 2;
            var radius = Math.min(w, h) * 0.35;
            for (var i = 0; i < PARTICLE_COUNT; i++) {
                var angle = Math.random() * Math.PI * 2;
                var r = radius * (0.6 + Math.random() * 0.4);
                particles.push({
                    x: cx + Math.cos(angle) * r,
                    y: cy + Math.sin(angle) * r,
                    angle: angle,
                    speed: 0.002 + Math.random() * 0.004,
                    radius: r,
                    cx: cx,
                    cy: cy,
                    size: 1.5 + Math.random() * 2,
                    opacity: 0.15 + Math.random() * 0.25,
                    phase: Math.random() * Math.PI * 2,
                });
            }
        }

        function draw() {
            if (!w || !h) return;
            ctx.clearRect(0, 0, w, h);
            var t = Date.now() * 0.001;
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.angle += p.speed;
                var wobble = Math.sin(t * 0.5 + p.phase) * 12;
                p.x = p.cx + Math.cos(p.angle) * (p.radius + wobble);
                p.y = p.cy + Math.sin(p.angle) * (p.radius + wobble);
                var flicker = 0.5 + 0.5 * Math.sin(t * 1.5 + p.phase);
                var alpha = p.opacity * flicker;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                var rgb = isDark ? '110, 180, 140' : '90, 125, 100';
                ctx.fillStyle = 'rgba(' + rgb + ', ' + alpha + ')';
                ctx.fill();

                if (alpha > 0.15) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.cx, p.cy);
                    ctx.strokeStyle = 'rgba(' + rgb + ', ' + (alpha * 0.1) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        function tick() { draw(); requestAnimationFrame(tick); }
        resize();
        window.addEventListener('resize', resize);
        requestAnimationFrame(tick);
    }

    /* ── Boot — runs on every page ── */
    function init() {
        applyGlowText();
        autoParticles();
        observeCardEntrance();
        observeSectionEntrance();
        initEnergyLines();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
