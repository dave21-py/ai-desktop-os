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

    // --- Drag and Drop State Management ---
    let isDraggingWindow = false;
    let isDraggingDesktopItem = false;
    let dragTarget = null;
    let dragOffset = { x: 0, y: 0 };

    // --- Desktop and Window Event Handling ---
    desktop.addEventListener('mousedown', (e) => {
        // Always check for a desktop item first
        const desktopItem = e.target.closest('.desktop-item');
        if (desktopItem) {
            const itemId = parseInt(desktopItem.dataset.itemId);
            const itemData = os.state.desktopItems.find(i => i.id === itemId);
            if (!itemData) return;
    
            isDraggingDesktopItem = true;
            // The target for styling is the DOM element itself
            dragTarget = desktopItem;
            
            // Use getBoundingClientRect for accurate position relative to viewport
            const rect = dragTarget.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
    
            // Add visual feedback for dragging
            dragTarget.classList.add('being-dragged');
            document.body.style.userSelect = 'none';
    
            console.log('Started dragging desktop item:', itemData.name);
            return; // Stop here to not trigger window logic
        }
    
        // --- The existing window logic follows ---
    
        // Check if we're clicking on a window
        const windowEl = e.target.closest('.app-instance-window');
        if (!windowEl) return;
    
        // Always focus the window first
        os._focusWindow(windowEl);
    
        // Handle button clicks
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
    
        // Handle window dragging (only if clicking on title bar and window is not maximized)
        if (e.target.closest('.window-title-bar') && !windowEl.classList.contains('maximized')) {
            isDraggingWindow = true;
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

    // Mouse move handler for dragging
    // In main.js - REPLACE the 'mousemove' listener

document.addEventListener('mousemove', (e) => {
    // Handle window dragging
    if (isDraggingWindow && dragTarget) {
        if (dragTarget.classList.contains('maximized')) return;

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        dragTarget.style.left = `${newX}px`;
        dragTarget.style.top = `${newY}px`;
    } 
    // NEW: Handle desktop item dragging
    else if (isDraggingDesktopItem && dragTarget) {
        const desktopRect = desktop.getBoundingClientRect();

        // Calculate position relative to the desktop, not the viewport
        const newX = e.clientX - desktopRect.left - dragOffset.x;
        const newY = e.clientY - desktopRect.top - dragOffset.y;

        // Keep item within desktop bounds
        const maxX = desktop.clientWidth - dragTarget.offsetWidth;
        const maxY = desktop.clientHeight - dragTarget.offsetHeight;
        const constrainedX = Math.max(0, Math.min(maxX, newX));
        const constrainedY = Math.max(0, Math.min(maxY, newY));

        dragTarget.style.left = `${constrainedX}px`;
        dragTarget.style.top = `${constrainedY}px`;

        // Check for dropping on recycle bin
        const recycleBin = os.ui.recycleBin;
        if (recycleBin) {
            const binRect = recycleBin.getBoundingClientRect();
            const isOverBin = e.clientX >= binRect.left && e.clientX <= binRect.right &&
                              e.clientY >= binRect.top && e.clientY <= binRect.bottom;
            recycleBin.classList.toggle('drag-over', isOverBin);
        }
    }
});

    // Mouse up handler to stop dragging
    document.addEventListener('mouseup', (e) => {
        // Reset window dragging state
        if (isDraggingWindow && dragTarget) {
            isDraggingWindow = false;
            dragTarget.style.cursor = '';
            dragTarget = null;
            console.log('Stopped dragging window');
        } 
        // NEW: Reset desktop item dragging state
        else if (isDraggingDesktopItem && dragTarget) {
            const recycleBin = os.ui.recycleBin;
            // Check if the item was dropped on the recycle bin
            if (recycleBin && recycleBin.classList.contains('drag-over')) {
                const itemId = parseInt(dragTarget.dataset.itemId);
                os._deleteItem(itemId);
                console.log('Dropped item on trash');
            } else {
                // Update the item's final position in the OS state
                const itemId = parseInt(dragTarget.dataset.itemId);
                const itemData = os.state.desktopItems.find(i => i.id === itemId);
                if (itemData) {
                    itemData.x = parseInt(dragTarget.style.left);
                    itemData.y = parseInt(dragTarget.style.top);
                    console.log('Updated item position:', itemData.name);
                }
            }
            
            // Clean up styles and state
            isDraggingDesktopItem = false;
            dragTarget.classList.remove('being-dragged');
            dragTarget = null;
            if (recycleBin) {
                recycleBin.classList.remove('drag-over');
            }
            console.log('Stopped dragging desktop item');
        }
    
        // Always clean up this style
        document.body.style.userSelect = '';
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
🎉 Welcome to your AI-powered desktop!

New Features:
• Talk to AI: "Create a folder called Documents"
• Double-click empty space to create folders manually
• Right-click for context menus
• Drag folders around the desktop
• Drag folders to recycle bin to delete
• Use voice commands or manual controls

Try saying: "Make a folder called My Files"
            `.trim();
            
            alert(instructions);
            localStorage.setItem('desktopInstructionsShown', 'true');
        }, 1000);
    }
});

// in main.js - Add this entire block at the end of the file

// --- DYNAMIC DOCK INITIALIZATION ---
const dockContainer = document.querySelector('.bar-section.center');
// Get ALL items that should magnify, not just opened apps
const dockItems = Array.from(dockContainer.children); 

// --- Configuration ---
const MAX_MAGNIFICATION = 1.8; // How big the icon gets directly under the mouse
const MAGNIFICATION_RANGE = 80; // In pixels, how far the "ripple" extends

const handleDockMouseMove = (e) => {
    const mouseX = e.clientX; // Get mouse X position from the event

    dockItems.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2;
        
        // Calculate the distance between the mouse and the center of the icon
        const distance = Math.abs(mouseX - itemCenterX);
        
        let scale = 1; // Default scale is 1 (normal size)

        // If the mouse is within the magnification range, calculate the scale
        if (distance < MAGNIFICATION_RANGE) {
            // Use a squared falloff for a nice curve effect
            const falloff = Math.pow(1 - (distance / MAGNIFICATION_RANGE), 2);
            scale = 1 + (MAX_MAGNIFICATION - 1) * falloff;
        }

        // Apply the calculated scale using CSS transform
        item.style.transform = `scale(${scale})`;
    });
};

const handleDockMouseLeave = () => {
    // Reset all items to their original size when the mouse leaves the dock
    dockItems.forEach(item => {
        item.style.transform = 'scale(1)';
    });
};

// Attach the event listeners to the dock container
if (dockContainer) {
    dockContainer.addEventListener('mousemove', handleDockMouseMove);
    dockContainer.addEventListener('mouseleave', handleDockMouseLeave);
}