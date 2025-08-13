document.addEventListener('DOMContentLoaded', () => {
    const os = new WarmwindOS();
    os.boot();

    const browseAppsBtn = document.querySelector('.browse-apps-btn');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const appGrid = document.querySelector('.app-grid');
    const desktop = document.querySelector('#desktop');
    const dock = document.querySelector('.bar-section.center');

    browseAppsBtn?.addEventListener('click', () => os.launchApp({ dataset: { appid: 'app-drawer' } }));
    closeModalBtn?.addEventListener('click', () => os._closeAppDrawer());

    appGrid?.addEventListener('click', (e) => {
        const appItem = e.target.closest('.app-item');
        if (appItem) {
            os.launchApp(appItem);
            os._closeAppDrawer();
        }
    });

    dock?.addEventListener('click', (e) => {
        const dockIcon = e.target.closest('.dock-item');
        if (dockIcon) {
            const windowId = dockIcon.dataset.windowId;
            const windowEl = desktop.querySelector(`.app-instance-window[data-window-id="${windowId}"]`);
            if (windowEl) os._focusWindow(windowEl);
        }
    });

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
});