document.addEventListener('DOMContentLoaded', () => {
    const os = new WarmwindOS();
    os.boot();

    // --- App Data ---
    const appDatabase = [
        { name: 'Amazon', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg' },
        { name: 'Canva', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Canva_icon_2021.svg' },
        { name: 'ChatGPT', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
        { name: 'Google Chrome', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg' },
        { name: 'DuckDuckGo', icon: 'https://upload.wikimedia.org/wikipedia/en/9/90/DuckDuckGo_logo.svg' },
        { name: 'Gmail', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg' },
        { name: 'Google Calendar', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg' },
        { name: 'Google Drive', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg' },
        { name: 'Google Sheets', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg' },
        { name: 'Google Slides', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Google_Slides_logo_%282014-2020%29.svg' },
        { name: 'Outlook', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg' },
        { name: 'Spotify', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg' }
    ];
    
    // --- UI Element Selectors ---
    const welcomeOverlay = document.querySelector('.welcome-overlay');
    const enterOsBtn = document.querySelector('#enter-os-btn'); // Corrected selector
    const background = document.querySelector('.background-image');
    const bottomBar = document.querySelector('.bottom-bar');
    
    // App Store selectors
    const topCenterMenu = document.querySelector('.top-center-menu'); // For animation
    const openAppStoreBtn = document.querySelector('#open-app-store-btn'); // New trigger
    const appStoreWindow = document.querySelector('.app-store-window');
    const closeAppStoreBtn = document.querySelector('.close-app-store-btn');
    const appListContainer = document.querySelector('.app-list');
    const appSearchInput = document.querySelector('#app-search-input');

    // Core chat elements
    const centerConsole = document.querySelector('.center-console');
    const compactInput = document.querySelector('#compact-input');
    const compactInputForm = document.querySelector('.compact-input-form');
    const chatOverlay = document.querySelector('.chat-overlay');

    // --- 1. App Store Logic ---
    const renderApps = (appsToRender = appDatabase) => {
        appListContainer.innerHTML = ''; // Clear previous list
        const appItemsHTML = appsToRender.map(app => `
            <div class="app-item">
                <img src="${app.icon}" alt="${app.name}" class="app-icon">
                <span class="app-name">${app.name}</span>
                <button class="add-app-btn" aria-label="Add ${app.name}">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 14v-3H8v-2h3V6h2v3h3v2h-3v3h-2Zm1 8q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.138T12 2q2.075 0 3.9.788t3.175 2.138q1.35 1.35 2.137 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.137T12 22Zm0-2q3.35 0 5.675-2.325T20 12q0-3.35-2.325-5.675T12 4Q8.65 4 6.325 6.325T4 12q0 3.35 2.325 5.675T12 20Z"/></svg>
                </button>
            </div>
        `).join('');
        appListContainer.innerHTML = appItemsHTML;
    };

    const openAppStore = () => appStoreWindow.classList.add('visible');
    const closeAppStore = () => appStoreWindow.classList.remove('visible');

    appSearchInput.addEventListener('input', () => {
        const searchTerm = appSearchInput.value.toLowerCase().trim();
        const filteredApps = appDatabase.filter(app => app.name.toLowerCase().includes(searchTerm));
        renderApps(filteredApps);
    });

    // --- 2. Welcome Screen & Homepage Animation ---
    enterOsBtn.addEventListener('click', () => {
        welcomeOverlay.classList.add('hidden');
        setTimeout(() => background.classList.add('loaded'), 100);
        setTimeout(() => topCenterMenu.classList.add('loaded'), 500); // Animate the new button
        setTimeout(() => bottomBar.classList.add('loaded'), 600);
        // App store does NOT open automatically
    });

    // --- 3. Homepage Triggers ---
    openAppStoreBtn.addEventListener('click', openAppStore);
    closeAppStoreBtn.addEventListener('click', closeAppStore);

    // --- 4. In-Place Input Logic ---
    const openCompactInput = () => document.body.classList.add('compact-active');
    const closeAllInputs = () => {
        document.body.classList.remove('compact-active');
        document.body.classList.remove('chat-active');
        compactInput.value = '';
        compactInput.style.height = 'auto';
    };

    centerConsole.addEventListener('click', (e) => {
        if (!e.target.closest('.compact-input-overlay')) {
            openCompactInput();
            setTimeout(() => compactInput.focus(), 100);
        }
    });
    compactInput.addEventListener('input', () => {
        compactInput.style.height = 'auto';
        compactInput.style.height = `${compactInput.scrollHeight}px`;
    });

    // --- 5. AI Form Submission Logic ---
    compactInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = compactInput.value.trim();
        if (!prompt) return;
        document.body.classList.add('chat-active');
        compactInput.value = '';
        compactInput.style.height = 'auto';
        await os.askAI(prompt);
    });

    // --- 6. Closing Logic ---
    chatOverlay.addEventListener('click', closeAllInputs);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (appStoreWindow.classList.contains('visible')) {
                closeAppStore(); // Prioritize closing the app store
            } else {
                closeAllInputs();
            }
        }
    });
    compactInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (compactInput.value.trim() === '' && !document.body.classList.contains('chat-active')) {
                closeAllInputs();
            }
        }, 150);
    });
    
    // --- Initial Render ---
    renderApps(); // Populate the app store on load
});