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

    commandCenterBtn?.addEventListener('click', () => os.showCommandCenter());
    
    // Close Command Center when clicking the background overlay
    commandCenterOverlay?.addEventListener('click', (e) => {
        if (e.target === commandCenterOverlay) {
            os.closeCommandCenter();
        }
    });

    // Update results as the user types
    commandCenterInput?.addEventListener('input', () => {
        os._updateCommandCenterResults(commandCenterInput.value);
    });

    // Handle clicks on app results
    commandCenterResults?.addEventListener('click', (e) => {
        const appItem = e.target.closest('.app-result-item');
        if (appItem && appItem.dataset.appid) {
            os.launchApp(appItem.dataset.appid);
            os.closeCommandCenter();
        }
    });
    
    // Handle submitting the form (pressing Enter)
    commandCenterInput?.parentElement.addEventListener('submit', (e) => e.preventDefault()); // Prevent page reload
    commandCenterInput?.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const firstResult = commandCenterResults.querySelector('.app-result-item');
            const query = commandCenterInput.value.trim();
            
            if (firstResult && firstResult.dataset.appid) {
                // If there's an app result, launch it
                os.launchApp(firstResult.dataset.appid);
            } else if (query) {
                // Otherwise, treat it as an AI query
                await os.askAI(query);
            }
            os.closeCommandCenter();
        }
    });

    // Global key listener to close panels
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            os.closeCommandCenter();
            os.closeAIPanel();
        }
    });

    // ======================================================
// --- NEW: CONTEXT MENU INTERACTIONS ---
// ======================================================

function showContextMenu(e) {
    e.preventDefault();
    // Remove any existing menu first
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();

    const menuTemplate = document.querySelector('#context-menu-template');
    const menu = menuTemplate.content.cloneNode(true).firstElementChild;

    // Position the menu, ensuring it doesn't go off-screen
    const appWindow = document.querySelector('.app-window');
    const appRect = appWindow.getBoundingClientRect();
    const x = Math.min(e.clientX, appRect.right - 200); // 200 is menu width
    const y = Math.min(e.clientY, appRect.bottom - 100); // 100 is menu height

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    document.body.appendChild(menu);

    // Handle clicks on menu items
    menu.addEventListener('click', (clickEvent) => {
        const action = clickEvent.target.closest('.context-menu-item')?.dataset.action;
        if (action === 'new-folder') {
            const desktopRect = desktop.getBoundingClientRect();
            // Convert viewport coordinates to desktop-relative coordinates
            const folderX = e.clientX - desktopRect.left;
            const folderY = e.clientY - desktopRect.top;
            os._createNewFolder(folderX, folderY);
        }
        menu.remove();
    });

    // Close the menu when clicking anywhere else
    const closeMenu = () => {
        if(document.body.contains(menu)) {
            menu.remove();
        }
        document.removeEventListener('click', closeMenu);
    };
    // Use a tiny timeout to prevent the context menu click from closing itself
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

desktop.addEventListener('contextmenu', showContextMenu);

    // ======================================================
// --- DESKTOP & WINDOW INTERACTIONS ---
// ======================================================
let isDraggingWindow = false;
let isDraggingDesktopItem = false; // NEW state for desktop items
let dragTarget = null;
let dragOffset = { x: 0, y: 0 };
let clickTimeout = null; // For detecting double-clicks

desktop.addEventListener('mousedown', (e) => {
    // Check for desktop item drag first
    const desktopItem = e.target.closest('.desktop-item');
    if (desktopItem) {
        isDraggingDesktopItem = true;
        dragTarget = desktopItem;
        const rect = dragTarget.getBoundingClientRect();
        const parentRect = desktop.getBoundingClientRect();
        dragOffset.x = e.clientX - (rect.left - parentRect.left);
        dragOffset.y = e.clientY - (rect.top - parentRect.top);
        document.body.classList.add('no-select');
        return; // Stop further processing
    }
    
    // Original window logic
    const windowEl = e.target.closest('.app-instance-window');
    if (!windowEl) return;

    os._focusWindow(windowEl);

    // Window controls
    if (e.target.closest('.window-close-btn')) { os._closeWindow(windowEl); return; }
    if (e.target.closest('.window-minimize-btn')) { os._minimizeWindow(windowEl); return; }
    if (e.target.closest('.window-maximize-btn')) { os._maximizeWindow(windowEl); return; }

    // Dragging a window
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
    // Check if we just finished dragging a desktop item
    if (isDraggingDesktopItem && dragTarget) {
        const itemId = dragTarget.dataset.itemId;
        const newX = parseInt(dragTarget.style.left);
        const newY = parseInt(dragTarget.style.top);
        os.updateDesktopItemPosition(itemId, newX, newY);
    }
    
    // Clear all dragging states
    isDraggingWindow = false;
    isDraggingDesktopItem = false;
    dragTarget = null;
    document.body.classList.remove('no-select');
});

// Double-click logic for desktop items
desktop.addEventListener('click', (e) => {
    const desktopItem = e.target.closest('.desktop-item');
    if (!desktopItem) return;

    if (!clickTimeout) {
        // First click
        clickTimeout = setTimeout(() => {
            clickTimeout = null; // Reset after timeout
            // Logic for single-click (e.g., selecting an icon) can go here
        }, 250);
    } else {
        // Second click (double-click)
        clearTimeout(clickTimeout);
        clickTimeout = null;
        const appId = desktopItem.dataset.appId;
        if (appId) {
            os.launchApp(appId);
        }
        // Add folder logic here later
    }
});


document.addEventListener('mousemove', (e) => {
    e.preventDefault(); // Good practice to prevent unwanted text selection
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

        // Constrain to desktop bounds
        const constrainedX = Math.max(0, Math.min(maxX, newX));
        const constrainedY = Math.max(0, Math.min(maxY, newY));

        dragTarget.style.left = `${constrainedX}px`;
        dragTarget.style.top = `${constrainedY}px`;
    }
});

    // ======================================================
    // --- DOCK INTERACTIONS ---
    // ======================================================
    if (dock) {
        // Dynamic Magnification
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
                    scale = 1 + (1 - distance / maxDist) * 0.8; // Max scale of 1.8
                }
                item.style.transform = `scale(${scale})`;
            });
        });

        dock.addEventListener('mouseleave', () => {
            dock.querySelectorAll('.dock-item').forEach(item => item.style.transform = 'scale(1)');
        });

        // Handle Clicks on App Icons in Dock
        dock.addEventListener('click', (e) => {
            const dockIcon = e.target.closest('.dock-item[data-window-id]');
            if (dockIcon) {
                const windowId = dockIcon.dataset.windowId;
                const windowEl = desktop.querySelector(`.app-instance-window[data-window-id="${windowId}"]`);
                if (windowEl) {
                    if (windowEl.classList.contains('minimized')) {
                        os._restoreWindow(windowEl);
                    } else if (windowEl.classList.contains('active-window')) {
                        os._minimizeWindow(windowEl); // Minimize if already active
                    }
                     else {
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