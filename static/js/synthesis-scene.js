/**
 * Cami EQLM Scene - Three.js 3D Visualization
 * Shows how Cami (an EQ Language Model) processes queries.
 * 
 * EQLM = Human+(live EQ) + MIN(live wisdom, growing) + Language
 * External LLMs are research tools, not primary intelligence.
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════
    
    const CONFIG = {
        // Stage timing (ms)
        stageDuration: 4000,
        transitionDuration: 800,
        
        // Colors (will be updated from CSS variables)
        colors: {
            accent: 0x5a7d64,
            accentLight: 0x7a9d84,
            core: 0x5a7d64,
            humanPlus: 0x5a7d64,
            min: 0x8ab89a,
            llmNodes: [0x4a90a4, 0xc9785d, 0x7b68a6, 0x5a8f7b], // GPT-4, Claude, Gemini, Grok
            bgLight: 0xf5f1eb,
            bgDark: 0x0f1117,
            textLight: 0x2c2620,
            textDark: 0xe4e4e8
        },
        
        // Scene dimensions
        coreRadius: 1.2,
        nodeRadius: 0.5,
        orbitRadius: 4,
        humanPlusRadius: 2.2,
        
        // Particle settings
        particleCount: 200,
        streamParticles: 50,
        
        // Camera
        cameraDistance: 10,
        autoRotateSpeed: 0.3
    };

    // ═══════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════
    
    let scene, camera, renderer, controls;
    let camiCore, humanPlusRing, llmNodes = [], particles = [];
    let streamParticles = { gpt4: [], claude: [], gemini: [], grok: [] };
    let minParticles = [];
    let queryOrb = null;
    let conflictParticles = [];
    
    let currentStage = 0;
    let isPlaying = true;
    let isPaused = false;
    let animationId = null;
    let stageStartTime = 0;
    let isDarkMode = false;
    let faceSpriteRefs = []; // { sprite, node } so we can position faces toward camera
    let camiFaceState = null;
    let camiFaceSprite = null;
    let _facePos = null;
    let _faceDir = null;
    
    const STAGES = [
        { id: 'query', title: 'Your Question', desc: 'A query enters Cami — the EQLM' },
        { id: 'humanplus', title: 'Human+ LIVE', desc: 'Emotional intelligence runs now — resonance, empathy, coherence' },
        { id: 'min', title: 'M.I.N. LIVE', desc: 'Wisdom retrieval + neural intuition. MIN grows with every query.' },
        { id: 'confidence', title: 'Confidence Check', desc: 'Can Cami answer from its own knowledge?' },
        { id: 'research', title: 'External Research', desc: 'If needed, Cami calls LLMs as research tools' },
        { id: 'synthesis', title: 'Cami Speaks', desc: 'EQ + wisdom + language. One unified EQLM response.' }
    ];

    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    function init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Synthesis scene container not found:', containerId);
            return false;
        }

        // Check for WebGL support
        if (!window.THREE) {
            console.error('Three.js not loaded');
            showFallback(container);
            return false;
        }

        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                showFallback(container);
                return false;
            }
        } catch (e) {
            showFallback(container);
            return false;
        }

        // Check reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            CONFIG.autoRotateSpeed = 0;
            CONFIG.stageDuration = 6000;
        }

        // Detect theme
        isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        updateColorsFromTheme();

        // Initialize helper vectors now that THREE is available
        _facePos = new THREE.Vector3();
        _faceDir = new THREE.Vector3();

        // Create scene
        scene = new THREE.Scene();
        updateSceneBackground();

        // Camera (guard against zero-size container)
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        const aspect = Math.max(0.1, Math.min(10, w / h));
        const isMobile = w < 768;
        const camDistance = isMobile ? CONFIG.cameraDistance * 1.3 : CONFIG.cameraDistance;
        const camY = isMobile ? 4 : 3;
        camera = new THREE.PerspectiveCamera(isMobile ? 65 : 60, aspect, 0.1, 1000);
        camera.position.set(0, camY, camDistance);
        camera.lookAt(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Controls
        if (THREE.OrbitControls) {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = false;
            controls.enablePan = false;
            controls.autoRotate = true;
            controls.autoRotateSpeed = CONFIG.autoRotateSpeed;
            controls.minPolarAngle = Math.PI / 4;
            controls.maxPolarAngle = Math.PI / 1.5;
        }

        // Lighting
        setupLighting();

        try {
            // Create objects (Cami face after LLM nodes so face helpers exist)
            createCamiCore();
            createLLMNodes();
            createCamiFace();
            createHumanPlusRing();
            createMINParticles();
            createQueryOrb();
            createConflictParticles();
        } catch (err) {
            console.error('Synthesis scene setup failed:', err);
            showFallback(container);
            return false;
        }

        // Event listeners
        window.addEventListener('resize', onWindowResize);
        
        // Theme change observer
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
                    updateColorsFromTheme();
                    updateSceneBackground();
                    updateMaterialColors();
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });

        // Start animation
        stageStartTime = Date.now();
        animate();
        
        return true;
    }

    function showFallback(container) {
        container.innerHTML = `
            <div class="synthesis-fallback">
                <div class="synthesis-fallback-diagram">
                    <div class="fallback-node fallback-query">Query</div>
                    <div class="fallback-arrow">→</div>
                    <div class="fallback-node fallback-cami" style="font-size: 1.2em;">Cami (EQLM)</div>
                    <div class="fallback-eqlm-components">
                        <span class="fallback-node fallback-humanplus">Human+ LIVE</span>
                        <span class="fallback-node fallback-min">M.I.N. LIVE</span>
                    </div>
                    <div class="fallback-arrow">↓</div>
                    <div class="fallback-confidence">Confident?</div>
                    <div class="fallback-branch">
                        <span>Yes → Answer</span>
                        <span>No → Research (LLMs)</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════════════
    // SCENE OBJECTS
    // ═══════════════════════════════════════════════════════════════════
    
    function setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 7);
        scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, -5, -5);
        scene.add(fillLight);

        // Point light at center for glow effect
        const centerLight = new THREE.PointLight(CONFIG.colors.accent, 1, 10);
        centerLight.position.set(0, 0, 0);
        scene.add(centerLight);
    }

    function createCamiCore() {
        // Main sphere
        const geometry = new THREE.SphereGeometry(CONFIG.coreRadius, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: CONFIG.colors.core,
            emissive: CONFIG.colors.core,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9,
            shininess: 100
        });
        camiCore = new THREE.Mesh(geometry, material);
        camiCore.userData = { baseEmissive: 0.3 };
        scene.add(camiCore);

        // Inner glow sphere
        const glowGeometry = new THREE.SphereGeometry(CONFIG.coreRadius * 1.15, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.colors.accent,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        camiCore.add(glowMesh);
    }

    function createCamiFace() {
        if (!camiCore || !scene) return;
        // Cami gets a taller canvas to fit crown above face
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 360;  // Taller for crown
        const ctx = canvas.getContext('2d');
        camiFaceState = { canvas, ctx, texture: null, color: CONFIG.colors.core };
        drawFace(camiFaceState.ctx, camiFaceState.canvas, 0, 4, CONFIG.colors.core);
        camiFaceState.texture = new THREE.CanvasTexture(camiFaceState.canvas);
        camiFaceState.texture.needsUpdate = true;
        const camiFaceMat = new THREE.SpriteMaterial({
            map: camiFaceState.texture,
            transparent: true,
            depthTest: false
        });
        camiFaceSprite = new THREE.Sprite(camiFaceMat);
        // Scale taller to match the canvas aspect ratio
        camiFaceSprite.scale.set(CONFIG.coreRadius * 1.9, CONFIG.coreRadius * 2.7, 1);
        camiFaceSprite.userData.node = camiCore;
        camiFaceSprite.userData.offset = CONFIG.coreRadius * 0.6;
        scene.add(camiFaceSprite);
    }

    // Face animation state for each node
    const faceStates = [];
    
    function createFaceTexture(color, faceIndex) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        return { canvas, ctx, texture: null, color };
    }
    
    function drawFace(ctx, canvas, time, faceIndex, colorNum) {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        
        // Transparent background - face will be on a sprite in front of sphere
        ctx.clearRect(0, 0, w, h);
        
        // Vegas Sphere style: bold black, super clean, emoji-like
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Subtle blink animation
        const blinkCycle = (time * 2.5 + faceIndex) % 6;
        const isBlinking = blinkCycle > 5.7;
        
        // Tighter face - features closer together
        const eyeY = cy - 18;
        const eyeGap = 32;  // Closer together
        const mouthY = cy + 28;
        
        if (faceIndex === 0) {
            // GPT-4: Derpy face - eyes looking different directions
            ctx.lineWidth = 8;
            
            if (isBlinking) {
                ctx.beginPath();
                ctx.moveTo(cx - eyeGap - 14, eyeY);
                ctx.lineTo(cx - eyeGap + 14, eyeY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeGap - 14, eyeY);
                ctx.lineTo(cx + eyeGap + 14, eyeY);
                ctx.stroke();
            } else {
                // Left eye looking up-left
                ctx.beginPath();
                ctx.arc(cx - eyeGap, eyeY, 14, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx - eyeGap - 4, eyeY - 4, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Right eye looking down-right
                ctx.beginPath();
                ctx.arc(cx + eyeGap, eyeY + 4, 14, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + eyeGap + 4, eyeY + 8, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Goofy wavy smile
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(cx - 30, mouthY - 5);
            ctx.quadraticCurveTo(cx - 15, mouthY + 15, cx, mouthY);
            ctx.quadraticCurveTo(cx + 15, mouthY - 10, cx + 30, mouthY + 5);
            ctx.stroke();
            
        } else if (faceIndex === 1) {
            // Claude: Silly tongue out :P
            ctx.lineWidth = 8;
            
            if (isBlinking) {
                ctx.beginPath();
                ctx.moveTo(cx - eyeGap - 12, eyeY);
                ctx.lineTo(cx - eyeGap + 12, eyeY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeGap - 12, eyeY);
                ctx.lineTo(cx + eyeGap + 12, eyeY);
                ctx.stroke();
            } else {
                // Playful squinty eyes ^_^
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(cx - eyeGap - 12, eyeY + 5);
                ctx.lineTo(cx - eyeGap, eyeY - 8);
                ctx.lineTo(cx - eyeGap + 12, eyeY + 5);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeGap - 12, eyeY + 5);
                ctx.lineTo(cx + eyeGap, eyeY - 8);
                ctx.lineTo(cx + eyeGap + 12, eyeY + 5);
                ctx.stroke();
            }
            
            // Smile with tongue
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(cx, mouthY - 8, 24, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
            
            // Tongue sticking out
            ctx.fillStyle = '#FF6B9D';
            ctx.beginPath();
            ctx.ellipse(cx + 8, mouthY + 12, 12, 18, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            
        } else if (faceIndex === 2) {
            // Gemini: Surprised/shocked O_O
            ctx.lineWidth = 8;
            
            if (isBlinking) {
                ctx.beginPath();
                ctx.moveTo(cx - eyeGap - 14, eyeY);
                ctx.lineTo(cx - eyeGap + 14, eyeY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeGap - 14, eyeY);
                ctx.lineTo(cx + eyeGap + 14, eyeY);
                ctx.stroke();
            } else {
                // Big surprised eyes O_O
                ctx.beginPath();
                ctx.arc(cx - eyeGap, eyeY, 16, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx - eyeGap, eyeY, 8, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(cx + eyeGap, eyeY, 16, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + eyeGap, eyeY, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Raised eyebrows
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(cx - eyeGap, eyeY - 28, 14, 1.1 * Math.PI, 1.9 * Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + eyeGap, eyeY - 28, 14, 1.1 * Math.PI, 1.9 * Math.PI);
                ctx.stroke();
            }
            
            // Small surprised "o" mouth
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(cx, mouthY, 14, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (faceIndex === 3) {
            // Grok: Mischievous smirk with one raised eyebrow
            ctx.lineWidth = 8;
            
            if (isBlinking) {
                ctx.beginPath();
                ctx.moveTo(cx - eyeGap - 12, eyeY);
                ctx.lineTo(cx - eyeGap + 12, eyeY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeGap - 12, eyeY);
                ctx.lineTo(cx + eyeGap + 12, eyeY);
                ctx.stroke();
            } else {
                // Left eye - normal
                ctx.beginPath();
                ctx.arc(cx - eyeGap, eyeY, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Right eye - sly half-closed
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.arc(cx + eyeGap, eyeY + 2, 14, 0.2 * Math.PI, 0.8 * Math.PI);
                ctx.stroke();
                
                // Raised eyebrow on right
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(cx + eyeGap - 16, eyeY - 18);
                ctx.quadraticCurveTo(cx + eyeGap, eyeY - 28, cx + eyeGap + 16, eyeY - 20);
                ctx.stroke();
            }
            
            // Smirk - asymmetric smile
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(cx - 28, mouthY);
            ctx.quadraticCurveTo(cx, mouthY + 8, cx + 20, mouthY - 12);
            ctx.stroke();
        } else if (faceIndex === 4) {
            // Cami: warm, wise, friendly :) with crown!
            
            // Draw crown on TOP of head
            const crownY = cy - 145;
            const crownW = 55;
            const crownH = 32;
            
            // Gold crown
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#DAA520';
            ctx.lineWidth = 3;
            
            // Crown shape - 3 pointed
            ctx.beginPath();
            ctx.moveTo(cx - crownW, crownY + crownH);
            ctx.lineTo(cx - crownW + 8, crownY + 5);
            ctx.lineTo(cx - crownW/2, crownY + crownH - 8);
            ctx.lineTo(cx, crownY - 5);
            ctx.lineTo(cx + crownW/2, crownY + crownH - 8);
            ctx.lineTo(cx + crownW - 8, crownY + 5);
            ctx.lineTo(cx + crownW, crownY + crownH);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Crown jewels
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.arc(cx, crownY + 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4ECDC4';
            ctx.beginPath();
            ctx.arc(cx - crownW/2 - 2, crownY + 10, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + crownW/2 + 2, crownY + 10, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset to black for face
            ctx.fillStyle = '#000000';
            ctx.strokeStyle = '#000000';
            
            ctx.lineWidth = 10;
            if (isBlinking) {
                ctx.beginPath();
                ctx.moveTo(cx - eyeGap - 14, eyeY);
                ctx.lineTo(cx - eyeGap + 14, eyeY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + eyeGap - 14, eyeY);
                ctx.lineTo(cx + eyeGap + 14, eyeY);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(cx - eyeGap, eyeY + 10, 14, 1.2 * Math.PI, 1.8 * Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx + eyeGap, eyeY + 10, 14, 1.2 * Math.PI, 1.8 * Math.PI);
                ctx.stroke();
            }
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(cx, mouthY - 10, 36, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
        }
    }
    
    function createLLMNodes() {
        const nodeData = [
            { name: 'GPT-4', color: CONFIG.colors.llmNodes[0], angle: 0 },
            { name: 'Claude', color: CONFIG.colors.llmNodes[1], angle: Math.PI / 2 },
            { name: 'Gemini', color: CONFIG.colors.llmNodes[2], angle: Math.PI },
            { name: 'Grok', color: CONFIG.colors.llmNodes[3], angle: (3 * Math.PI) / 2 }
        ];

        nodeData.forEach((data, index) => {
            const group = new THREE.Group();
            
            // Create face texture (transparent background)
            const faceData = createFaceTexture(data.color, index);
            faceData.color = data.color;
            drawFace(faceData.ctx, faceData.canvas, 0, index, data.color);
            faceData.texture = new THREE.CanvasTexture(faceData.canvas);
            faceData.texture.needsUpdate = true;
            faceStates.push(faceData);
            
            // Solid colored sphere (no face texture on it)
            const geometry = new THREE.SphereGeometry(CONFIG.nodeRadius, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: data.color,
                emissive: data.color,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.95,
                shininess: 60
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.userData.faceIndex = index;
            sphere.userData.color = data.color;
            group.add(sphere);
            
            // Face sprite - added to scene so we can position it toward camera each frame
            const faceMaterial = new THREE.SpriteMaterial({
                map: faceData.texture,
                transparent: true,
                depthTest: false
            });
            const faceSprite = new THREE.Sprite(faceMaterial);
            faceSprite.scale.set(CONFIG.nodeRadius * 1.8, CONFIG.nodeRadius * 1.8, 1);
            faceSprite.userData.node = group;
            faceSprite.userData.offset = CONFIG.nodeRadius * 0.6;
            scene.add(faceSprite);
            faceSpriteRefs.push(faceSprite);

            // Node label
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = isDarkMode ? '#e4e4e8' : '#2c2620';
            ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(data.name, 128, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const labelMaterial = new THREE.SpriteMaterial({ 
                map: texture, 
                transparent: true,
                depthTest: false
            });
            const label = new THREE.Sprite(labelMaterial);
            label.scale.set(2, 0.5, 1);
            label.position.y = CONFIG.nodeRadius + 0.6;
            group.add(label);
            group.userData.label = label;
            group.userData.labelCanvas = canvas;
            group.userData.name = data.name;

            // Position in orbit
            const x = Math.cos(data.angle) * CONFIG.orbitRadius;
            const z = Math.sin(data.angle) * CONFIG.orbitRadius;
            group.position.set(x, 0, z);
            group.userData.basePosition = { x, y: 0, z };
            group.userData.angle = data.angle;

            // Create particle stream
            createParticleStream(group, data.name.toLowerCase().replace('-', ''));

            scene.add(group);
            llmNodes.push(group);
        });
    }

    function createParticleStream(node, streamKey) {
        const particleCount = CONFIG.streamParticles;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const nodeColor = new THREE.Color(node.children[0].material.color);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            colors[i * 3] = nodeColor.r;
            colors[i * 3 + 1] = nodeColor.g;
            colors[i * 3 + 2] = nodeColor.b;
            
            sizes[i] = Math.random() * 0.1 + 0.05;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const points = new THREE.Points(geometry, material);
        points.userData = {
            streamKey,
            active: false,
            progress: new Float32Array(particleCount).fill(0)
        };
        
        scene.add(points);
        streamParticles[streamKey.replace('4', '')] = points;
    }

    function createHumanPlusRing() {
        // Torus ring
        const geometry = new THREE.TorusGeometry(CONFIG.humanPlusRadius, 0.08, 16, 100);
        const material = new THREE.MeshPhongMaterial({
            color: CONFIG.colors.humanPlus,
            emissive: CONFIG.colors.humanPlus,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0
        });
        humanPlusRing = new THREE.Mesh(geometry, material);
        humanPlusRing.rotation.x = Math.PI / 2;
        humanPlusRing.userData = { active: false };
        scene.add(humanPlusRing);

        // Second ring at angle
        const ring2 = humanPlusRing.clone();
        ring2.rotation.x = Math.PI / 3;
        ring2.rotation.z = Math.PI / 4;
        humanPlusRing.userData.ring2 = ring2;
        scene.add(ring2);

        // Third ring
        const ring3 = humanPlusRing.clone();
        ring3.rotation.x = Math.PI / 2.5;
        ring3.rotation.z = -Math.PI / 3;
        humanPlusRing.userData.ring3 = ring3;
        scene.add(ring3);
    }

    function createMINParticles() {
        const particleCount = CONFIG.particleCount;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const minColor = new THREE.Color(CONFIG.colors.min);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in sphere around core
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 3 + Math.random() * 3;
            
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
            
            colors[i * 3] = minColor.r;
            colors[i * 3 + 1] = minColor.g;
            colors[i * 3 + 2] = minColor.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.06,
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const points = new THREE.Points(geometry, material);
        points.userData = { 
            active: false,
            basePositions: positions.slice()
        };
        minParticles = points;
        scene.add(points);
    }

    function createQueryOrb() {
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0
        });
        queryOrb = new THREE.Mesh(geometry, material);
        queryOrb.position.set(0, 5, 0);
        queryOrb.userData = { active: false };
        scene.add(queryOrb);

        // Glow
        const glowGeometry = new THREE.SphereGeometry(0.45, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        queryOrb.add(glow);
        queryOrb.userData.glow = glow;
    }

    function createConflictParticles() {
        const count = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            color: 0xffaa44,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        
        const points = new THREE.Points(geometry, material);
        points.userData = { active: false };
        conflictParticles = points;
        scene.add(points);
    }

    // ═══════════════════════════════════════════════════════════════════
    // THEME & COLORS
    // ═══════════════════════════════════════════════════════════════════
    
    function updateColorsFromTheme() {
        const style = getComputedStyle(document.documentElement);
        const accentStr = style.getPropertyValue('--accent').trim();
        if (accentStr) {
            CONFIG.colors.accent = parseInt(accentStr.replace('#', ''), 16) || CONFIG.colors.accent;
            CONFIG.colors.core = CONFIG.colors.accent;
            CONFIG.colors.humanPlus = CONFIG.colors.accent;
        }
    }

    function updateSceneBackground() {
        if (scene) {
            // Transparent background to let CSS show through
            scene.background = null;
        }
    }

    function updateMaterialColors() {
        // Cami face uses drawFace (black on transparent); no theme change needed for face

        // Update node labels
        llmNodes.forEach(node => {
            if (node.userData.label && node.userData.labelCanvas) {
                const canvas = node.userData.labelCanvas;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = isDarkMode ? '#e4e4e8' : '#2c2620';
                ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.userData.name, 128, 32);
                node.userData.label.material.map = new THREE.CanvasTexture(canvas);
                node.userData.label.material.needsUpdate = true;
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // ANIMATION STAGES
    // ═══════════════════════════════════════════════════════════════════
    
    function setStage(stageIndex, immediate = false) {
        if (stageIndex < 0 || stageIndex >= STAGES.length) return;
        
        currentStage = stageIndex;
        stageStartTime = Date.now();
        
        // Update UI
        updateStageUI(stageIndex);
        
        // Reset all objects first
        resetStageObjects();
        
        // Activate appropriate objects for this stage
        switch (stageIndex) {
            case 0: // Query enters Cami
                activateQueryOrb();
                break;
            case 1: // Human+ LIVE
                activateHumanPlus();
                break;
            case 2: // M.I.N. LIVE
                activateMIN();
                break;
            case 3: // Confidence Check
                activateConfidenceCheck();
                break;
            case 4: // External Research (optional)
                activateResearch();
                break;
            case 5: // Cami Speaks
                activateSynthesis();
                break;
        }
    }

    function resetStageObjects() {
        // Hide query orb
        if (queryOrb) {
            queryOrb.material.opacity = 0;
            queryOrb.userData.glow.material.opacity = 0;
            queryOrb.position.set(0, 5, 0);
        }
        
        // Dim LLM nodes
        llmNodes.forEach(node => {
            node.children[0].material.opacity = 0.3;
            node.children[0].material.emissiveIntensity = 0.1;
        });
        
        // Hide streams
        Object.values(streamParticles).forEach(stream => {
            if (stream && stream.material) {
                stream.material.opacity = 0;
                stream.userData.active = false;
            }
        });
        
        // Hide conflict particles
        if (conflictParticles) {
            conflictParticles.material.opacity = 0;
            conflictParticles.userData.active = false;
        }
        
        // Hide Human+ rings
        if (humanPlusRing) {
            humanPlusRing.material.opacity = 0;
            if (humanPlusRing.userData.ring2) humanPlusRing.userData.ring2.material.opacity = 0;
            if (humanPlusRing.userData.ring3) humanPlusRing.userData.ring3.material.opacity = 0;
            humanPlusRing.userData.active = false;
        }
        
        // Hide M.I.N. particles
        if (minParticles) {
            minParticles.material.opacity = 0;
            minParticles.userData.active = false;
        }
        
        // Reset core
        if (camiCore) {
            camiCore.material.emissiveIntensity = 0.3;
        }
    }

    function activateQueryOrb() {
        queryOrb.userData.active = true;
        queryOrb.material.opacity = 1;
        queryOrb.userData.glow.material.opacity = 0.3;
    }

    function activateLLMNodes() {
        llmNodes.forEach(node => {
            node.children[0].material.opacity = 0.9;
            node.children[0].material.emissiveIntensity = 0.4;
        });
        
        // Activate streams
        Object.values(streamParticles).forEach(stream => {
            if (stream) {
                stream.userData.active = true;
                stream.material.opacity = 0.8;
            }
        });
    }

    function activateConflict() {
        // Keep LLM nodes active
        llmNodes.forEach(node => {
            node.children[0].material.opacity = 0.9;
            node.children[0].material.emissiveIntensity = 0.4;
        });
        
        // Show conflict particles
        conflictParticles.userData.active = true;
        conflictParticles.material.opacity = 0.8;
    }

    function activateHumanPlus() {
        humanPlusRing.userData.active = true;
        humanPlusRing.material.opacity = 0.8;
        if (humanPlusRing.userData.ring2) humanPlusRing.userData.ring2.material.opacity = 0.6;
        if (humanPlusRing.userData.ring3) humanPlusRing.userData.ring3.material.opacity = 0.4;
    }

    function activateMIN() {
        // Keep Human+ active (both are LIVE)
        humanPlusRing.material.opacity = 0.5;
        if (humanPlusRing.userData.ring2) humanPlusRing.userData.ring2.material.opacity = 0.4;
        if (humanPlusRing.userData.ring3) humanPlusRing.userData.ring3.material.opacity = 0.3;
        
        // Activate M.I.N. particles (wisdom flowing in)
        minParticles.userData.active = true;
        minParticles.material.opacity = 0.9;
        
        // Core glows as it receives wisdom
        camiCore.material.emissiveIntensity = 0.5;
    }

    function activateConfidenceCheck() {
        // Keep Human+ and MIN visible (they're part of the assessment)
        humanPlusRing.material.opacity = 0.4;
        if (humanPlusRing.userData.ring2) humanPlusRing.userData.ring2.material.opacity = 0.3;
        if (humanPlusRing.userData.ring3) humanPlusRing.userData.ring3.material.opacity = 0.2;
        
        minParticles.material.opacity = 0.5;
        minParticles.userData.active = false; // Stop flow, just ambient
        
        // Core pulses as it assesses
        camiCore.material.emissiveIntensity = 0.6;
        camiCore.userData.assessing = true;
    }

    function activateResearch() {
        // External LLMs appear (dimmer - they're just tools)
        llmNodes.forEach(node => {
            node.children[0].material.opacity = 0.6;
            node.children[0].material.emissiveIntensity = 0.2;
        });
        
        // Activate streams flowing TO Cami (research coming in)
        Object.values(streamParticles).forEach(stream => {
            if (stream) {
                stream.userData.active = true;
                stream.material.opacity = 0.5;
            }
        });
        
        // Core stays active (Cami is gathering research)
        camiCore.material.emissiveIntensity = 0.4;
    }

    function activateSynthesis() {
        // Core glows brightly - Cami speaks
        camiCore.material.emissiveIntensity = 0.9;
        camiCore.material.opacity = 1;
        
        // Human+ and MIN stay visible (they're part of Cami)
        humanPlusRing.material.opacity = 0.3;
        if (humanPlusRing.userData.ring2) humanPlusRing.userData.ring2.material.opacity = 0.2;
        if (humanPlusRing.userData.ring3) humanPlusRing.userData.ring3.material.opacity = 0.1;
        
        minParticles.material.opacity = 0.3;
        
        // Dim external LLMs (they were just research)
        llmNodes.forEach(node => {
            node.children[0].material.opacity = 0.3;
            node.children[0].material.emissiveIntensity = 0.1;
        });
    }

    function updateStageUI(stageIndex) {
        // Update stage indicators
        const indicators = document.querySelectorAll('.stage-indicator');
        indicators.forEach((ind, i) => {
            ind.classList.toggle('active', i === stageIndex);
        });
        
        // Update caption
        const caption = document.getElementById('stage-caption');
        if (caption) {
            const stage = STAGES[stageIndex];
            caption.innerHTML = `
                <div class="stage-title">${stage.title}</div>
                <div class="stage-desc">${stage.desc}</div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════════════════════════
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        const time = Date.now() * 0.001;
        const elapsed = Date.now() - stageStartTime;
        const stageProgress = Math.min(elapsed / CONFIG.stageDuration, 1);
        
        // Auto-advance stages
        if (isPlaying && !isPaused && elapsed >= CONFIG.stageDuration) {
            setStage((currentStage + 1) % STAGES.length);
        }
        
        // Animate based on current stage
        animateStage(currentStage, stageProgress, time);
        
        // Global animations
        animateCore(time);
        animateHumanPlusRings(time);
        animateMINParticles(time);
        animateLLMNodes(time);
        updateFaceSpritePositions();
        
        // Update Cami face texture each frame
        if (camiFaceState && camiFaceState.texture) {
            drawFace(camiFaceState.ctx, camiFaceState.canvas, time, 4, camiFaceState.color);
            camiFaceState.texture.needsUpdate = true;
        }
        
        // Update controls
        if (controls) controls.update();
        
        // Render
        renderer.render(scene, camera);
    }

    function animateStage(stage, progress, time) {
        switch (stage) {
            case 0: // Query descends into Cami
                if (queryOrb.userData.active) {
                    const targetY = 0;
                    queryOrb.position.y = 5 - (5 - targetY) * easeOutCubic(progress);
                    queryOrb.material.opacity = easeOutCubic(Math.min(progress * 2, 1));
                    queryOrb.userData.glow.material.opacity = 0.3 * easeOutCubic(Math.min(progress * 2, 1));
                    
                    // Core glows as query approaches
                    if (camiCore && progress > 0.5) {
                        camiCore.material.emissiveIntensity = 0.3 + (progress - 0.5) * 0.4;
                    }
                }
                break;
                
            case 1: // Human+ LIVE - rings pulse with EQ analysis
                if (humanPlusRing.userData.active) {
                    const pulse = 0.5 + Math.sin(time * 4) * 0.3;
                    humanPlusRing.material.emissiveIntensity = pulse;
                    
                    // Rings expand slightly as they analyze
                    const scale = 1 + Math.sin(time * 2) * 0.05;
                    humanPlusRing.scale.setScalar(scale);
                    if (humanPlusRing.userData.ring2) humanPlusRing.userData.ring2.scale.setScalar(scale);
                    if (humanPlusRing.userData.ring3) humanPlusRing.userData.ring3.scale.setScalar(scale);
                }
                break;
                
            case 2: // M.I.N. LIVE - particles flow inward (wisdom retrieval)
                if (minParticles.userData.active) {
                    const positions = minParticles.geometry.attributes.position.array;
                    const basePositions = minParticles.userData.basePositions;
                    const flowProgress = easeInOutCubic(progress);
                    
                    for (let i = 0; i < positions.length; i += 3) {
                        // Particles flow toward core (wisdom retrieval)
                        const targetX = basePositions[i] * (1 - flowProgress * 0.6);
                        const targetY = basePositions[i + 1] * (1 - flowProgress * 0.6);
                        const targetZ = basePositions[i + 2] * (1 - flowProgress * 0.6);
                        
                        positions[i] = targetX + Math.sin(time + i) * 0.1;
                        positions[i + 1] = targetY + Math.cos(time + i) * 0.1;
                        positions[i + 2] = targetZ + Math.sin(time * 0.5 + i) * 0.1;
                    }
                    minParticles.geometry.attributes.position.needsUpdate = true;
                }
                break;
                
            case 3: // Confidence check - core pulses as it assesses
                if (camiCore && camiCore.userData.assessing) {
                    // Rhythmic pulse like thinking
                    const pulse = 0.5 + Math.sin(time * 5) * 0.15;
                    camiCore.material.emissiveIntensity = pulse;
                    
                    // Slight scale change
                    const scale = 1 + Math.sin(time * 3) * 0.03;
                    camiCore.scale.setScalar(scale);
                }
                break;
                
            case 4: // External research - streams flow FROM LLMs to Cami
                animateStreams(progress, time);
                break;
                
            case 5: // Cami speaks - core pulses brightly
                if (camiCore) {
                    const pulse = 0.7 + Math.sin(time * 4) * 0.2;
                    camiCore.material.emissiveIntensity = pulse;
                    camiCore.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
                }
                break;
        }
    }

    function animateStreams(progress, time) {
        const streamKeys = ['gpt', 'claude', 'gemini', 'grok'];
        
        streamKeys.forEach((key, nodeIndex) => {
            const stream = streamParticles[key];
            if (!stream || !stream.userData.active) return;
            
            const node = llmNodes[nodeIndex];
            const nodePos = node.position;
            const positions = stream.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length / 3; i++) {
                const particleProgress = (progress + i / (positions.length / 3)) % 1;
                const t = easeInOutCubic(particleProgress);
                
                // Interpolate from node to center
                positions[i * 3] = nodePos.x * (1 - t);
                positions[i * 3 + 1] = nodePos.y * (1 - t) + Math.sin(time * 3 + i) * 0.2 * (1 - t);
                positions[i * 3 + 2] = nodePos.z * (1 - t);
            }
            stream.geometry.attributes.position.needsUpdate = true;
        });
    }

    function animateCore(time) {
        if (!camiCore) return;
        
        // Gentle rotation
        camiCore.rotation.y = time * 0.1;
        
        // Subtle breathing
        const breathe = 1 + Math.sin(time * 0.5) * 0.02;
        if (currentStage !== 5) { // Don't override synthesis pulse
            camiCore.scale.setScalar(breathe);
        }
    }

    function animateHumanPlusRings(time) {
        if (!humanPlusRing) return;
        
        // Main ring rotation
        humanPlusRing.rotation.z = time * 0.5;
        
        // Secondary rings
        if (humanPlusRing.userData.ring2) {
            humanPlusRing.userData.ring2.rotation.z = -time * 0.3;
            humanPlusRing.userData.ring2.rotation.x = Math.PI / 3 + Math.sin(time * 0.2) * 0.1;
        }
        if (humanPlusRing.userData.ring3) {
            humanPlusRing.userData.ring3.rotation.z = time * 0.4;
            humanPlusRing.userData.ring3.rotation.x = Math.PI / 2.5 + Math.cos(time * 0.3) * 0.1;
        }
    }

    function animateMINParticles(time) {
        if (!minParticles) return;
        
        // Slow rotation of entire particle system
        minParticles.rotation.y = time * 0.05;
        minParticles.rotation.x = Math.sin(time * 0.1) * 0.1;
    }

    function updateFaceSpritePositions() {
        if (!camera || !scene || !_facePos || !_faceDir) return;
        try {
            // LLM face sprites
            for (let i = 0; i < faceSpriteRefs.length; i++) {
                const sprite = faceSpriteRefs[i];
                const node = sprite.userData && sprite.userData.node;
                const offset = (sprite.userData && sprite.userData.offset) || 0.5;
                if (!node) continue;
                node.getWorldPosition(_facePos);
                _faceDir.copy(camera.position).sub(_facePos).normalize();
                sprite.position.copy(_facePos).add(_faceDir.multiplyScalar(offset));
            }
            // Cami face sprite
            if (camiFaceSprite && camiCore && camiFaceSprite.userData && camiFaceSprite.userData.offset != null) {
                camiCore.getWorldPosition(_facePos);
                _faceDir.copy(camera.position).sub(_facePos).normalize();
                camiFaceSprite.position.copy(_facePos).add(_faceDir.multiplyScalar(camiFaceSprite.userData.offset));
            }
        } catch (e) {
            console.warn('updateFaceSpritePositions:', e);
        }
    }

    function animateLLMNodes(time) {
        llmNodes.forEach((node, i) => {
            // Gentle bob
            const baseY = node.userData.basePosition.y;
            node.position.y = baseY + Math.sin(time + i * Math.PI / 2) * 0.15;
            
            // Subtle scale pulse on the sphere
            const scale = 1 + Math.sin(time * 2 + i) * 0.03;
            node.children[0].scale.setScalar(scale);
            
            // Update face animation - face sprite uses same texture
            if (faceStates[i] && faceStates[i].texture) {
                const faceData = faceStates[i];
                drawFace(faceData.ctx, faceData.canvas, time, i, faceData.color);
                faceData.texture.needsUpdate = true;
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // EASING FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════
    
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // ═══════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════
    
    function onWindowResize() {
        const container = renderer.domElement.parentElement;
        if (!container) return;
        
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        const isMobile = w < 768;
        
        camera.aspect = w / h;
        camera.fov = isMobile ? 65 : 60;
        camera.updateProjectionMatrix();
        
        // Adjust camera distance for mobile
        const camDistance = isMobile ? CONFIG.cameraDistance * 1.3 : CONFIG.cameraDistance;
        const camY = isMobile ? 4 : 3;
        camera.position.set(0, camY, camDistance);
        camera.lookAt(0, 0, 0);
        
        renderer.setSize(w, h);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════
    
    window.SynthesisScene = {
        init: init,
        
        setStage: function(index) {
            setStage(index, true);
        },
        
        play: function() {
            isPlaying = true;
            isPaused = false;
            if (controls) controls.autoRotate = true;
        },
        
        pause: function() {
            isPaused = true;
            if (controls) controls.autoRotate = false;
        },
        
        toggle: function() {
            if (isPaused) {
                this.play();
            } else {
                this.pause();
            }
        },
        
        isPaused: function() {
            return isPaused;
        },
        
        isReady: function() {
            return !!(scene && camera && renderer);
        },
        
        nextStage: function() {
            setStage((currentStage + 1) % STAGES.length);
        },
        
        prevStage: function() {
            setStage((currentStage - 1 + STAGES.length) % STAGES.length);
        },
        
        getCurrentStage: function() {
            return currentStage;
        },
        
        getStages: function() {
            return STAGES;
        },
        
        destroy: function() {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            if (renderer) {
                renderer.dispose();
            }
            window.removeEventListener('resize', onWindowResize);
        }
    };

})();
