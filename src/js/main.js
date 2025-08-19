document.addEventListener('DOMContentLoaded', () => {
    
    // --- App Data ---
    const appDatabase = [
        // Keep your existing apps
        { name: 'Amazon', id: 'amazon', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg', url: 'https://www.amazon.com' },
        { name: 'Canvas', id: 'canvas', icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/2019_InstructureLogoHorizontal_Color.svg', url: 'https://bju.instructure.com' },
        { name: 'ChatGPT', id: 'chatgpt', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', url: 'https://chat.openai.com' },
        { name: 'Google Chrome', id: 'chrome', icon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg', url: 'https://www.google.com/chrome/' },
        { name: 'DuckDuckGo', id: 'duckduckgo', icon: 'https://upload.wikimedia.org/wikipedia/en/9/90/DuckDuckGo_logo.svg', url: 'https://duckduckgo.com' },
        { name: 'Gmail', id: 'gmail', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg', url: 'https://mail.google.com' },
        { name: 'Google Calendar', id: 'calendar', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg', url: 'https://calendar.google.com' },
        { name: 'Google Drive', id: 'drive', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg', url: 'https://drive.google.com' },
        { name: 'Google Sheets', id: 'sheets', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg', url: 'https://docs.google.com/spreadsheets/' },
        { name: 'Google Slides', id: 'slides', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Google_Slides_logo_%282014-2020%29.svg', url: 'https://docs.google.com/presentation/' },
        { name: 'Outlook', id: 'outlook', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg', url: 'https://outlook.live.com' },
        { name: 'Spotify', id: 'spotify', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg', url: 'https://spotify-astro-transitions.vercel.app/playlist/2_side', openInWindow: true},
        { name: 'AI Trip Planner', id: 'ai_planner', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Globe_rotating.gif', action: 'openPlanner' },
        {name: 'YouTube', id: 'mytube_clone', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/54/YouTube_dark_logo_2017.svg', url: 'https://youtube-clone-orcin.vercel.app', openInWindow: true},
        {name: 'Wikipedia', id: 'wikipedia', icon: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Wikipedia-logo-v2.svg', url: 'https://www.wikipedia.org/', openInWindow: true},
        {name: 'Y2Mate', id: 'ytmate', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Youtube-to-mp3.png', url: 'https://y2mate.nu/C1Gx/'},
        {
            name: 'Excalidraw',
            id: 'excalidraw',
            icon: 'https://excalidraw.com/apple-touch-icon.png',
            url: 'https://excalidraw.com',
            openInWindow: true,
            category: 'Design'
        },
        {
            name: 'Photopea',
            id: 'photopea',
            icon: 'https://www.photopea.com/promo/icon512.png',
            url: 'https://www.photopea.com',
            openInWindow: true,
            category: 'Design',
            allowFullscreen: true
        },
    ];
    
        // --- NEW: Speech Recognition ---
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let recognition;
        let isListening = false;
    // --- Wallpaper Data & State ---
    const lightWallpapers = ['wallpaper1.png', 'wallpaper2.png', 'wallpaper6.jpg', 'wallpaper9.jpg'];
    const darkWallpapers = ['wallpaper3.png', 'wallpaper4.png', 'wallpaper5.jpg', 'wallpaper7.jpg', 'wallpaper8.jpg'];
    let currentWallpaper = '';

    let runningApps = new Set(); // Tracks the IDs of all open windowed apps

    // --- State ---
    let dockedApps = [];

    // --- UI Element Selectors ---
    const appDock = document.querySelector('.app-dock');
    const notesSidebar = document.querySelector('.notes-sidebar'); // ADD THIS
    const closeNotesBtn = document.querySelector('.close-notes-btn'); // ADD THIS
    const notesTextarea = document.querySelector('#notes-textarea'); // ADD THIS
    const welcomeOverlay = document.querySelector('.welcome-overlay');
    const enterOsBtn = document.querySelector('#enter-os-btn');
    const background = document.querySelector('.background-image');
    const bottomBar = document.querySelector('.bottom-bar');
    const appStoreWindow = document.querySelector('.app-store-window');
    const closeAppStoreBtn = document.querySelector('.close-app-store-btn');
    const appListContainer = document.querySelector('.app-list');
    const appSearchInput = document.querySelector('#app-search-input');
    const centerConsole = document.querySelector('.center-console');
    const compactInput = document.querySelector('#compact-input');
    const compactInputForm = document.querySelector('.compact-input-form');
    const chatOverlay = document.querySelector('.chat-overlay');
    const voiceModeBtn = document.querySelector('#voice-mode-btn'); // ADD THIS LINE
    // Add these to your UI selectors
const clockDisplay = document.querySelector('#clock-display');
const dateDisplay = document.querySelector('#date-display');
const weatherDisplay = document.querySelector('#weather-display');
const systemWidget = document.querySelector('.system-widget');

        // ======================================================
    // THEME LOGIC
    // ======================================================

    const setWallpaper = (wallpaperFile) => {
        const backgroundElement = document.querySelector('.background-image');
        backgroundElement.style.setProperty('--background-image-url', `url('../assets/wallpapers/${wallpaperFile}')`);
        currentWallpaper = wallpaperFile;
        // Save the choice based on the current theme
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        if (currentTheme === 'dark') {
            localStorage.setItem('warmwindOS.darkWallpaper', wallpaperFile);
        } else {
            localStorage.setItem('warmwindOS.lightWallpaper', wallpaperFile);
        }
    };
    
    const setTheme = (theme) => {
        const isDark = theme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        localStorage.setItem('warmwindOS.theme', theme);
    
        // Now, load the appropriate wallpaper for the new theme
        const wallpaperKey = isDark ? 'warmwindOS.darkWallpaper' : 'warmwindOS.lightWallpaper';
        const defaultWallpaper = isDark ? darkWallpapers[0] : lightWallpapers[0];
        const savedWallpaper = localStorage.getItem(wallpaperKey) || defaultWallpaper;
        setWallpaper(savedWallpaper);
    };
    
    const loadTheme = () => {
        const savedTheme = localStorage.getItem('warmwindOS.theme') || 'light';
        setTheme(savedTheme);
    };

    // ADD THESE TWO NEW FUNCTIONS

function updateClock() {
    const now = new Date();
    const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };

    clockDisplay.textContent = now.toLocaleTimeString([], timeOptions);
    dateDisplay.textContent = now.toLocaleDateString([], dateOptions);
}

async function fetchWeather() {
    try {
        // CORRECT: Using the secure (https) location provider
        const locResponse = await fetch('https://ipapi.co/json/');
        if (!locResponse.ok) {
            throw new Error(`Location fetch failed with status: ${locResponse.status}`);
        }
        const locData = await locResponse.json();
        const { latitude, longitude, city } = locData;

        const weatherData = await os.getWeather(latitude, longitude);

        if (weatherData) {
            weatherDisplay.innerHTML = `
                <img src="https://openweathermap.org/img/wn/${weatherData.icon}.png" alt="${weatherData.description}" width="24" height="24">
                <span>${weatherData.temp}°C in ${city}</span>
            `;
        }
    } catch (error) {
        console.error("Could not fetch weather:", error);
        weatherDisplay.innerHTML = `<span>Weather unavailable</span>`;
    }
}

    const cycleWallpaper = () => {
        const isDark = document.body.classList.contains('dark-theme');
        const wallpaperList = isDark ? darkWallpapers : lightWallpapers;
        
        const currentIndex = wallpaperList.indexOf(currentWallpaper);
        const nextIndex = (currentIndex + 1) % wallpaperList.length; // Loop back to the start
        
        const newWallpaper = wallpaperList[nextIndex];
        setWallpaper(newWallpaper);
        return `Sure, how about this one?`; // Return a message for the AI
    };

    // ======================================================
    // CORE LOGIC (Dock & App Store)
    // ======================================================

        // ======================================================
    // NOTES LOGIC
    // ======================================================
    
    const openNotes = () => notesSidebar.classList.add('open');
    const closeNotes = () => notesSidebar.classList.remove('open');
    
    const saveNotes = () => {
        localStorage.setItem('warmwindOS.notes', notesTextarea.value);
    };

    const loadNotes = () => {
        notesTextarea.value = localStorage.getItem('warmwindOS.notes') || '';
    };

    const updateNotes = (newText, append = false) => {
        openNotes();
        if (append) {
            notesTextarea.value += `\n- ${newText}`;
        } else {
            notesTextarea.value = newText;
        }
        saveNotes();
    };

    const openAppStore = () => appStoreWindow.classList.add('visible');
    
    const saveDockState = () => {
        const appIds = dockedApps.map(app => app.id);
        localStorage.setItem('warmwindOS.dockedApps', JSON.stringify(appIds));
    };
    
    const loadDockState = () => {
        const savedAppIds = JSON.parse(localStorage.getItem('warmwindOS.dockedApps')) || [];
        dockedApps = savedAppIds.map(id => appDatabase.find(app => app.id === id)).filter(Boolean);
        renderDock();
        renderApps();
    };

    const renderDock = () => {
        const appsToShow = new Map(); // Use a Map to automatically handle duplicates
    
        // First, add all permanently docked apps
        dockedApps.forEach(app => appsToShow.set(app.id, app));
    
        // Then, add all currently running apps
        runningApps.forEach(appId => {
            if (!appsToShow.has(appId)) {
                const app = appDatabase.find(a => a.id === appId);
                if (app) appsToShow.set(appId, app);
            }
        });
    
        appDock.innerHTML = '';
        if (appsToShow.size > 0) {
            appsToShow.forEach(app => {
                const dockItem = document.createElement('div');
                dockItem.className = 'dock-item';
                dockItem.dataset.appId = app.id;
    
                // Add an 'active' class if the app is currently running
                if (runningApps.has(app.id)) {
                    dockItem.classList.add('active');
                }
    
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
                renderApps();
                // If the dock wasn't visible before, make it visible now.
                setTimeout(() => appDock.classList.add('visible'), 50);
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

    const addMinimizedAppToDock = (app) => {
        // This function doesn't need to do anything with state,
        // it just ensures the dock's UI is up-to-date.
        renderDock();
    };

    const appOpened = (appId) => {
        runningApps.add(appId);
        renderDock(); // Re-render the dock to show the running app
    };
    
    const appClosed = (appId) => {
        runningApps.delete(appId);
        renderDock(); // Re-render the dock to remove the running app
    };

    const startListening = () => {
        if (!recognition || isListening) return;
        try {
            console.log("Starting voice recognition.");
            isListening = true;
            voiceModeBtn.classList.add('recording');
            recognition.start();
        } catch (error) {
            console.error("Could not start recognition:", error);
            isListening = false;
            voiceModeBtn.classList.remove('recording');
        }
    };
    
    const stopListening = () => {
        if (!recognition || !isListening) return;
        console.log("Stopping voice recognition.");
        recognition.stop(); // onend event will handle isListening and class removal
    };

    // Initialize OS Core, passing all necessary control functions for the AI
    const os = new WarmwindOS(appDatabase, { addAppToDock, removeAppFromDock, openAppStore, setTheme, cycleWallpaper, updateNotes, openNotes, startListening, stopListening,appOpened, appClosed, addMinimizedAppToDock});
    os.boot();

    const renderApps = (appsToRender = appDatabase) => {
        appListContainer.innerHTML = '';
        const dockedAppIds = new Set(dockedApps.map(app => app.id));

        appsToRender.forEach(app => {
            const isAdded = dockedAppIds.has(app.id);
            const appItemHTML = `
                <div class="app-item" data-app-id="${app.id}">
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

        // ======================================================
    // SPEECH RECOGNITION LOGIC
    // ======================================================
    const setupSpeechRecognition = () => {
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API is not supported in this browser.");
            if (voiceModeBtn) voiceModeBtn.style.display = 'none'; // Hide button if not supported
            return;
        }
    
        recognition = new SpeechRecognition();
        recognition.continuous = false; // IMPORTANT: Only listen for a single utterance
        recognition.interimResults = false;
        recognition.lang = 'en-US';
    
        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.trim();
            console.log('Voice Command Received:', command);
    
            if (command) {
                document.body.classList.add('chat-active');
                os.askAI(command);
            }
        };
    
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
        
        // This event now correctly handles all ways the recognition can end
        recognition.onend = () => {
            // Check if still listening, as stopListening might have been called manually
            if (isListening) {
                console.log('Speech recognition service ended.');
                isListening = false;
                voiceModeBtn.classList.remove('recording');
            }
        };
    };
    
    // ======================================================
    // EVENT LISTENERS
    // ======================================================

    closeNotesBtn.addEventListener('click', closeNotes);
    notesTextarea.addEventListener('input', saveNotes); // Auto-save on typing

    // --- NEW: AI Trip Planner Listeners ---
os.ui.closePlannerBtn.addEventListener('click', () => {
    os.closePlanner();
});

os.ui.plannerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = os.ui.plannerInput.value.trim();
    if (prompt) {
        os.generateTripPlan(prompt);
    }
});

        // --- Welcome Screen & Homepage Animation ---
        enterOsBtn.addEventListener('click', () => {
            welcomeOverlay.classList.add('hidden');
            setTimeout(() => background.classList.add('loaded'), 100);
            
            // Animate the dock if it has items in it from the start
            if (dockedApps.length > 0) {
                setTimeout(() => appDock.classList.add('visible'), 500);
            }
            
            setTimeout(() => bottomBar.classList.add('loaded'), 600);
    
            // --- NEW: Trigger the AI Greeting after animations ---
            setTimeout(() => {
                // Make the chat interface visible
                document.body.classList.add('chat-active');
                document.body.classList.add('compact-active');
    
                // Tell the OS core to generate and display the greeting message
                os.deliverGreeting(); 
            }, 1000); // 1 second delay to feel deliberate
        });
    
        appListContainer.addEventListener('click', (e) => {
            const addButton = e.target.closest('.add-app-btn');
            const appItem = e.target.closest('.app-item');
        
            // Case 1: User clicked the 'add' button specifically
            if (addButton && !addButton.classList.contains('added')) {
                addAppToDock(addButton.dataset.appId);
                return; // Stop here to prevent launching
            }
        
            // Case 2: User clicked anywhere on the app row to launch it
            if (appItem) {
                // Find the app ID from the app item's data attribute
                const appId = appItem.dataset.appId;
                const appToLaunch = appDatabase.find(app => app.id === appId);
                
                if (appToLaunch) {
                    os.launchApp(appToLaunch);
                }
            }
        });

        appDock.addEventListener('click', (e) => {
            const removeButton = e.target.closest('.remove-dock-item');
            const dockItem = e.target.closest('.dock-item');
        
            if (removeButton && dockItem) {
                e.stopPropagation();
                removeAppFromDock(dockItem.dataset.appId);
                return;
            }
        
            if (dockItem) {
                const appId = dockItem.dataset.appId;
                const appToLaunch = appDatabase.find(app => app.id === appId);
                os.launchApp(appToLaunch); // The smart launcher handles everything.
            }
        });

        // --- NEW: Handle clicks on AI Quick Action buttons ---
        const messageList = document.querySelector('.ai-message-list');
        messageList.addEventListener('click', (e) => {
            const button = e.target.closest('.quick-action-btn');
            if (button) {
                const payload = button.dataset.payload;
                if (payload) {
                    // Remove the buttons after one is clicked for a cleaner UI
                    button.parentElement.remove();
                    // Send the payload to the AI as if the user typed it
                    os.askAI(payload);
                }
            }
        });
    
    appSearchInput.addEventListener('input', () => {
        const searchTerm = appSearchInput.value.toLowerCase().trim();
        const filteredApps = appDatabase.filter(app => app.name.toLowerCase().includes(searchTerm));
        renderApps(filteredApps);
    });

    closeAppStoreBtn.addEventListener('click', () => appStoreWindow.classList.remove('visible'));
    
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
    
    compactInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = compactInput.value.trim();
        if (!prompt) return;
        document.body.classList.add('chat-active');
        compactInput.value = '';
        compactInput.style.height = 'auto';
        await os.askAI(prompt);
    });

    // NEW, SAFER FUNCTION
const closeCompactInput = () => {
    document.body.classList.remove('compact-active');
    // We don't clear the input here, in case the user is just clicking away temporarily
};

// MODIFIED closeAll FUNCTION
const closeAll = () => {
    appStoreWindow.classList.remove('visible');
    os.closePlanner();
    closeCompactInput(); // Use the new function
    document.body.classList.remove('chat-active');
    compactInput.value = ''; // Now we clear the input when everything closes
    compactInput.style.height = 'auto';
};
    chatOverlay.addEventListener('click', closeAll);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });
    compactInput.addEventListener('blur', () => {
        setTimeout(() => {
            // This new logic is much safer. It closes the input bar if you click away,
            // but ONLY if the input is empty AND you are not actively using voice mode.
            // Most importantly, it no longer closes the entire chat view.
            if (compactInput.value.trim() === '' && !isListening) {
                closeCompactInput(); 
            }
        }, 150);
    });
    voiceModeBtn.addEventListener('click', () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    });
    setupSpeechRecognition();
    
    // --- Initial Load ---
loadDockState();
loadTheme();
loadNotes();
updateClock();
setInterval(updateClock, 1000); // Update clock every second
fetchWeather();
setTimeout(() => systemWidget.classList.add('loaded'), 800); // Fade in the widget
});