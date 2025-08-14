class WarmwindOS {
    constructor() {
        // --- PASTE YOUR GOOGLE AI API KEY HERE ---
        this.GEMINI_API_KEY = this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        this.state = {
            openWindows: [],
            nextZIndex: 21,
            nextWindowID: 0,
            availableApps: [], // To store app data for intent recognition
        };
        this.ui = {};
    }

    boot() {
        this._initUI();
        this._loadAppIntents();
        this._injectWindowCSS(); // Add required CSS for maximize functionality
    }

    _initUI() {
        this.ui.modalOverlay = document.querySelector('.modal-overlay');
        this.ui.desktop = document.querySelector('#desktop');
        this.ui.windowTemplate = document.querySelector('#window-template');
        this.ui.dock = document.querySelector('.bar-section.center');
        this.ui.aiPanel = document.querySelector('.ai-assistant-panel');
        this.ui.aiMessageList = document.querySelector('.ai-message-list');
        this.ui.aiInputForm = document.querySelector('.ai-input-form');
        this.ui.aiInput = document.querySelector('.ai-input-form input');
        this.ui.aiSendBtn = document.querySelector('.ai-input-form button[type="submit"]');
        this.ui.aiTypingIndicator = document.querySelector('.ai-typing-indicator');
    }

    /**
     * Inject CSS for window maximize functionality
     */
    _injectWindowCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Override the existing maximized class to work within the app-window container */
            .app-instance-window.maximized {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                border-radius: 0 !important;
                resize: none !important;
                transition: none !important;
                z-index: 9999 !important;
            }
            
            .window-title-bar {
                cursor: grab;
            }
            
            .window-title-bar:active {
                cursor: grabbing;
            }
            
            .app-instance-window.maximized .window-title-bar {
                cursor: default !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Scans the HTML for all available apps and stores their data.
     */
    _loadAppIntents() {
        const appItems = document.querySelectorAll('.app-item');
        appItems.forEach(el => {
            this.state.availableApps.push({
                element: el,
                name: el.dataset.appname.toLowerCase(),
                id: el.dataset.appid,
            });
        });
        console.log('OS Intents Loaded:', this.state.availableApps);
    }

    // --- Window and Modal Functions ---
    launchApp(appElement) {
        const appData = {
            id: appElement.dataset.appid,
            name: appElement.dataset.appname,
            url: appElement.dataset.url,
            icon: appElement.querySelector('img')?.src || '',
            launchMode: appElement.dataset.launchMode
        };

        if (appData.id === 'app-drawer') {
            this._showAppDrawer();
            return;
        }

        if (appData.launchMode === 'new-tab') {
            window.open(appData.url, '_blank');
            return;
        }

        this._createWindow(appData);
    }

    _createWindow(appData) {
        const windowId = `window-${this.state.nextWindowID++}`;
        
        // Clone the template
        const template = this.ui.windowTemplate.content.cloneNode(true);
        const windowEl = template.querySelector('.app-instance-window');
        
        // Calculate center position
        const appWindowRect = this.ui.desktop.parentElement.getBoundingClientRect();
        const windowWidth = 960;
        const windowHeight = 640;
        
        // Center the window with slight offset for multiple windows
        const centerX = (appWindowRect.width - windowWidth) / 2;
        const centerY = (appWindowRect.height - windowHeight) / 2;
        const offset = this.state.openWindows.length * 30;
        
        // Set window properties
        windowEl.dataset.windowId = windowId;
        windowEl.dataset.appId = appData.id;
        windowEl.style.left = `${Math.max(20, centerX + offset)}px`;
        windowEl.style.top = `${Math.max(60, centerY + offset)}px`; // 60px to avoid top pill
        windowEl.style.width = `${windowWidth}px`;
        windowEl.style.height = `${windowHeight}px`;
        windowEl.style.zIndex = this.state.nextZIndex++;

        // Store original dimensions for maximize/restore
        windowEl.dataset.originalLeft = windowEl.style.left;
        windowEl.dataset.originalTop = windowEl.style.top;
        windowEl.dataset.originalWidth = windowEl.style.width;
        windowEl.dataset.originalHeight = windowEl.style.height;

        // Set window content
        const titleBar = windowEl.querySelector('.window-title-bar');
        titleBar.querySelector('.window-icon').src = appData.icon;
        titleBar.querySelector('.window-title').textContent = appData.name;
        
        const iframe = windowEl.querySelector('iframe');
        const loadingOverlay = windowEl.querySelector('.loading-overlay');
        
        // Set iframe properties for better compatibility
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        
        let loadTimeout;
        
        iframe.onload = () => {
            clearTimeout(loadTimeout);
            loadingOverlay.classList.add('hidden');
        };
        
        iframe.onerror = () => {
            clearTimeout(loadTimeout);
            loadingOverlay.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3>Unable to load ${appData.name}</h3>
                    <p>This site may not allow embedding.</p>
                    <button onclick="window.open('${appData.url}', '_blank')" 
                            style="margin-top: 10px; padding: 8px 16px; border: none; background: #007AFF; color: white; border-radius: 6px; cursor: pointer;">
                        Open in New Tab
                    </button>
                </div>
            `;
        };
        
        // Set timeout for loading
        loadTimeout = setTimeout(() => {
            if (!loadingOverlay.classList.contains('hidden')) {
                iframe.onerror();
            }
        }, 10000); // 10 second timeout
        
        iframe.src = appData.url;

        // Add to desktop
        this.ui.desktop.appendChild(windowEl);
        
        // Track window
        this.state.openWindows.push({
            id: windowId,
            element: windowEl,
            appData: appData
        });

        // Create dock icon
        this._createDockIcon(appData, windowId);
        
        this._focusWindow(windowEl);
    }

    _focusWindow(windowElement) {
        // Remove active class from all windows
        document.querySelectorAll('.app-instance-window').forEach(w => {
            w.classList.remove('active-window');
        });
        
        // Add active class and bring to front
        windowElement.classList.add('active-window');
        windowElement.style.zIndex = this.state.nextZIndex++;
        
        // Update dock
        document.querySelectorAll('.dock-item').forEach(item => {
            item.classList.remove('active-dock-icon');
        });
        
        const windowId = windowElement.dataset.windowId;
        const dockItem = document.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) {
            dockItem.classList.add('active-dock-icon');
        }
    }

    _closeWindow(windowElement) {
        const windowId = windowElement.dataset.windowId;
        
        // Remove from state
        this.state.openWindows = this.state.openWindows.filter(w => w.id !== windowId);
        
        // Remove dock icon
        const dockItem = document.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) {
            dockItem.remove();
        }
        
        // Remove window
        windowElement.remove();
    }

    _createDockIcon(appData, windowId) {
        const dockIcon = document.createElement('div');
        dockIcon.className = 'dock-item';
        dockIcon.dataset.windowId = windowId;
        
        const img = document.createElement('img');
        img.src = appData.icon;
        img.alt = appData.name;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        
        dockIcon.appendChild(img);
        
        // Insert before the add button
        const addBtn = this.ui.dock.querySelector('.add-btn');
        this.ui.dock.insertBefore(dockIcon, addBtn);
    }

    _minimizeWindow(windowElement) {
        windowElement.classList.add('minimized');
        
        // Update dock icon - remove active state but keep the icon
        const windowId = windowElement.dataset.windowId;
        const dockItem = document.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) {
            dockItem.classList.remove('active-dock-icon');
            dockItem.classList.add('minimized-dock-icon'); // Add visual indicator
        }
    }

    _restoreWindow(windowElement) {
        windowElement.classList.remove('minimized');
        this._focusWindow(windowElement);
        
        // Update dock icon
        const windowId = windowElement.dataset.windowId;
        const dockItem = document.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) {
            dockItem.classList.remove('minimized-dock-icon');
            dockItem.classList.add('active-dock-icon');
        }
    }

    _maximizeWindow(windowElement) {
        console.log('Maximize window called');
        
        if (windowElement.classList.contains('maximized')) {
            // Restore to original size
            console.log('Restoring window to original size');
            windowElement.classList.remove('maximized');
            
            // Restore original dimensions and positioning
            windowElement.style.left = windowElement.dataset.originalLeft;
            windowElement.style.top = windowElement.dataset.originalTop;
            windowElement.style.width = windowElement.dataset.originalWidth;
            windowElement.style.height = windowElement.dataset.originalHeight;
            windowElement.style.position = 'absolute';
        } else {
            // Maximize window
            console.log('Maximizing window');
            
            // Store current dimensions before maximizing
            windowElement.dataset.originalLeft = windowElement.style.left;
            windowElement.dataset.originalTop = windowElement.style.top;
            windowElement.dataset.originalWidth = windowElement.style.width;
            windowElement.dataset.originalHeight = windowElement.style.height;
            
            // Get the app-window container dimensions (the parent container)
            const appWindow = document.querySelector('.app-window');
            const appWindowRect = appWindow.getBoundingClientRect();
            
            // Maximize within the app-window container, not the entire viewport
            windowElement.style.position = 'absolute';
            windowElement.style.left = '0px';
            windowElement.style.top = '0px';
            windowElement.style.width = `${appWindow.clientWidth}px`;
            windowElement.style.height = `${appWindow.clientHeight}px`;
            
            windowElement.classList.add('maximized');
        }
    }

    _showAppDrawer() {
        this.ui.modalOverlay.classList.remove('hidden');
    }

    _closeAppDrawer() {
        this.ui.modalOverlay.classList.add('hidden');
    }

    // --- AI Assistant Functions ---
    showAIPanel() {
        this.ui.aiPanel.classList.remove('hidden');
        this.ui.aiInput.focus();
    }

    closeAIPanel() {
        this.ui.aiPanel.classList.add('hidden');
    }

    /**
     * Main function to process a user's query.
     * It checks for commands first, then falls back to the AI.
     */
    async askAI(query) {
        this._addMessageToChat('user', query);
        this.ui.aiTypingIndicator.classList.remove('hidden');

        // 1. Intent Recognition
        const commandResponse = this._processCommand(query);
        if (commandResponse) {
            this.ui.aiTypingIndicator.classList.add('hidden');
            this._addMessageToChat('ai', commandResponse.message);
            if(commandResponse.action) commandResponse.action();
            this.ui.aiSendBtn.disabled = false;
            return;
        }

        // 2. Fallback to Gemini AI
        if (!this.GEMINI_API_KEY || this.GEMINI_API_KEY === '') {
            this.ui.aiTypingIndicator.classList.add('hidden');
            this._addMessageToChat('ai', "I'm not connected to the AI network. Please add an API key in os-core.js.");
            this.ui.aiSendBtn.disabled = false;
            return;
        }

        try {
            const aiResponse = await this._getGeminiResponse(query);
            this.ui.aiTypingIndicator.classList.add('hidden');
            this._addMessageToChat('ai', aiResponse);
        } catch (error) {
            console.error("AI Error:", error);
            this.ui.aiTypingIndicator.classList.add('hidden');
            this._addMessageToChat('ai', "Sorry, I'm having trouble connecting to the AI network right now.");
        }
        
        this.ui.aiSendBtn.disabled = false;
    }
    
    /**
     * Checks a query for executable commands like "open an app".
     */
    _processCommand(query) {
        const lowerQuery = query.toLowerCase();
        const commandWords = ['open', 'launch', 'start', 'run'];

        if (commandWords.some(word => lowerQuery.includes(word))) {
            for (const app of this.state.availableApps) {
                if (lowerQuery.includes(app.name)) {
                    return {
                        message: `Sure, launching ${app.element.dataset.appname}...`,
                        action: () => this.launchApp(app.element)
                    };
                }
            }
        }
        return null; // No command found
    }

    /**
     * Sends a query to the Google Gemini API.
     */
    async _getGeminiResponse(query) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.GEMINI_API_KEY}`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: query }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Helper function to add a new message bubble to the chat UI.
     */
    _addMessageToChat(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message from-${sender}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = text;
        
        messageDiv.appendChild(bubbleDiv);
        this.ui.aiMessageList.appendChild(messageDiv);

        // Auto-scroll to the bottom
        this.ui.aiMessageList.scrollTop = this.ui.aiMessageList.scrollHeight;
    }
}