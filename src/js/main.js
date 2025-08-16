document.addEventListener('DOMContentLoaded', () => {
    
    // --- App Data (EDITED: Added a unique 'id' for tracking) ---
    const appDatabase = [
        { name: 'Amazon', id: 'amazon', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg', url: 'https://www.amazon.com' },
        { name: 'Canva', id: 'canva', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Canva_icon_2021.svg', url: 'https://www.canva.com' },
        { name: 'ChatGPT', id: 'chatgpt', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', url: 'https://chat.openai.com' },
        { name: 'Google Chrome', id: 'chrome', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg', url: 'https://www.google.com/chrome/' },
        { name: 'DuckDuckGo', id: 'duckduckgo', icon: 'https://upload.wikimedia.org/wikipedia/en/9/90/DuckDuckGo_logo.svg', url: 'https://duckduckgo.com' },
        { name: 'Gmail', id: 'gmail', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg', url: 'https://mail.google.com' },
        { name: 'Google Calendar', id: 'calendar', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg', url: 'https://calendar.google.com' },
        { name: 'Google Drive', id: 'drive', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg', url: 'https://drive.google.com' },
        { name: 'Google Sheets', id: 'sheets', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg', url: 'https://docs.google.com/spreadsheets/' },
        { name: 'Google Slides', id: 'slides', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Google_Slides_logo_%282014-2020%29.svg', url: 'https://docs.google.com/presentation/' },
        { name: 'Outlook', id: 'outlook', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg', url: 'https://outlook.live.com' },
        { name: 'Spotify', id: 'spotify', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg', url: 'https://www.spotify.com' }
    ];

    // --- State ---
    let dockedApps = []; // This will hold the apps currently in our dock

    // --- UI Element Selectors ---
    const appDock = document.querySelector('.app-dock');
    const welcomeOverlay = document.querySelector('.welcome-overlay');
    const enterOsBtn = document.querySelector('#enter-os-btn');
    const background = document.querySelector('.background-image');
    const bottomBar = document.querySelector('.bottom-bar');
    const topCenterMenu = document.querySelector('.top-center-menu');
    const openAppStoreBtn = document.querySelector('#open-app-store-btn');
    const appStoreWindow = document.querySelector('.app-store-window');
    const closeAppStoreBtn = document.querySelector('.close-app-store-btn');
    const appListContainer = document.querySelector('.app-list');
    const appSearchInput = document.querySelector('#app-search-input');
    const centerConsole = document.querySelector('.center-console');
    const compactInput = document.querySelector('#compact-input');
    const compactInputForm = document.querySelector('.compact-input-form');
    const chatOverlay = document.querySelector('.chat-overlay');

    // ======================================================
    // DOCK LOGIC
    // ======================================================
    
    const saveDockState = () => {
        const appIds = dockedApps.map(app => app.id);
        localStorage.setItem('warmwindOS.dockedApps', JSON.stringify(appIds));
    };
    
    const loadDockState = () => {
        const savedAppIds = JSON.parse(localStorage.getItem('warmwindOS.dockedApps')) || [];
        // Find the full app objects from the database using the saved IDs
        dockedApps = savedAppIds.map(id => appDatabase.find(app => app.id === id)).filter(Boolean); // .filter(Boolean) removes any nulls if an app was deleted
        renderDock();
        renderApps(); // Re-render app store to show correct button states
    };

    const renderDock = () => {
        appDock.innerHTML = ''; // Clear the dock before rendering
        if (dockedApps.length > 0) {
            dockedApps.forEach(app => {
                const dockItem = document.createElement('div');
                dockItem.className = 'dock-item';
                dockItem.dataset.appId = app.id;
                dockItem.innerHTML = `
                    <img src="${app.icon}" alt="${app.name}" title="${app.name}">
                    <button class="remove-dock-item" aria-label="Remove ${app.name}">
                        <svg width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                    </button>
                `;
                appDock.appendChild(dockItem);
            });
            appDock.classList.add('visible');
        } else {
            appDock.classList.remove('visible');
        }
    };
    
    const addAppToDock = (appId) => {
        if (!dockedApps.some(app => app.id === appId)) {
            const appToAdd = appDatabase.find(app => app.id === appId);
            if (appToAdd) {
                dockedApps.push(appToAdd);
                saveDockState();
                renderDock();
                renderApps(); // Update app store buttons
                return `${appToAdd.name} has been added to your dock.`;
            }
        }
        const app = appDatabase.find(app => app.id === appId);
        return `${app ? app.name : 'That app'} is already in your dock.`;
    };
    
    const removeAppFromDock = (appId) => {
        const appToRemove = appDatabase.find(app => app.id === appId);
        if (appToRemove && dockedApps.some(app => app.id === appId)) {
            dockedApps = dockedApps.filter(app => app.id !== appId);
            saveDockState();
            renderDock();
            renderApps();
            return `${appToRemove.name} has been removed from your dock.`;
        }
        return `I couldn't find that app in your dock.`;
    };

    // Initialize OS Core, passing the new control functions for the AI to use
    const os = new WarmwindOS(appDatabase, { addAppToDock, removeAppFromDock });
    os.boot();

    // ======================================================
    // APP STORE & EVENT LISTENERS
    // ======================================================

    const renderApps = (appsToRender = appDatabase) => {
        appListContainer.innerHTML = '';
        const dockedAppIds = new Set(dockedApps.map(app => app.id));

        appsToRender.forEach(app => {
            const isAdded = dockedAppIds.has(app.id);
            const appItemHTML = `
                <div class="app-item" data-url="${app.url}">
                    <img src="${app.icon}" alt="${app.name}" class="app-icon">
                    <span class="app-name">${app.name}</span>
                    <button class="add-app-btn ${isAdded ? 'added' : ''}" data-app-id="${app.id}" aria-label="${isAdded ? 'Added' : `Add ${app.name}`}">
                        <svg class="plus-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M11 14v-3H8v-2h3V6h2v3h3v2h-3v3h-2Z"/></svg>
                        <svg class="check-icon" viewBox="0 0 24 24"><path fill="currentColor" d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4L9.55 18Z"/></svg>
                    </button>
                </div>
            `;
            appListContainer.insertAdjacentHTML('beforeend', appItemHTML);
        });
    };
    
    appListContainer.addEventListener('click', (e) => {
        const addButton = e.target.closest('.add-app-btn');
        if (addButton) {
            const appId = addButton.dataset.appId;
            // Toggle functionality: add if not present, do nothing if already added (or could be remove)
            if (!addButton.classList.contains('added')) {
                addAppToDock(appId);
            }
            return;
        }

        const appItem = e.target.closest('.app-item');
        if (appItem) {
            window.open(appItem.dataset.url, '_blank');
        }
    });

    appDock.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.remove-dock-item');
        const dockItem = e.target.closest('.dock-item');

        if (removeButton) {
            e.stopPropagation(); // Prevent launching the app when clicking the remove button
            const appId = dockItem.dataset.appId;
            removeAppFromDock(appId);
            return;
        }

        if (dockItem) {
            const appId = dockItem.dataset.appId;
            const appToLaunch = appDatabase.find(app => app.id === appId);
            if (appToLaunch) {
                window.open(appToLaunch.url, '_blank');
            }
        }
    });
    
    appSearchInput.addEventListener('input', () => {
        const searchTerm = appSearchInput.value.toLowerCase().trim();
        const filteredApps = appDatabase.filter(app => app.name.toLowerCase().includes(searchTerm));
        renderApps(filteredApps);
    });

    // --- Welcome Screen & Homepage Animation ---
    enterOsBtn.addEventListener('click', () => {
        welcomeOverlay.classList.add('hidden');
        setTimeout(() => background.classList.add('loaded'), 100);
        setTimeout(() => topCenterMenu.classList.add('loaded'), 500);
        setTimeout(() => bottomBar.classList.add('loaded'), 600);
    });

    // --- Homepage Triggers ---
    openAppStoreBtn.addEventListener('click', () => appStoreWindow.classList.add('visible'));
    closeAppStoreBtn.addEventListener('click', () => appStoreWindow.classList.remove('visible'));

    // --- In-Place Input Logic ---
    centerConsole.addEventListener('click', (e) => {
        if (!e.target.closest('.compact-input-overlay')) {
            document.body.classList.add('compact-active');
            setTimeout(() => compactInput.focus(), 100);
        }
    });
    compactInput.addEventListener('input', () => {
        compactInput.style.height = 'auto';
        compactInput.style.height = `${compactInput.scrollHeight}px`;
    });

    // --- AI Form Submission Logic ---
    compactInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = compactInput.value.trim();
        if (!prompt) return;
        document.body.classList.add('chat-active');
        compactInput.value = '';
        compactInput.style.height = 'auto';
        await os.askAI(prompt);
    });

    // --- Closing Logic ---
    const closeAll = () => {
        appStoreWindow.classList.remove('visible');
        document.body.classList.remove('compact-active');
        document.body.classList.remove('chat-active');
        compactInput.value = '';
        compactInput.style.height = 'auto';
    };
    chatOverlay.addEventListener('click', closeAll);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });
    compactInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (compactInput.value.trim() === '' && !document.body.classList.contains('chat-active')) {
                closeAll();
            }
        }, 150);
    });
    
    // --- Initial Load ---
    loadDockState();
});