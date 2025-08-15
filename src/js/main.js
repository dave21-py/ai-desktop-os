document.addEventListener('DOMContentLoaded', () => {
    const os = new WarmwindOS();
    os.boot();

    // --- Core UI Elements ---
    const desktop = document.querySelector('#desktop');
    const dock = document.querySelector('.bottom-bar');

    // ======================================================
    // --- COMMAND CENTER INTERACTIONS ---
    // ======================================================
    const commandCenterBtn = document.querySelector('#command-center-btn');
    const commandCenterOverlay = document.querySelector('.command-center-overlay');
    const commandCenterInput = document.querySelector('#command-center-input');
    const commandCenterResults = document.querySelector('#command-center-results');

    // Add this to the event listeners section in main.js
const themeToggleBtn = document.querySelector('#theme-toggle');
themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = os.state.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    os._setTheme(newTheme);
});

    commandCenterBtn?.addEventListener('click', () => os.showCommandCenter());
    
    commandCenterOverlay?.addEventListener('click', (e) => {
        if (e.target === commandCenterOverlay) {
            os.closeCommandCenter();
        }
    });

    commandCenterInput?.addEventListener('input', () => {
        os._updateCommandCenterResults(commandCenterInput.value);
    });

    commandCenterResults?.addEventListener('click', (e) => {
        const appItem = e.target.closest('.app-result-item');
        if (appItem && appItem.dataset.appid) {
            os.launchApp(appItem.dataset.appid);
            os.closeCommandCenter();
        }
    });
    
    commandCenterInput?.parentElement.addEventListener('submit', (e) => e.preventDefault());
    commandCenterInput?.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const firstResult = commandCenterResults.querySelector('.app-result-item');
            const query = commandCenterInput.value.trim();
            
            if (firstResult && firstResult.dataset.appid) {
                os.launchApp(firstResult.dataset.appid);
            } else if (query) {
                await os.askAI(query);
            }
            os.closeCommandCenter();
        }
    });

    // ======================================================
    // --- CONTEXT MENU INTERACTIONS ---
    // ======================================================
    function showContextMenu(e) {
        e.preventDefault();
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();

        const menuTemplate = document.querySelector('#context-menu-template');
        const menu = menuTemplate.content.cloneNode(true).firstElementChild;

        const appWindow = document.querySelector('.app-window');
        const appRect = appWindow.getBoundingClientRect();
        const x = Math.min(e.clientX, appRect.right - 200);
        const y = Math.min(e.clientY, appRect.bottom - 100);

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        document.body.appendChild(menu);

        menu.addEventListener('click', (clickEvent) => {
            const action = clickEvent.target.closest('.context-menu-item')?.dataset.action;
            if (action === 'new-folder') {
                const desktopRect = desktop.getBoundingClientRect();
                const folderX = e.clientX - desktopRect.left;
                const folderY = e.clientY - desktopRect.top;
                os._createNewFolder(folderX, folderY);
            }
            menu.remove();
        });

        const closeMenu = () => {
            if(document.body.contains(menu)) menu.remove();
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    desktop.addEventListener('contextmenu', showContextMenu);

    // ======================================================
    // --- DESKTOP & WINDOW INTERACTIONS ---
    // ======================================================
    let isDraggingWindow = false;
    let isDraggingDesktopItem = false;
    let dragTarget = null;
    let dragOffset = { x: 0, y: 0 };
    let clickTimeout = null;

    desktop.addEventListener('mousedown', (e) => {
        const desktopItem = e.target.closest('.desktop-item');
        if (desktopItem) {
            isDraggingDesktopItem = true;
            dragTarget = desktopItem;
            const rect = dragTarget.getBoundingClientRect();
            const parentRect = desktop.getBoundingClientRect();
            dragOffset.x = e.clientX - (rect.left - parentRect.left);
            dragOffset.y = e.clientY - (rect.top - parentRect.top);
            document.body.classList.add('no-select');
            return;
        }
        
        const windowEl = e.target.closest('.app-instance-window');
        if (!windowEl) return;

        os._focusWindow(windowEl);

        if (e.target.closest('.window-close-btn')) { os._closeWindow(windowEl); return; }
        if (e.target.closest('.window-minimize-btn')) { os._minimizeWindow(windowEl); return; }
        if (e.target.closest('.window-maximize-btn')) { os._maximizeWindow(windowEl); return; }

        if (e.target.closest('.window-title-bar') && !windowEl.classList.contains('maximized')) {
            isDraggingWindow = true;
            dragTarget = windowEl;
            const rect = windowEl.getBoundingClientRect();
            const parentRect = dragTarget.parentElement.getBoundingClientRect();
            dragOffset.x = e.clientX - (rect.left - parentRect.left);
            dragOffset.y = e.clientY - (rect.top - parentRect.top);
            document.body.classList.add('no-select');
        }
    });

    desktop.addEventListener('mouseup', (e) => {
        if (isDraggingDesktopItem && dragTarget) {
            const itemId = dragTarget.dataset.itemId;
            const newX = parseInt(dragTarget.style.left);
            const newY = parseInt(dragTarget.style.top);
            os.updateDesktopItemPosition(itemId, newX, newY);
        }
        
        isDraggingWindow = false;
        isDraggingDesktopItem = false;
        dragTarget = null;
        document.body.classList.remove('no-select');
    });

    desktop.addEventListener('click', (e) => {
        const desktopItem = e.target.closest('.desktop-item');
        if (!desktopItem) return;

        if (!clickTimeout) {
            clickTimeout = setTimeout(() => {
                clickTimeout = null;
            }, 250);
        } else {
            // This is a double-click
            clearTimeout(clickTimeout);
            clickTimeout = null;
            const itemId = desktopItem.dataset.itemId;
            const appId = desktopItem.dataset.appId;

            if (appId) {
                os.launchApp(appId);
            } else {
                os.openFolder(itemId);
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDraggingWindow || isDraggingDesktopItem) {
            e.preventDefault();
        }

        if (isDraggingWindow && dragTarget) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            dragTarget.style.left = `${newX}px`;
            dragTarget.style.top = `${newY}px`;
        } else if (isDraggingDesktopItem && dragTarget) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const maxX = desktop.clientWidth - dragTarget.offsetWidth;
            const maxY = desktop.clientHeight - dragTarget.offsetHeight;
            const constrainedX = Math.max(0, Math.min(maxX, newX));
            const constrainedY = Math.max(0, Math.min(maxY, newY));
            dragTarget.style.left = `${constrainedX}px`;
            dragTarget.style.top = `${constrainedY}px`;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            os.closeCommandCenter();
            os.closeAIPanel();
        }
    });

    // ======================================================
    // --- DOCK INTERACTIONS ---
    // ======================================================
    if (dock) {
        dock.addEventListener('mousemove', (e) => {
            const dockItems = dock.querySelectorAll('.dock-item');
            const dockRect = dock.getBoundingClientRect();
            const mouseX = e.clientX;

            dockItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenterX = itemRect.left + itemRect.width / 2;
                const distance = Math.abs(mouseX - itemCenterX);
                const maxDist = dockRect.width / 3;
                let scale = 1;

                if (distance < maxDist) {
                    scale = 1 + (1 - distance / maxDist) * 0.8;
                }
                item.style.transform = `scale(${scale})`;
            });
        });

        dock.addEventListener('mouseleave', () => {
            dock.querySelectorAll('.dock-item').forEach(item => item.style.transform = 'scale(1)');
        });

        dock.addEventListener('click', (e) => {
            const dockIcon = e.target.closest('.dock-item[data-window-id]');
            if (dockIcon) {
                const windowId = dockIcon.dataset.windowId;
                const windowEl = desktop.querySelector(`.app-instance-window[data-window-id="${windowId}"]`);
                if (windowEl) {
                    if (windowEl.classList.contains('minimized')) {
                        os._restoreWindow(windowEl);
                    } else if (windowEl.classList.contains('active-window')) {
                        os._minimizeWindow(windowEl);
                    } else {
                        os._focusWindow(windowEl);
                    }
                }
            }
        });
    }

    // ======================================================
    // --- AI ASSISTANT INTERACTIONS ---
    // ======================================================
    const aiCloseBtn = document.querySelector('.ai-close-btn');
    const aiInputForm = os.ui.aiInputForm;

    aiCloseBtn?.addEventListener('click', () => os.closeAIPanel());

    if (aiInputForm) {
        aiInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = os.ui.aiInput.value.trim();
            if (query) {
                os.ui.aiInput.value = '';
                os.ui.aiSendBtn.disabled = true;
                await os.askAI(query);
                os.ui.aiSendBtn.disabled = false;
                os.ui.aiInput.focus();
            }
        });
        os.ui.aiInput.addEventListener('input', () => {
            os.ui.aiSendBtn.disabled = os.ui.aiInput.value.trim() === '';
        });
        os.ui.aiSendBtn.disabled = true;
    }
});