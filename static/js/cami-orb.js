/**
 * Cami Service Orb - Playful 3D mascot for service pages
 * A lighter-weight, themed version of the main synthesis scene.
 * Face only (no crown) - always facing forward.
 * 
 * Usage: CamiOrb.init('container-id', { theme: 'support' | 'health' | 'legal' })
 */

(function() {
    'use strict';

    const THEMES = {
        support: {
            name: 'Support',
            primaryColor: 0x4a90d9,    // Friendly blue
            secondaryColor: 0x7bb3e8,
            glowColor: 0x4a90d9,
            pulseSpeed: 1.2,           // Bouncy
            bobAmount: 0.15,
            bobSpeed: 2.0,
            particleCount: 60,
            expression: 'happy'        // ^_^ helpful
        },
        health: {
            name: 'Health',
            primaryColor: 0x5aa08a,    // Calming teal-green
            secondaryColor: 0x8ac4b0,
            glowColor: 0x5aa08a,
            pulseSpeed: 0.6,           // Calm breathing
            bobAmount: 0.08,
            bobSpeed: 0.8,
            particleCount: 40,
            expression: 'calm'         // gentle caring
        },
        legal: {
            name: 'Legal',
            primaryColor: 0x6b5b8a,    // Authoritative purple
            secondaryColor: 0x9585ab,
            glowColor: 0x6b5b8a,
            pulseSpeed: 0.4,           // Steady
            bobAmount: 0.05,
            bobSpeed: 0.6,
            particleCount: 50,
            expression: 'focused'      // determined professional
        }
    };

    let scene, camera, renderer;
    let orb, orbGlow, particles = [];
    let faceSprite = null;
    let faceState = null;
    let animationId = null;
    let currentTheme = null;
    let startTime = 0;
    let isDarkMode = false;

    function init(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Cami orb container not found:', containerId);
            return false;
        }

        if (!window.THREE) {
            console.warn('Three.js not loaded, showing fallback');
            showFallback(container, options.theme);
            return false;
        }

        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                showFallback(container, options.theme);
                return false;
            }
        } catch (e) {
            showFallback(container, options.theme);
            return false;
        }

        currentTheme = THEMES[options.theme] || THEMES.support;
        isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        startTime = Date.now();

        // Create scene
        scene = new THREE.Scene();

        // Camera
        const w = container.clientWidth || 300;
        const h = container.clientHeight || 300;
        camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: 'low-power'
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);
        
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(2, 3, 4);
        scene.add(directional);

        // Create orb
        createOrb();
        createParticles();
        createFace();

        // Handle resize
        window.addEventListener('resize', () => {
            const newW = container.clientWidth;
            const newH = container.clientHeight;
            if (newW > 0 && newH > 0) {
                camera.aspect = newW / newH;
                camera.updateProjectionMatrix();
                renderer.setSize(newW, newH);
            }
        });

        // Start animation
        animate();
        return true;
    }

    function createOrb() {
        // Main orb - glossy sphere
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: currentTheme.primaryColor,
            emissive: currentTheme.primaryColor,
            emissiveIntensity: 0.15,
            shininess: 100,
            transparent: true,
            opacity: 0.95
        });
        orb = new THREE.Mesh(geometry, material);
        scene.add(orb);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(1.15, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: currentTheme.glowColor,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        orbGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(orbGlow);

        // Inner glow ring
        const ringGeometry = new THREE.TorusGeometry(1.1, 0.02, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: currentTheme.secondaryColor,
            transparent: true,
            opacity: 0.4
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        orb.add(ring);
    }

    function createParticles() {
        const particleGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        for (let i = 0; i < currentTheme.particleCount; i++) {
            // Orbit around the orb
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.5 + Math.random() * 1;
            const height = (Math.random() - 0.5) * 2;
            
            positions.push(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );

            // Theme color particles
            const color = new THREE.Color(currentTheme.secondaryColor);
            colors.push(color.r, color.g, color.b);
        }

        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        particles.push(particleSystem);
        scene.add(particleSystem);
    }

    function createFace() {
        // Create canvas for face texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        faceState = { canvas, ctx, texture: null };
        drawFace(ctx, canvas, 0);
        
        faceState.texture = new THREE.CanvasTexture(canvas);
        faceState.texture.needsUpdate = true;
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: faceState.texture, 
            transparent: true,
            depthTest: false
        });
        
        faceSprite = new THREE.Sprite(spriteMaterial);
        faceSprite.scale.set(1.8, 1.8, 1);
        faceSprite.position.z = 1.02;
        orb.add(faceSprite);
    }
    
    function drawFace(ctx, canvas, time) {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, w, h);
        
        // Vegas Sphere style: bold black, super clean
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Subtle blink animation
        const blinkCycle = (time * 2.5) % 6;
        const isBlinking = blinkCycle > 5.7;
        
        // Face positioning
        const eyeY = cy - 18;
        const eyeGap = 32;
        const mouthY = cy + 28;
        
        // Draw expression based on theme
        if (currentTheme.expression === 'happy') {
            // Happy helpful face - ^_^ style
            if (isBlinking) {
                ctx.fillRect(cx - eyeGap - 10, eyeY, 20, 4);
                ctx.fillRect(cx + eyeGap - 10, eyeY, 20, 4);
            } else {
                // Cute arc eyes ^_^
                ctx.beginPath();
                ctx.arc(cx - eyeGap, eyeY, 12, Math.PI * 1.1, Math.PI * 1.9);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + eyeGap, eyeY, 12, Math.PI * 1.1, Math.PI * 1.9);
                ctx.stroke();
            }
            
            // Big friendly smile
            ctx.beginPath();
            ctx.arc(cx, mouthY, 22, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
            
        } else if (currentTheme.expression === 'calm') {
            // Calm caring face - gentle closed eyes
            if (isBlinking) {
                ctx.fillRect(cx - eyeGap - 10, eyeY, 20, 4);
                ctx.fillRect(cx + eyeGap - 10, eyeY, 20, 4);
            } else {
                // Peaceful closed eyes - -
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(cx - eyeGap - 12, eyeY);
                ctx.lineTo(cx - eyeGap + 12, eyeY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeGap - 12, eyeY);
                ctx.lineTo(cx + eyeGap + 12, eyeY);
                ctx.stroke();
                ctx.lineWidth = 8;
            }
            
            // Gentle smile
            ctx.beginPath();
            ctx.arc(cx, mouthY + 5, 16, 0.2 * Math.PI, 0.8 * Math.PI);
            ctx.stroke();
            
        } else {
            // Focused professional face - determined look
            if (isBlinking) {
                ctx.fillRect(cx - eyeGap - 10, eyeY, 20, 4);
                ctx.fillRect(cx + eyeGap - 10, eyeY, 20, 4);
            } else {
                // Focused round eyes
                ctx.beginPath();
                ctx.arc(cx - eyeGap, eyeY, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + eyeGap, eyeY, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Slight eyebrow raise for determination
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(cx - eyeGap - 14, eyeY - 22);
                ctx.lineTo(cx - eyeGap + 14, eyeY - 18);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeGap - 14, eyeY - 18);
                ctx.lineTo(cx + eyeGap + 14, eyeY - 22);
                ctx.stroke();
                ctx.lineWidth = 8;
            }
            
            // Confident straight mouth
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(cx - 18, mouthY);
            ctx.lineTo(cx + 18, mouthY);
            ctx.stroke();
        }
    }

    function showFallback(container, theme) {
        const t = THEMES[theme] || THEMES.support;
        const color = '#' + t.primaryColor.toString(16).padStart(6, '0');
        // Simple CSS fallback with face
        let faceEmoji = '^_^';
        if (t.expression === 'calm') faceEmoji = '-‿-';
        if (t.expression === 'focused') faceEmoji = '•_•';
        
        container.innerHTML = `
            <div style="
                width: 100%; height: 100%;
                display: flex; align-items: center; justify-content: center;
                flex-direction: column;
            ">
                <div style="
                    width: 120px; height: 120px;
                    background: ${color};
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 28px;
                    font-family: monospace;
                    box-shadow: 0 0 40px ${color}40;
                    animation: pulse 2s ease-in-out infinite;
                    color: #000;
                ">
                    ${faceEmoji}
                </div>
                <style>
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                </style>
            </div>
        `;
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        
        const elapsed = (Date.now() - startTime) / 1000;
        
        // Bob up and down
        const bobY = Math.sin(elapsed * currentTheme.bobSpeed) * currentTheme.bobAmount;
        orb.position.y = bobY;
        orbGlow.position.y = bobY;
        
        // No rotation - face always forward
        
        // Pulse glow
        const pulse = 0.12 + Math.sin(elapsed * currentTheme.pulseSpeed) * 0.05;
        orbGlow.material.opacity = pulse;
        
        // Rotate particles only
        particles.forEach((p, i) => {
            p.rotation.y = elapsed * 0.2 * (i + 1);
        });
        
        // Update face animation (for blinking)
        if (faceState && faceState.texture) {
            drawFace(faceState.ctx, faceState.canvas, elapsed);
            faceState.texture.needsUpdate = true;
        }
        
        renderer.render(scene, camera);
    }

    function destroy() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (renderer) {
            renderer.dispose();
        }
    }

    // Expose API
    window.CamiOrb = {
        init: init,
        destroy: destroy,
        THEMES: THEMES
    };
})();
