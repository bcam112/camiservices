/**
 * Cami Money dashboard: Command (prompt) + See (rail status, connections, activity).
 * All requests same-origin; uses API keys for actual connection.
 */
(function () {
    function getApiBase() {
        if (typeof window === 'undefined') return '';
        var base = (window.CAMI_API_BASE || '').toString().replace(/\/$/, '');
        if (base) return base;
        return '';
    }
    function getAnalyzeUrl() { return getApiBase() + '/cami-money/analyze'; }
    const RAIL_BASE = '/api/cami_money';

    function getApiKey() {
        return (typeof window !== 'undefined' && (window.CAMI_API_KEY || window.CAMI_MONEY_API_KEY)) || '';
    }

    function railUrl(path) {
        return RAIL_BASE + '?__path=' + encodeURIComponent(path);
    }

    function authHeaders() {
        var key = getApiKey();
        var h = { 'Content-Type': 'application/json' };
        if (key) {
            h['X-API-Key'] = key;
            h['api-key'] = key;
        }
        return h;
    }

    function railHeaders() {
        var key = getApiKey();
        var h = {};
        if (key) {
            h['X-API-Key'] = key;
            h['api-key'] = key;
        }
        return h;
    }

    const thread = document.getElementById('moneyThread');
    const welcome = document.getElementById('moneyWelcome');
    const form = document.getElementById('moneyForm');
    const input = document.getElementById('moneyInput');
    const sendBtn = document.getElementById('moneySend');
    const activityEl = document.getElementById('moneyActivity');
    const connectionsEl = document.getElementById('moneyConnections');

    function appendToThread(targetThread, welcomeEl, role, text, meta) {
        if (!targetThread) return;
        if (welcomeEl && welcomeEl.parentNode) welcomeEl.remove();
        const div = document.createElement('div');
        div.className = 'money-msg money-msg--' + (role === 'user' ? 'user' : 'cami');
        const content = role === 'cami' ? text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') : escapeHtml(text);
        div.innerHTML = (role === 'cami' ? '<strong>Cami:</strong> ' : '') + content + (meta ? '<div class="money-msg__meta">' + escapeHtml(meta) + '</div>' : '');
        targetThread.appendChild(div);
        targetThread.scrollTop = targetThread.scrollHeight;
    }

    function appendMessage(role, text, meta) {
        appendToThread(thread, welcome, role, text, meta);
    }

    function escapeHtml(s) {
        if (!s) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function addActivity(line) {
        if (!activityEl) return;
        if (activityEl.children.length === 1 && activityEl.children[0].textContent.includes('Ready.')) activityEl.innerHTML = '';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const entry = document.createElement('div');
        entry.className = 'money-activity__line';
        entry.innerHTML = '<span class="money-activity__time">' + time + '</span>' + escapeHtml(line);
        activityEl.insertBefore(entry, activityEl.firstChild);
    }

    function setRailStatus(redis, plaid) {
        const dotRedis = document.getElementById('dotRedis');
        const dotPlaid = document.getElementById('dotPlaid');
        const valRedis = document.getElementById('valRedis');
        const valPlaid = document.getElementById('valPlaid');
        if (dotRedis) {
            dotRedis.classList.toggle('money-status-dot--on', redis && redis.connected);
            dotRedis.classList.toggle('money-status-dot--off', !redis || !redis.connected);
        }
        if (valRedis) valRedis.textContent = (redis && redis.connected) ? 'Connected' : (redis && redis.message) || 'Not connected';
        if (valRedis) valRedis.className = 'money-card__value ' + ((redis && redis.connected) ? 'money-card__value--ok' : 'money-card__value--muted');
        if (dotPlaid) {
            dotPlaid.classList.toggle('money-status-dot--on', plaid && plaid.connected);
            dotPlaid.classList.toggle('money-status-dot--off', !plaid || !plaid.connected);
        }
        if (valPlaid) valPlaid.textContent = (plaid && plaid.connected) ? 'Configured' : (plaid && plaid.message) || 'Not configured';
        if (valPlaid) valPlaid.className = 'money-card__value ' + ((plaid && plaid.connected) ? 'money-card__value--ok' : 'money-card__value--muted');
    }

    function setConnections(accounts) {
        if (!connectionsEl) return;
        if (!accounts || accounts.length === 0) {
            connectionsEl.innerHTML = '<p class="money-card__empty">No accounts yet. Say &ldquo;Connect Plaid sandbox&rdquo; in Command.</p>';
            return;
        }
        let html = '';
        accounts.slice(0, 6).forEach(function (acc) {
            const name = acc.name || 'Account';
            const bal = acc.balance != null ? (typeof acc.balance === 'number' && acc.balance >= 100 ? '$' + (acc.balance / 100).toFixed(2) : '$' + (acc.balance || 0)) : '—';
            html += '<div class="money-card__row"><span class="money-card__label">' + escapeHtml(name) + '</span><span class="money-card__value">' + escapeHtml(String(bal)) + '</span></div>';
        });
        if (accounts.length > 6) html += '<div class="money-card__row"><span class="money-card__label">+ ' + (accounts.length - 6) + ' more</span><span class="money-card__value money-card__value--muted">—</span></div>';
        connectionsEl.innerHTML = html;
    }

    function fetchRailStatus() {
        var headers = railHeaders();
        Promise.all([
            fetch(railUrl('/api/aegr/redis/status'), { headers: headers }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
            fetch(railUrl('/api/aegr/plaid/status'), { headers: headers }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
        ]).then(function (arr) {
            setRailStatus(arr[0], arr[1]);
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = (input.value || '').trim();
        if (!text) return;
        input.value = '';
        sendBtn.disabled = true;
        appendMessage('user', text);
        addActivity('You: ' + text);

        var headers = authHeaders();
        fetch(getAnalyzeUrl(), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ question: text, context: { mode: 'cami_money', source: 'cami_money_dashboard' } })
        })
            .then(function (r) {
                if (!r.ok) throw new Error('Request failed');
                return r.json();
            })
            .then(function (data) {
                var answer = (data && data.answer) ? data.answer : 'No response.';
                appendMessage('cami', answer, 'Cami Money');
                addActivity('Cami: ' + answer.substring(0, 80) + (answer.length > 80 ? '…' : ''));
                if (data && data.accounts && Array.isArray(data.accounts)) setConnections(data.accounts);
                if (answer.toLowerCase().includes('connected') || (data && data.accounts)) fetchRailStatus();
            })
            .catch(function (err) {
                appendMessage('cami', 'Something went wrong: ' + (err.message || 'please try again.'), 'Error');
                addActivity('Error: ' + (err.message || 'request failed'));
            })
            .finally(function () {
                sendBtn.disabled = false;
            });
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fetchRailStatus);
    } else {
        fetchRailStatus();
    }

    // Talk money = financial assistant chat (stock broker style)
    var talkForm = document.getElementById('talkForm');
    var talkThread = document.getElementById('talkThread');
    var talkWelcome = document.getElementById('talkWelcome');
    var talkInput = document.getElementById('talkInput');
    var talkSend = document.getElementById('talkSend');
    if (talkForm && talkThread && talkInput && talkSend) {
        talkForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var text = (talkInput.value || '').trim();
            if (!text) return;
            talkInput.value = '';
            talkSend.disabled = true;
            appendToThread(talkThread, talkWelcome, 'user', text, null);
            fetch(getAnalyzeUrl(), {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ question: text, context: { mode: 'cami_money', source: 'cami_money_talk', role: 'financial_assistant' } })
            })
                .then(function (r) {
                    if (!r.ok) throw new Error('Request failed');
                    return r.json();
                })
                .then(function (data) {
                    var answer = (data && data.answer) ? data.answer : 'No response.';
                    appendToThread(talkThread, talkWelcome, 'cami', answer, 'Talk money');
                })
                .catch(function (err) {
                    appendToThread(talkThread, talkWelcome, 'cami', 'Something went wrong: ' + (err.message || 'please try again.'), 'Error');
                })
                .finally(function () {
                    talkSend.disabled = false;
                });
        });
    }
})();
