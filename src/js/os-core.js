class WarmwindOS {
    constructor() {
        this.state = {
            openWindows: [],
            nextZIndex: 21,
            nextWindowID: 0,
        };
        this.ui = {};
    }

    boot() {
        this._initUI();
    }

    _initUI() {
        this.ui.modalOverlay = document.querySelector('.modal-overlay');
        this.ui.desktop = document.querySelector('#desktop');
        this.ui.windowTemplate = document.querySelector('#window-template');
        this.ui.dock = document.querySelector('.bar-section.center');
    }

    /**
     * UPDATED: This is now the main router for launching anything.
     * @param {HTMLElement} appElement - The app icon element that was clicked.
     */
    launchApp(appElement) {
        // Handle opening the App Drawer itself
        if (appElement.dataset.appid === 'app-drawer') {
            this._showAppDrawer();
            return;
        }
        
        // NEW: Check the launch mode. Default to 'iframe' if not specified.
        const launchMode = appElement.dataset.launchMode || 'iframe';
        const url = appElement.dataset.url;

        if (launchMode === 'new-tab') {
            // Logic for opening in a new browser tab
            console.log(`Core: Launching ${url} in a new tab.`);
            window.open(url, '_blank');
        } else {
            // Existing logic for opening an internal iframe window
            const appData = {
                id: appElement.dataset.appid,
                name: appElement.dataset.appname,
                url: url,
                icon: appElement.querySelector('img').src,
            };

            const existingWindow = this.state.openWindows.find(win => win.dataset.appid === appData.id);
            if (existingWindow) {
                this._focusWindow(existingWindow);
            } else {
                this._createWindow(appData);
            }
        }
    }
    
    _createWindow(appData) {
        const template = this.ui.windowTemplate.content.cloneNode(true);
        const newWindow = template.querySelector('.app-instance-window');
        const windowId = this.state.nextWindowID++;
        
        newWindow.dataset.windowId = windowId;
        newWindow.dataset.appid = appData.id;
        newWindow.querySelector('.window-title').textContent = appData.name;
        newWindow.querySelector('.window-icon').src = appData.icon;

        const iframe = newWindow.querySelector('iframe');
        const loader = newWindow.querySelector('.loading-overlay');
        iframe.onload = () => loader.classList.add('hidden');
        iframe.src = appData.url;

        const offset = (this.state.openWindows.length % 10) * 25;
        newWindow.style.top = `${50 + offset}px`;
        newWindow.style.left = `${100 + offset}px`;
        
        this.ui.desktop.appendChild(newWindow);
        this.state.openWindows.push(newWindow);
        
        this._createDockIcon(appData, windowId);
        this._focusWindow(newWindow);
    }

    _focusWindow(windowElement) {
        this.state.openWindows.forEach(win => win.classList.remove('active-window'));
        document.querySelectorAll('.dock-item').forEach(icon => icon.classList.remove('active-dock-icon'));
        
        windowElement.classList.add('active-window');
        windowElement.style.zIndex = this.state.nextZIndex++;

        const dockIcon = this.ui.dock.querySelector(`.dock-item[data-window-id="${windowElement.dataset.windowId}"]`);
        dockIcon?.classList.add('active-dock-icon');

        if(windowElement.classList.contains('minimized')) {
            windowElement.classList.remove('minimized');
        }
    }

    _closeWindow(windowElement) {
        const windowId = parseInt(windowElement.dataset.windowId);
        windowElement.remove();
        this.state.openWindows = this.state.openWindows.filter(win => parseInt(win.dataset.windowId) !== windowId);
        this.ui.dock.querySelector(`.dock-item[data-window-id="${windowId}"]`)?.remove();
    }

    _createDockIcon(appData, windowId) {
        const dockIcon = document.createElement('img');
        dockIcon.src = appData.icon;
        dockIcon.className = 'avatar dock-item';
        dockIcon.title = appData.name;
        dockIcon.dataset.windowId = windowId;
        this.ui.dock.insertBefore(dockIcon, this.ui.dock.querySelector('.add-btn'));
    }

    _minimizeWindow(windowElement) {
        windowElement.classList.add('minimized');
    }

    _maximizeWindow(windowElement) {
        windowElement.classList.toggle('maximized');
    }

    _showAppDrawer() { this.ui.modalOverlay.classList.remove('hidden'); }
    _closeAppDrawer() { this.ui.modalOverlay.classList.add('hidden'); }
}