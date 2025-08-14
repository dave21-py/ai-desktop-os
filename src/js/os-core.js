// Enhanced WarmwindOS with Desktop Management
class WarmwindOS {
    constructor() {
        this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        this.state = {
            openWindows: [],
            nextZIndex: 21,
            nextWindowID: 0,
            availableApps: [],
            desktopItems: [], // New: Desktop folders and files
            recycleBin: [], // New: Deleted items
            selectedItems: [], // New: Currently selected desktop items
            nextItemId: 1
        };
        this.ui = {};
    }

    boot() {
        this._initUI();
        this._loadAppIntents();
        this._injectWindowCSS();
        this._injectDesktopCSS(); // New: Desktop styles
        this._initDesktopSystem(); // New: Desktop functionality
        this._createRecycleBin(); // New: Create recycle bin
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

    _injectDesktopCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Desktop Items */
            .desktop-item {
                position: absolute;
                width: 80px;
                height: 80px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                user-select: none;
                transition: all 0.2s ease;
                border-radius: 8px;
                padding: 8px;
            }

            .desktop-item:hover {
                background-color: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
            }

            .desktop-item.selected {
                background-color: rgba(0, 122, 255, 0.3);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(0, 122, 255, 0.5);
            }

            .desktop-item.dragging {
                opacity: 0.7;
                transform: rotate(5deg) scale(1.1);
                z-index: 1000;
            }

            .desktop-item-icon {
                width: 48px;
                height: 48px;
                margin-bottom: 4px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }

            .desktop-item-name {
                font-size: 11px;
                font-weight: 600;
                color: white;
                text-align: center;
                text-shadow: 0 1px 3px rgba(0,0,0,0.7);
                word-wrap: break-word;
                max-width: 70px;
                line-height: 1.2;
            }

            .desktop-item-name.editing {
                background-color: rgba(255, 255, 255, 0.9);
                color: #333;
                border-radius: 4px;
                padding: 2px 4px;
                text-shadow: none;
                outline: 2px solid #007AFF;
            }

            /* Context Menu */
            .context-menu {
                position: absolute;
                background-color: rgba(248, 249, 251, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                padding: 6px 0;
                min-width: 180px;
                z-index: 10000;
                font-size: 14px;
            }

            .context-menu-item {
                padding: 8px 16px;
                cursor: pointer;
                transition: background-color 0.15s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #333;
            }

            .context-menu-item:hover {
                background-color: rgba(0, 122, 255, 0.1);
            }

            .context-menu-item.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .context-menu-item.disabled:hover {
                background-color: transparent;
            }

            .context-menu-separator {
                height: 1px;
                background-color: rgba(0, 0, 0, 0.1);
                margin: 4px 0;
            }

            .context-menu-icon {
                width: 16px;
                height: 16px;
            }

            /* Selection Rectangle */
            .selection-rectangle {
                position: absolute;
                border: 1px solid rgba(0, 122, 255, 0.6);
                background-color: rgba(0, 122, 255, 0.1);
                pointer-events: none;
                z-index: 999;
            }

            /* Recycle Bin */
            .recycle-bin {
                position: absolute;
                bottom: 20px;
                right: 20px;
                width: 80px;
                height: 80px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border-radius: 8px;
                padding: 8px;
                transition: all 0.2s ease;
            }

            .recycle-bin:hover {
                background-color: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
            }

            .recycle-bin.drag-over {
                background-color: rgba(255, 0, 0, 0.2);
                border: 2px dashed rgba(255, 0, 0, 0.5);
            }

            .recycle-bin-icon {
                width: 48px;
                height: 48px;
                margin-bottom: 4px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }

            .recycle-bin-name {
                font-size: 11px;
                font-weight: 600;
                color: white;
                text-align: center;
                text-shadow: 0 1px 3px rgba(0,0,0,0.7);
            }

            /* Folder Icons */
            .folder-icon {
                background: linear-gradient(45deg, #4A90E2, #357ABD);
                border-radius: 8px;
                position: relative;
                overflow: hidden;
            }

            .folder-icon::before {
                content: '';
                position: absolute;
                top: 6px;
                left: 6px;
                right: 6px;
                height: 8px;
                background: linear-gradient(45deg, #5BA0F2, #4A90E2);
                border-radius: 4px 4px 0 0;
            }

            .folder-icon::after {
                content: '📁';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 24px;
            }
        `;
        document.head.appendChild(style);
    }

    _initDesktopSystem() {
        // Desktop event listeners
        this.ui.desktop.addEventListener('dblclick', (e) => this._handleDesktopDoubleClick(e));
        this.ui.desktop.addEventListener('contextmenu', (e) => this._handleDesktopRightClick(e));
        this.ui.desktop.addEventListener('click', (e) => this._handleDesktopClick(e));
        this.ui.desktop.addEventListener('mousedown', (e) => this._handleDesktopMouseDown(e));
        
        // Global event listeners
        document.addEventListener('click', (e) => this._hideContextMenu(e));
        document.addEventListener('keydown', (e) => this._handleKeydown(e));
    }

    _createRecycleBin() {
        const recycleBin = document.createElement('div');
        recycleBin.className = 'recycle-bin';
        recycleBin.innerHTML = `
            <div class="recycle-bin-icon">🗑️</div>
            <div class="recycle-bin-name">Recycle Bin</div>
        `;
        
        // Drag and drop functionality
        recycleBin.addEventListener('dragover', (e) => {
            e.preventDefault();
            recycleBin.classList.add('drag-over');
        });
        
        recycleBin.addEventListener('dragleave', () => {
            recycleBin.classList.remove('drag-over');
        });
        
        recycleBin.addEventListener('drop', (e) => {
            e.preventDefault();
            recycleBin.classList.remove('drag-over');
            this._handleRecycleBinDrop(e);
        });
        
        recycleBin.addEventListener('dblclick', () => {
            this._openRecycleBin();
        });
        
        this.ui.desktop.appendChild(recycleBin);
    }

    _handleDesktopDoubleClick(e) {
        if (e.target === this.ui.desktop) {
            const rect = this.ui.desktop.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this._createNewFolder(x, y);
        }
    }

    _handleDesktopRightClick(e) {
        e.preventDefault();
        const rect = this.ui.desktop.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (e.target === this.ui.desktop) {
            this._showDesktopContextMenu(x, y);
        } else if (e.target.closest('.desktop-item')) {
            const item = e.target.closest('.desktop-item');
            this._showItemContextMenu(x, y, item);
        }
    }

    _handleDesktopClick(e) {
        if (e.target === this.ui.desktop) {
            this._clearSelection();
        }
    }

    _createNewFolder(x, y) {
        const folder = {
            id: this.state.nextItemId++,
            type: 'folder',
            name: 'New Folder',
            x: Math.max(10, Math.min(x - 40, this.ui.desktop.clientWidth - 90)),
            y: Math.max(10, Math.min(y - 40, this.ui.desktop.clientHeight - 90)),
            created: new Date()
        };
        
        this.state.desktopItems.push(folder);
        this._renderDesktopItem(folder);
        
        // Start editing the name immediately
        setTimeout(() => {
            this._startRenaming(folder.id);
        }, 100);
    }

    _renderDesktopItem(item) {
        const element = document.createElement('div');
        element.className = 'desktop-item';
        element.dataset.itemId = item.id;
        element.style.left = `${item.x}px`;
        element.style.top = `${item.y}px`;
        element.draggable = true;
        
        const icon = document.createElement('div');
        icon.className = 'desktop-item-icon';
        
        if (item.type === 'folder') {
            icon.className += ' folder-icon';
        }
        
        const name = document.createElement('div');
        name.className = 'desktop-item-name';
        name.textContent = item.name;
        
        element.appendChild(icon);
        element.appendChild(name);
        
        // Event listeners
        element.addEventListener('click', (e) => this._selectItem(e, item.id));
        element.addEventListener('dblclick', (e) => this._openItem(e, item.id));
        element.addEventListener('dragstart', (e) => this._handleDragStart(e, item.id));
        element.addEventListener('dragend', (e) => this._handleDragEnd(e, item.id));
        
        this.ui.desktop.appendChild(element);
    }

    _selectItem(e, itemId) {
        e.stopPropagation();
        
        if (!e.ctrlKey && !e.metaKey) {
            this._clearSelection();
        }
        
        const element = document.querySelector(`[data-item-id="${itemId}"]`);
        element.classList.add('selected');
        
        if (!this.state.selectedItems.includes(itemId)) {
            this.state.selectedItems.push(itemId);
        }
    }

    _clearSelection() {
        document.querySelectorAll('.desktop-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        this.state.selectedItems = [];
    }

    _openItem(e, itemId) {
        e.stopPropagation();
        const item = this.state.desktopItems.find(i => i.id === itemId);
        
        if (item && item.type === 'folder') {
            // Create a simple folder window
            this._createFolderWindow(item);
        }
    }

    _createFolderWindow(folder) {
        const appData = {
            id: `folder-${folder.id}`,
            name: folder.name,
            url: 'data:text/html,<html><body style="font-family: system-ui; padding: 20px; background: #f5f5f5;"><h2>📁 ' + folder.name + '</h2><p>This is a folder window. You can extend this to show folder contents.</p></body></html>',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234A90E2"><path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/></svg>',
            launchMode: 'window'
        };
        
        this._createWindow(appData);
    }

    _showDesktopContextMenu(x, y) {
        this._hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        
        menu.innerHTML = `
            <div class="context-menu-item" data-action="new-folder">
                <span class="context-menu-icon">📁</span>
                New Folder
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="paste" ${this.state.clipboard ? '' : 'class="disabled"'}>
                <span class="context-menu-icon">📋</span>
                Paste
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="refresh">
                <span class="context-menu-icon">🔄</span>
                Refresh
            </div>
        `;
        
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if (action) {
                this._handleContextMenuAction(action, { x, y });
            }
        });
        
        this.ui.desktop.appendChild(menu);
        
        // Adjust position if menu goes off screen
        const rect = menu.getBoundingClientRect();
        const desktopRect = this.ui.desktop.getBoundingClientRect();
        
        if (rect.right > desktopRect.right) {
            menu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > desktopRect.bottom) {
            menu.style.top = `${y - rect.height}px`;
        }
    }

    _showItemContextMenu(x, y, itemElement) {
        this._hideContextMenu();
        
        const itemId = parseInt(itemElement.dataset.itemId);
        const item = this.state.desktopItems.find(i => i.id === itemId);
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        
        menu.innerHTML = `
            <div class="context-menu-item" data-action="open">
                <span class="context-menu-icon">📂</span>
                Open
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="rename">
                <span class="context-menu-icon">✏️</span>
                Rename
            </div>
            <div class="context-menu-item" data-action="copy">
                <span class="context-menu-icon">📄</span>
                Copy
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="delete">
                <span class="context-menu-icon">🗑️</span>
                Delete
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="properties">
                <span class="context-menu-icon">ℹ️</span>
                Properties
            </div>
        `;
        
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if (action) {
                this._handleContextMenuAction(action, { itemId, x, y });
            }
        });
        
        this.ui.desktop.appendChild(menu);
    }

    _handleContextMenuAction(action, data) {
        this._hideContextMenu();
        
        switch (action) {
            case 'new-folder':
                this._createNewFolder(data.x, data.y);
                break;
            case 'open':
                this._openItem({stopPropagation: () => {}}, data.itemId);
                break;
            case 'rename':
                this._startRenaming(data.itemId);
                break;
            case 'delete':
                this._deleteItem(data.itemId);
                break;
            case 'copy':
                this._copyItem(data.itemId);
                break;
            case 'paste':
                if (this.state.clipboard) {
                    this._pasteItem(data.x, data.y);
                }
                break;
            case 'refresh':
                this._refreshDesktop();
                break;
            case 'properties':
                this._showProperties(data.itemId);
                break;
        }
    }

    _startRenaming(itemId) {
        const element = document.querySelector(`[data-item-id="${itemId}"]`);
        const nameElement = element.querySelector('.desktop-item-name');
        const currentName = nameElement.textContent;
        
        nameElement.classList.add('editing');
        nameElement.contentEditable = true;
        nameElement.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(nameElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        const finishRename = () => {
            const newName = nameElement.textContent.trim();
            if (newName && newName !== currentName) {
                const item = this.state.desktopItems.find(i => i.id === itemId);
                if (item) {
                    item.name = newName;
                }
            } else {
                nameElement.textContent = currentName;
            }
            
            nameElement.classList.remove('editing');
            nameElement.contentEditable = false;
            nameElement.blur();
        };
        
        nameElement.addEventListener('blur', finishRename, { once: true });
        nameElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRename();
            } else if (e.key === 'Escape') {
                nameElement.textContent = currentName;
                finishRename();
            }
        });
    }

    _deleteItem(itemId) {
        const item = this.state.desktopItems.find(i => i.id === itemId);
        if (item) {
            // Move to recycle bin
            this.state.recycleBin.push({
                ...item,
                deletedAt: new Date()
            });
            
            // Remove from desktop
            this.state.desktopItems = this.state.desktopItems.filter(i => i.id !== itemId);
            const element = document.querySelector(`[data-item-id="${itemId}"]`);
            if (element) {
                element.remove();
            }
        }
    }

    _copyItem(itemId) {
        const item = this.state.desktopItems.find(i => i.id === itemId);
        if (item) {
            this.state.clipboard = { ...item };
        }
    }

    _pasteItem(x, y) {
        if (this.state.clipboard) {
            const newItem = {
                ...this.state.clipboard,
                id: this.state.nextItemId++,
                name: `${this.state.clipboard.name} - Copy`,
                x: x,
                y: y
            };
            
            this.state.desktopItems.push(newItem);
            this._renderDesktopItem(newItem);
        }
    }

    _refreshDesktop() {
        // Re-render all desktop items
        document.querySelectorAll('.desktop-item').forEach(el => el.remove());
        this.state.desktopItems.forEach(item => this._renderDesktopItem(item));
    }

    _showProperties(itemId) {
        const item = this.state.desktopItems.find(i => i.id === itemId);
        if (item) {
            alert(`Properties of ${item.name}:\n\nType: ${item.type}\nCreated: ${item.created.toLocaleString()}\nPosition: (${item.x}, ${item.y})`);
        }
    }

    _handleDragStart(e, itemId) {
        const element = document.querySelector(`[data-item-id="${itemId}"]`);
        element.classList.add('dragging');
        e.dataTransfer.setData('text/plain', itemId);
    }

    _handleDragEnd(e, itemId) {
        const element = document.querySelector(`[data-item-id="${itemId}"]`);
        element.classList.remove('dragging');
    }

    _handleRecycleBinDrop(e) {
        const itemId = parseInt(e.dataTransfer.getData('text/plain'));
        if (itemId) {
            this._deleteItem(itemId);
        }
    }

    _openRecycleBin() {
        if (this.state.recycleBin.length === 0) {
            alert('Recycle Bin is empty');
            return;
        }
        
        const items = this.state.recycleBin.map(item => 
            `${item.name} (deleted ${item.deletedAt.toLocaleString()})`
        ).join('\n');
        
        alert(`Recycle Bin Contents:\n\n${items}`);
    }

    _hideContextMenu() {
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
    }

    _handleKeydown(e) {
        if (e.key === 'Delete' && this.state.selectedItems.length > 0) {
            this.state.selectedItems.forEach(itemId => this._deleteItem(itemId));
            this._clearSelection();
        } else if (e.key === 'F2' && this.state.selectedItems.length === 1) {
            this._startRenaming(this.state.selectedItems[0]);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && this.state.selectedItems.length === 1) {
            this._copyItem(this.state.selectedItems[0]);
        }
    }

    // [Keep all your existing methods: _injectWindowCSS, _loadAppIntents, launchApp, etc...]
    _injectWindowCSS() {
        const style = document.createElement('style');
        style.textContent = `
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
        
        const template = this.ui.windowTemplate.content.cloneNode(true);
        const windowEl = template.querySelector('.app-instance-window');
        
        const appWindowRect = this.ui.desktop.parentElement.getBoundingClientRect();
        const windowWidth = 960;
        const windowHeight = 640;
        
        const centerX = (appWindowRect.width - windowWidth) / 2;
        const centerY = (appWindowRect.height - windowHeight) / 2;
        const offset = this.state.openWindows.length * 30;
        
        windowEl.dataset.windowId = windowId;
        windowEl.dataset.appId = appData.id;
        windowEl.style.left = `${Math.max(20, centerX + offset)}px`;
        windowEl.style.top = `${Math.max(60, centerY + offset)}px`;
        windowEl.style.width = `${windowWidth}px`;
        windowEl.style.height = `${windowHeight}px`;
        windowEl.style.zIndex = this.state.nextZIndex++;

        windowEl.dataset.originalLeft = windowEl.style.left;
        windowEl.dataset.originalTop = windowEl.style.top;
        windowEl.dataset.originalWidth = windowEl.style.width;
        windowEl.dataset.originalHeight = windowEl.style.height;

        const titleBar = windowEl.querySelector('.window-title-bar');
        titleBar.querySelector('.window-icon').src = appData.icon;
        titleBar.querySelector('.window-title').textContent = appData.name;
        
        const iframe = windowEl.querySelector('iframe');
        const loadingOverlay = windowEl.querySelector('.loading-overlay');
        
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
        
        loadTimeout = setTimeout(() => {
            if (!loadingOverlay.classList.contains('hidden')) {
                iframe.onerror();
            }
        }, 10000);
        
        iframe.src = appData.url;

        this.ui.desktop.appendChild(windowEl);
        
        this.state.openWindows.push({
            id: windowId,
            element: windowEl,
            appData: appData
        });

        this._createDockIcon(appData, windowId);
        
        this._focusWindow(windowEl);
    }

    _focusWindow(windowElement) {
        document.querySelectorAll('.app-instance-window').forEach(w => {
            w.classList.remove('active-window');
        });
        
        windowElement.classList.add('active-window');
        windowElement.style.zIndex = this.state.nextZIndex++;
        
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
        
        this.state.openWindows = this.state.openWindows.filter(w => w.id !== windowId);
        
        const dockItem = document.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) {
            dockItem.remove();
        }
        
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
        
        const addBtn = this.ui.dock.querySelector('.add-btn');
        this.ui.dock.insertBefore(dockIcon, addBtn);
    }

    _minimizeWindow(windowElement) {
        windowElement.classList.add('minimized');
        
        const windowId = windowElement.dataset.windowId;
        const dockItem = document.querySelector(`.dock-item[data-window-id="${windowId}"]`);
        if (dockItem) {
            dockItem.classList.remove('active-dock-icon');
            dockItem.classList.add('minimized-dock-icon');
        }
    }

    _restoreWindow(windowElement) {
        windowElement.classList.remove('minimized');
        this._focusWindow(windowElement);
        
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
            console.log('Restoring window to original size');
            windowElement.classList.remove('maximized');
            
            windowElement.style.left = windowElement.dataset.originalLeft;
            windowElement.style.top = windowElement.dataset.originalTop;
            windowElement.style.width = windowElement.dataset.originalWidth;
            windowElement.style.height = windowElement.dataset.originalHeight;
            windowElement.style.position = 'absolute';
        } else {
            console.log('Maximizing window');
            
            windowElement.dataset.originalLeft = windowElement.style.left;
            windowElement.dataset.originalTop = windowElement.style.top;
            windowElement.dataset.originalWidth = windowElement.style.width;
            windowElement.dataset.originalHeight = windowElement.style.height;
            
            const appWindow = document.querySelector('.app-window');
            
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

    // AI Assistant Functions
    showAIPanel() {
        this.ui.aiPanel.classList.remove('hidden');
        this.ui.aiInput.focus();
    }

    closeAIPanel() {
        this.ui.aiPanel.classList.add('hidden');
    }

    async askAI(query) {
        this._addMessageToChat('user', query);
        this.ui.aiTypingIndicator.classList.remove('hidden');

        const commandResponse = this._processCommand(query);
        if (commandResponse) {
            this.ui.aiTypingIndicator.classList.add('hidden');
            this._addMessageToChat('ai', commandResponse.message);
            if(commandResponse.action) commandResponse.action();
            this.ui.aiSendBtn.disabled = false;
            return;
        }

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
    
    _processCommand(query) {
        const lowerQuery = query.toLowerCase();
        
        // Desktop Management Commands
        if (this._isDesktopCommand(lowerQuery)) {
            return this._handleDesktopCommand(lowerQuery);
        }
        
        // App Launch Commands
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
        return null;
    }

    _isDesktopCommand(query) {
        const desktopKeywords = [
            'folder', 'create', 'make', 'new', 'delete', 'remove', 'rename', 
            'recycle', 'bin', 'trash', 'empty', 'show', 'list', 'move'
        ];
        return desktopKeywords.some(keyword => query.includes(keyword));
    }

    _handleDesktopCommand(query) {
        // Create folder commands
        if (query.includes('create') || query.includes('make') || query.includes('new')) {
            if (query.includes('folder')) {
                return this._handleCreateFolderCommand(query);
            }
        }
        
        // Delete commands
        if (query.includes('delete') || query.includes('remove')) {
            if (query.includes('folder')) {
                return this._handleDeleteFolderCommand(query);
            }
            if (query.includes('selected')) {
                return this._handleDeleteSelectedCommand();
            }
        }
        
        // Rename commands
        if (query.includes('rename')) {
            return this._handleRenameCommand(query);
        }
        
        // Recycle bin commands
        if (query.includes('recycle') || query.includes('bin') || query.includes('trash')) {
            if (query.includes('empty')) {
                return this._handleEmptyRecycleBinCommand();
            }
            if (query.includes('show') || query.includes('open')) {
                return this._handleShowRecycleBinCommand();
            }
        }
        
        // List/Show commands
        if (query.includes('show') || query.includes('list')) {
            if (query.includes('folder')) {
                return this._handleListFoldersCommand();
            }
        }
        
        // Move to recycle bin
        if (query.includes('move') && (query.includes('recycle') || query.includes('bin') || query.includes('trash'))) {
            return this._handleMoveToRecycleBinCommand(query);
        }
        
        return null;
    }

    _handleCreateFolderCommand(query) {
        // Extract folder name from query
        let folderName = 'New Folder';
        
        // Look for patterns like "called X", "named X", "folder X"
        const patterns = [
            /(?:called|named)\s+["']?([^"']+)["']?/i,
            /(?:folder|create)\s+["']?([^"']+)["']?(?:\s+folder)?/i,
            /make\s+(?:a\s+)?["']?([^"']+)["']?(?:\s+folder)?/i
        ];
        
        for (const pattern of patterns) {
            const match = query.match(pattern);
            if (match && match[1] && !['a', 'new', 'folder'].includes(match[1].toLowerCase())) {
                folderName = match[1].trim();
                break;
            }
        }
        
        // Generate unique name if folder exists
        const existingNames = this.state.desktopItems.map(item => item.name.toLowerCase());
        let finalName = folderName;
        let counter = 1;
        
        while (existingNames.includes(finalName.toLowerCase())) {
            finalName = `${folderName} (${counter})`;
            counter++;
        }
        
        return {
            message: `Creating folder "${finalName}"...`,
            action: () => {
                // Create folder in center of desktop
                const desktopRect = this.ui.desktop.getBoundingClientRect();
                const x = (desktopRect.width / 2) - 40;
                const y = (desktopRect.height / 2) - 40;
                
                const folder = {
                    id: this.state.nextItemId++,
                    type: 'folder',
                    name: finalName,
                    x: Math.max(10, Math.min(x, this.ui.desktop.clientWidth - 90)),
                    y: Math.max(10, Math.min(y, this.ui.desktop.clientHeight - 90)),
                    created: new Date()
                };
                
                this.state.desktopItems.push(folder);
                this._renderDesktopItem(folder);
                
                // Select the new folder
                setTimeout(() => {
                    this._selectItem({stopPropagation: () => {}, ctrlKey: false}, folder.id);
                }, 100);
            }
        };
    }

    _handleDeleteFolderCommand(query) {
        // Look for specific folder name in query
        const folderNames = this.state.desktopItems.map(item => item.name);
        let targetFolder = null;
        
        // Find folder name in query
        for (const name of folderNames) {
            if (query.includes(name.toLowerCase())) {
                targetFolder = this.state.desktopItems.find(item => item.name === name);
                break;
            }
        }
        
        // If no specific folder found, check for "selected" or use selected folders
        if (!targetFolder) {
            if (query.includes('selected') && this.state.selectedItems.length > 0) {
                return this._handleDeleteSelectedCommand();
            }
            
            return {
                message: "I couldn't find a specific folder to delete. Please select a folder first or specify the folder name.",
                action: null
            };
        }
        
        return {
            message: `Deleting folder "${targetFolder.name}"...`,
            action: () => {
                this._deleteItem(targetFolder.id);
            }
        };
    }

    _handleDeleteSelectedCommand() {
        if (this.state.selectedItems.length === 0) {
            return {
                message: "No folders are currently selected. Please select a folder first by clicking on it.",
                action: null
            };
        }
        
        const selectedNames = this.state.selectedItems.map(id => {
            const item = this.state.desktopItems.find(i => i.id === id);
            return item ? item.name : 'Unknown';
        });
        
        return {
            message: `Deleting selected folder(s): ${selectedNames.join(', ')}...`,
            action: () => {
                this.state.selectedItems.forEach(itemId => this._deleteItem(itemId));
                this._clearSelection();
            }
        };
    }

    _handleRenameCommand(query) {
        if (this.state.selectedItems.length !== 1) {
            return {
                message: "Please select exactly one folder to rename.",
                action: null
            };
        }
        
        // Extract new name from query
        const patterns = [
            /rename\s+(?:to\s+)?["']?([^"']+)["']?/i,
            /(?:call\s+it|name\s+it)\s+["']?([^"']+)["']?/i
        ];
        
        let newName = null;
        for (const pattern of patterns) {
            const match = query.match(pattern);
            if (match && match[1]) {
                newName = match[1].trim();
                break;
            }
        }
        
        if (!newName) {
            return {
                message: "Please specify the new name. For example: 'Rename to Documents' or 'Rename folder to Work Files'",
                action: null
            };
        }
        
        const selectedId = this.state.selectedItems[0];
        const selectedItem = this.state.desktopItems.find(i => i.id === selectedId);
        
        return {
            message: `Renaming "${selectedItem.name}" to "${newName}"...`,
            action: () => {
                selectedItem.name = newName;
                const element = document.querySelector(`[data-item-id="${selectedId}"]`);
                const nameElement = element.querySelector('.desktop-item-name');
                nameElement.textContent = newName;
            }
        };
    }

    _handleListFoldersCommand() {
        if (this.state.desktopItems.length === 0) {
            return {
                message: "Your desktop is empty. You can create a new folder by saying 'Create a new folder'.",
                action: null
            };
        }
        
        const folderList = this.state.desktopItems.map(item => `• ${item.name}`).join('\n');
        
        return {
            message: `Here are your desktop folders:\n${folderList}\n\nYou can select any folder by clicking on it, or ask me to create, delete, or rename folders.`,
            action: null
        };
    }

    _handleEmptyRecycleBinCommand() {
        if (this.state.recycleBin.length === 0) {
            return {
                message: "The recycle bin is already empty.",
                action: null
            };
        }
        
        const itemCount = this.state.recycleBin.length;
        
        return {
            message: `Emptying recycle bin (${itemCount} item${itemCount > 1 ? 's' : ''})...`,
            action: () => {
                this.state.recycleBin = [];
            }
        };
    }

    _handleShowRecycleBinCommand() {
        return {
            message: "Opening recycle bin...",
            action: () => {
                this._openRecycleBin();
            }
        };
    }

    _handleMoveToRecycleBinCommand(query) {
        // Look for specific folder name or use selected
        const folderNames = this.state.desktopItems.map(item => item.name);
        let targetFolder = null;
        
        for (const name of folderNames) {
            if (query.includes(name.toLowerCase())) {
                targetFolder = this.state.desktopItems.find(item => item.name === name);
                break;
            }
        }
        
        if (!targetFolder && this.state.selectedItems.length > 0) {
            return this._handleDeleteSelectedCommand();
        }
        
        if (!targetFolder) {
            return {
                message: "Please specify which folder to move to recycle bin or select a folder first.",
                action: null
            };
        }
        
        return {
            message: `Moving "${targetFolder.name}" to recycle bin...`,
            action: () => {
                this._deleteItem(targetFolder.id);
            }
        };
    }

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

    _addMessageToChat(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message from-${sender}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Add desktop command suggestions for AI messages
        if (sender === 'ai' && text.includes("I'm not connected to the AI network")) {
            bubbleDiv.innerHTML = `${text}<br><br><strong>💡 Desktop Commands Available:</strong><br>• "Create a new folder"<br>• "Make a folder called Documents"<br>• "Delete selected folder"<br>• "Rename to Work Files"<br>• "Show all folders"<br>• "Empty recycle bin"`;
        } else if (sender === 'ai' && this.state.desktopItems.length === 0 && !text.includes('Creating') && !text.includes('launched')) {
            bubbleDiv.innerHTML = `${text}<br><br><em>💡 Try: "Create a new folder" or "Make a folder called Documents"</em>`;
        } else {
            bubbleDiv.textContent = text;
        }
        
        messageDiv.appendChild(bubbleDiv);
        this.ui.aiMessageList.appendChild(messageDiv);

        this.ui.aiMessageList.scrollTop = this.ui.aiMessageList.scrollHeight;
    }
}