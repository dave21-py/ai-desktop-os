document.addEventListener('DOMContentLoaded', () => {
    const os = new WarmwindOS();
    os.boot();

    // --- Global UI Listeners ---
    const browseAppsBtn = document.querySelector('.browse-apps-btn');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const appGrid = document.querySelector('.app-grid');
    const desktop = document.querySelector('#desktop');
    const dock = document.querySelector('.bar-section.center');

    // AI Assistant Elements
    const aiAskElements = document.querySelectorAll('.central-ask-avatar, .ask-text');
    const aiCloseBtn = document.querySelector('.ai-close-btn');

    // Debug logging
    console.log('Browse Apps Button found:', browseAppsBtn);
    console.log('Modal overlay found:', document.querySelector('.modal-overlay'));

    // App Drawer Button
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

    // --- Window Interactions ---
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let dragTarget = null;

    desktop.addEventListener('mousedown', (e) => {
        // Handle desktop items first (they have higher priority)
        if (e.target.closest('.desktop-item')) {
            return; // Let the desktop system handle this
        }

        // Handle windows
        const windowEl = e.target.closest('.app-instance-window');
        if (!windowEl) return;

        // Always focus the window first
        os._focusWindow(windowEl);

        // Handle button clicks
        if (e.target.closest('.window-close-btn')) {
            console.log('Close button clicked');
            os._closeWindow(windowEl);
            return;
        }
        
        if (e.target.closest('.window-minimize-btn')) {
            console.log('Minimize button clicked');
            os._minimizeWindow(windowEl);
            return;
        }
        
        if (e.target.closest('.window-maximize-btn')) {
            console.log('Maximize button clicked');
            os._maximizeWindow(windowEl);
            return;
        }

        // Handle dragging (only if clicking on title bar and window is not maximized)
        if (e.target.closest('.window-title-bar') && !windowEl.classList.contains('maximized')) {
            isDragging = true;
            dragTarget = windowEl;
            
            const rect = windowEl.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            // Add visual feedback
            windowEl.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            
            console.log('Started dragging window');
        }
    });

    // Mouse move handler for dragging windows
    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !dragTarget) return;
        
        if (dragTarget.classList.contains('maximized')) return;

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep window within bounds
        const minX = 0;
        const minY = 0;
        const maxX = window.innerWidth - 200;
        const maxY = window.innerHeight - 100;
        
        const constrainedX = Math.max(minX, Math.min(maxX, newX));
        const constrainedY = Math.max(minY, Math.min(maxY, newY));
        
        dragTarget.style.left = `${constrainedX}px`;
        dragTarget.style.top = `${constrainedY}px`;
    });

    // Mouse up handler to stop dragging
    document.addEventListener('mouseup', () => {
        if (isDragging && dragTarget) {
            isDragging = false;
            
            dragTarget.style.cursor = '';
            dragTarget = null;
            document.body.style.userSelect = '';
            
            console.log('Stopped dragging window');
        }
    });

    // Dock Interactions
    dock?.addEventListener('click', (e) => {
        const dockIcon = e.target.closest('.dock-item');
        if (dockIcon) {
            const windowId = dockIcon.dataset.windowId;
            const windowEl = desktop.querySelector(`.app-instance-window[data-window-id="${windowId}"]`);
            if (windowEl) {
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

    // --- Desktop Instructions Overlay (Optional) ---
    // Show instructions on first load
    if (!localStorage.getItem('desktopInstructionsShown')) {
        setTimeout(() => {
            const instructions = `
🎉 Welcome to your enhanced desktop!

New Features:
• Double-click empty space to create folders
• Right-click for context menus
• Drag folders around the desktop
• Drag folders to recycle bin to delete
• Double-click recycle bin to view deleted items
• Use Ctrl+C to copy, Del to delete, F2 to rename
• Right-click folders for more options

Enjoy your new desktop experience!
            `.trim();
            
            alert(instructions);
            localStorage.setItem('desktopInstructionsShown', 'true');
        }, 1000);
    }
});