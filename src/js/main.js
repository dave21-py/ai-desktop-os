let os; // Declare os globally

document.addEventListener('DOMContentLoaded', () => {
    try {
        os = new WarmwindOS();
        os.boot();
        
        console.log("State initialized:", os.state);

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

        commandCenterBtn?.addEventListener('click', () => {
            if (os) os.showCommandCenter();
        });
        
        commandCenterOverlay?.addEventListener('click', (e) => {
            if (e.target === commandCenterOverlay) {
                if (os) os.closeCommandCenter();
            }
        });

        commandCenterInput?.addEventListener('input', () => {
            if (os) os._updateCommandCenterResults(commandCenterInput.value);
        });

        commandCenterResults?.addEventListener('click', (e) => {
            const appItem = e.target.closest('.app-result-item');
            if (appItem && appItem.dataset.appid && os) {
                os.launchApp(appItem.dataset.appid);
                os.closeCommandCenter();
            }
        });
        
        commandCenterInput?.parentElement.addEventListener('submit', (e) => e.preventDefault());
        commandCenterInput?.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && os) {
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
        // MODIFIED: Enhanced context menu logic
        function showContextMenu(e) {
            e.preventDefault();
            document.querySelector('.context-menu')?.remove();

            const menuTemplate = document.querySelector('#context-menu-template');
            if (!menuTemplate) return;
            
            const menu = menuTemplate.content.cloneNode(true).firstElementChild;
            if (!menu) return;
            
            const targetItem = e.target.closest('.desktop-item');
            
            // Enable/disable options based on what was clicked
            const renameItem = menu.querySelector('[data-action="rename"]');
            const deleteItem = menu.querySelector('[data-action="delete"]');

            if (targetItem) {
                menu.dataset.targetId = targetItem.dataset.itemId;
            } else {
                renameItem.classList.add('disabled');
                deleteItem.classList.add('disabled');
            }

            const appRect = desktop.getBoundingClientRect();
            const x = Math.min(e.clientX, appRect.right - menu.offsetWidth - 5);
            const y = Math.min(e.clientY, appRect.bottom - menu.offsetHeight - 5);

            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            document.body.appendChild(menu);

            menu.addEventListener('click', (clickEvent) => {
                const menuItem = clickEvent.target.closest('.context-menu-item');
                if (!menuItem || menuItem.classList.contains('disabled')) return;
                
                const action = menuItem.dataset.action;
                const targetId = menu.dataset.targetId;

                if (action === 'new-folder' && os) {
                    const desktopRect = desktop.getBoundingClientRect();
                    const folderX = e.clientX - desktopRect.left;
                    const folderY = e.clientY - desktopRect.top;
                    os._createNewFolder(folderX, folderY);
                } else if (targetId && os) {
                    if (action === 'rename') {
                        os.initiateRename(targetId);
                    } else if (action === 'delete') {
                        os.deleteItem(targetId);
                    }
                }
                menu.remove();
            });

            const closeMenu = () => {
                menu?.remove();
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
        
        // NEW: Variables for window snapping and drag-and-drop
        let snapPreviewEl = null;
        let currentSnapState = 'none';
        let currentDropTarget = null;

        desktop.addEventListener('mousedown', (e) => {
            if (!os) return;
            
            const desktopItem = e.target.closest('.desktop-item');
            if (desktopItem) {
                // Prevent starting drag if we're clicking on an input field (for renaming)
                if(e.target.tagName.toLowerCase() === 'input') return;

                isDraggingDesktopItem = true;
                dragTarget = desktopItem;
                const rect = dragTarget.getBoundingClientRect();
                const parentRect = desktop.getBoundingClientRect();
                dragOffset.x = e.clientX - (rect.left - parentRect.left);
                dragOffset.y = e.clientY - (rect.top - parentRect.top);
                dragTarget.style.zIndex = os.state.nextZIndex++; // Bring item to front
                document.body.classList.add('no-select');
                return;
            }
            
            const windowEl = e.target.closest('.app-instance-window');
            if (!windowEl) return;

            os._focusWindow(windowEl);

            if (e.target.closest('.window-close-btn')) { os._closeWindow(windowEl); return; }
            if (e.target.closest('.window-minimize-btn')) { os._minimizeWindow(windowEl); return; }
            if (e.target.closest('.window-maximize-btn')) { os._maximizeWindow(windowEl); return; }

            if (e.target.closest('.window-title-bar')) {
                // NEW: Un-snap on drag start
                if (windowEl.dataset.snapped) {
                    os.unsnapWindow(windowEl);
                }
                if (!windowEl.classList.contains('maximized')) {
                    isDraggingWindow = true;
                    dragTarget = windowEl;
                    const rect = windowEl.getBoundingClientRect();
                    const parentRect = dragTarget.parentElement.getBoundingClientRect();
                    dragOffset.x = e.clientX - (rect.left - parentRect.left);
                    dragOffset.y = e.clientY - (rect.top - parentRect.top);
                    document.body.classList.add('no-select');
                }
            }
        });

        document.addEventListener('mouseup', (e) => { // MODIFIED: Changed to document to catch releases outside window
            if (!os) return;
            
            // MODIFIED: Handle both item dropping and position updates
            if (isDraggingDesktopItem && dragTarget) {
                if (currentDropTarget) {
                    const draggedId = dragTarget.dataset.itemId;
                    const targetFolderId = currentDropTarget.dataset.itemId;
                    os.moveItem(draggedId, targetFolderId);
                    currentDropTarget.classList.remove('drop-target');
                    currentDropTarget = null;
                } else {
                    const itemId = dragTarget.dataset.itemId;
                    const newX = parseInt(dragTarget.style.left);
                    const newY = parseInt(dragTarget.style.top);
                    os.updateDesktopItemPosition(itemId, newX, newY);
                }
            }
            
            // MODIFIED: Handle window snapping on release
            if (isDraggingWindow && dragTarget) {
                if (currentSnapState !== 'none') {
                    os.snapWindow(dragTarget, currentSnapState);
                }
            }

            // Cleanup for all drag operations
            isDraggingWindow = false;
            isDraggingDesktopItem = false;
            dragTarget = null;
            document.body.classList.remove('no-select');
            
            // NEW: Cleanup for snap preview
            if (snapPreviewEl) {
                snapPreviewEl.remove();
                snapPreviewEl = null;
            }
            currentSnapState = 'none';
        });

        desktop.addEventListener('click', (e) => {
            if (!os) return;
            
            const desktopItem = e.target.closest('.desktop-item');
            if (desktopItem) {
                // Double click logic
                if (!clickTimeout) {
                    clickTimeout = setTimeout(() => { clickTimeout = null; }, 250);
                } else {
                    clearTimeout(clickTimeout);
                    clickTimeout = null;
                    const itemId = desktopItem.dataset.itemId;
                    const itemData = os.state.desktopItems.find(i => i.id == itemId);

                    if (itemData) {
                        if (itemData.type === 'app') {
                            os.launchApp(itemData.appId);
                        } else if (itemData.type === 'folder') {
                            os.openFolder(itemId);
                        }
                    }
                }
            }
        });

        document.addEventListener('mousemove', (e) => { // MODIFIED: Changed to document to catch mouse moves outside window
            if (!os) return;
            
            if (isDraggingWindow || isDraggingDesktopItem) {
                e.preventDefault();
            }

            if (isDraggingWindow && dragTarget) {
                // Window drag logic
                let newX = e.clientX - dragOffset.x;
                let newY = e.clientY - dragOffset.y;
                dragTarget.style.left = `${newX}px`;
                dragTarget.style.top = `${newY}px`;
                
                // NEW: Window snapping preview logic
                const snapThreshold = 20;
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                let nextSnapState = 'none';

                if (e.clientX < snapThreshold) nextSnapState = 'left';
                else if (e.clientX > screenWidth - snapThreshold) nextSnapState = 'right';
                else if (e.clientY < snapThreshold) nextSnapState = 'top';
                
                if (nextSnapState !== currentSnapState) {
                    currentSnapState = nextSnapState;
                    if (currentSnapState !== 'none') {
                        if (!snapPreviewEl) {
                            snapPreviewEl = document.createElement('div');
                            snapPreviewEl.className = 'snap-preview';
                            desktop.appendChild(snapPreviewEl);
                        }
                        const rects = {
                            left: { top: 0, left: 0, width: '50%', height: '100%' },
                            right: { top: 0, left: '50%', width: '50%', height: '100%' },
                            top: { top: 0, left: 0, width: '100%', height: '100%' }
                        };
                        Object.assign(snapPreviewEl.style, rects[currentSnapState]);
                        snapPreviewEl.style.display = 'block';
                    } else if (snapPreviewEl) {
                        snapPreviewEl.style.display = 'none';
                    }
                }

            } else if (isDraggingDesktopItem && dragTarget) {
                // Desktop item drag logic
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                const maxX = desktop.clientWidth - dragTarget.offsetWidth;
                const maxY = desktop.clientHeight - dragTarget.offsetHeight;
                const constrainedX = Math.max(0, Math.min(maxX, newX));
                const constrainedY = Math.max(0, Math.min(maxY, newY));
                dragTarget.style.left = `${constrainedX}px`;
                dragTarget.style.top = `${constrainedY}px`;

                // NEW: Drag and Drop folder target logic
                dragTarget.style.pointerEvents = 'none'; // Temporarily disable pointer events on the dragged item
                const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
                dragTarget.style.pointerEvents = 'auto'; // Re-enable
                
                const potentialTarget = elementBelow ? elementBelow.closest('.desktop-item') : null;
                const isFolder = potentialTarget && os.state.desktopItems.some(i => i.id == potentialTarget.dataset.itemId && i.type === 'folder');

                if (potentialTarget && isFolder && potentialTarget !== dragTarget) {
                    if (currentDropTarget !== potentialTarget) {
                        currentDropTarget?.classList.remove('drop-target');
                        currentDropTarget = potentialTarget;
                        currentDropTarget.classList.add('drop-target');
                    }
                } else {
                    if (currentDropTarget) {
                        currentDropTarget.classList.remove('drop-target');
                        currentDropTarget = null;
                    }
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!os) return;
            
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
                if (!os) return;
                
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
        // --- SETTINGS APP INTERACTIONS (NEW) ---
        // ======================================================
        
        desktop.addEventListener('change', (e) => {
            // Theme toggle switch inside Settings App
            if (e.target.id === 'theme-toggle-switch') {
                const newTheme = e.target.checked ? 'dark' : 'light';
                os._setTheme(newTheme);
            }
        });

        desktop.addEventListener('click', (e) => {
            // Wallpaper thumbnail click inside Settings App
            const wallpaperThumb = e.target.closest('.wallpaper-thumbnail');
            if (wallpaperThumb && wallpaperThumb.dataset.wallpaperUrl) {
                os.setWallpaper(wallpaperThumb.dataset.wallpaperUrl);
                // Update selection visual
                const parent = wallpaperThumb.parentElement;
                parent.querySelector('.selected')?.classList.remove('selected');
                wallpaperThumb.classList.add('selected');
            }
        });

        // ======================================================
        // --- AI ASSISTANT INTERACTIONS ---
        // ======================================================
        const aiCloseBtn = document.querySelector('.ai-close-btn');
        const aiInputForm = os.ui.aiInputForm;

        aiCloseBtn?.addEventListener('click', () => {
            if (os) os.closeAIPanel();
        });

        if (aiInputForm) {
            aiInputForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!os) return;
                
                const query = os.ui.aiInput.value.trim();
                if (query) {
                    os.ui.aiInput.value = '';
                    os.ui.aiSendBtn.disabled = true;
                    await os.askAI(query);
                    os.ui.aiSendBtn.disabled = false;
                    os.ui.aiInput.focus();
                }
            });
            
            os.ui.aiInput?.addEventListener('input', () => {
                if (os.ui.aiInput) {
                    os.ui.aiSendBtn.disabled = os.ui.aiInput.value.trim() === '';
                }
            });
            
            if (os.ui.aiSendBtn) {
                os.ui.aiSendBtn.disabled = true;
            }
        }

    } catch (error) {
        console.error("Error initializing WarmwindOS:", error);
    }
});

// Add a helper function to safely access os when needed
function getOS() {
    return os;
}