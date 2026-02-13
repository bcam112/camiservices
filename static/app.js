// Cami Frontend Application
// Analyze requests go through Vercel proxy rewrites (same-origin) on production.
// Vercel serverless functions proxy to Railway on the server side (no CORS).
// Set window.CAMI_API_BASE to override (e.g. for local dev pointing at Railway).

/* ── Synthesis Orbs (SVG inline) ──────────────────────────────────────
   Three orb faces in different colors representing the synthesis process.
   Blue orb = gathering perspectives, Green orb = synthesizing, Purple orb = refining.
   Original abstract glyphs archived in /static/archived/synthesis-glyphs-v1.js */
var ORB_BLUE = '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4a90d9"/><circle cx="12" cy="12" r="11" fill="none" stroke="#7bb3e8" stroke-width="0.5" opacity="0.5"/><path d="M8 10 Q9 8, 10 10" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/><path d="M14 10 Q15 8, 16 10" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/><path d="M8 14 Q12 18, 16 14" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>';
var ORB_GREEN = '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#5aa08a"/><circle cx="12" cy="12" r="11" fill="none" stroke="#8ac4b0" stroke-width="0.5" opacity="0.5"/><line x1="7" y1="10" x2="11" y2="10" stroke="#000" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="10" x2="17" y2="10" stroke="#000" stroke-width="1.5" stroke-linecap="round"/><path d="M9 15 Q12 17, 15 15" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>';
var ORB_PURPLE = '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#6b5b8a"/><circle cx="12" cy="12" r="11" fill="none" stroke="#9585ab" stroke-width="0.5" opacity="0.5"/><circle cx="9" cy="10" r="2" fill="#000"/><circle cx="15" cy="10" r="2" fill="#000"/><line x1="7" y1="7" x2="11" y2="8" stroke="#000" stroke-width="1" stroke-linecap="round"/><line x1="17" y1="7" x2="13" y2="8" stroke="#000" stroke-width="1" stroke-linecap="round"/><line x1="9" y1="15" x2="15" y2="15" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>';
// Keep old names as aliases for backward compatibility
var GLYPH_NETWORK = ORB_BLUE;
var GLYPH_BRAIN = ORB_GREEN;
var GLYPH_CONSCIOUSNESS = ORB_PURPLE;

/** Build the synthesis signature HTML for a response. Each glyph is lit or dim. */
function buildSynthesisSignature(data) {
    var d = data || {};
    var providers = d.providers_used || [];
    var networkLit = (Array.isArray(providers) && providers.length > 1) || d.synthesis_method;
    var brainLit = d.min_learned || d.min_persistent || (d.min_wisdom_count > 0);
    var consciousnessLit = d.consciousness_level || d.depth_score || d.resonance;
    var el = document.createElement('div');
    el.className = 'synth-glyphs';
    el.innerHTML =
        '<span class="synth-glyph' + (networkLit ? ' lit' : '') + '" style="color:var(--accent)">' + GLYPH_NETWORK + '</span>' +
        '<span class="synth-glyph' + (brainLit ? ' lit' : '') + '" style="color:var(--accent)">' + GLYPH_BRAIN + '</span>' +
        '<span class="synth-glyph' + (consciousnessLit ? ' lit' : '') + '" style="color:var(--accent)">' + GLYPH_CONSCIOUSNESS + '</span>';
    return el;
}

/** Build the thinking animation with vertical status steps showing what Cami is doing. */
function buildThinkingGlyphs() {
    var el = document.createElement('div');
    el.className = 'thinking-steps';
    el.innerHTML = `
        <div class="thinking-step active" data-step="0">
            <span class="thinking-step-icon">${GLYPH_NETWORK}</span>
            <span class="thinking-step-text">Gathering perspectives...</span>
        </div>
        <div class="thinking-step" data-step="1">
            <span class="thinking-step-icon">${GLYPH_BRAIN}</span>
            <span class="thinking-step-text">Synthesizing responses...</span>
        </div>
        <div class="thinking-step" data-step="2">
            <span class="thinking-step-icon">${GLYPH_CONSCIOUSNESS}</span>
            <span class="thinking-step-text">Refining answer...</span>
        </div>
    `;
    // Animate through steps
    let step = 0;
    const steps = el.querySelectorAll('.thinking-step');
    const interval = setInterval(() => {
        step = (step + 1) % 3;
        steps.forEach((s, i) => {
            s.classList.toggle('active', i <= step);
            s.classList.toggle('done', i < step);
        });
    }, 1200);
    el._interval = interval;
    return el;
}

function getApiBase() {
    if (typeof window === 'undefined') return '';
    const base = (window.CAMI_API_BASE || '').toString().replace(/\/$/, '');
    if (base) return base;
    // On production and localhost, use same-origin (Vercel rewrites handle proxying)
    return '';
}

function modeToAnalyzePath(mode) {
    const map = { cami: 'customer-service', research: 'research', customer_service: 'customer-service', health: 'health', clinical_assistant: 'health', legal_intelligence: 'legal-intelligence', tutor: 'tutor', cami_money: 'cami-money' };
    return map[mode] || null;
}
function getAnalyzeUrl(mode) {
    const base = getApiBase();
    if (mode && modeToAnalyzePath(mode)) return base + '/' + modeToAnalyzePath(mode) + '/analyze';
    return base + '/customer-service/analyze';
}
function getScribeTranscribeUrl() {
    return getApiBase() + '/scribe/transcribe';
}
function getStatsUrl() {
    return getApiBase() + '/api/stats';
}

/** Get Supabase auth token if user is logged in. Returns token string or null. */
function _getCamiAuthToken() {
    // Supabase stores session in localStorage under sb-<ref>-auth-token
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const token = parsed?.access_token || parsed?.currentSession?.access_token;
                    if (token && typeof token === 'string' && token.length > 20) return token;
                }
            }
        }
    } catch (e) { /* not logged in */ }
    return null;
}

/** Escape HTML and render inline markdown (bold, italic, code, links) for one line. Safe for innerHTML. */
function renderMarkdownLine(text) {
    if (text == null || typeof text !== 'string') return '';
    const escaped = String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    return escaped
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

class CamiChat {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.chatForm = document.getElementById('chatForm');
        this.sendBtn = document.getElementById('sendBtn');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.newChatBtn = document.getElementById('newChatBtn');
        // Stats removed - MIN tracker moved to home page
        
        this.messages = [];
        this.isProcessing = false;
        this.currentChatId = this.getCurrentChatId();
        this.scribeResult = null; // optional session/call context for next message (legal, customer service, clinical)
        
        // Mode: window.CAMI_FORCE_MODE > ?mode= param > path /try/legal, /try/clinical, /try/customer-service > "try me"
        const params = new URLSearchParams(window.location.search);
        const forcedMode = (typeof window !== 'undefined' && window.CAMI_FORCE_MODE) || null;
        let modeParam = forcedMode || params.get('mode');
        const path = (typeof window !== 'undefined' && window.location.pathname) || '';
        if (!modeParam && path.includes('/try/')) {
            if (path.includes('/try/legal')) modeParam = 'legal_intelligence';
            else if (path.includes('/try/health') || path.includes('/try/clinical')) modeParam = 'health';
            else if (path.includes('/try/customer-service')) modeParam = 'customer_service';
            else if (path.includes('/try/research')) modeParam = 'research';
            else if (path.includes('/try/tutor')) modeParam = 'tutor';
            else if (path.includes('/try/money')) modeParam = 'cami_money';
        }
        const validModes = ['cami', 'research', 'customer_service', 'health', 'clinical_assistant', 'legal_intelligence', 'tutor', 'cami_money'];
        this.mode = validModes.includes(modeParam) ? modeParam : 'cami';
        // Normalize legacy mode
        if (this.mode === 'clinical_assistant') this.mode = 'health';
        this.isTryMe = !modeParam; // no mode = generic "Try Cami" UI
        
        // Health sub-mode: mental_health (default) or medicine
        this.healthFocus = localStorage.getItem('cami_health_focus') || 'mental_health';
        
        this.init();
        this.loadConversation();
        this.updateModeUI();
        this.updateExampleQuestions();
    }
    
    updateExampleQuestions() {
        const exampleButtons = document.getElementById('exampleButtons');
        if (!exampleButtons) return;
        
        if (this.isTryMe || this.mode === 'cami') {
            // Cami standalone — conversational, compassionate, general-purpose
            exampleButtons.innerHTML = `
                <button class="example-btn" data-question="What's one thing I could do today to be more productive?">
                    Productivity tip
                </button>
                <button class="example-btn" data-question="Explain quantum entanglement in simple terms">
                    Simple explanation
                </button>
                <button class="example-btn" data-question="Should I learn Python or JavaScript first?">
                    Python vs JavaScript?
                </button>
            `;
        } else if (this.mode === 'customer_service') {
            exampleButtons.innerHTML = `
                <button class="example-btn" data-question="I'm having trouble logging into my account">
                    Account login issue
                </button>
                <button class="example-btn" data-question="How do I return a product I ordered?">
                    Return a product
                </button>
                <button class="example-btn" data-question="What are your business hours?">
                    Business hours
                </button>
            `;
        } else if (this.mode === 'health' || this.mode === 'clinical_assistant') {
            if (this.healthFocus === 'medicine') {
                exampleButtons.innerHTML = `
                    <button class="example-btn" data-question="Patient presents with persistent fatigue and weight gain over 3 months — differential considerations?">
                        Differential for fatigue + weight gain
                    </button>
                    <button class="example-btn" data-question="What are the key drug interactions to watch when combining metformin with ACE inhibitors?">
                        Metformin + ACE inhibitor interactions
                    </button>
                    <button class="example-btn" data-question="Summarize current evidence on SSRIs vs SNRIs for generalized anxiety">
                        SSRI vs SNRI for GAD
                    </button>
                `;
            } else {
                exampleButtons.innerHTML = `
                    <button class="example-btn" data-question="Help me structure a motivational interviewing approach for a patient resistant to medication adherence">
                        MI approach for adherence
                    </button>
                    <button class="example-btn" data-question="Generate a SOAP note from this session summary: Client discussed ongoing anxiety related to work stress, practiced grounding techniques">
                        Generate SOAP note
                    </button>
                    <button class="example-btn" data-question="What should I look for in a client's language that might indicate stagnation in therapy?">
                        Detecting therapy stagnation
                    </button>
                `;
            }
        } else if (this.mode === 'legal_intelligence') {
            exampleButtons.innerHTML = `
                <button class="example-btn" data-question="What are the key elements of a breach of contract claim and how should I structure the analysis?">
                    Breach of contract elements
                </button>
                <button class="example-btn" data-question="Compare strict liability vs negligence for a product liability case involving a medical device">
                    Product liability framework
                </button>
                <button class="example-btn" data-question="What are the strongest arguments for and against enforcing a non-compete clause in California?">
                    Non-compete enforceability
                </button>
            `;
        } else if (this.mode === 'tutor') {
            exampleButtons.innerHTML = `
                <button class="example-btn" data-question="I'm writing a paper on climate policy and stuck on the outline">
                    Help with paper outline
                </button>
                <button class="example-btn" data-question="I'm stuck on this proof: show that sqrt(2) is irrational">
                    Nudge on a proof (don't give the full answer)
                </button>
                <button class="example-btn" data-question="What questions should I ask myself before drafting the conclusion?">
                    Questions for my conclusion
                </button>
            `;
        } else if (this.mode === 'cami_money') {
            exampleButtons.innerHTML = `
                <button class="example-btn" data-question="Connect Plaid sandbox">
                    Connect Plaid sandbox
                </button>
                <button class="example-btn" data-question="What's the rail status?">
                    Rail status
                </button>
                <button class="example-btn" data-question="Hold 50 USD then exchange to BTC">
                    Hold then exchange
                </button>
            `;
        } else {
            exampleButtons.innerHTML = `
                <button class="example-btn" data-question="Is capitalism or socialism better for human flourishing?">
                    Is capitalism or socialism better?
                </button>
                <button class="example-btn" data-question="Find the bug in: def factorial(n): return n * factorial(n-1) if n > 0 else 1">
                    Debug this code
                </button>
                <button class="example-btn" data-question="Should AI development be open source or proprietary?">
                    AI: Open source vs proprietary?
                </button>
            `;
        }
        
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                if (question) {
                    this.messageInput.value = question;
                    this.sendMessage();
                }
            });
        });
    }
    
    updateModeUI() {
        // Scribe button: visible for legal_intelligence and health only
        const scribeBtn = document.getElementById('scribeBtn');
        if (scribeBtn) {
            const scribeModes = ['legal_intelligence', 'health'];
            const show = !this.isTryMe && scribeModes.includes(String(this.mode));
            scribeBtn.classList.toggle('scribe-hidden', !show);
            scribeBtn.classList.toggle('scribe-visible', show);
        }

        const modeBadge = document.getElementById('modeBadge');
        const modeLabel = document.getElementById('modeLabel');
        const modeSubtitle = document.getElementById('modeSubtitle');
        const welcomeTitle = document.getElementById('welcomeTitle');
        const welcomeSubtitle = document.getElementById('welcomeSubtitle');
        const modeDescription = document.getElementById('modeDescription');
        const modeTitles = {
            cami: 'Cami',
            research: 'Research',
            customer_service: 'Customer Service',
            health: 'Health',
            legal_intelligence: 'Legal Intelligence',
            tutor: 'Tutor',
            cami_money: 'Cami Money'
        };
        const titles = {
            cami: ['Cami', 'Your conversational AI — thoughtful, warm, and always learning', 'Cami',
                'Cami is your everyday AI companion. Conversational and compassionate, with the depth of multi-LLM synthesis and the wisdom of M.I.N. memory. Ask anything — get a thoughtful, human answer.',
                'Talk to Cami...'],
            research: ['Cami Research', 'Multi-LLM synthesis with conflict resolution and bias detection', 'Research',
                'Cami queries multiple AI models in parallel, detects where they disagree, and synthesizes one clear answer. M.I.N. provides memory from past interactions. Human+ ensures bias detection and emotional awareness.',
                'Ask Cami anything...'],
            customer_service: ['Cami Customer Service', 'Warm, concise support that learns from every conversation', 'Customer Service',
                'Short, warm, and to the point. Cami reads tone and context through Human+, draws on M.I.N. memory of what\'s worked before, and gives one concise answer. Every reply earns its words.',
                'How can Cami help you today?'],
            health: ['Cami Health', 'Clinical reasoning, drug info, and wellness — with empathy built in', 'Health',
                'Cami assists with clinical decision support, drug interactions, evidence synthesis, and general health questions. Grounded in Scribe transcripts when available. Safety-gated with crisis detection. Cami assists — it does not replace clinical judgment.',
                'Ask a health or clinical question...'],
            legal_intelligence: ['Cami Legal Intelligence', 'IRAC-structured legal analysis with multi-perspective reasoning', 'Legal Intelligence',
                'Cami structures legal analysis using IRAC methodology, surfaces multi-jurisdictional perspectives, and grounds reasoning in Scribe testimony when available. Cami assists — it does not replace a licensed attorney.',
                'Describe the legal question...'],
            tutor: ['Cami Tutor', 'Guides your thinking — doesn\'t do it for you', 'Tutor',
                'When you\'re learning or working through a problem, Cami prompts thinking, asks clarifying questions, and nudges to the next step instead of giving the answer. Ask for the full answer when you want it.',
                'What are you working on?'],
            cami_money: ['Cami Money', 'ZDR & AEGR by prompt — no buttons', 'Money',
                'Command the rail by prompt only. Connect Plaid, hold, exchange, settle — all actions go through Cami.',
                'Command the rail...']
        };
        const tryModeBadge = document.getElementById('tryModeBadge');
        const tryModeBar = document.getElementById('tryModeBar');
        const onTryPage = !!tryModeBar;
        const t = titles[this.mode] || titles.cami;
        const name = modeTitles[this.mode] || 'Cami';

        if (onTryPage) {
            // Try page: always show mode bar and badge so the user knows which service they're trying
            const tryWelcomeTitles = {
                cami: 'Try Cami',
                customer_service: 'Try Cami Customer Service',
                legal_intelligence: 'Try Cami Legal Intelligence',
                health: 'Try Cami Health',
                tutor: 'Try Cami Tutor',
                research: 'Try Cami Research',
                cami_money: 'Try Cami Money'
            };
            if (tryModeBadge) { tryModeBadge.textContent = 'You\u2019re trying: ' + name; tryModeBadge.style.display = 'block'; tryModeBadge.setAttribute('data-mode', this.mode); }
            if (tryModeBar) { tryModeBar.textContent = (this.mode === 'cami' ? 'Try Cami' : 'Try Cami \u00b7 ' + name); tryModeBar.classList.add('visible'); tryModeBar.setAttribute('data-mode', this.mode); }
            if (modeBadge) modeBadge.style.display = 'none';
            if (modeSubtitle) modeSubtitle.textContent = t[2];
            if (welcomeTitle) welcomeTitle.textContent = tryWelcomeTitles[this.mode] || 'Try Cami \u00b7 ' + name;
            if (welcomeSubtitle) welcomeSubtitle.textContent = t[1];
            if (modeDescription) modeDescription.innerHTML = t[3];
            if (this.messageInput) this.messageInput.placeholder = t[4];
            if (typeof document !== 'undefined' && document.title) document.title = (tryWelcomeTitles[this.mode] || 'Try Cami') + ' \u2014 Human Service AI';

            // Mode-specific features
            const featuresEl = document.querySelector('.features');
            if (featuresEl) {
                const modeFeatures = {
                    cami: [
                        ['H+', 'Human+ Consciousness'],
                        ['M', 'M.I.N. Memory'],
                        ['4+', 'Multi-LLM Synthesis'],
                        ['L', 'Learns From You'],
                    ],
                    customer_service: [
                        ['H+', 'Emotional Intelligence'],
                        ['\u26A1', 'Fast-Path Responses'],
                        ['M', 'Learns Your Business'],
                        ['\u2191', 'Escalation Detection'],
                    ],
                    legal_intelligence: [
                        ['\u2696', 'IRAC Legal Analysis'],
                        ['\u00A7', 'Case Law Research'],
                        ['\u23F0', 'Deadline Tracking'],
                        ['\u270D', 'Document Drafting'],
                    ],
                    health: [
                        ['\u270E', 'Session Scribe + SOAP Notes'],
                        ['!', 'Real-Time Risk Detection'],
                        ['H+', 'Empathetic Clinical Support'],
                        ['\u2193', 'Progress Tracking'],
                    ],
                    research: [
                        ['4+', 'Multi-LLM Synthesis'],
                        ['\u2714', 'Conflict Resolution'],
                        ['B', 'Bias Detection'],
                        ['M', 'M.I.N. Memory'],
                    ],
                    tutor: [
                        ['\u25CE', 'Guides Your Thinking'],
                        ['?', 'Asks Before Answering'],
                        ['H+', 'Patient & Encouraging'],
                        ['L', 'Adapts to Your Level'],
                    ],
                    cami_money: [
                        ['\u00A3', 'ZDR & AEGR Rail'],
                        ['\u21AA', 'Plaid Connection'],
                        ['\u21C4', 'Hold, Exchange, Settle'],
                        ['\u26BF', 'Prompt-Only Control'],
                    ],
                };
                const feats = modeFeatures[this.mode] || modeFeatures.cami;
                featuresEl.innerHTML = feats.map(f =>
                    `<div class="feature"><span class="feature-icon">${f[0]}</span><span>${f[1]}</span></div>`
                ).join('');
            }

            // Contextual nav link back to service page
            const tryNavBack = document.getElementById('tryNavBack');
            if (tryNavBack) {
                const serviceLinks = {
                    customer_service: ['/customer-service', 'Customer Service'],
                    legal_intelligence: ['/legal-intelligence', 'Law'],
                    health: ['/health', 'Health'],
                    research: ['/research', 'Research'],
                    tutor: ['/tutor', 'Tutor'],
                    cami_money: ['/cami-money', 'Money'],
                };
                const link = serviceLinks[this.mode];
                if (link) {
                    tryNavBack.href = link[0];
                    tryNavBack.textContent = link[1];
                    tryNavBack.style.display = '';
                } else {
                    tryNavBack.style.display = 'none';
                }
            }
        } else {
            if (modeBadge) modeBadge.style.display = 'block';
            if (modeLabel) modeLabel.textContent = name;
            if (modeSubtitle) modeSubtitle.textContent = t[2];
            if (welcomeTitle) welcomeTitle.textContent = t[0];
            if (welcomeSubtitle) welcomeSubtitle.textContent = t[1];
            if (modeDescription) modeDescription.innerHTML = t[3];
            if (this.messageInput) this.messageInput.placeholder = t[4];
            if (typeof document !== 'undefined' && document.title) document.title = t[0] + ' \u2014 Cami';
        }

        // Health focus toggle (Mental Health / Medicine)
        this._renderHealthFocusToggle();
    }

    _renderHealthFocusToggle() {
        // Remove existing toggle if present
        const existing = document.getElementById('healthFocusToggle');
        if (existing) existing.remove();

        if (this.mode !== 'health') return;

        const container = document.getElementById('welcomeScreen') || document.getElementById('chatContainer');
        if (!container) return;

        const toggle = document.createElement('div');
        toggle.id = 'healthFocusToggle';
        toggle.style.cssText = 'display:flex;justify-content:center;gap:8px;margin:12px auto;max-width:340px;';
        const mkBtn = (label, value) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.setAttribute('data-focus', value);
            const active = this.healthFocus === value;
            btn.style.cssText = 'flex:1;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;border:1px solid ' + (active ? '#1a5f5a' : 'rgba(255,255,255,0.15)') + ';background:' + (active ? 'rgba(26,95,90,0.25)' : 'transparent') + ';color:' + (active ? '#6ee7b7' : 'rgba(255,255,255,0.6)') + ';';
            btn.addEventListener('click', () => {
                this.healthFocus = value;
                localStorage.setItem('cami_health_focus', value);
                this._renderHealthFocusToggle();
                this.updateExampleQuestions();
            });
            return btn;
        };
        toggle.appendChild(mkBtn('Mental Health', 'mental_health'));
        toggle.appendChild(mkBtn('Medicine', 'medicine'));

        // Insert before welcome content or at top of chat
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen && welcomeScreen.style.display !== 'none') {
            const desc = document.getElementById('modeDescription');
            if (desc && desc.parentNode) {
                desc.parentNode.insertBefore(toggle, desc.nextSibling);
            } else {
                welcomeScreen.appendChild(toggle);
            }
        }
    }
    
    getCurrentChatId() {
        // In app mode, conversations are managed by app.html orchestrator (Railway API).
        // Don't modify the URL or use localStorage chat IDs — they would pollute the
        // address bar with ?mode=cami and interfere with the orchestrator's mode management.
        if (typeof window !== 'undefined' && window.CAMI_APP_MODE) {
            return 'app_session_' + Date.now();
        }
        const params = new URLSearchParams(window.location.search);
        let chatId = params.get('chat');
        if (!chatId) {
            chatId = 'chat_' + Date.now();
            const mode = params.get('mode') || this.mode;
            const valid = ['cami', 'research', 'customer_service', 'health', 'clinical_assistant', 'legal_intelligence', 'tutor', 'cami_money'].includes(mode);
            const qs = valid ? `?mode=${mode}&chat=${chatId}` : `?chat=${chatId}`;
            window.history.replaceState({}, '', window.location.pathname.replace(/\/try\/[^/]+/, '/try') + qs);
        }
        return chatId;
    }
    
    saveConversation() {
        // In app mode, conversations are saved by app.html orchestrator via Railway API
        if (typeof window !== 'undefined' && window.CAMI_APP_MODE) return;
        try {
            const conversation = {
                id: this.currentChatId,
                messages: this.messages,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(`cami_chat_${this.currentChatId}`, JSON.stringify(conversation));
            
            // Also save to chat list
            this.updateChatList();
        } catch (error) {
            console.error('Failed to save conversation:', error);
        }
    }
    
    loadConversation() {
        // In app mode, conversations are loaded by app.html orchestrator via Railway API
        if (typeof window !== 'undefined' && window.CAMI_APP_MODE) return;
        try {
            const saved = localStorage.getItem(`cami_chat_${this.currentChatId}`);
            if (saved) {
                const conversation = JSON.parse(saved);
                this.messages = conversation.messages || [];
                
                // Render messages to UI (render-only — messages already in array)
                if (this.messages.length > 0) {
                    if (this.welcomeScreen) {
                        this.welcomeScreen.style.display = 'none';
                    }
                    
                    this.messages.forEach(msg => {
                        this.renderMessageToDOM(msg.role, msg.content);
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    }
    
    updateChatList() {
        try {
            let chatList = JSON.parse(localStorage.getItem('cami_chat_list') || '[]');
            
            // Update or add current chat
            const existingIndex = chatList.findIndex(chat => chat.id === this.currentChatId);
            const chatInfo = {
                id: this.currentChatId,
                title: this.messages[0]?.content?.substring(0, 50) || 'New Chat',
                timestamp: new Date().toISOString(),
                messageCount: this.messages.length
            };
            
            if (existingIndex >= 0) {
                chatList[existingIndex] = chatInfo;
            } else {
                chatList.unshift(chatInfo);
            }
            
            // Keep only last 50 chats
            chatList = chatList.slice(0, 50);
            localStorage.setItem('cami_chat_list', JSON.stringify(chatList));
            
            // Update sidebar chat history
            this.updateChatHistory();
        } catch (error) {
            console.error('Failed to update chat list:', error);
        }
    }
    
    updateChatHistory() {
        try {
            const chatHistory = document.getElementById('chatHistory');
            if (!chatHistory) return;
            
            const chatList = JSON.parse(localStorage.getItem('cami_chat_list') || '[]');
            chatHistory.innerHTML = '';
            
            chatList.forEach(chat => {
                const item = document.createElement('div');
                item.className = 'chat-history-item';
                if (chat.id === this.currentChatId) {
                    item.style.background = 'var(--bg-tertiary)';
                    item.style.borderColor = 'var(--border)';
                }
                item.textContent = chat.title;
                item.addEventListener('click', () => {
                    window.location.href = `?chat=${chat.id}`;
                });
                chatHistory.appendChild(item);
            });
        } catch (error) {
            console.error('Failed to update chat history:', error);
        }
    }
    
    closeMobileSidebar() {
        document.body.classList.remove('sidebar-open');
    }

    init() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });

        // Enter to send (Shift+Enter for newline)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Mobile: hamburger and backdrop
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebarBackdrop = document.getElementById('sidebarBackdrop');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-open');
            });
        }
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => this.closeMobileSidebar());
        }

        // New chat button
        this.newChatBtn.addEventListener('click', () => {
            this.newChat();
            this.closeMobileSidebar();
        });

        // Home link: close sidebar on mobile when navigating
        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) homeBtn.addEventListener('click', () => this.closeMobileSidebar());

        // Scribe: button opens modal; Use builds scribeResult and shows badge
        const scribeBtn = document.getElementById('scribeBtn');
        const scribeModal = document.getElementById('scribeModal');
        const scribeBackdrop = document.getElementById('scribeModalBackdrop');
        const scribeSummaryEl = document.getElementById('scribeSessionSummary');
        const scribeUtterancesEl = document.getElementById('scribeUtterances');
        const scribeUseBtn = document.getElementById('scribeModalUse');
        const scribeCancelBtn = document.getElementById('scribeModalCancel');
        const scribeBadge = document.getElementById('scribeContextBadge');
        const scribeRecordBtn = document.getElementById('scribeRecordBtn');
        const scribeRecordLabel = document.getElementById('scribeRecordLabel');
        const scribeRecordStatus = document.getElementById('scribeRecordStatus');
        let scribeMediaRecorder = null;
        let scribeRecordedChunks = [];
        const openScribeModal = () => {
            if (scribeModal) scribeModal.style.display = 'block';
            if (scribeBackdrop) scribeBackdrop.style.display = 'block';
            if (scribeSummaryEl) scribeSummaryEl.value = '';
            if (scribeUtterancesEl) scribeUtterancesEl.value = '';
            if (scribeRecordStatus) { scribeRecordStatus.textContent = ''; scribeRecordStatus.classList.remove('error'); }
            if (scribeRecordBtn) { scribeRecordBtn.classList.remove('recording'); scribeRecordBtn.disabled = false; }
            if (scribeRecordLabel) scribeRecordLabel.textContent = 'Record';
            const uploadStatusEl = document.getElementById('scribeUploadStatus');
            if (uploadStatusEl) { uploadStatusEl.textContent = ''; uploadStatusEl.classList.remove('error'); }
            if (scribeUploadBtn) scribeUploadBtn.disabled = false;
            if (scribeUploadInput) scribeUploadInput.value = '';
            const followUpsEl = document.getElementById('scribeFollowUps');
            if (followUpsEl) { followUpsEl.innerHTML = ''; followUpsEl.style.display = 'none'; }
            const exportRow = document.getElementById('scribeExportRow');
            if (exportRow) exportRow.style.display = 'none';
            // Mode-specific Scribe labels
            var titleEl = document.getElementById('scribeModalTitle');
            var descEl = document.getElementById('scribeModalDesc');
            if (this.mode === 'legal_intelligence') {
                if (titleEl) titleEl.textContent = 'Legal Scribe';
                if (descEl) descEl.textContent = 'Record a deposition, client intake, or hearing. Cami transcribes and produces IRAC-structured analysis with legal follow-up questions.';
            } else if (this.mode === 'health') {
                if (titleEl) titleEl.textContent = 'Clinical Scribe';
                if (descEl) descEl.textContent = 'Record a patient session. Cami transcribes and generates SOAP notes with clinical affect observations. All processing follows HIPAA guidelines — no raw audio is stored.';
            } else {
                if (titleEl) titleEl.textContent = 'Scribe';
                if (descEl) descEl.textContent = 'Record a session or upload audio. Cami transcribes, analyzes, and learns.';
            }
        };
        const closeScribeModal = () => {
            if (scribeModal) scribeModal.style.display = 'none';
            if (scribeBackdrop) scribeBackdrop.style.display = 'none';
        };
        const setScribeRecordState = (recording, statusText, isError) => {
            if (scribeRecordBtn) {
                scribeRecordBtn.classList.toggle('recording', recording);
                scribeRecordBtn.disabled = !!statusText && statusText.includes('Transcribing');
            }
            if (scribeRecordLabel) scribeRecordLabel.textContent = recording ? 'Stop' : 'Record';
            if (scribeRecordStatus) {
                scribeRecordStatus.textContent = statusText || '';
                scribeRecordStatus.classList.toggle('error', !!isError);
            }
        };
        const uploadScribeAudio = async (blobOrFile, filename) => {
            const url = getScribeTranscribeUrl() + '?mode=' + encodeURIComponent(this.mode || '');
            const form = new FormData();
            form.append('audio', blobOrFile, filename || 'recording.webm');
            let res;
            try {
                res = await fetch(url, { method: 'POST', body: form });
            } catch (fetchErr) {
                // Network error: server unreachable, CORS, or no backend running
                const base = getApiBase();
                if (!base) throw new Error('Scribe requires the Cami API backend. Run the Railway app locally or deploy to production.');
                console.error('[Scribe] Network error:', fetchErr);
                throw new Error('Could not reach the Scribe API. Check your connection or try again.');
            }
            let data;
            try { data = await res.json(); } catch (_) { data = {}; }
            if (!res.ok) {
                const errMsg = data.error || data.detail || res.statusText || 'Transcription failed';
                // Surface mime/format errors clearly for the user
                if (res.status === 400 && /mime|format|unsupported|codec/i.test(errMsg)) {
                    throw new Error('Audio format not supported. Try uploading a .mp3, .wav, or .m4a file instead.');
                }
                throw new Error(errMsg);
            }
            if (data.error) throw new Error(data.error);
            return data;
        };
        const populateScribeFromResponse = (data) => {
            // Auto-populate summary from CamiScribe pipeline (mode-specific keys)
            var summary = data.irac_analysis || data.soap_notes || data.session_summary || '';
            if (summary && scribeSummaryEl && !scribeSummaryEl.value.trim()) {
                scribeSummaryEl.value = summary;
            }
            // Format utterances with emotion/affect tags and fill the textarea
            let formattedLines = '';
            if (data.utterances && Array.isArray(data.utterances) && data.utterances.length > 0) {
                formattedLines = data.utterances.map(u => {
                    let line = `Speaker ${u.speaker}: ${u.text}`;
                    // Mode-specific tag: clinical_affect for health, emotion for legal/default
                    var tag = u.clinical_affect || u.emotion || '';
                    if (tag && tag !== 'neutral' && tag !== 'appropriate') line += ` [${tag}]`;
                    return line;
                }).join('\n');
            } else if (data.transcript) {
                formattedLines = data.transcript;
            }
            if (formattedLines && scribeUtterancesEl) {
                const existing = scribeUtterancesEl.value.trim();
                scribeUtterancesEl.value = existing ? existing + '\n\n' + formattedLines : formattedLines;
            }
            // Show follow-ups (mode-specific keys)
            var followUps = data.legal_follow_ups || data.clinical_follow_ups || data.suggested_follow_ups || [];
            var followUpsLabel = data.legal_follow_ups ? 'Legal follow-ups:' : (data.clinical_follow_ups ? 'Clinical follow-ups:' : 'Suggested follow-ups:');
            const followUpsEl = document.getElementById('scribeFollowUps');
            if (followUpsEl && followUps.length > 0) {
                followUpsEl.innerHTML = '<strong>' + followUpsLabel + '</strong><ul>' +
                    followUps.map(q => `<li>${q}</li>`).join('') + '</ul>';
                followUpsEl.style.display = 'block';
            }
            // Show export buttons if there is content to export
            const exportRowEl = document.getElementById('scribeExportRow');
            const hasSummary = scribeSummaryEl && scribeSummaryEl.value.trim();
            const hasTranscript = scribeUtterancesEl && scribeUtterancesEl.value.trim();
            if (exportRowEl) exportRowEl.style.display = (hasSummary || hasTranscript) ? 'block' : 'none';
        };

        // ── Scribe export helpers ──────────────────────────────────────
        const _scribeExportTitle = () => {
            if (this.mode === 'legal_intelligence') return 'Legal Scribe — IRAC Analysis';
            if (this.mode === 'health') return 'Health Scribe — SOAP Notes';
            return 'Cami Scribe';
        };
        const _scribeExportFilename = (ext) => {
            const modeTag = this.mode === 'legal_intelligence' ? 'legal' : (this.mode === 'health' ? 'health' : 'general');
            const date = new Date().toISOString().slice(0, 10);
            return 'cami-scribe-' + modeTag + '-' + date + '.' + ext;
        };
        const _scribeExportContent = () => {
            const summary = (scribeSummaryEl && scribeSummaryEl.value.trim()) || '';
            const transcript = (scribeUtterancesEl && scribeUtterancesEl.value.trim()) || '';
            const title = _scribeExportTitle();
            const sep = '='.repeat(60);
            const sections = [];
            sections.push(sep);
            sections.push(title);
            sections.push('Generated: ' + new Date().toLocaleString());
            sections.push(sep);
            if (summary) {
                sections.push('');
                var summaryLabel = this.mode === 'legal_intelligence' ? 'IRAC ANALYSIS' : (this.mode === 'health' ? 'SOAP NOTES' : 'SESSION SUMMARY');
                sections.push(summaryLabel);
                sections.push('-'.repeat(summaryLabel.length));
                sections.push(summary);
            }
            if (transcript) {
                sections.push('');
                sections.push('TRANSCRIPT');
                sections.push('-'.repeat('TRANSCRIPT'.length));
                sections.push(transcript);
            }
            // Follow-ups
            const followUpsContainer = document.getElementById('scribeFollowUps');
            if (followUpsContainer && followUpsContainer.style.display !== 'none') {
                const items = Array.from(followUpsContainer.querySelectorAll('li')).map(li => '  - ' + li.textContent);
                if (items.length) {
                    sections.push('');
                    sections.push('FOLLOW-UPS');
                    sections.push('-'.repeat('FOLLOW-UPS'.length));
                    sections.push(items.join('\n'));
                }
            }
            sections.push('');
            sections.push(sep);
            sections.push('Generated by Cami Scribe — https://usecami.com');
            return sections.join('\n');
        };
        const _triggerDownload = (blob, filename) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
        };
        const scribeExportTxtBtn = document.getElementById('scribeExportTxt');
        const scribeExportPdfBtn = document.getElementById('scribeExportPdf');
        if (scribeExportTxtBtn) {
            scribeExportTxtBtn.addEventListener('click', () => {
                const text = _scribeExportContent();
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                _triggerDownload(blob, _scribeExportFilename('txt'));
            });
        }
        if (scribeExportPdfBtn) {
            scribeExportPdfBtn.addEventListener('click', () => {
                const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
                if (!jsPDFClass) {
                    alert('PDF library not loaded. Please try again or use the .txt export.');
                    return;
                }
                const doc = new jsPDFClass({ unit: 'mm', format: 'a4' });
                const pageW = doc.internal.pageSize.getWidth();
                const margin = 15;
                const maxW = pageW - margin * 2;
                let y = margin;
                const lineH = 5;

                const addText = (text, fontSize, isBold) => {
                    doc.setFontSize(fontSize);
                    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                    const lines = doc.splitTextToSize(text, maxW);
                    for (let i = 0; i < lines.length; i++) {
                        if (y + lineH > doc.internal.pageSize.getHeight() - margin) {
                            doc.addPage();
                            y = margin;
                        }
                        doc.text(lines[i], margin, y);
                        y += lineH;
                    }
                };
                const addGap = (mm) => { y += mm; };

                // Title
                addText(_scribeExportTitle(), 16, true);
                addGap(2);
                addText('Generated: ' + new Date().toLocaleString(), 9, false);
                addGap(4);
                doc.setDrawColor(180);
                doc.line(margin, y, pageW - margin, y);
                addGap(6);

                // Summary section
                const summary = (scribeSummaryEl && scribeSummaryEl.value.trim()) || '';
                if (summary) {
                    var sLabel = this.mode === 'legal_intelligence' ? 'IRAC Analysis' : (this.mode === 'health' ? 'SOAP Notes' : 'Session Summary');
                    addText(sLabel, 13, true);
                    addGap(2);
                    addText(summary, 10, false);
                    addGap(6);
                }

                // Transcript section
                const transcript = (scribeUtterancesEl && scribeUtterancesEl.value.trim()) || '';
                if (transcript) {
                    addText('Transcript', 13, true);
                    addGap(2);
                    addText(transcript, 9, false);
                    addGap(6);
                }

                // Follow-ups
                const followUpsContainer = document.getElementById('scribeFollowUps');
                if (followUpsContainer && followUpsContainer.style.display !== 'none') {
                    const items = Array.from(followUpsContainer.querySelectorAll('li')).map(li => li.textContent);
                    if (items.length) {
                        addText('Follow-ups', 13, true);
                        addGap(2);
                        items.forEach(item => addText('  \u2022 ' + item, 10, false));
                        addGap(6);
                    }
                }

                // Footer
                doc.setDrawColor(180);
                doc.line(margin, y, pageW - margin, y);
                addGap(4);
                addText('Generated by Cami Scribe \u2014 https://usecami.com', 8, false);

                doc.save(_scribeExportFilename('pdf'));
            });
        }

        const setScribeUploadStatus = (text, isError) => {
            const el = document.getElementById('scribeUploadStatus');
            if (el) {
                el.textContent = text || '';
                el.classList.toggle('error', !!isError);
            }
        };
        // Helper: pick the best supported MIME type for MediaRecorder and return {mime, ext}
        const _scribeMimePrefs = [
            { mime: 'audio/webm;codecs=opus', ext: 'webm' },
            { mime: 'audio/webm', ext: 'webm' },
            { mime: 'audio/mp4', ext: 'mp4' },
            { mime: 'audio/aac', ext: 'aac' },
            { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
            { mime: 'audio/wav', ext: 'wav' },
        ];
        function _pickRecordingMime() {
            if (typeof MediaRecorder === 'undefined') return null;
            for (const p of _scribeMimePrefs) {
                try { if (MediaRecorder.isTypeSupported(p.mime)) return p; } catch (_) {}
            }
            return null; // let the browser pick its default
        }
        let _scribeActiveMime = null; // set when recording starts

        if (scribeRecordBtn) {
            scribeRecordBtn.addEventListener('click', async () => {
                if (scribeMediaRecorder && scribeMediaRecorder.state === 'recording') {
                    setScribeRecordState(false, 'Stopping…', false);
                    scribeRecordBtn.disabled = true;
                    // Wait for MediaRecorder to flush all data and stop before building the blob
                    const blob = await new Promise((resolve) => {
                        scribeMediaRecorder.onstop = () => {
                            // Release mic tracks
                            try { scribeMediaRecorder.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
                            const blobType = (_scribeActiveMime && _scribeActiveMime.mime) || scribeMediaRecorder.mimeType || 'audio/webm';
                            const b = new Blob(scribeRecordedChunks, { type: blobType });
                            scribeRecordedChunks = [];
                            resolve(b);
                        };
                        scribeMediaRecorder.stop();
                    });
                    if (!blob || blob.size === 0) {
                        setScribeRecordState(false, 'No audio captured. Try recording again.', true);
                        scribeRecordBtn.disabled = false;
                        return;
                    }
                    setScribeRecordState(false, 'Transcribing…', false);
                    try {
                        const ext = (_scribeActiveMime && _scribeActiveMime.ext) || 'webm';
                        const scribeData = await uploadScribeAudio(blob, 'recording.' + ext);
                        populateScribeFromResponse(scribeData);
                        setScribeRecordState(false, 'Done. You can record again or use the transcript below.', false);
                    } catch (err) {
                        setScribeRecordState(false, err.message || 'Transcription failed', true);
                    }
                    scribeRecordBtn.disabled = false;
                    return;
                }
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    _scribeActiveMime = _pickRecordingMime();
                    const recorderOpts = _scribeActiveMime ? { mimeType: _scribeActiveMime.mime } : {};
                    scribeMediaRecorder = new MediaRecorder(stream, recorderOpts);
                    scribeRecordedChunks = [];
                    scribeMediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) scribeRecordedChunks.push(e.data); };
                    scribeMediaRecorder.start(200);
                    setScribeRecordState(true, 'Recording…', false);
                } catch (err) {
                    setScribeRecordState(false, err.message || 'Microphone access denied', true);
                }
            });
        }
        const scribeUploadInput = document.getElementById('scribeUploadInput');
        const scribeUploadBtn = document.getElementById('scribeUploadBtn');
        if (scribeUploadBtn && scribeUploadInput) {
            scribeUploadBtn.addEventListener('click', () => scribeUploadInput.click());
            scribeUploadInput.addEventListener('change', async () => {
                const file = scribeUploadInput.files && scribeUploadInput.files[0];
                if (!file) return;
                scribeUploadBtn.disabled = true;
                setScribeUploadStatus('Transcribing…', false);
                try {
                    const scribeData = await uploadScribeAudio(file, file.name);
                    populateScribeFromResponse(scribeData);
                    setScribeUploadStatus('Done. Transcript added below.', false);
                } catch (err) {
                    setScribeUploadStatus(err.message || 'Transcription failed', true);
                }
                scribeUploadBtn.disabled = false;
                scribeUploadInput.value = '';
            });
        }
        if (scribeBtn) scribeBtn.addEventListener('click', openScribeModal);
        if (scribeBackdrop) scribeBackdrop.addEventListener('click', closeScribeModal);
        if (scribeCancelBtn) scribeCancelBtn.addEventListener('click', closeScribeModal);
        if (scribeUseBtn) {
            scribeUseBtn.addEventListener('click', () => {
                const summary = scribeSummaryEl ? scribeSummaryEl.value.trim() : '';
                const rawLines = scribeUtterancesEl ? scribeUtterancesEl.value.trim().split(/\n/) : [];
                const utterances = rawLines
                    .map(line => line.trim())
                    .filter(Boolean)
                    .slice(0, 50)
                    .map(line => {
                        const match = line.match(/^(.*?)\s*\[([^\]]+)\]$/);
                        if (match) return { text: match[1].trim(), emotion: match[2].trim() };
                        return { text: line };
                    });
                this.scribeResult = {};
                if (summary) this.scribeResult.session_summary = summary;
                if (utterances.length) this.scribeResult.utterances_with_emotions = utterances;
                if (Object.keys(this.scribeResult).length === 0) this.scribeResult = null;
                closeScribeModal();
                if (scribeBadge) scribeBadge.style.display = this.scribeResult ? 'inline' : 'none';
            });
        }

        // Load chat history
        this.updateChatHistory();
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;
        
        // Hide welcome screen
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'none';
        }
        
        // Add user message
        this.addMessage('user', message);
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        // Show typing indicator
        const typingId = this.showTypingIndicator();
        
        // Disable input
        this.setProcessing(true);
        
        const maxAttempts = 3;
        const retryDelayMs = 4000;
        let lastError = null;
        let data = null;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const analyzeUrl = getAnalyzeUrl(this.mode);
                const body = {
                    question: message,
                    context: {
                        mode: this.mode,
                        source: 'web_chat',
                        conversation_history: this.messages.slice(0, -1)
                    }
                };
                if (this.scribeResult) {
                    body.scribe_result = this.scribeResult;
                }
                if (this.mode === 'health' && this.healthFocus) {
                    body.health_focus = this.healthFocus;
                }
                const headers = {
                    'Content-Type': 'application/json',
                    'api-key': 'demo_key_123',
                    'X-API-Key': 'demo_key_123'
                };
                // Pass Supabase JWT if user is logged in (enables per-user MIN memory)
                const authToken = _getCamiAuthToken();
                if (authToken) {
                    headers['Authorization'] = 'Bearer ' + authToken;
                }
                const response = await fetch(analyzeUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body)
                });
                
                if (response.status === 503 && attempt < maxAttempts) {
                    lastError = new Error('Cami is still waking up');
                    lastError.response = response;
                    await new Promise(r => setTimeout(r, retryDelayMs));
                    continue;
                }

                // Rate limit or access denied — don't retry, surface to UI
                if (response.status === 403) {
                    const errorData = await response.json().catch(() => ({}));
                    if (errorData.error === 'limit_reached') {
                        const error = new Error(errorData.message || 'Usage limit reached. Sign up for more access.');
                        error.limitReached = true;
                        error.response = response;
                        error.data = errorData;
                        throw error;
                    }
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch (e) {
                        errorData = { detail: errorText || `HTTP ${response.status}` };
                    }
                    const error = new Error(errorData.detail || `API error: ${response.status}`);
                    error.response = response;
                    error.data = errorData;
                    throw error;
                }
                
                data = await response.json();
                lastError = null;
                break;
            } catch (error) {
                if (error.response && error.response.status === 503 && attempt < maxAttempts) {
                    lastError = error;
                    await new Promise(r => setTimeout(r, retryDelayMs));
                    continue;
                }
                lastError = error;
                break;
            }
        }
        
        this.removeTypingIndicator(typingId);
        
        if (data) {
            this.addAssistantMessage(data);
            if (this.scribeResult) {
                this.scribeResult = null;
                const scribeBadge = document.getElementById('scribeContextBadge');
                if (scribeBadge) scribeBadge.style.display = 'none';
            }
        } else {
            let errorMessage = lastError ? `Error: ${lastError.message}` : 'Request failed';
            let is503 = false;
            // Rate limit reached — show signup prompt instead of error
            if (lastError && lastError.limitReached) {
                errorMessage = "Usage limit reached. [Sign up](/login) to continue using Cami.";
                this.addMessage('assistant', errorMessage);
                this.isProcessing = false;
                this.sendBtn.disabled = false;
                return;
            }
            if (lastError && lastError.response) {
                try {
                    const errorData = lastError.data || (await lastError.response.json().catch(() => ({})));
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Error ${lastError.response.status}: ${lastError.response.statusText || lastError.message}`;
                }
                if (lastError.response.status === 503) is503 = true;
            }
            if (is503) {
                errorMessage = "Cami is still waking up. Try again in a few seconds—your message wasn't lost.";
            }
            this.addMessage('assistant', errorMessage);
        }
        
        this.setProcessing(false);
    }
    
    /** Render a message bubble in the DOM (no state change). */
    renderMessageToDOM(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (role === 'assistant') {
            const img = document.createElement('img');
            img.src = '/static/favicon.svg';
            img.alt = 'Cami';
            img.className = 'message-avatar-img';
            avatar.appendChild(img);
        } else {
            // Clean SVG user icon instead of emoji
            avatar.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        }
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const safeContent = (content == null) ? '' : String(content);
        const lines = safeContent.split('\n');
        lines.forEach((line, index) => {
            if (line.trim() || index < lines.length - 1) {
                const p = document.createElement('p');
                p.innerHTML = renderMarkdownLine(line || '') || '\u00A0';
                messageContent.appendChild(p);
            }
        });
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }

    addMessage(role, content) {
        this.renderMessageToDOM(role, content);
        this.messages.push({ role, content });
        this.saveConversation();
    }
    
    addAssistantMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        const img = document.createElement('img');
        img.src = '/static/favicon.svg';
        img.alt = 'Cami';
        img.className = 'message-avatar-img';
        avatar.appendChild(img);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Main answer - format with proper paragraphs and inline markdown (bold, italic, code)
        const answerText = data.answer || 'No answer provided.';
        const answerLines = answerText.split('\n');
        answerLines.forEach((line, index) => {
            if (line.trim() || index < answerLines.length - 1) {
                const p = document.createElement('p');
                p.innerHTML = renderMarkdownLine(line || '') || '\u00A0';
                messageContent.appendChild(p);
            }
        });
        
        // Metadata (web search badge, convergence — no confidence shown to customers)
        const hasMetadata = (Array.isArray(data.providers_used) && data.providers_used.includes('web_search')) || data.convergence_achieved;
        if (hasMetadata) {
            const metadata = document.createElement('div');
            metadata.className = 'message-metadata';
            if (Array.isArray(data.providers_used) && data.providers_used.includes('web_search')) {
                const webBadge = document.createElement('div');
                webBadge.className = 'metadata-item';
                webBadge.innerHTML = '<span>✓</span> <span>Included web search</span>';
                metadata.appendChild(webBadge);
            }
            if (data.convergence_achieved) {
                const convergence = document.createElement('div');
                convergence.className = 'metadata-item';
                convergence.innerHTML = `<span>✓</span> <span>Sources converged</span>`;
                metadata.appendChild(convergence);
            }
            messageContent.appendChild(metadata);
        }
        
        if (data.perspectives && Object.keys(data.perspectives).length > 0) {
            const perspectives = document.createElement('div');
            perspectives.className = 'perspectives';
            
            const title = document.createElement('div');
            title.className = 'perspectives-title';
            title.textContent = 'Perspectives:';
            perspectives.appendChild(title);
            
            Object.entries(data.perspectives).forEach(([id, role]) => {
                const tag = document.createElement('span');
                tag.className = 'perspective-tag';
                tag.textContent = `${id} (${role})`;
                perspectives.appendChild(tag);
            });
            
            messageContent.appendChild(perspectives);
        }
        
        // Biases
        if (data.biases_acknowledged && data.biases_acknowledged.length > 0) {
            const biases = document.createElement('div');
            biases.className = 'biases';
            
            const title = document.createElement('div');
            title.className = 'biases-title';
            title.textContent = 'Biases Identified:';
            biases.appendChild(title);
            
            data.biases_acknowledged.slice(0, 5).forEach(bias => {
                const item = document.createElement('div');
                item.className = 'bias-item';
                item.textContent = `• ${bias}`;
                biases.appendChild(item);
            });
            
            messageContent.appendChild(biases);
        }
        
        // Feedback buttons (all modes — functional data)
        const fbRow = document.createElement('div');
        fbRow.className = 'cami-feedback-row';
        fbRow.style.cssText = 'display:flex;gap:6px;margin-top:8px;';
        const msgIdx = this.messages.filter(m => m.role === 'assistant').length;
        ['positive', 'negative'].forEach(rating => {
            const btn = document.createElement('button');
            btn.className = 'cami-fb-btn';
            btn.style.cssText = 'background:none;border:1px solid var(--border, #d4e0d6);border-radius:6px;padding:3px 10px;font-size:13px;cursor:pointer;color:var(--text-secondary, #999);transition:all 0.15s;';
            btn.textContent = rating === 'positive' ? '\u2713' : '\u2717';
            btn.title = rating === 'positive' ? 'Helpful' : 'Not helpful';
            btn.addEventListener('click', () => {
                fbRow.querySelectorAll('.cami-fb-btn').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
                btn.style.opacity = '1';
                btn.style.fontWeight = '700';
                btn.style.borderColor = rating === 'positive' ? '#27ae60' : '#c0392b';
                this._submitFeedback(msgIdx, rating);
            });
            fbRow.appendChild(btn);
        });
        messageContent.appendChild(fbRow);

        // Synthesis signature — three glyphs showing what fired
        try { messageContent.appendChild(buildSynthesisSignature(data)); } catch(_){}

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        this.messages.push({ role: 'assistant', content: data.answer, data });
        this.saveConversation();
    }
    
    _submitFeedback(messageIndex, rating) {
        // Send feedback to backend — works for any mode but most useful for CS
        const chatId = new URLSearchParams(window.location.search).get('chat') || 'unknown';
        try {
            fetch('/customer-service/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: 'user_session',
                    session_id: chatId,
                    message_index: messageIndex,
                    rating: rating,
                }),
            });
        } catch (_) {}
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant';
        typingDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        const img = document.createElement('img');
        img.src = '/static/favicon.svg';
        img.alt = 'Cami';
        img.className = 'message-avatar-img';
        avatar.appendChild(img);
        
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content';
        
        // Glyph-based thinking animation instead of dead dots
        try {
            typingContent.appendChild(buildThinkingGlyphs());
        } catch(_) {
            // Fallback to classic dots if glyph build fails
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.className = 'typing-dot';
                typingIndicator.appendChild(dot);
            }
            typingContent.appendChild(typingIndicator);
        }
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(typingContent);
        
        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
        
        return 'typing-indicator';
    }
    
    removeTypingIndicator(id) {
        const indicator = document.getElementById(id);
        if (indicator) {
            // Clear the thinking steps animation interval
            const thinkingSteps = indicator.querySelector('.thinking-steps');
            if (thinkingSteps && thinkingSteps._interval) {
                clearInterval(thinkingSteps._interval);
            }
            indicator.remove();
        }
    }
    
    setProcessing(processing) {
        this.isProcessing = processing;
        this.sendBtn.disabled = processing;
        this.messageInput.disabled = processing;
        
        if (processing) {
            this.sendBtn.style.opacity = '0.5';
        } else {
            this.sendBtn.style.opacity = '1';
        }
    }
    
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    newChat() {
        this.messages = [];
        // Remove only message elements so welcome screen stays in DOM
        this.chatContainer.querySelectorAll('.message').forEach(el => el.remove());
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'flex';
        }
    }
    
    async loadStats() {
        try {
            const response = await fetch(getStatsUrl(), {
                headers: {
                    'api-key': 'demo_key_123',
                    'X-API-Key': 'demo_key_123'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Stats removed - MIN tracker moved to home page
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }
}

// Warmup: ping backend immediately when page loads to reduce cold start latency
function warmupBackend() {
    const base = getApiBase();
    // Use a lightweight health check or status endpoint
    fetch(base + '/api/status', { method: 'GET', mode: 'cors' }).catch(() => {});
    // Also warm up the analyze endpoint with an OPTIONS preflight
    const analyzeUrl = base + '/customer-service/analyze';
    fetch(analyzeUrl, { method: 'OPTIONS', mode: 'cors' }).catch(() => {});
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Start warmup immediately
    warmupBackend();
    
    const chat = new CamiChat();
    window._camiChat = chat; // Expose for app.html orchestrator
    // Re-apply Scribe visibility after a tick in case of race with styles or URL
    setTimeout(function () {
        if (chat && typeof chat.updateModeUI === 'function') chat.updateModeUI();
    }, 100);
});
