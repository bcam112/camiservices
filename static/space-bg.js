/**
 * Live space background — subtle starfield. Non-interactive, no user input.
 * Call once on load: window.initSpaceBg() or initSpaceBg(containerId).
 */
(function () {
    'use strict';

    var STAR_COUNT = 72;
    var TWINKLE_SPEED = 0.0008;
    var BASE_OPACITY = 0.25;
    var OPACITY_RANGE = 0.25;
    /* Light earth-tone space: subtle warm stars */
    var STAR_OPACITY_MIN = 0.12;
    var STAR_OPACITY_MAX = 0.4;

    function rand(lo, hi) {
        return lo + Math.random() * (hi - lo);
    }

    function initSpaceBg(containerId) {
        var container = document.getElementById(containerId || 'space-bg-stars');
        if (!container) return;

        var canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);

        var ctx = canvas.getContext('2d');
        var stars = [];
        var width = 0;
        var height = 0;

        function resize() {
            var w = container.offsetWidth || window.innerWidth;
            var h = container.offsetHeight || window.innerHeight;
            if (w === width && h === height) return;
            width = w;
            height = h;
            canvas.width = width;
            canvas.height = height;
            if (stars.length === 0) {
                for (var i = 0; i < STAR_COUNT; i++) {
                    stars.push({
                        x: rand(0, width),
                        y: rand(0, height),
                        phase: rand(0, Math.PI * 2),
                        size: rand(0.8, 2),
                        speed: rand(0.6, 1.4)
                    });
                }
            }
            draw();
        }

        function draw() {
            if (!width || !height) return;
            var t = Date.now();
            ctx.fillStyle = 'transparent';
            ctx.clearRect(0, 0, width, height);

            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var opacity = BASE_OPACITY + OPACITY_RANGE * 0.5 * (1 + Math.sin(t * TWINKLE_SPEED * s.speed + s.phase));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                var rgb = isDark ? '180, 200, 190' : '90, 80, 70';
                ctx.fillStyle = 'rgba(' + rgb + ', ' + Math.max(0.08, Math.min(0.45, opacity)) + ')';
                ctx.fill();
            }
        }

        function tick() {
            draw();
            requestAnimationFrame(tick);
        }

        resize();
        window.addEventListener('resize', resize);
        requestAnimationFrame(tick);
    }

    window.initSpaceBg = initSpaceBg;
})();
