document.addEventListener('DOMContentLoaded', () => {
    const os = new WarmwindOS();
    os.boot();

    // --- Global UI Listeners ---
    const browseAppsBtn = document.querySelector('.browse-apps-btn');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const appGrid = document.querySelector('.app-grid');
    const desktop = document.querySelector('#desktop');
    const dock = document.querySelector('.bar-section.center');

    // NEW: AI Assistant Elements
    const aiAskElements = document.querySelectorAll('.central-ask-avatar, .ask-text');
    const aiCloseBtn = document.querySelector('.ai-close-btn');

    // Debug logging
    console.log('Browse Apps Button found:', browseAppsBtn);
    console.log('Modal overlay found:', document.querySelector('.modal-overlay'));

    // App Drawer Button - FIXED: Call _showAppDrawer directly
    browseAppsBtn?.addEventListener('click', (e) => {
        console.log('Browse apps button clicked!');
        e.preventDefault();
        e.stopPropagation();
        os._showAppDrawer();
    });

    closeModalBtn?.addEventListener('click', (e) => {
        console.log('Close modal button clicked!');
        e.preventDefault();
        e.stopPropagation();
        os._closeAppDrawer();
    });

    // App Grid Launching
    appGrid?.addEventListener('click', (e) => {
        const appItem = e.target.closest('.app-item');
        if (appItem) {
            console.log('App item clicked:', appItem.dataset.appname);
            os.launchApp(appItem);
            os._closeAppDrawer();
        }
    });

    // Window Interactions (Dragging, Focusing, Closing)
    let activeWindow = null;
    let offsetX, offsetY;

    desktop.addEventListener('mousedown', (e) => {
        const windowEl = e.target.closest('.app-instance-window');
        if (!windowEl) return;

        os._focusWindow(windowEl);

        if (e.target.closest('.window-close-btn')) {
            os._closeWindow(windowEl);
            return;
        }
        if (e.target.closest('.window-minimize-btn')) {
            os._minimizeWindow(windowEl);
            return;
        }
        if (e.target.closest('.window-maximize-btn')) {
            os._maximizeWindow(windowEl);
            return;
        }
        
        if (e.target.closest('.window-title-bar') && !windowEl.classList.contains('maximized')) {
            activeWindow = windowEl;
            offsetX = e.clientX - activeWindow.getBoundingClientRect().left;
            offsetY = e.clientY - activeWindow.getBoundingClientRect().top;
        }
    });

    desktop.addEventListener('mousemove', (e) => {
        if (!activeWindow) return;
        e.preventDefault();
        activeWindow.style.left = `${e.clientX - offsetX}px`;
        activeWindow.style.top = `${e.clientY - offsetY}px`;
    });

    window.addEventListener('mouseup', () => {
        activeWindow = null;
    });

    // Dock Interactions - FIXED: Handle minimized windows
    dock?.addEventListener('click', (e) => {
        const dockIcon = e.target.closest('.dock-item');
        if (dockIcon) {
            const windowId = dockIcon.dataset.windowId;
            const windowEl = desktop.querySelector(`.app-instance-window[data-window-id="${windowId}"]`);
            if (windowEl) {
                // Check if window is minimized and restore it, otherwise just focus
                if (windowEl.classList.contains('minimized')) {
                    console.log('Restoring minimized window:', windowId);
                    os._restoreWindow(windowEl);
                } else {
                    console.log('Focusing window:', windowId);
                    os._focusWindow(windowEl);
                }
            }
        }
    });

    // --- AI Assistant Interactions ---

    // Open AI Panel when 'Ask something' is clicked
    aiAskElements.forEach(el => {
        el.addEventListener('click', () => {
            console.log('AI panel opened');
            os.showAIPanel();
        });
    });

    // Close AI Panel
    aiCloseBtn?.addEventListener('click', () => {
        console.log('AI panel closed');
        os.closeAIPanel();
    });

    // Handle AI Input form submission (The 'send' button)
    const aiInputForm = os.ui.aiInputForm;
    if (aiInputForm) {
        aiInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = os.ui.aiInput.value.trim();
            if (query) {
                os.ui.aiInput.value = ''; // Clear input immediately
                os.ui.aiSendBtn.disabled = true;
                await os.askAI(query); // Call the main AI function and wait for it to finish
                os.ui.aiSendBtn.disabled = false; // Re-enable button after AI response
            }
        });

        // Simple input validation for the send button (UX detail)
        os.ui.aiInput.addEventListener('input', () => {
            os.ui.aiSendBtn.disabled = os.ui.aiInput.value.trim() === '';
        });
        os.ui.aiSendBtn.disabled = true; // Disable on load
    }
});