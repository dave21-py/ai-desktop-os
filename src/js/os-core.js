class WarmwindOS {
    constructor() {
        this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        this.state = {
            openWindows: [],
            desktopItems: [
                { id: 1, type: 'app', appId: 'vscode', x: 50, y: 50 },
                { id: 2, type: 'app', appId: 'gemini', x: 50, y: 160 },
                { id: 3, type: 'folder', name: 'Projects', x: 160, y: 50, children: [] }
            ],
            nextZIndex: 21,
            nextWindowID: 0,
            nextItemID: 4,
            availableApps: [], // Ensure availableApps is initialized as an empty array
            theme: 'light'
        };
        this.ui = {};
    }

    boot() {
        this._loadState();
        this._initUI();
        this._loadApps(); // Load apps
        console.log("Available Apps:", this.state.availableApps); // Log available apps
        this._renderDesktop();
        this._setTheme(this.state.theme);
    }

    _initUI() {
        this.ui.desktop = document.querySelector('#desktop');
        this.ui.windowTemplate = document.querySelector('#window-template');
        this.ui.dock = document.querySelector('.bottom-bar');
        this.ui.commandCenterOverlay = document.querySelector('.command-center-overlay');
        this.ui.commandCenterInput = document.querySelector('#command-center-input');
        this.ui.commandCenterResults = document.querySelector('#command-center-results');
        this.ui.appSearchResultTemplate = document.querySelector('#app-search-result-template');
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
    // --- SYSTEM DASHBOARD ---
    // ======================================================

    showSystemInfo() {
        // Get window statistics
        const totalWindows = this.state.openWindows.length;
        const appWindows = this.state.openWindows.filter(w => w.appData).length;
        const folderWindows = this.state.openWindows.filter(w => w.folderId).length;
        
        // Get desktop item statistics
        const totalDesktopItems = this.state.desktopItems.length;
        const appItems = this.state.desktopItems.filter(item => item.type === 'app').length;
        const folderItems = this.state.desktopItems.filter(item => item.type === 'folder').length;
        
        // Get system information
        const theme = this.state.theme;
        const time = new Date().toLocaleTimeString();
        const date = new Date().toLocaleDateString();
        const availableApps = this.state.availableApps.length;
        
        // Create a formatted message
        const message = `📊 **System Status Dashboard**
        
**🖥️ Windows**
• Total Open Windows: ${totalWindows}
• Application Windows: ${appWindows}
• Folder Windows: ${folderWindows}

**📁 Desktop**
• Total Items: ${totalDesktopItems}
• Applications: ${appItems}
• Folders: ${folderItems}

**⚙️ System**
• Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode
• Current Time: ${time}
• Current Date: ${date}
• Available Apps: ${availableApps}

**🤖 AI Assistant**
• Status: Active and Ready
• API: Google Gemini Connected`;

        return {
            message: message
        };
    }

    getPerformanceMetrics() {
        // Simulate some performance metrics (in a real OS this would be actual system data)
        const memoryUsage = Math.floor(Math.random() * 30) + 60; // 60-90%
        const cpuUsage = Math.floor(Math.random() * 20) + 5; // 5-25%
        const networkStatus = 'Connected';
        const batteryLevel = Math.floor(Math.random() * 40) + 60; // 60-100%
        
        return {
            memoryUsage,
            cpuUsage,
            networkStatus,
            batteryLevel
        };
    }

    openDashboard() {
        const existingDashboard = this.state.openWindows.find(w => w.isDashboard);
        if (existingDashboard) {
            this._focusWindow(existingDashboard.element);
            return;
        }
    
        const windowId = `window-${this.state.nextWindowID++}`;
        const template = document.querySelector('#dashboard-template').content.cloneNode(true);
        const windowEl = template.querySelector('.app-instance-window');
    
        // Set position
        const appWindowRect = this.ui.desktop.getBoundingClientRect();
        const windowWidth = 800;
        const windowHeight = 500;
        const centerX = (appWindowRect.width - windowWidth) / 2;
        const centerY = (appWindowRect.height - windowHeight) / 2;
    
        windowEl.dataset.windowId = windowId;
        windowEl.style.left = `${Math.max(40, centerX)}px`;
        windowEl.style.top = `${Math.max(40, centerY)}px`;
    
        // Append to DOM first
        this.ui.desktop.appendChild(windowEl);
    
        // Update dashboard data immediately after appending to DOM
        setTimeout(() => {
            this.updateDashboardData(windowEl);
            
            // Auto-refresh every second
            const refreshInterval = setInterval(() => {
                if (document.body.contains(windowEl)) {
                    this.updateDashboardData(windowEl);
                } else {
                    clearInterval(refreshInterval);
                }
            }, 1000);
        }, 100);
    
        this.state.openWindows.push({ 
            id: windowId, 
            element: windowEl, 
            isDashboard: true
        });
    
        this._createDockIcon({ 
            name: 'System Dashboard', 
            icon: 'assets/icons/dashboard.png' 
        }, windowId);
        this._focusWindow(windowEl);
    }

    updateDashboardData(windowEl) {
        console.log("Updating dashboard data..."); // Debug
        // Get elements
        const totalWindowsEl = windowEl.querySelector('#total-windows');
        const appWindowsEl = windowEl.querySelector('#app-windows');
        const folderWindowsEl = windowEl.querySelector('#folder-windows');
        const totalItemsEl = windowEl.querySelector('#total-items');
        const appItemsEl = windowEl.querySelector('#app-items');
        const folderItemsEl = windowEl.querySelector('#folder-items');
        const themeEl = windowEl.querySelector('#current-theme');
        const timeEl = windowEl.querySelector('#current-time');
        const appsEl = windowEl.querySelector('#available-apps');
        const memoryEl = windowEl.querySelector('#memory-usage');
        const cpuEl = windowEl.querySelector('#cpu-usage');
        const batteryEl = windowEl.querySelector('#battery-level');
        
        // Calculate stats
        const totalWindows = this.state.openWindows.length;
        const appWindows = this.state.openWindows.filter(w => w.appData).length;
        const folderWindows = this.state.openWindows.filter(w => w.folderId).length;
        const totalItems = this.state.desktopItems.length;
        const appItems = this.state.desktopItems.filter(item => item.type === 'app').length;
        const folderItems = this.state.desktopItems.filter(item => item.type === 'folder').length;
        const theme = this.state.theme;
        const time = new Date().toLocaleTimeString();
        const apps = this.state.availableApps.length;
        const perf = this.getPerformanceMetrics();
        
        // Update UI
        if (totalWindowsEl) totalWindowsEl.textContent = totalWindows;
        if (appWindowsEl) appWindowsEl.textContent = appWindows;
        if (folderWindowsEl) folderWindowsEl.textContent = folderWindows;
        if (totalItemsEl) totalItemsEl.textContent = totalItems;
        if (appItemsEl) appItemsEl.textContent = appItems;
        if (folderItemsEl) folderItemsEl.textContent = folderItems;
        if (themeEl) themeEl.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        if (timeEl) timeEl.textContent = time;
        if (appsEl) appsEl.textContent = apps;
        if (memoryEl) memoryEl.textContent = `${perf.memoryUsage}%`;
        if (cpuEl) cpuEl.textContent = `${perf.cpuUsage}%`;
        if (batteryEl) batteryEl.textContent = `${perf.batteryLevel}%`;
    }

    // ======================================================
    // --- DESKTOP & STATE MANAGEMENT ---
    // ======================================================

    _renderDesktop() {
        // Create a map of existing desktop items by ID
        const existingItems = {};
        this.ui.desktop.querySelectorAll('.desktop-item').forEach(item => {
            const id = item.dataset.itemId;
            if (id) {
                existingItems[id] = item;
            }
        });
    
        // Process each desktop item
        this.state.desktopItems.forEach(item => {
            let itemEl = existingItems[item.id];
    
            // If item doesn't exist, create it
            if (!itemEl) {
                itemEl = document.createElement('div');
                itemEl.className = 'desktop-item';
                itemEl.dataset.itemId = item.id;
                this.ui.desktop.appendChild(itemEl);
            }
    
            // Update position
            itemEl.style.left = `${item.x}px`;
            itemEl.style.top = `${item.y}px`;
    
            // Update content if needed
            let iconSrc = '';
            let name = '';
    
            if (item.type === 'app') {
                const appData = this.state.availableApps.find(app => app.id === item.appId);
                if (appData) {
                    iconSrc = appData.icon;
                    name = appData.name;
                    itemEl.dataset.appId = item.appId;
                }
            } else if (item.type === 'folder') {
                iconSrc = 'assets/icons/folder.png'; // Ensure this path exists!
                name = item.name;
                delete itemEl.dataset.appId; // Remove app ID if it was previously an app
            }
    
            // Only update innerHTML if content has changed
            const currentHTML = itemEl.innerHTML;
            const newHTML = `
                <img src="${iconSrc}" alt="${name}">
                <span>${name}</span>
            `;
    
            if (currentHTML !== newHTML) {
                itemEl.innerHTML = newHTML;
            }
        });
    
        // Remove any desktop items that no longer exist in state
        const stateItemIds = this.state.desktopItems.map(item => item.id.toString());
        Object.keys(existingItems).forEach(id => {
            if (!stateItemIds.includes(id)) {
                existingItems[id].remove();
            }
        });
    }

    _createNewFolder(x, y) {
        let maxNum = 0;
        this.state.desktopItems.forEach(item => {
            if (item.name?.startsWith('New Folder')) {
                const num = parseInt(item.name.replace('New Folder', '').trim()) || 0;
                if (num > maxNum) maxNum = num;
            }
        });
        const newName = maxNum > 0 ? `New Folder ${maxNum + 1}` : 'New Folder';
        const newItem = {
            id: this.state.nextItemID++,
            type: 'folder',
            name: newName,
            x: x,
            y: y,
            children: []
        };
        this.state.desktopItems.push(newItem);
        this._renderDesktop();
        this._saveState();
    }
    
    _saveState() {
        const stateToSave = { desktopItems: this.state.desktopItems, theme: this.state.theme };
        localStorage.setItem('vibeos_state', JSON.stringify(stateToSave));
        console.log('State saved!');
    }

    _loadState() {
        const savedState = localStorage.getItem('vibeos_state');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            this.state = Object.assign(this.state, parsedState);
            console.log('State loaded!');
        }
    }
    
    updateDesktopItemPosition(itemId, x, y) {
        const item = this.state.desktopItems.find(i => i.id == itemId);
        if (item) {
            item.x = x;
            item.y = y;
            this._saveState();
        }
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
        
        // ================== FIX START ==================
        // Add special handling for the native dashboard app
        if (appId === 'dashboard') {
            this.openDashboard();
            return; // Stop execution to prevent the generic window from opening
        }
        // =================== FIX END ===================

        if (appData.launchMode === 'new-tab') { 
            // Create temporary link and simulate click (bypasses CSP)
            const link = document.createElement('a');
            link.href = appData.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        
        const existingWindow = this.state.openWindows.find(w => w.appData && w.appData.id === appId);
        if (existingWindow) { this._restoreWindow(existingWindow.element); return; }
        this._createWindow(appData);
        console.log("Launching app:", appData.name, "URL:", appData.url, "Mode:", appData.launchMode);
    }

    openFolder(itemId) {
        const folderItem = this.state.desktopItems.find(item => item.id == itemId && item.type === 'folder');
        if (folderItem) {
            const existingWindow = this.state.openWindows.find(w => w.folderId === folderItem.id);
            if (existingWindow) { this._focusWindow(existingWindow.element); return; }
            this._createFileExplorerWindow(folderItem);
        }
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

        windowEl.dataset.windowId = windowId;
        windowEl.dataset.appId = appData.id;
        windowEl.style.left = `${Math.max(20, centerX)}px`;
        windowEl.style.top = `${Math.max(20, centerY)}px`;

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
            loadingOverlay.innerHTML = `<div style="text-align: center; padding: 20px;"><h3>Unable to load ${appData.name}</h3><p>This site may not allow embedding.</p><button onclick="window.open('${appData.url}', '_blank')" style="margin-top: 10px; padding: 8px 16px;">Open in New Tab</button></div>`;
        };
        loadTimeout = setTimeout(() => { if (!loadingOverlay.classList.contains('hidden')) { iframe.onerror(); } }, 10000);
        iframe.src = appData.url;

        this.ui.desktop.appendChild(windowEl);
        this.state.openWindows.push({ id: windowId, element: windowEl, appData: appData });

        this._createDockIcon({ name: appData.name, icon: appData.icon }, windowId);
        this._focusWindow(windowEl);
    }

    _createFileExplorerWindow(folderData) {
        const windowId = `window-${this.state.nextWindowID++}`;
        const template = document.querySelector('#file-explorer-template').content.cloneNode(true);
        const windowEl = template.querySelector('.app-instance-window');

        const appWindowRect = this.ui.desktop.getBoundingClientRect();
        const windowWidth = 720;
        const windowHeight = 480;
        const centerX = (appWindowRect.width - windowWidth) / 2;
        const centerY = (appWindowRect.height - windowHeight) / 2;

        windowEl.dataset.windowId = windowId;
        windowEl.style.left = `${Math.max(40, centerX)}px`;
        windowEl.style.top = `${Math.max(40, centerY)}px`;

        // Set folder title
        const titleBar = windowEl.querySelector('.window-title-bar');
        titleBar.querySelector('.window-title').textContent = folderData.name;

        // Render folder contents
        this._renderFolderContents(windowEl, folderData);

        // Add event listeners for toolbar buttons
        const newFolderBtn = windowEl.querySelector('.new-folder-btn');
        newFolderBtn?.addEventListener('click', () => {
            this._createNewFolderInExplorer(folderData, windowEl);
        });

        this.ui.desktop.appendChild(windowEl);
        this.state.openWindows.push({ id: windowId, element: windowEl, folderId: folderData.id });

        // Create dock icon for folder
        this._createDockIcon({ name: folderData.name, icon: 'assets/icons/folder.png' }, windowId);
        this._focusWindow(windowEl);
    }

    _renderFolderContents(windowEl, folderData) {
        const contentArea = windowEl.querySelector('.file-explorer-content');
        const emptyMessage = windowEl.querySelector('.empty-folder-message');
        
        // Clear existing content
        contentArea.innerHTML = '';
        
        if (!folderData.children || folderData.children.length === 0) {
            // Show empty folder message
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
            return;
        }
        
        // Hide empty folder message
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
        
        // Render folder contents
        folderData.children.forEach(item => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.itemId = item.id;
            
            let iconSrc = '';
            let name = '';
            
            if (item.type === 'folder') {
                iconSrc = 'assets/icons/folder.png';
                name = item.name;
            } else {
                // For files, use a generic file icon or determine based on extension
                iconSrc = 'assets/icons/file.svg';
                name = item.name;
            }
            
            fileItem.innerHTML = `
                <img src="${iconSrc}" alt="${name}">
                <span>${name}</span>
            `;
            
            // Add double-click to open
            fileItem.addEventListener('dblclick', () => {
                if (item.type === 'folder') {
                    this.openFolder(item.id);
                }
                // For files, we could implement opening functionality here
            });
            
            contentArea.appendChild(fileItem);
        });
    }

    _createNewFolderInExplorer(folderData, windowEl) {
        let maxNum = 0;
        if (folderData.children) {
            folderData.children.forEach(item => {
                if (item.name?.startsWith('New Folder')) {
                    const num = parseInt(item.name.replace('New Folder', '').trim()) || 0;
                    if (num > maxNum) maxNum = num;
                }
            });
        }
        
        const newName = maxNum > 0 ? `New Folder ${maxNum + 1}` : 'New Folder';
        const newItem = {
            id: this.state.nextItemID++,
            type: 'folder',
            name: newName,
            children: []
        };
        
        if (!folderData.children) {
            folderData.children = [];
        }
        
        folderData.children.push(newItem);
        this._renderFolderContents(windowEl, folderData);
        this._saveState();
    }

    _createDockIcon(data, windowId) {
        const commandBtn = this.ui.dock.querySelector('#command-center-btn');
        const dockIcon = document.createElement('button');
        dockIcon.className = 'dock-item';
        dockIcon.dataset.windowId = windowId;
        dockIcon.title = data.name;
        dockIcon.setAttribute('aria-label', `Focus ${data.name}`);
        
        const img = document.createElement('img');
        img.src = data.icon; // Use the provided icon path
        img.alt = data.name;
        
        dockIcon.appendChild(img);
        this.ui.dock.insertBefore(dockIcon, commandBtn.nextSibling);
    }

    _focusWindow(windowElement) {
        document.querySelectorAll('.app-instance-window').forEach(w => w.classList.remove('active-window'));
        windowElement.classList.add('active-window');
        windowElement.style.zIndex = this.state.nextZIndex++;
        
        document.querySelectorAll('.dock-item').forEach(item => item.classList.remove('active-dock-icon'));
        const windowId = windowElement.dataset.windowId;
        const dockItem = this.ui.dock.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) {
            dockItem.classList.remove('minimized-dock-icon'); // Ensure it's not marked as minimized
            dockItem.classList.add('active-dock-icon');
        }
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
    }

    _maximizeWindow(windowElement) { 
        windowElement.classList.toggle('maximized'); 
    }
    
    // ======================================================
    // --- COMMAND CENTER & SEARCH ---
    // ======================================================

    showCommandCenter() {
        this.ui.commandCenterOverlay.classList.remove('hidden');
        this._updateCommandCenterResults('');
        this.ui.commandCenterInput.value = '';
        this.ui.commandCenterInput.focus();
    }
    
    closeCommandCenter() { 
        this.ui.commandCenterOverlay.classList.add('hidden'); 
    }
    
    _updateCommandCenterResults(query) {
        this.ui.commandCenterResults.innerHTML = '';
        const lowerQuery = query.toLowerCase().trim();
        const filteredApps = this.state.availableApps.filter(app => 
            app.name.toLowerCase().includes(lowerQuery)
        );
        if (filteredApps.length === 0 && lowerQuery === '') {
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

    showAIPanel() { 
        this.ui.aiPanel.classList.remove('hidden'); 
        this.ui.aiInput.focus(); 
    }
    
    closeAIPanel() { 
        this.ui.aiPanel.classList.add('hidden'); 
    }
    
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
            let userMessage = "Sorry, I'm having trouble connecting to the AI network right now.";
            
            // Provide more specific error messages to the user
            if (error.message.includes("Network error")) {
                userMessage = "Network connection error. Please check your internet connection.";
            } else if (error.message.includes("API_KEY_INVALID")) {
                userMessage = "Invalid API key. Please check your configuration in config.js.";
            } else if (error.message.includes("401")) {
                userMessage = "Authentication failed. Please check your API key.";
            } else if (error.message.includes("429")) {
                userMessage = "Rate limit exceeded. Please wait a moment before trying again.";
            }
            
            this._addMessageToChat('ai', userMessage);
        } finally {
            this.ui.aiTypingIndicator.classList.add('hidden');
            this.ui.aiSendBtn.disabled = false;
        }
    }
    
    _processCommand(query) {
        const lowerQuery = query.toLowerCase().trim();
        
        // Handle app launching commands

        // Handle theme switching commands
    if (lowerQuery === 'light mode' || lowerQuery === 'enable light mode' || lowerQuery === 'light theme') {
        return {
            message: "Switching to light mode...",
            action: () => this._setTheme('light')
        };
    }
    
    if (lowerQuery === 'dark mode' || lowerQuery === 'enable dark mode' || lowerQuery === 'dark theme') {
        return {
            message: "Switching to dark mode...",
            action: () => this._setTheme('dark')
        };
    }

        if (lowerQuery.startsWith('open ')) {
            const appName = lowerQuery.substring(5).trim();
            const app = this.state.availableApps.find(a => 
                a.name.toLowerCase().includes(appName) || 
                a.id.toLowerCase().includes(appName)
            );
            
            if (app) {
                return {
                    message: `Opening ${app.name}...`,
                    action: () => this.launchApp(app.id)
                };
            } else {
                return {
                    message: `I couldn't find an app named "${appName}". Try searching for it in the command center.`
                };
            }
        }
        
        // Handle folder creation commands
        if (lowerQuery === 'create folder' || lowerQuery === 'new folder') {
            // Create folder at a default position
            const centerX = this.ui.desktop.clientWidth / 2 - 45;
            const centerY = this.ui.desktop.clientHeight / 2 - 55;
            
            return {
                message: "Creating a new folder on the desktop...",
                action: () => this._createNewFolder(centerX, centerY)
            };
        }
        
        // Handle system info commands
        if (lowerQuery.includes('system') && (lowerQuery.includes('info') || lowerQuery.includes('status'))) {
            return this.showSystemInfo();
        }
        
        if (lowerQuery === 'dashboard' || lowerQuery === 'sysinfo') {
            return this.showSystemInfo();
        }
        
        // Handle dashboard opening
        if (lowerQuery.includes('open') && lowerQuery.includes('dashboard')) {
            return {
                message: "Opening System Dashboard...",
                action: () => this.openDashboard()
            };
        }
        
        // Handle theme switching commands
        if (lowerQuery === 'dark mode' || lowerQuery === 'enable dark mode') {
            return {
                message: "Switching to dark mode...",
                action: () => this._setTheme('dark')
            };
        }
        
        if (lowerQuery === 'light mode' || lowerQuery === 'enable light mode') {
            return {
                message: "Switching to light mode...",
                action: () => this._setTheme('light')
            };
        }
        
        // Handle help command
        if (lowerQuery === 'help' || lowerQuery === 'what can you do') {
            return {
                message: `I can help you with:
• Opening apps (try "open [app name]")
• Creating folders (try "create folder")
• Switching themes (try "dark mode" or "light mode")
• Answering questions (just ask anything!)

You can also search for apps in the command center by typing their name.`
            };
        }
        
        // If no specific command matched, return null to proceed with AI
        return null;
    }
    
    _setTheme(themeName) {
        this.state.theme = themeName;
        document.body.classList.toggle('dark-theme', themeName === 'dark');
        this._saveState();
    }
    
    async _getGeminiResponse(query) {
        // FIXED: Removed the space in the API URL
        const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contents: [{ 
                        parts: [{ 
                            text: `You are VibeOS, a friendly and helpful operating system assistant. Keep your answers concise and helpful. User query: "${query}"` 
                        }] 
                    }] 
                })
            });

            if (!response.ok) {
                let errorMessage = `API request failed with status ${response.status}`;
                
                // Try to get more specific error information
                try {
                    const errorData = await response.json();
                    if (errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (e) {
                    // If we can't parse the error, use the status text
                    errorMessage = response.statusText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            // Check if we have a valid response
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
                throw new Error("Received incomplete response from AI service");
            }
            
            return data.candidates[0].content.parts[0].text;
            
        } catch (error) {
            console.error("AI Error:", error);
            let userMessage = "Sorry, I'm having trouble connecting to the AI network right now.";
            
            // Provide more specific error messages to the user
            if (error.message.includes("Network error")) {
                userMessage = "Network connection error. Please check your internet connection.";
            } else if (error.message.includes("API_KEY_INVALID")) {
                userMessage = "Invalid API key. Please check your configuration in config.js.";
            } else if (error.message.includes("401")) {
                userMessage = "Authentication failed. Please check your API key.";
            } else if (error.message.includes("429")) {
                userMessage = "Rate limit exceeded. Please wait a moment before trying again.";
            }
            
            throw new Error(userMessage);
        }
    }
    
    _addMessageToChat(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message from-${sender}`;
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code>$1</code>');
        bubbleDiv.innerHTML = text;
        messageDiv.appendChild(bubbleDiv);
        this.ui.aiMessageList.appendChild(messageDiv);
        this.ui.aiMessageList.scrollTop = this.ui.aiMessageList.scrollHeight;
    }
}