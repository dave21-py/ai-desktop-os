class WarmwindOS {
    constructor() {
        this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        this.state = {
            openWindows: [],
            nextZIndex: 21,
            nextWindowID: 0,
            availableApps: [],
        };
        this.ui = {};
    }

    boot() {
        this._initUI();
        this._loadApps();
    }

    _initUI() {
        this.ui.desktop = document.querySelector('#desktop');
        this.ui.windowTemplate = document.querySelector('#window-template');
        this.ui.dock = document.querySelector('.bottom-bar');
        
        // Command Center UI
        this.ui.commandCenterOverlay = document.querySelector('.command-center-overlay');
        this.ui.commandCenterInput = document.querySelector('#command-center-input');
        this.ui.commandCenterResults = document.querySelector('#command-center-results');
        this.ui.appSearchResultTemplate = document.querySelector('#app-search-result-template');

        // AI Panel UI
        this.ui.aiPanel = document.querySelector('.ai-assistant-panel');
        this.ui.aiMessageList = document.querySelector('.ai-message-list');
        this.ui.aiInputForm = document.querySelector('.ai-input-form');
        this.ui.aiInput = this.ui.aiInputForm?.querySelector('input');
        this.ui.aiSendBtn = this.ui.aiInputForm?.querySelector('button[type="submit"]');
        this.ui.aiTypingIndicator = document.querySelector('.ai-typing-indicator');
    }
    
    _loadApps() {
        const appItems = document.querySelectorAll('#app-data-store .app-item');
        appItems.forEach(el => {
            this.state.availableApps.push({
                id: el.dataset.appid,
                name: el.dataset.appname,
                url: el.dataset.url,
                icon: el.querySelector('img')?.src || '',
                launchMode: el.dataset.launchMode
            });
        });
        console.log('OS Apps Loaded:', this.state.availableApps);
    }

    // ======================================================
    // --- APP & WINDOW MANAGEMENT ---
    // ======================================================

    launchApp(appId) {
        const appData = this.state.availableApps.find(app => app.id === appId);
        if (!appData) {
            console.error(`App with ID "${appId}" not found.`);
            return;
        }

        if (appData.launchMode === 'new-tab') {
            window.open(appData.url, '_blank');
            return;
        }

        // Check if a window for this app is already open but minimized
        const existingWindow = this.state.openWindows.find(w => w.appData.id === appId);
        if (existingWindow) {
             this._restoreWindow(existingWindow.element);
             return;
        }

        this._createWindow(appData);
    }

    _createWindow(appData) {
        const windowId = `window-${this.state.nextWindowID++}`;
        const template = this.ui.windowTemplate.content.cloneNode(true);
        const windowEl = template.querySelector('.app-instance-window');

        const appWindowRect = this.ui.desktop.getBoundingClientRect();
        const windowWidth = 960;
        const windowHeight = 640;
        const centerX = (appWindowRect.width - windowWidth) / 2;
        const centerY = (appWindowRect.height - windowHeight) / 2;
        const offset = (this.state.openWindows.length % 5) * 30;
        
        windowEl.dataset.windowId = windowId;
        windowEl.dataset.appId = appData.id;
        windowEl.style.left = `${Math.max(20, centerX + offset)}px`;
        windowEl.style.top = `${Math.max(20, centerY + offset)}px`;
        
        const titleBar = windowEl.querySelector('.window-title-bar');
        titleBar.querySelector('.window-icon').src = appData.icon;
        titleBar.querySelector('.window-title').textContent = appData.name;
        
        const iframe = windowEl.querySelector('iframe');
        const loadingOverlay = windowEl.querySelector('.loading-overlay');
        
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups');
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        
        let loadTimeout;
        iframe.onload = () => { clearTimeout(loadTimeout); loadingOverlay.classList.add('hidden'); };
        iframe.onerror = () => {
            clearTimeout(loadTimeout);
            loadingOverlay.innerHTML = `<div style="text-align: center; padding: 20px;"><h3>Unable to load ${appData.name}</h3><p>This site may not allow embedding.</p><button onclick="window.open('${appData.url}', '_blank')" style="margin-top: 10px; padding: 8px 16px; border: none; background: #007AFF; color: white; border-radius: 6px; cursor: pointer;">Open in New Tab</button></div>`;
        };
        loadTimeout = setTimeout(() => { if (!loadingOverlay.classList.contains('hidden')) { iframe.onerror(); } }, 10000);
        iframe.src = appData.url;

        this.ui.desktop.appendChild(windowEl);
        this.state.openWindows.push({ id: windowId, element: windowEl, appData: appData });

        this._createDockIcon(appData, windowId);
        this._focusWindow(windowEl);
    }

    _focusWindow(windowElement) {
        document.querySelectorAll('.app-instance-window').forEach(w => w.classList.remove('active-window'));
        windowElement.classList.add('active-window');
        windowElement.style.zIndex = this.state.nextZIndex++;
        
        document.querySelectorAll('.dock-item').forEach(item => item.classList.remove('active-dock-icon'));
        const windowId = windowElement.dataset.windowId;
        const dockItem = this.ui.dock.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) dockItem.classList.add('active-dock-icon');
    }

    _closeWindow(windowElement) {
        const windowId = windowElement.dataset.windowId;
        this.state.openWindows = this.state.openWindows.filter(w => w.id !== windowId);
        
        const dockItem = this.ui.dock.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) dockItem.remove();
        
        windowElement.remove();
    }

    _minimizeWindow(windowElement) {
        windowElement.classList.add('minimized');
        const windowId = windowElement.dataset.windowId;
        const dockItem = this.ui.dock.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) {
            dockItem.classList.remove('active-dock-icon');
            dockItem.classList.add('minimized-dock-icon');
        }
    }

    _restoreWindow(windowElement) {
        windowElement.classList.remove('minimized');
        this._focusWindow(windowElement);
        const windowId = windowElement.dataset.windowId;
        const dockItem = this.ui.dock.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) {
            dockItem.classList.remove('minimized-dock-icon');
        }
    }

    _maximizeWindow(windowElement) { windowElement.classList.toggle('maximized'); }

    _createDockIcon(appData, windowId) {
        const commandBtn = this.ui.dock.querySelector('#command-center-btn');
        const dockIcon = document.createElement('button');
        dockIcon.className = 'dock-item';
        dockIcon.dataset.windowId = windowId;
        dockIcon.title = appData.name;
        dockIcon.setAttribute('aria-label', `Focus ${appData.name}`);
        
        const img = document.createElement('img');
        img.src = appData.icon;
        img.alt = appData.name;
        
        dockIcon.appendChild(img);
        this.ui.dock.insertBefore(dockIcon, commandBtn.nextSibling); // Insert after command button
    }

    // ======================================================
    // --- COMMAND CENTER ---
    // ======================================================
    showCommandCenter() {
        this.ui.commandCenterOverlay.classList.remove('hidden');
        this._updateCommandCenterResults('');
        this.ui.commandCenterInput.value = '';
        this.ui.commandCenterInput.focus();
    }
    closeCommandCenter() { this.ui.commandCenterOverlay.classList.add('hidden'); }
    
    _updateCommandCenterResults(query) {
        this.ui.commandCenterResults.innerHTML = '';
        const lowerQuery = query.toLowerCase().trim();
        
        const filteredApps = this.state.availableApps.filter(app => 
            app.name.toLowerCase().includes(lowerQuery)
        );

        if (filteredApps.length === 0 && lowerQuery === '') {
             // Show all apps if query is empty
             this.state.availableApps.forEach(app => this._createAppResult(app));
        } else {
             filteredApps.forEach(app => this._createAppResult(app));
        }
    }
    
    _createAppResult(app) {
        const template = this.ui.appSearchResultTemplate.content.cloneNode(true);
        const resultEl = template.querySelector('.app-result-item');
        resultEl.dataset.appid = app.id;
        resultEl.querySelector('img').src = app.icon;
        resultEl.querySelector('.app-name').textContent = app.name;
        this.ui.commandCenterResults.appendChild(resultEl);
    }

    // ======================================================
    // --- AI ASSISTANT ---
    // ======================================================

    showAIPanel() { this.ui.aiPanel.classList.remove('hidden'); this.ui.aiInput.focus(); }
    closeAIPanel() { this.ui.aiPanel.classList.add('hidden'); }

    async askAI(query) {
        this.showAIPanel();
        this._addMessageToChat('user', query);
        this.ui.aiTypingIndicator.classList.remove('hidden');

        const commandResponse = this._processCommand(query);
        if (commandResponse) {
            this.ui.aiTypingIndicator.classList.add('hidden');
            this._addMessageToChat('ai', commandResponse.message);
            if (commandResponse.action) commandResponse.action();
            this.ui.aiSendBtn.disabled = false;
            return;
        }

        if (!this.GEMINI_API_KEY || this.GEMINI_API_KEY === '') {
            this.ui.aiTypingIndicator.classList.add('hidden');
            this._addMessageToChat('ai', "I'm not connected to the AI network. Please add an API key in config.js.");
            this.ui.aiSendBtn.disabled = false;
            return;
        }

        try {
            const aiResponse = await this._getGeminiResponse(query);
            this._addMessageToChat('ai', aiResponse);
        } catch (error) {
            console.error("AI Error:", error);
            this._addMessageToChat('ai', "Sorry, I'm having trouble connecting to the AI network right now.");
        } finally {
            this.ui.aiTypingIndicator.classList.add('hidden');
            this.ui.aiSendBtn.disabled = false;
        }
    }
    
    _processCommand(query) {
        const lowerQuery = query.toLowerCase();

        // Window Management Commands
        const windowCommands = ['close', 'minimize', 'maximize', 'restore'];
        for (const command of windowCommands) {
            if (lowerQuery.startsWith(command)) {
                const appNameToFind = lowerQuery.replace(command, '').trim();
                const openWindow = this.state.openWindows.find(w => w.appData.name.toLowerCase().includes(appNameToFind));
                if (openWindow) {
                    let action, message = '';
                    switch (command) {
                        case 'close': message = `Closing ${openWindow.appData.name}.`; action = () => this._closeWindow(openWindow.element); break;
                        case 'minimize': message = `Minimizing ${openWindow.appData.name}.`; action = () => this._minimizeWindow(openWindow.element); break;
                        case 'maximize': message = `Maximizing ${openWindow.appData.name}.`; action = () => this._maximizeWindow(openWindow.element); break;
                        case 'restore': message = `Restoring ${openWindow.appData.name}.`; action = () => this._restoreWindow(openWindow.element); break;
                    }
                    return { message, action };
                } else {
                    return { message: `I couldn't find an open app named "${appNameToFind}".` };
                }
            }
        }
        
        // App Launch Commands
        const launchCommands = ['open', 'launch', 'start', 'run'];
        if (launchCommands.some(word => lowerQuery.startsWith(word))) {
            const appName = lowerQuery.replace(new RegExp(launchCommands.join('|')), '').trim();
            for (const app of this.state.availableApps) {
                if (app.name.toLowerCase().includes(appName)) {
                    return { message: `Sure, launching ${app.name}...`, action: () => this.launchApp(app.id) };
                }
            }
        }
        
        // Quick Calculator
        if (lowerQuery.match(/^calculate|what is/)) {
            const mathExpression = lowerQuery.replace(/calculate|what is/g, '').trim();
            try {
                // Using a safer method than new Function() for basic math
                if (/^[0-9+\-*/().\s]+$/.test(mathExpression)) {
                   const result = eval(mathExpression);
                   return { message: `${mathExpression} = ${result}` };
                }
            } catch (error) { /* Fall through to Gemini AI */ }
        }

        // System Commands
        if (lowerQuery.includes('dark mode') || lowerQuery.includes('dark theme')) { return { message: "Switching to dark mode.", action: () => this._setTheme('dark') }; }
        if (lowerQuery.includes('light mode') || lowerQuery.includes('light theme')) { return { message: "Switching to the light theme.", action: () => this._setTheme('light') }; }
        
        return null;
    }

    _setTheme(themeName) {
        document.body.classList.toggle('dark-theme', themeName === 'dark');
    }

    async _getGeminiResponse(query) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.GEMINI_API_KEY}`;
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `You are VibeOS, a friendly and helpful operating system assistant. Keep your answers concise and helpful. User query: "${query}"` }] }] })
        });
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    _addMessageToChat(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message from-${sender}`;
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        // Basic markdown for bold and code
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        bubbleDiv.innerHTML = text;
        messageDiv.appendChild(bubbleDiv);
        this.ui.aiMessageList.appendChild(messageDiv);
        this.ui.aiMessageList.scrollTop = this.ui.aiMessageList.scrollHeight;
    }
}