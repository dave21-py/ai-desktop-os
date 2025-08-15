document.addEventListener('DOMContentLoaded', () => {
    const os = new WarmwindOS();
    os.boot();

    // --- Global UI Elements ---
    const desktop = document.querySelector('#desktop');
    const appGrid = document.querySelector('.app-grid'); // This is now the Home Screen
    
    // --- REMOVED --- Obsolete listeners for the old modal app drawer.
    // const browseAppsBtn = document.querySelector('.browse-apps-btn');
    // const closeModalBtn = document.querySelector('.close-modal-btn');
    
    // App Grid Launching (from the Home Screen)
    appGrid?.addEventListener('click', (e) => {
        const appItem = e.target.closest('.app-item');
        if (appItem) {
            console.log('App item clicked:', appItem.dataset.appname);
            os.launchApp(appItem);
            // --- REMOVED --- os._closeAppDrawer() is no longer needed.
        }
    });

    // --- Drag and Drop State Management ---
    let isDraggingWindow = false;
    let isDraggingDesktopItem = false;
    let dragTarget = null;
    let dragOffset = { x: 0, y: 0 };

    // --- Desktop and Window Event Handling ---
    desktop.addEventListener('mousedown', (e) => {
        const desktopItem = e.target.closest('.desktop-item');
        if (desktopItem) {
            // ... (Your excellent desktop item drag logic remains unchanged)
            const itemId = parseInt(desktopItem.dataset.itemId);
            const itemData = os.state.desktopItems.find(i => i.id === itemId);
            if (!itemData) return;
    
            isDraggingDesktopItem = true;
            dragTarget = desktopItem;
            const rect = dragTarget.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
    
            dragTarget.classList.add('being-dragged');
            document.body.style.userSelect = 'none';
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
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            windowEl.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDraggingWindow && dragTarget) {
            // ... (Your window drag logic remains unchanged)
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            dragTarget.style.left = `${newX}px`;
            dragTarget.style.top = `${newY}px`;
        } 
        else if (isDraggingDesktopItem && dragTarget) {
            // ... (Your desktop item move logic remains unchanged)
            const desktopRect = desktop.getBoundingClientRect();
            const newX = e.clientX - desktopRect.left - dragOffset.x;
            const newY = e.clientY - desktopRect.top - dragOffset.y;
            const maxX = desktop.clientWidth - dragTarget.offsetWidth;
            const maxY = desktop.clientHeight - dragTarget.offsetHeight;
            const constrainedX = Math.max(0, Math.min(maxX, newX));
            const constrainedY = Math.max(0, Math.min(maxY, newY));
            dragTarget.style.left = `${constrainedX}px`;
            dragTarget.style.top = `${constrainedY}px`;
            const recycleBin = os.ui.recycleBin;
            if (recycleBin) {
                const binRect = recycleBin.getBoundingClientRect();
                const isOverBin = e.clientX >= binRect.left && e.clientX <= binRect.right && e.clientY >= binRect.top && e.clientY <= binRect.bottom;
                recycleBin.classList.toggle('drag-over', isOverBin);
            }
        }
    });

    document.addEventListener('mouseup', (e) => {
        // ... (Your entire mouseup logic for windows and desktop items remains unchanged)
        if (isDraggingWindow && dragTarget) {
            isDraggingWindow = false;
            dragTarget.style.cursor = '';
            dragTarget = null;
        } 
        else if (isDraggingDesktopItem && dragTarget) {
            const recycleBin = os.ui.recycleBin;
            if (recycleBin && recycleBin.classList.contains('drag-over')) {
                const itemId = parseInt(dragTarget.dataset.itemId);
                os._deleteItem(itemId);
            } else {
                const itemId = parseInt(dragTarget.dataset.itemId);
                const itemData = os.state.desktopItems.find(i => i.id === itemId);
                if (itemData) {
                    itemData.x = parseInt(dragTarget.style.left);
                    itemData.y = parseInt(dragTarget.style.top);
                }
            }
            isDraggingDesktopItem = false;
            dragTarget.classList.remove('being-dragged');
            dragTarget = null;
            if (recycleBin) {
                recycleBin.classList.remove('drag-over');
            }
        }
        document.body.style.userSelect = '';
    });

    // --- CONSOLIDATED DOCK LOGIC ---
    const dock = document.querySelector('.bottom-bar');
    const dockTriggerZone = document.querySelector('.dock-trigger-zone');
    let hideDockTimeout;

    if (dock && dockTriggerZone) {
        // --- Auto Show/Hide Logic ---
        const showDock = () => {
            clearTimeout(hideDockTimeout);
            dock.classList.add('dock-visible');
        };
        const hideDock = () => {
            dock.classList.remove('dock-visible');
        };

        dockTriggerZone.addEventListener('mouseenter', showDock);
        dock.addEventListener('mouseleave', () => {
            hideDockTimeout = setTimeout(hideDock, 300);
        });
        dock.addEventListener('mouseenter', () => clearTimeout(hideDockTimeout));

        // --- Dynamic Magnification Logic ---
        const MAX_MAGNIFICATION = 1.6;
        const MAGNIFICATION_RANGE = 70;

        dock.addEventListener('mousemove', (e) => {
            // Important: We query for dock-items here so it works with newly added app icons!
            const dockItems = dock.querySelectorAll('.dock-item');
            if (dockItems.length === 0) return;

            const mouseX = e.clientX;
            dockItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenterX = itemRect.left + itemRect.width / 2;
                const distance = Math.abs(mouseX - itemCenterX);
                let scale = 1;
                if (distance < MAGNIFICATION_RANGE) {
                    const falloff = Math.pow(1 - (distance / MAGNIFICATION_RANGE), 2);
                    scale = 1 + (MAX_MAGNIFICATION - 1) * falloff;
                }
                item.style.transform = `scale(${scale})`;
            });
        });
        
        // --- Window Click Logic (Focus/Restore) ---
        dock.addEventListener('click', (e) => {
            const dockIcon = e.target.closest('.dock-item');
            if (dockIcon) {
                const windowId = dockIcon.dataset.windowId;
                const windowEl = desktop.querySelector(`.app-instance-window[data-window-id="${windowId}"]`);
                if (windowEl) {
                    if (windowEl.classList.contains('minimized')) {
                        os._restoreWindow(windowEl);
                    } else {
                        os._focusWindow(windowEl);
                    }
                }
            }
        });
    }

    // --- AI Assistant Interactions ---
    const aiCloseBtn = document.querySelector('.ai-close-btn');

    // --- UPDATED --- Use the new AI Dock Button as the single trigger
    const aiDockBtn = document.querySelector('#ai-dock-btn');
    aiDockBtn?.addEventListener('click', () => {
        console.log('AI panel opened from dock');
        os.showAIPanel();
    });

    // Close AI Panel
    aiCloseBtn?.addEventListener('click', () => {
        console.log('AI panel closed');
        os.closeAIPanel();
    });

    // Handle AI Input form submission
    const aiInputForm = os.ui.aiInputForm;
    if (aiInputForm) {
        aiInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = os.ui.aiInput.value.trim();
            if (query) {
                os.ui.aiInput.value = '';
                os.ui.aiSendBtn.disabled = true;
                await os.askAI(query);
                os.ui.aiSendBtn.disabled = false;
            }
        });

        // Input validation for send button
        os.ui.aiInput.addEventListener('input', () => {
            os.ui.aiSendBtn.disabled = os.ui.aiInput.value.trim() === '';
        });
        os.ui.aiSendBtn.disabled = true;
    }
    
    // ... (Your optional instructions alert can remain here if you like)
});