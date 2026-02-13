    console.log('🚀 Cami Money (ZDR & AEGR) — same-origin API');
    
    // All rail requests go through Cami: /api/cami_money?__path=/api/...
    // Backend is configured by CAMI_MONEY_RAIL_URL (no external links in UI).
    function railUrl(path) {
      return '/api/cami_money?__path=' + encodeURIComponent(path);
    }
    let API_BASE = ''; // not used for fetch; we use railUrl() for every request
    window.API_BASE = window.location.origin + '/api/cami_money';
    window.railUrl = railUrl;
    
    let connected = false;
    let plaidAccount = null;
    let btcWallet = null;
    let currentHoldId = null;
    let currentExchangeId = null;
    let allPlaidAccounts = [];
    let fromAccountId = null;
    let toAccountId = null;
    let exchangeSecrets = {};

    // Status logging
    function statusLog(message) {
      try {
        const log = document.getElementById('statusLog');
        if (!log) {
          console.warn('statusLog element not found');
          return;
        }
        const time = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
      } catch (e) {
        console.error('Error in statusLog:', e);
      }
    }

    // Terminal logging
    function terminalLog(message, type = 'response') {
      try {
        const terminal = document.getElementById('terminal');
        if (!terminal) {
          console.warn('terminal element not found');
          return;
        }
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        if (type === 'command') {
          line.innerHTML = `<span class="terminal-prompt">$</span> <span class="terminal-command">${message}</span>`;
        } else if (type === 'error') {
          line.innerHTML = `<span class="terminal-error">${message}</span>`;
        } else if (type === 'success') {
          line.innerHTML = `<span class="terminal-success">${message}</span>`;
        } else {
          line.innerHTML = `<span class="terminal-response">→ ${message}</span>`;
        }
        
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
      } catch (e) {
        console.error('Error in terminalLog:', e);
      }
    }
    
    // Test that functions work immediately
    console.log('✅ statusLog function defined:', typeof statusLog);
    console.log('✅ terminalLog function defined:', typeof terminalLog);

    // Check Redis status
    async function checkRedisStatus() {
      try {
        terminalLog('Checking Redis connection...', 'command');
        const response = await fetch(railUrl('/api/aegr/redis/status'));
        
        const redisStatusEl = document.getElementById('redisStatus');
        
        if (!response.ok) {
          const text = await response.text();
          terminalLog(`Redis: HTTP ${response.status}`, 'error');
          if (redisStatusEl) {
            redisStatusEl.innerHTML = 
              `<span class="status-indicator status-disconnected">❌ HTTP ${response.status}</span>`;
          }
          return;
        }
        
        // Check if response is HTML (404 page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            terminalLog('Redis: Endpoint not found (404) - check CAMI_MONEY_RAIL_URL is set', 'error');
            if (redisStatusEl) {
              redisStatusEl.innerHTML = 
                `<span class="status-indicator status-disconnected">❌ Endpoint not found</span>`;
            }
            return;
          }
        }
        
        const data = await response.json();
        
        if (data.connected) {
          if (redisStatusEl) {
            redisStatusEl.innerHTML = 
              `<span class="status-indicator status-connected">✅ ${data.message}</span>`;
          }
          terminalLog(`Redis: ${data.message}`, 'success');
        } else {
          const redisStatusEl2 = document.getElementById('redisStatus');
          if (redisStatusEl2) {
            redisStatusEl2.innerHTML = 
              `<span class="status-indicator status-disconnected">❌ ${data.message}</span>`;
          }
          terminalLog(`Redis: ${data.message}`, 'error');
        }
      } catch (error) {
        const redisStatusEl = document.getElementById('redisStatus');
        // Check if error is JSON parse error (HTML response)
        if (error.message && error.message.includes('Unexpected token')) {
          terminalLog('Redis: Endpoint returned HTML (404) - Cami Money rail URL may be unset or wrong', 'error');
          if (redisStatusEl) {
            redisStatusEl.innerHTML = 
              `<span class="status-indicator status-disconnected">❌ Endpoint not found</span>`;
          }
        } else {
          if (redisStatusEl) {
            redisStatusEl.innerHTML = 
              `<span class="status-indicator status-disconnected">❌ Connection error</span>`;
          }
          terminalLog(`Redis: Connection error - ${error.message}`, 'error');
        }
        console.error('Redis status check failed:', error);
      }
    }

    // Check Plaid status
    async function checkPlaidStatus() {
      try {
        terminalLog('Checking Plaid connection...', 'command');
        const response = await fetch(railUrl('/api/aegr/plaid/status'));
        
        const plaidStatusEl = document.getElementById('plaidStatus');
        
        if (!response.ok) {
          const text = await response.text();
          terminalLog(`Plaid: HTTP ${response.status}`, 'error');
          if (plaidStatusEl) {
            plaidStatusEl.innerHTML = 
              `<span class="status-indicator status-disconnected">❌ HTTP ${response.status}</span>`;
          }
          return;
        }
        
        // Check if response is HTML (404 page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            terminalLog('Plaid: Endpoint not found (404) - check CAMI_MONEY_RAIL_URL is set', 'error');
            if (plaidStatusEl) {
              plaidStatusEl.innerHTML = 
                `<span class="status-indicator status-disconnected">❌ Endpoint not found</span>`;
            }
            return;
          }
        }
        
        const data = await response.json();
        
        if (data.connected) {
          if (plaidStatusEl) {
            plaidStatusEl.innerHTML = 
              `<span class="status-indicator status-connected">✅ ${data.message}</span>`;
          }
          terminalLog(`Plaid: ${data.message}`, 'success');
        } else {
          const plaidStatusEl2 = document.getElementById('plaidStatus');
          if (plaidStatusEl2) {
            plaidStatusEl2.innerHTML = 
              `<span class="status-indicator status-disconnected">❌ ${data.message}</span>`;
          }
          terminalLog(`Plaid: ${data.message}`, 'error');
        }
      } catch (error) {
        const plaidStatusEl = document.getElementById('plaidStatus');
        // Check if error is JSON parse error (HTML response)
        if (error.message && error.message.includes('Unexpected token')) {
          terminalLog('Plaid: Endpoint returned HTML (404) - Cami Money rail URL may be unset or wrong', 'error');
          if (plaidStatusEl) {
            plaidStatusEl.innerHTML = 
              `<span class="status-indicator status-disconnected">❌ Endpoint not found</span>`;
          }
        } else {
          if (plaidStatusEl) {
            plaidStatusEl.innerHTML = 
              `<span class="status-indicator status-disconnected">❌ Connection error</span>`;
          }
          terminalLog(`Plaid: Connection error - ${error.message}`, 'error');
        }
        console.error('Plaid status check failed:', error);
      }
    }

    // Auto connect Plaid (demo mode) - Uses AEGR Rust backend
    async function autoConnect() {
      const btn = document.getElementById('autoConnectBtn');
      btn.disabled = true;
      btn.textContent = 'CONNECTING...';
      
      statusLog('Initializing auto-connections via Plaid Sandbox...');
      terminalLog('POST /api/demo/plaid/auto_connect', 'command');
      terminalLog('Initializing auto-connections via Plaid Sandbox...');
      
      try {
        let response = await fetch(railUrl('/api/demo/plaid/auto_connect'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          statusLog(`Connection error: ${data.error}`);
          terminalLog(`Error: ${data.error}`, 'error');
          btn.disabled = false;
          btn.textContent = 'AUTO CONNECT PLAID (DEMO)';
          return;
        }
        
        // Handle AEGR response format
        let accounts = data.accounts || [];
        if (accounts.length === 0 && data.account_id) {
          // Single account format
          accounts = [{
            id: data.account_id,
            name: data.name || 'Account',
            balance: data.balance || 10000 // Default $100 in cents
          }];
        }
        
        // Store all accounts
        allPlaidAccounts = accounts.map(acc => ({
          id: acc.id || acc.account_id,
          name: acc.name || 'Account',
          balance: (acc.balance || 0) * 100 // Ensure in cents
        }));
        
        // Use first account as default FROM
        plaidAccount = allPlaidAccounts[0] || {
          id: data.access_token || data.account_id || 'demo_account_123',
          name: data.name || 'Demo Checking Account',
          balance: 1000000 // $10,000 in cents
        };
        
        // Ensure balance is in cents format
        if (plaidAccount.balance < 1000) {
          plaidAccount.balance = plaidAccount.balance * 100; // Convert dollars to cents
        }
        
        // Update UI
        updateConnections();
        updateAccountValues();
        
        // Auto-select first account as FROM
        if (allPlaidAccounts.length > 0) {
          selectAccount(allPlaidAccounts[0].id, 'from');
          // Auto-select second account as TO if available
          if (allPlaidAccounts.length > 1) {
            selectAccount(allPlaidAccounts[1].id, 'to');
          }
        }
        
        connected = true;
        
        btn.textContent = '✓ CONNECTED';
        const accountCount = allPlaidAccounts.length;
        statusLog(`Connected ${accountCount} sandbox account(s) - no Plaid Link required`);
        terminalLog(`Connected ${accountCount} sandbox account(s) - no Plaid Link required`, 'success');
        terminalLog(`Plaid connected: ${accountCount} sandbox account(s)`, 'success');
        
      } catch (error) {
        statusLog(`Connection error: ${error.message}`);
        terminalLog(`Error: ${error.message}`, 'error');
        btn.disabled = false;
        btn.textContent = 'AUTO CONNECT PLAID (DEMO)';
      }
    }

    // Connect BTC wallet (demo mode)
    async function connectBTC() {
      const btn = document.getElementById('btcConnectBtn');
      btn.disabled = true;
      btn.textContent = 'CONNECTING...';
      
      statusLog('Connecting BTC wallet (demo mode)...');
      terminalLog('Connecting BTC wallet (demo mode)...', 'command');
      
      // Simulate BTC wallet connection
      setTimeout(() => {
        // Generate demo BTC address
        const demoAddress = 'bc1q' + Array.from(crypto.getRandomValues(new Uint8Array(20)))
          .map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
        
        // Demo BTC balance (random between 0.1 and 1.0 BTC)
        const demoBalance = (0.1 + Math.random() * 0.9).toFixed(8);
        
        btcWallet = {
          address: demoAddress,
          balance: parseFloat(demoBalance),
          balanceSats: Math.round(parseFloat(demoBalance) * 100000000)
        };
        
        document.getElementById('btcWalletStatus').style.display = 'block';
        document.getElementById('btcAddress').textContent = btcWallet.address;
        document.getElementById('btcBalance').textContent = `${btcWallet.balance} BTC`;
        
        if (!connected) {
          updateCryptoDisplay();
          document.getElementById('holdBtn').disabled = false;
        }
        
        btn.textContent = '✓ CONNECTED';
        statusLog(`BTC wallet connected: ${btcWallet.address.substring(0, 16)}...`);
        terminalLog(`BTC Wallet: ${btcWallet.address}`, 'success');
        terminalLog(`Balance: ${btcWallet.balance} BTC`, 'success');
        
        updateCryptoDisplay();
        connected = true;
      }, 1000);
    }

    // Update amount field based on selected inbound asset
    function updateAmountForAsset() {
      const inboundAsset = document.getElementById('inboundAsset').value;
      const amountInput = document.getElementById('exchangeAmount');
      
      // Set default amounts based on asset type
      switch(inboundAsset) {
        case 'tCO2e':
          amountInput.value = '2.5';
          break;
        case 'BTC':
          amountInput.value = '1';
          break;
        case 'USD':
        case 'USDC':
          amountInput.value = '50';
          break;
        case 'MXN':
          amountInput.value = '1000';
          break;
        default:
          amountInput.value = '50';
      }
      
      // Trigger calculation after updating amount
      calculateExchange();
    }

    // Calculate exchange (using AEGR rail's fee calculation) - KEEPS REVENUE MODEL
    async function calculateExchange() {
      const amount = parseFloat(document.getElementById('exchangeAmount').value) || 0;
      const inboundAsset = document.getElementById('inboundAsset').value;
      const targetAsset = document.getElementById('targetAsset').value;
      
      if (amount <= 0) return;
      
      // Convert to cents for API
      const amountCents = Math.round(amount * 100);
      
      try {
        // Get fee calculation from AEGR rail
        let feeResponse;
        let feeData;
        
        try {
          feeResponse = await fetch(railUrl('/api/demo/fee/calculate?amount=' + amount));
          feeData = await feeResponse.json();
        } catch (e) {
          // Use default calculation if endpoint unavailable
          feeData = {};
        }
        
        // AEGR Revenue Model: Fee (0.25%) + Spread (0.1%) = Total Revenue
        const feeCents = feeData.fee_cents || Math.round(amount * 0.0025 * 100); // 0.25% fee
        const spreadCents = feeData.spread_cents || Math.round(amount * 0.001 * 100); // 0.1% spread
        const aegrRevenue = feeCents + spreadCents; // Total AEGR revenue
        
        // Simple exchange rate (demo - in production this would come from AEGR exchange)
        let exchangeRate = 1.0;
        if (inboundAsset === 'BTC' && targetAsset === 'USD') exchangeRate = 50000.0;
        else if (inboundAsset === 'USD' && targetAsset === 'BTC') exchangeRate = 1.0 / 50000.0;
        else if (inboundAsset === 'MXN' && targetAsset === 'USD') exchangeRate = 0.05;
        else if (inboundAsset === 'USD' && targetAsset === 'MXN') exchangeRate = 20.0;
        else if (inboundAsset === 'tCO2e' && targetAsset === 'USD') exchangeRate = 80.0; // 1 tCO2e = $80
        else if (inboundAsset === 'USD' && targetAsset === 'tCO2e') exchangeRate = 1.0 / 80.0;
        else if (inboundAsset === 'tCO2e' && targetAsset === 'BTC') exchangeRate = 80.0 / 50000.0;
        else if (inboundAsset === 'BTC' && targetAsset === 'tCO2e') exchangeRate = 50000.0 / 80.0;
        
        const outboundBeforeFee = Math.round(amount * exchangeRate * 100);
        const netOutbound = outboundBeforeFee - feeCents - spreadCents; // Subtract both fee and spread
        
        document.getElementById('inboundAmount').textContent = formatAmount(amountCents, inboundAsset);
        document.getElementById('exchangeRate').textContent = exchangeRate.toFixed(4);
        document.getElementById('outboundBeforeFee').textContent = formatAmount(outboundBeforeFee, targetAsset);
        document.getElementById('feeValue').textContent = formatAmount(feeCents, targetAsset);
        document.getElementById('spreadRevenue').textContent = formatAmount(spreadCents, targetAsset);
        document.getElementById('netOutbound').textContent = formatAmount(netOutbound, targetAsset);
        document.getElementById('aegrRevenue').textContent = formatAmount(aegrRevenue, targetAsset);
        
        terminalLog(`GET /api/demo/fee/calculate?amount=${amount}`, 'command');
        terminalLog(`Exchange: ${inboundAsset} → ${targetAsset} | Rate: ${exchangeRate.toFixed(4)} | Fee: ${formatAmount(feeCents, targetAsset)} | Spread: ${formatAmount(spreadCents, targetAsset)} | AEGR Revenue: ${formatAmount(aegrRevenue, targetAsset)}`);
      } catch (error) {
        terminalLog(`Error calculating exchange: ${error.message}`, 'error');
      }
    }

    // Step 1: Hold inbound asset - Uses AEGR backend
    async function holdAsset() {
      if (!connected) {
        statusLog('Please connect first');
        return;
      }
      
      const amount = parseFloat(document.getElementById('exchangeAmount').value) || 0;
      const inboundAsset = document.getElementById('inboundAsset').value;
      if (amount <= 0) {
        statusLog('Please enter a valid amount');
        return;
      }
      
      const btn = document.getElementById('holdBtn');
      btn.disabled = true;
      btn.textContent = 'HOLDING...';
      
      statusLog(`Holding ${formatAmount(Math.round(amount * 100), inboundAsset)} in AEGR escrow (zero reserves model)`);
      terminalLog(`POST /api/aegr/hold`, 'command');
      
      try {
        // Convert amount based on asset type
        let amountValue;
        if (inboundAsset === 'BTC') {
          // For BTC, amount is in BTC (convert to satoshis)
          amountValue = Math.round(amount * 100000000);
        } else if (inboundAsset === 'tCO2e' || inboundAsset === 'CARBON') {
          // For carbon, amount is in tons (convert to 1000s of grams for precision)
          amountValue = Math.round(amount * 1000); // Store as kg (1000g per kg, 1000kg per ton)
        } else {
          // For fiat, amount is in dollars (convert to cents)
          amountValue = Math.round(amount * 100);
        }
        
        // Build rail_payload with account info
        let railPayload = {
          participant_id: btcWallet?.address || plaidAccount?.id || 'demo_user_123'
        };
        
        // Add Plaid account info if available
        if (plaidAccount && plaidAccount.id) {
          railPayload.account_id = plaidAccount.id;
          railPayload.account_name = plaidAccount.name;
        }
        
        // Add BTC wallet info if available
        if (btcWallet && btcWallet.address) {
          railPayload.btc_address = btcWallet.address;
        }
        
        // Determine rail type
        let railType = 'ach';
        if (inboundAsset === 'BTC') railType = 'bitcoin';
        else if (inboundAsset === 'tCO2e' || inboundAsset === 'CARBON') railType = 'verra';
        
        // Determine currency
        let currency = 'USD';
        if (inboundAsset === 'BTC') currency = 'BTC';
        else if (inboundAsset === 'tCO2e' || inboundAsset === 'CARBON') currency = 'tCO2e';
        
        const request = {
          asset: inboundAsset,
          amount: amountValue,
          currency: currency,
          rail: railType,
          rail_payload: railPayload
        };
        
        const response = await fetch(railUrl('/api/aegr/hold'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        
        const data = await response.json();
        
        if (data.error) {
          statusLog(`Error: ${data.error}`);
          terminalLog(`Error: ${data.error}`, 'error');
          btn.disabled = false;
          btn.textContent = '1. HOLD INBOUND';
          return;
        }
        
        currentHoldId = data.hold_id;
        statusLog(`Asset held in AEGR escrow: ${data.hold_id}`);
        terminalLog(`Hold ID: ${data.hold_id}`, 'success');
        terminalLog(`Custody TX: ${data.custody_tx || data.hold_id}`);
        
        // Deduct inbound asset from source based on asset type
        if (['USD', 'EUR', 'MXN'].includes(inboundAsset) && fromAccountId && allPlaidAccounts.length > 0) {
          const fromAcc = allPlaidAccounts.find(a => a.id === fromAccountId);
          if (fromAcc) {
            const amountCents = Math.round(amount * 100);
            fromAcc.balance = Math.max(0, fromAcc.balance - amountCents);
            document.getElementById('fromBalanceFiat').textContent = `$${(fromAcc.balance / 100).toFixed(2)}`;
            document.getElementById('fromAccountFiat').textContent = `${fromAcc.name || 'Account'} - ${fromAcc.id.substring(0, 20)}...`;
            statusLog(`  Fiat FROM Balance: $${(fromAcc.balance / 100).toFixed(2)}`);
            terminalLog(`  Fiat FROM Balance: $${(fromAcc.balance / 100).toFixed(2)}`);
          }
        } else if (inboundAsset === 'BTC' && btcWallet) {
          // Deduct from BTC wallet
          const currentBalance = typeof btcWallet.balance === 'number' ? btcWallet.balance : parseFloat(btcWallet.balance);
          const newBalance = Math.max(0, currentBalance - amount);
          btcWallet.balance = newBalance;
          btcWallet.balanceSats = Math.round(newBalance * 100000000);
          const balanceStr = newBalance.toFixed(8);
          document.getElementById('btcBalance').textContent = `${balanceStr} BTC`;
          document.getElementById('fromBalanceCrypto').textContent = `${balanceStr} BTC`;
          document.getElementById('fromAccountCrypto').textContent = `BTC Wallet: ${btcWallet.address.substring(0, 16)}...`;
          statusLog(`  Crypto FROM Balance: ${balanceStr} BTC`);
          terminalLog(`  Crypto FROM Balance: ${balanceStr} BTC`);
        } else if (['tCO2e', 'CARBON'].includes(inboundAsset)) {
          // Carbon credits are held, show in carbon display
          const carbonAmount = amountValue / 1000; // Convert kg to tons
          document.getElementById('fromBalanceCarbon').textContent = `${carbonAmount.toFixed(3)} tCO₂e`;
          statusLog(`  Carbon FROM: ${carbonAmount.toFixed(3)} tCO₂e held in escrow`);
          terminalLog(`  Carbon FROM: ${carbonAmount.toFixed(3)} tCO₂e held in escrow`);
        }
        
        document.getElementById('exchangeStatus').style.display = 'block';
        document.getElementById('currentExchangeId').textContent = `Hold: ${data.hold_id}`;
        document.getElementById('currentExchangeStatus').textContent = 'Asset held in escrow (zero reserves)';
        
        document.getElementById('exchangeBtn').disabled = false;
        btn.textContent = '✓ HELD';
        
        // Update displays after hold
        if (inboundAsset === 'BTC') {
          updateCryptoDisplay();
        }
        
        refreshHolds();
        
      } catch (error) {
        statusLog(`Error: ${error.message}`);
        terminalLog(`Error: ${error.message}`, 'error');
        btn.disabled = false;
        btn.textContent = '1. HOLD INBOUND';
      }
    }

    // Step 2: Match and exchange (AEGR IS THE EXCHANGE) - KEEPS REVENUE MODEL
    async function matchAndExchange() {
      if (!currentHoldId) {
        statusLog('Please hold an asset first');
        return;
      }
      
      const targetAsset = document.getElementById('targetAsset').value;
      const btn = document.getElementById('exchangeBtn');
      btn.disabled = true;
      btn.textContent = 'EXCHANGING...';
      
      statusLog(`AEGR matching and exchanging: ${currentHoldId} → ${targetAsset}`);
      terminalLog(`POST /api/aegr/exchange`, 'command');
      terminalLog(`AEGR IS THE EXCHANGE - matching and calculating fees + spread (Revenue Model)`);
      
      try {
        const request = {
          inbound_hold_id: currentHoldId,
          target_asset: targetAsset,
          target_currency: targetAsset === 'BTC' ? 'BTC' : 'USD'
        };
        
        const response = await fetch(railUrl('/api/aegr/exchange'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        
        const data = await response.json();
        
        if (data.error) {
          statusLog(`Error: ${data.error}`);
          terminalLog(`Error: ${data.error}`, 'error');
          btn.disabled = false;
          btn.textContent = '2. EXCHANGE';
          return;
        }
        
        currentExchangeId = data.exchange_id;
        statusLog(`Exchange matched: ${data.exchange_id}`);
        terminalLog(`Exchange ID: ${data.exchange_id}`, 'success');
        // Format net outbound with proper unit conversion
        const netOutboundFormatted = formatAmount(data.net_outbound, targetAsset);
        terminalLog(`Net Outbound: ${netOutboundFormatted}`);
        document.getElementById('netOutbound').textContent = netOutboundFormatted;
        terminalLog(`Fee: ${formatAmount(data.fee_amount, targetAsset)}`);
        if (data.proof) {
          terminalLog(`Merkle Proof: ${data.proof.substring(0, 16)}...`);
        }
        
        // Calculate spread revenue (AEGR Revenue Model)
        const spreadAmount = data.spread_amount || Math.round(data.net_outbound * 0.001);
        const totalRevenue = (data.fee_amount || 0) + spreadAmount;
        
        document.getElementById('currentExchangeId').textContent = `Exchange: ${data.exchange_id}`;
        document.getElementById('currentExchangeStatus').textContent = 
          `Matched! Net: ${formatAmount(data.net_outbound, targetAsset)} | Fee: ${formatAmount(data.fee_amount, targetAsset)} | Spread: ${formatAmount(spreadAmount, targetAsset)} | AEGR Revenue: ${formatAmount(totalRevenue, targetAsset)}`;
        
        document.getElementById('settleBtn').disabled = false;
        btn.textContent = '✓ EXCHANGED';
        
        refreshExchanges();
        
      } catch (error) {
        statusLog(`Error: ${error.message}`);
        terminalLog(`Error: ${error.message}`, 'error');
        btn.disabled = false;
        btn.textContent = '2. EXCHANGE';
      }
    }

    // Step 3: Settle exchange
    async function settleExchange() {
      if (!currentExchangeId) {
        statusLog('Please create an exchange first');
        return;
      }
      
      const btn = document.getElementById('settleBtn');
      btn.disabled = true;
      btn.textContent = 'SETTLING...';
      
      statusLog(`Settling exchange: ${currentExchangeId} (forwarding from escrow, not reserves)`);
      terminalLog(`POST /api/aegr/settle/${currentExchangeId}`, 'command');
      
      try {
        const response = await fetch(railUrl('/api/aegr/settle/' + currentExchangeId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.error) {
          statusLog(`Error: ${data.error}`);
          terminalLog(`Error: ${data.error}`, 'error');
          btn.disabled = false;
          btn.textContent = '3. SETTLE';
          return;
        }
        
        // Extract MT payment ID if it's an MT transaction (only for fiat assets)
        const outboundAsset = data.outbound_asset || document.getElementById('targetAsset').value;
        const mtPaymentId = (data.release_tx && data.release_tx.startsWith('mt_') && ['USD', 'EUR', 'MXN'].includes(outboundAsset)) ? data.release_tx : null;
        
        const finalAsset = data.outbound_asset || document.getElementById('targetAsset').value;
        const finalAmountFormatted = formatAmount(data.final_amount, finalAsset);
        
        statusLog(`✓ AEGR RAIL SUCCESS`);
        statusLog(`  Exchange: ${data.inbound_asset || document.getElementById('inboundAsset').value} → ${finalAsset}`);
        statusLog(`  Final Amount: ${finalAmountFormatted}`);
        statusLog(`  Finality: ${currentExchangeId}`);
        statusLog(`  Release TX: ${data.release_tx}`);
        
        terminalLog(`✓ AEGR RAIL SUCCESS`, 'success');
        terminalLog(`Settlement successful`, 'success');
        terminalLog(`  Exchange: ${data.inbound_asset || document.getElementById('inboundAsset').value} → ${finalAsset}`, 'success');
        terminalLog(`  Final Amount: ${finalAmountFormatted}`, 'success');
        terminalLog(`  Finality: ${currentExchangeId}`);
        terminalLog(`  Release TX: ${data.release_tx}`);
        
        // Log asset-specific movement details
        if (mtPaymentId) {
          statusLog(`  → Fiat Movement: Modern Treasury Payment ${mtPaymentId}`);
          terminalLog(`  → Fiat Movement: Modern Treasury Payment ${mtPaymentId}`, 'success');
        } else if (finalAsset === 'BTC') {
          statusLog(`  → Crypto Movement: On-chain BTC transfer`);
          terminalLog(`  → Crypto Movement: On-chain BTC transfer`, 'success');
        } else if (['tCO2e', 'CARBON'].includes(finalAsset)) {
          statusLog(`  → Carbon Movement: Verra Registry transaction`);
          terminalLog(`  → Carbon Movement: Verra Registry transaction`, 'success');
        }
        // Get asset types from response (already declared above)
        const inboundAsset = data.inbound_asset || document.getElementById('inboundAsset').value;
        // outboundAsset already declared above, don't redeclare
        
        // Update balances ONLY for the correct asset types
        // Deduct from inbound asset source
        if (['USD', 'EUR', 'MXN'].includes(inboundAsset) && fromAccountId && allPlaidAccounts.length > 0) {
          const fromAcc = allPlaidAccounts.find(a => a.id === fromAccountId);
          if (fromAcc) {
            const inboundAmount = parseFloat(document.getElementById('exchangeAmount').value) || 0;
            const fee = inboundAmount * 0.0025; // 0.25% fee
            fromAcc.balance = Math.max(0, fromAcc.balance - Math.round(inboundAmount * 100) - Math.round(fee * 100));
            document.getElementById('fromBalanceFiat').textContent = `$${(fromAcc.balance / 100).toFixed(2)}`;
            document.getElementById('fromAccountFiat').textContent = `${fromAcc.name || 'Account'} - ${fromAcc.id.substring(0, 20)}...`;
            statusLog(`  Fiat FROM Balance: $${(fromAcc.balance / 100).toFixed(2)}`);
            terminalLog(`  Fiat FROM Balance: $${(fromAcc.balance / 100).toFixed(2)}`);
          }
        } else if (inboundAsset === 'BTC' && btcWallet) {
          // BTC wallet balance already deducted in hold step, just update display
          const balanceStr = typeof btcWallet.balance === 'number' ? btcWallet.balance.toFixed(8) : parseFloat(btcWallet.balance).toFixed(8);
          document.getElementById('fromBalanceCrypto').textContent = `${balanceStr} BTC`;
          document.getElementById('fromAccountCrypto').textContent = `BTC Wallet: ${btcWallet.address.substring(0, 16)}...`;
          statusLog(`  Crypto FROM Balance: ${balanceStr} BTC`);
          terminalLog(`  Crypto FROM Balance: ${balanceStr} BTC`);
        } else if (['tCO2e', 'CARBON'].includes(inboundAsset)) {
          // Carbon credits were held, show deduction
          const carbonAmount = data.final_amount / 1000; // Convert kg to tons (approximate)
          document.getElementById('fromBalanceCarbon').textContent = `0.000 tCO₂e`;
          document.getElementById('fromAccountCarbon').textContent = 'Carbon credit retired/transferred';
          statusLog(`  Carbon FROM: ${carbonAmount.toFixed(3)} tCO₂e retired/transferred`);
          terminalLog(`  Carbon FROM: ${carbonAmount.toFixed(3)} tCO₂e retired/transferred`);
        }
        
        // Add to outbound asset destination
        if (['USD', 'EUR', 'MXN'].includes(outboundAsset) && toAccountId && allPlaidAccounts.length > 0) {
          const toAcc = allPlaidAccounts.find(a => a.id === toAccountId);
          if (toAcc) {
            // Use final_amount from settlement response (already in smallest units)
            toAcc.balance = toAcc.balance + Math.round(data.final_amount);
            document.getElementById('toBalanceFiat').textContent = `$${(toAcc.balance / 100).toFixed(2)}`;
            document.getElementById('toAccountFiat').textContent = `${toAcc.name || 'Account'} - ${toAcc.id.substring(0, 20)}...`;
            statusLog(`  Fiat TO Balance: $${(toAcc.balance / 100).toFixed(2)}`);
            terminalLog(`  Fiat TO Balance: $${(toAcc.balance / 100).toFixed(2)}`);
            if (mtPaymentId) {
              statusLog(`  → Modern Treasury Payment: ${mtPaymentId}`);
              terminalLog(`  → Modern Treasury Payment: ${mtPaymentId}`, 'success');
            }
          }
        } else if (outboundAsset === 'BTC' && btcWallet) {
          // Add to BTC wallet
          const btcAmount = data.final_amount / 100000000; // Convert satoshis to BTC
          const currentBalance = typeof btcWallet.balance === 'number' ? btcWallet.balance : parseFloat(btcWallet.balance);
          const newBalance = currentBalance + btcAmount;
          btcWallet.balance = newBalance;
          btcWallet.balanceSats = Math.round(newBalance * 100000000);
          const balanceStr = newBalance.toFixed(8);
          document.getElementById('btcBalance').textContent = `${balanceStr} BTC`;
          document.getElementById('toBalanceCrypto').textContent = `${balanceStr} BTC`;
          document.getElementById('toAccountCrypto').textContent = `BTC Wallet: ${btcWallet.address.substring(0, 16)}...`;
          statusLog(`  Crypto TO Balance: ${balanceStr} BTC`);
          terminalLog(`  Crypto TO Balance: ${balanceStr} BTC`);
          terminalLog(`  → On-chain BTC transfer: ${data.release_tx}`, 'success');
        } else if (['tCO2e', 'CARBON'].includes(outboundAsset)) {
          // Carbon credits retired/transferred
          const carbonAmount = data.final_amount / 1000; // Convert kg to tons
          document.getElementById('toBalanceCarbon').textContent = `${carbonAmount.toFixed(3)} tCO₂e`;
          document.getElementById('toAccountCarbon').textContent = `Carbon Credit: Retired/Transferred`;
          statusLog(`  Carbon TO: ${carbonAmount.toFixed(3)} tCO₂e retired/transferred`);
          terminalLog(`  Carbon TO: ${carbonAmount.toFixed(3)} tCO₂e retired/transferred`);
          if (data.release_tx && data.release_tx.startsWith('verra_')) {
            terminalLog(`  → Verra Registry TX: ${data.release_tx}`, 'success');
          }
        }
        
        updateAccountValues();
        updateCryptoDisplay();
        
        document.getElementById('currentExchangeStatus').textContent = `Settled! Release TX: ${data.release_tx}`;
        btn.textContent = '✓ SETTLED';
        
        // Reset for next exchange
        setTimeout(() => {
          currentHoldId = null;
          currentExchangeId = null;
          document.getElementById('exchangeStatus').style.display = 'none';
          document.getElementById('holdBtn').disabled = false;
          document.getElementById('holdBtn').textContent = '1. HOLD INBOUND';
          document.getElementById('exchangeBtn').disabled = true;
          document.getElementById('exchangeBtn').textContent = '2. EXCHANGE';
          document.getElementById('settleBtn').disabled = true;
          document.getElementById('settleBtn').textContent = '3. SETTLE';
        }, 3000);
        
        refreshExchanges();
        
      } catch (error) {
        statusLog(`Error: ${error.message}`);
        terminalLog(`Error: ${error.message}`, 'error');
        btn.disabled = false;
        btn.textContent = '3. SETTLE';
      }
    }

    // Refund hold
    async function refundHold(holdId) {
      try {
        statusLog(`Refunding hold: ${holdId}`);
        terminalLog(`POST /api/aegr/refund/${holdId}`, 'command');
        
        const response = await fetch(railUrl('/api/aegr/refund/' + holdId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.error) {
          statusLog(`Error: ${data.error}`);
          terminalLog(`Error: ${data.error}`, 'error');
          return;
        }
        
        statusLog(`Hold ${holdId} refunded (timelock expiry)`);
        terminalLog(`Refund TX: ${data.refund_tx}`, 'success');
        refreshHolds();
        
      } catch (error) {
        statusLog(`Error: ${error.message}`);
        terminalLog(`Error: ${error.message}`, 'error');
      }
    }

    // Refresh holds list
    async function refreshHolds() {
      // In production, this would fetch from /api/aegr/holds
      // For now, just show current hold if exists
      if (currentHoldId) {
        const container = document.getElementById('holds');
        container.innerHTML = `
          <div class="exchange-item">
            <div>
              <span class="exchange-id">Hold: ${currentHoldId}</span>
              <span class="status-badge status-locked">HELD</span>
            </div>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">
              Asset held in AEGR escrow (zero reserves model)
            </div>
            <div style="margin-top: 8px;">
              <button onclick="refundHold('${currentHoldId}')">Refund</button>
            </div>
          </div>
        `;
      }
    }

    // Refresh exchanges list
    async function refreshExchanges() {
      try {
        terminalLog(`GET /api/aegr/demo/exchanges`, 'command');
        const response = await fetch(railUrl('/api/aegr/demo/exchanges'));
        
        if (!response.ok) {
          const text = await response.text();
          terminalLog(`HTTP ${response.status}: ${text.substring(0, 100)}`, 'error');
          return;
        }
        
        const data = await response.json();
        
        if (data.error) {
          return;
        }
        
        const container = document.getElementById('exchanges');
        container.innerHTML = '';
        
        if (data.exchanges.length === 0) {
          container.innerHTML = '<p style="color: #666;">No exchanges yet. Create one to start!</p>';
          return;
        }
        
        data.exchanges.forEach(exchange => {
          const div = document.createElement('div');
          div.className = 'exchange-item';
          
          const statusClass = `status-${exchange.status}`;
          const statusLabel = exchange.status.charAt(0).toUpperCase() + exchange.status.slice(1);
          
          let legsHtml = '<div class="leg-info">';
          (exchange.legs || []).forEach(leg => {
            const legStatus = leg.status.charAt(0).toUpperCase() + leg.status.slice(1);
            legsHtml += `<div>${leg.rail} ${leg.side}: ${formatAmount(leg.amount, leg.currency)} - ${legStatus}</div>`;
          });
          legsHtml += '</div>';
          
          div.innerHTML = `
            <div>
              <span class="exchange-id">${exchange.exchange_id}</span>
              <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">
              Hashlock: ${(exchange.hashlock || '').substring(0, 16)}...
            </div>
            ${legsHtml}
            <div style="margin-top: 8px;">
              ${exchange.status === 'locked' && exchangeSecrets[exchange.exchange_id] ? 
                `<button onclick="revealSecret('${exchange.exchange_id}')">Reveal & Settle</button>` : ''}
              ${(exchange.status === 'proposed' || exchange.status === 'locked') ? 
                `<button onclick="refundExchange('${exchange.exchange_id}')">Refund</button>` : ''}
            </div>
          `;
          
          container.appendChild(div);
        });
      } catch (error) {
        // Silent fail for auto-refresh
      }
    }

    // Format currency
    function formatCurrency(cents) {
      return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Format amount
    function formatAmount(amount, currency) {
      // Handle null/undefined
      if (amount === null || amount === undefined) {
        return '0';
      }
      
      // Convert to number if it's a string
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      if (isNaN(numAmount)) {
        return '0';
      }
      
      if (currency === 'USD' || currency === 'USDC' || currency === 'EUR' || currency === 'MXN') {
        // Fiat currencies: amount is in cents, convert to dollars
        return formatCurrency(numAmount);
      } else if (currency === 'BTC' || currency === 'BITCOIN') {
        // BTC: amount is in satoshis, convert to BTC
        const btcAmount = numAmount / 100000000;
        return `${btcAmount.toFixed(8)} BTC`;
      } else if (currency === 'ETH' || currency === 'ETHEREUM') {
        // ETH: amount is in wei, convert to ETH
        const ethAmount = numAmount / 1000000000000000000;
        return `${ethAmount.toFixed(6)} ETH`;
      } else if (currency === 'SOL' || currency === 'SOLANA') {
        // SOL: amount is in lamports, convert to SOL
        const solAmount = numAmount / 1000000000;
        return `${solAmount.toFixed(4)} SOL`;
      } else if (currency === 'tCO2e' || currency === 'CARBON') {
        // Carbon: amount is in kg (1000g), convert to tons
        // 1 ton = 1000 kg, so divide by 1000
        const tonsAmount = numAmount / 1000;
        return `${tonsAmount.toFixed(3)} tCO₂e`;
      }
      // Default: show as-is with currency
      return `${numAmount} ${currency}`;
    }

    // Issue carbon credit from meter (AEGR Carbon Engine)
    async function issueCarbon() {
      const btn = document.getElementById('carbonIssueBtn');
      btn.disabled = true;
      btn.textContent = 'ISSUING...';
      
      statusLog('Issuing carbon credit from solar meter...');
      terminalLog('POST /api/demo/carbon/issue', 'command');
      terminalLog('AEGR Carbon Engine: Real-time carbon issuance');
      
      try {
        const response = await fetch(railUrl('/api/demo/carbon/issue'), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.error) {
          statusLog(`Error: ${data.error}`);
          terminalLog(`Error: ${data.error}`, 'error');
          btn.disabled = false;
          btn.textContent = 'ISSUE CARBON (DEMO)';
          return;
        }
        
        statusLog(`Carbon issued: ${data.tons_co2e} tCO₂e | Credit ID: ${data.credit_id}`);
        terminalLog(`Carbon Credit ID: ${data.credit_id}`, 'success');
        terminalLog(`Amount: ${data.tons_co2e} tCO₂e`, 'success');
        terminalLog(`Anchor TX: ${data.anchor_tx}`, 'success');
        terminalLog(`Message: ${data.message}`, 'success');
        
        // Always update UI to show carbon as available asset
        document.getElementById('fromBalanceCarbon').textContent = `${data.tons_co2e} tCO₂e`;
        document.getElementById('fromAccountCarbon').textContent = `Carbon Credit: ${data.credit_id.substring(0, 16)}...`;
        document.getElementById('holdBtn').disabled = false;
        if (!connected) {
          connected = true;
        }
        
        btn.textContent = '✓ ISSUED';
        setTimeout(() => {
          btn.textContent = 'ISSUE CARBON (DEMO)';
          btn.disabled = false;
        }, 2000);
        
      } catch (error) {
        statusLog(`Error: ${error.message}`);
        terminalLog(`Error: ${error.message}`, 'error');
        btn.disabled = false;
        btn.textContent = 'ISSUE CARBON (DEMO)';
      }
    }

    // Store all Plaid accounts
    // Update Connections section with all accounts
    function updateConnections() {
      const container = document.getElementById('connections');
      if (!container) return;
      
      container.innerHTML = '';
      allPlaidAccounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'account-box';
        div.style.cursor = 'pointer';
        div.onclick = () => selectAccount(acc.id, 'from');
        div.innerHTML = `
          <strong>${acc.name || 'Account'}</strong>
          <div style="margin-top: 4px; color: #666; font-size: 12px;">$${(acc.balance / 100).toFixed(2)}</div>
          <div style="margin-top: 4px; color: #999; font-size: 10px; word-break: break-all;">${acc.id.substring(0, 20)}...</div>
        `;
        container.appendChild(div);
      });
    }

    // Update Account Values section
    function updateAccountValues() {
      const container = document.getElementById('accountValues');
      if (!container) return;
      
      container.innerHTML = '';
      allPlaidAccounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'account-box';
        div.style.marginBottom = '8px';
        const isFrom = fromAccountId === acc.id;
        const isTo = toAccountId === acc.id;
        div.style.borderColor = isFrom ? '#dc3545' : isTo ? '#28a745' : '#ddd';
        div.innerHTML = `
          <strong>${acc.name || 'Account'}</strong>
          <div style="margin-top: 4px; font-size: 14px; color: #666;">
            Balance: $${(acc.balance / 100).toFixed(2)}
            ${isFrom ? ' <span style="color: #dc3545;">← FROM</span>' : ''}
            ${isTo ? ' <span style="color: #28a745;">→ TO</span>' : ''}
          </div>
          <div style="margin-top: 4px; color: #999; font-size: 10px; word-break: break-all;">${acc.id.substring(0, 30)}...</div>
        `;
        container.appendChild(div);
      });
    }

    // Select account for FROM or TO
    function selectAccount(accountId, type) {
      const acc = allPlaidAccounts.find(a => a.id === accountId);
      if (!acc) return;
      
      if (type === 'from') {
        fromAccountId = accountId;
        document.getElementById('fromBalanceFiat').textContent = `$${(acc.balance / 100).toFixed(2)}`;
        document.getElementById('fromAccountFiat').textContent = `${acc.name || 'Account'} - ${acc.id.substring(0, 20)}...`;
        plaidAccount = acc;
        document.getElementById('holdBtn').disabled = false;
      } else {
        toAccountId = accountId;
        document.getElementById('toBalanceFiat').textContent = `$${(acc.balance / 100).toFixed(2)}`;
        document.getElementById('toAccountFiat').textContent = `${acc.name || 'Account'} - ${acc.id.substring(0, 20)}...`;
      }
      
      updateAccountValues();
      statusLog(`${type.toUpperCase()} account selected: ${acc.name}`);
    }
    
    // Update crypto wallet display
    function updateCryptoDisplay() {
      if (btcWallet) {
        const balanceStr = typeof btcWallet.balance === 'number' ? btcWallet.balance.toFixed(8) : parseFloat(btcWallet.balance).toFixed(8);
        const addressStr = btcWallet.address ? `${btcWallet.address.substring(0, 16)}...` : 'No address';
        
        // Always show current BTC wallet balance
        document.getElementById('fromBalanceCrypto').textContent = `${balanceStr} BTC`;
        document.getElementById('fromAccountCrypto').textContent = `BTC Wallet: ${addressStr}`;
        document.getElementById('toBalanceCrypto').textContent = `${balanceStr} BTC`;
        document.getElementById('toAccountCrypto').textContent = `BTC Wallet: ${addressStr}`;
      } else {
        document.getElementById('fromBalanceCrypto').textContent = '0.00000000 BTC';
        document.getElementById('fromAccountCrypto').textContent = 'No wallet connected';
        document.getElementById('toBalanceCrypto').textContent = '0.00000000 BTC';
        document.getElementById('toAccountCrypto').textContent = 'No wallet connected';
      }
    }
    
    // Update carbon display
    function updateCarbonDisplay() {
      // This will be updated when carbon is issued or selected
      // For now, just show placeholders
      if (!document.getElementById('fromAccountCarbon').textContent.includes('No carbon')) {
        // Carbon is already set, don't overwrite
        return;
      }
      document.getElementById('fromBalanceCarbon').textContent = '0.000 tCO₂e';
      document.getElementById('fromAccountCarbon').textContent = 'No carbon credit issued';
      document.getElementById('toBalanceCarbon').textContent = '0.000 tCO₂e';
      document.getElementById('toAccountCarbon').textContent = 'No carbon credit issued';
    }

    // Check Treasury ping status
    async function checkTreasuryStatus() {
      try {
        terminalLog('Checking Treasury connection...', 'command');
        const response = await fetch(railUrl('/api/aegr/treasury/ping'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}) // Use preset credentials from env
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.connected) {
            terminalLog(`Treasury API: CONNECTED (${data.provider || 'mt'})`, 'success');
            terminalLog(`Treasury connection established: ${(data.provider || 'MT').toUpperCase()}`, 'success');
            terminalLog('Connection test: PASSED', 'success');
            statusLog(`Treasury API: CONNECTED (${data.provider || 'mt'})`);
          } else {
            terminalLog(`Treasury: ${data.error || 'Not connected'}`, 'error');
          }
        } else {
          terminalLog('Treasury: Not configured or connection failed', 'error');
        }
      } catch (error) {
        terminalLog(`Treasury check error: ${error.message}`, 'error');
      }
    }

    // Initialize function
    function initializeAEGR() {
      // Attach event listeners to buttons FIRST
      const autoConnectBtn = document.getElementById('autoConnectBtn');
      if (autoConnectBtn) {
        autoConnectBtn.addEventListener('click', autoConnect);
        console.log('✅ Attached click listener to autoConnectBtn');
      } else {
        console.error('❌ autoConnectBtn not found');
      }
      
      const btcConnectBtn = document.getElementById('btcConnectBtn');
      if (btcConnectBtn) {
        btcConnectBtn.addEventListener('click', connectBTC);
        console.log('✅ Attached click listener to btcConnectBtn');
      } else {
        console.error('❌ btcConnectBtn not found');
      }
      
      const carbonIssueBtn = document.getElementById('carbonIssueBtn');
      if (carbonIssueBtn) {
        carbonIssueBtn.addEventListener('click', issueCarbon);
        console.log('✅ Attached click listener to carbonIssueBtn');
      } else {
        console.error('❌ carbonIssueBtn not found');
      }
      
      const holdBtn = document.getElementById('holdBtn');
      if (holdBtn) {
        holdBtn.addEventListener('click', holdAsset);
        console.log('✅ Attached click listener to holdBtn');
      } else {
        console.error('❌ holdBtn not found');
      }
      
      const exchangeBtn = document.getElementById('exchangeBtn');
      if (exchangeBtn) {
        exchangeBtn.addEventListener('click', matchAndExchange);
        console.log('✅ Attached click listener to exchangeBtn');
      } else {
        console.error('❌ exchangeBtn not found');
      }
      
      const settleBtn = document.getElementById('settleBtn');
      if (settleBtn) {
        settleBtn.addEventListener('click', settleExchange);
        console.log('✅ Attached click listener to settleBtn');
      } else {
        console.error('❌ settleBtn not found');
      }
      
      // Initialize - AEGR Demo (PRESET MODE - Auto-connect on load)
      statusLog('AEGR Demo loaded. AEGR — Hold/Exchange/Settle pattern.');
      terminalLog('Ready to test AEGR Rail with your credentials.', 'response');
      terminalLog('', 'response');
      terminalLog('→ STEP 1: Checking Redis connection (REQUIRED FIRST)...', 'response');
      terminalLog('→ Open Launcher initialized. Enter your Plaid and Treasury credentials to begin.', 'response');
      
      // Store interval IDs to prevent duplicates if script runs multiple times
      if (!window.aegrIntervals) {
        window.aegrIntervals = {};
      } else {
        // Clear existing intervals if they exist
        if (window.aegrIntervals.redis) clearInterval(window.aegrIntervals.redis);
        if (window.aegrIntervals.plaid) clearInterval(window.aegrIntervals.plaid);
        if (window.aegrIntervals.exchanges) clearInterval(window.aegrIntervals.exchanges);
      }
      
      // Initial status checks with delay to ensure DOM is ready
      setTimeout(async () => {
        await checkRedisStatus();
        await checkTreasuryStatus();
        await checkPlaidStatus();
        
        // Auto-connect Plaid in preset demo mode
        terminalLog('', 'response');
        terminalLog('→ Connecting Plaid with your sandbox credentials...', 'response');
        terminalLog('→ Connecting to Plaid (Your Sandbox)...', 'response');
        setTimeout(() => {
          autoConnect(); // Auto-connect on page load
        }, 1000);
      }, 500);
      
      calculateExchange();
      refreshHolds();
      refreshExchanges();
      
      // Periodic status checks - every 2 minutes (120000ms)
      window.aegrIntervals.redis = setInterval(checkRedisStatus, 120000); // Check Redis every 2 minutes
      window.aegrIntervals.plaid = setInterval(checkPlaidStatus, 120000); // Check Plaid every 2 minutes
      window.aegrIntervals.exchanges = setInterval(refreshExchanges, 120000); // Auto-refresh every 2 minutes
    }
    
    // Run initialization when DOM is ready
    console.log('📋 Document readyState:', document.readyState);
    
    function startApp() {
      console.log('🚀 Starting AEGR initialization...');
      try {
        initializeAEGR();
        console.log('✅ AEGR initialization complete');
      } catch (e) {
        console.error('❌ CRITICAL ERROR in initializeAEGR:', e);
        alert('Error initializing AEGR: ' + e.message);
      }
    }
    
    if (document.readyState === 'loading') {
      console.log('⏳ Waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', startApp);
    } else {
      console.log('✅ DOM already loaded, starting immediately');
      // DOM is already loaded
      setTimeout(startApp, 100); // Small delay to ensure everything is ready
    }
    
    // Also try to log something immediately to verify script is running
    console.log('✅ AEGR Demo Script Loaded - waiting for DOM');
