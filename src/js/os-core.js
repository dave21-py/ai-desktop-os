class WarmwindOS {
    constructor(apps = [], controls = {}) {
        this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        this.apps = apps;
        this.controls = controls; // Stores all our control functions
        this.state = {
            conversationHistory: []
        };
        this.ui = {};
                // --- NEW: Music Player State ---
                this.musicLibrary = [
                    { title: "Lost in the City Lights", artist: "Cool Cat", file: "track1.mp3" },
                    { title: "Ocean Drive", artist: "Synthwave Kid", file: "track2.mp3" },
                    { title: "Midnight Stroll", artist: "Lofi Girl", file: "track3.mp3" }
                    // Add more songs here
                ];
                // --- NEW: Focus Timer State ---
this.timerInterval = null;
this.timerSecondsRemaining = 0;
this.isFocusModeActive = false;
this.currentSessionType = 'work'; // Can be 'work' or 'break'
                this.currentTrackIndex = 0;
                this.isAudioContextInitialized = false;
                this.audioElement = null;
                this.visualizerCanvas = null;
                this.visualizerCtx = null;
                this.audioContext = null;
                this.analyser = null;
                this.sourceNode = null;
                this.animationFrameId = null;
                this.zIndexCounter = 100; // Manages which window is on top
                this.openWindows = new Set(); // Tracks all open app IDs
    }

    boot() {
        this._initUI();
        console.log("AI OS Core Booted Successfully.");
    }

    launchApp(app) {
        if (!app) return;
    
        // 1. Handle special internal actions (like Trip Planner)
        if (app.action && typeof this[app.action] === 'function') {
            this[app.action]();
            return; // Stop here
        }
    
        // 2. Handle all windowed apps (new or existing)
        if (app.openInWindow && app.url) {
            // If window already exists, restore and focus it.
            if (this.openWindows.has(app.id)) {
                this._restoreAppWindow(app.id);
            } 
            // Otherwise, create a new one.
            else {
                this._createAppWindow(app);
            }
        } 
        // 3. Default to opening in a new browser tab
        else if (app.url) {
            window.open(app.url, '_blank');
            this._addMessageToChat('ai', `Opening ${app.name} in a new tab for you.`);
        }
    }

    _createAppWindow(app) {
        this.zIndexCounter++;
        this.openWindows.add(app.id);
        if (this.controls.appOpened) this.controls.appOpened(app.id);
    
        // --- Create Window Element ---
        const win = document.createElement('div');
        win.className = 'app-window';
        win.dataset.appId = app.id;
        win.style.zIndex = this.zIndexCounter;
        
        // --- Create Title Bar ---
        const titleBar = document.createElement('div');
        titleBar.className = 'window-title-bar';
        titleBar.innerHTML = `
        <div class="window-title">${app.name}</div>
                <div class="window-controls">
            <button class="window-control-btn minimize" aria-label="Minimize Window">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 14H4v-4h16"/></svg>
            </button>
            <button class="window-control-btn close" aria-label="Close Window">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
            </button>
        </div>
    `;
        
        // --- Create Content Area with iFrame ---
        const content = document.createElement('div');
        content.className = 'window-content';
        const iframe = document.createElement('iframe');
        iframe.src = app.url;
        iframe.title = app.name;
        content.appendChild(iframe);
        
        win.appendChild(titleBar);
        win.appendChild(content);
        
        // --- Add to DOM ---
        this.ui.appWindowContainer.appendChild(win);
        
        // Trigger open animation
        setTimeout(() => win.classList.add('open'), 10);
    
        // --- Event Handlers ---

        
        const closeBtn = win.querySelector('.window-control-btn.close');
        closeBtn.addEventListener('click', () => this._closeAppWindow(win));

        const minimizeBtn = win.querySelector('.window-control-btn.minimize');
        minimizeBtn.addEventListener('click', () => this._minimizeAppWindow(win, app));
        
        win.addEventListener('mousedown', () => this._focusWindow(win));
        
        this._focusWindow(win); // Focus on creation
        this._tileWindows();
    }
    
    // CORRECTED CODE
_closeAppWindow(win) {
    const appId = win.dataset.appId;
    if (appId) {
        this.openWindows.delete(appId);
        if (this.controls.appClosed) this.controls.appClosed(appId);
    }
    win.classList.remove('open'); // Trigger close animation
    setTimeout(() => {
        win.remove();
        this._tileWindows(); // <-- MOVED a call here, after the window is removed
    }, 300); // Wait for animation to finish
}

    // CORRECTED CODE
_minimizeAppWindow(win, app) {
    win.classList.remove('open', 'active');
    win.dataset.minimized = 'true';
    win.classList.add('minimized');
    if (this.controls.addMinimizedAppToDock) {
         this.controls.addMinimizedAppToDock(app);
    }

    
    this._tileWindows(); // <-- MOVED here, to run every time
}
    
    // TIDIED CODE
_restoreAppWindow(appId) {
    const win = document.querySelector(`.app-window[data-app-id="${appId}"]`);
    if (win) {
        if (win.dataset.minimized === 'true') {
            delete win.dataset.minimized;
            win.classList.remove('minimized');
            win.classList.add('open');
        }
        this._focusWindow(win); // This method already calls _tileWindows() for us
    }
}
    
    _focusWindow(win) {
        this.zIndexCounter++;
        win.style.zIndex = this.zIndexCounter;
        
        // Remove active class from all other windows
        document.querySelectorAll('.app-window.active').forEach(activeWin => {
            if (activeWin !== win) activeWin.classList.remove('active');
        });
        win.classList.add('active');
        this._tileWindows();
    }

    // ADD THIS NEW METHOD
_tileWindows() {
    const PADDING = 10; // Space between windows and around the edges
    const PRIMARY_PANE_WIDTH_RATIO = 0.65; // Main window takes up 65% of the space

    const container = this.ui.appWindowContainer;
    const visibleWindows = Array.from(container.querySelectorAll('.app-window:not(.minimized)'));

    if (visibleWindows.length === 0) return;

    // --- CASE 1: Only one window is open ---
    if (visibleWindows.length === 1) {
        const win = visibleWindows[0];
        win.style.left = `${PADDING}px`;
        win.style.top = `${PADDING}px`;
        win.style.width = `calc(100% - ${2 * PADDING}px)`;
        win.style.height = `calc(100% - ${2 * PADDING}px)`;
        win.style.transform = 'none'; // Override any previous transform
        return;
    }

    // --- CASE 2: Multiple windows are open ---
    let primary = visibleWindows.find(win => win.classList.contains('active'));
    if (!primary) {
        // If no window is active, make the last one opened the primary one
        primary = visibleWindows[visibleWindows.length - 1];
        primary.classList.add('active');
    }
    const secondaries = visibleWindows.filter(win => win !== primary);

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Position the primary window
    const primaryWidth = (containerWidth * PRIMARY_PANE_WIDTH_RATIO) - (1.5 * PADDING);
    primary.style.left = `${PADDING}px`;
    primary.style.top = `${PADDING}px`;
    primary.style.width = `${primaryWidth}px`;
    primary.style.height = `calc(100% - ${2 * PADDING}px)`;
    primary.style.transform = 'none';

    // Position the secondary windows
    const secondaryPaneLeft = primaryWidth + (2 * PADDING);
    const secondaryWidth = containerWidth - secondaryPaneLeft - PADDING;
    const secondaryHeight = (containerHeight - (secondaries.length + 1) * PADDING) / secondaries.length;

    secondaries.forEach((win, index) => {
        win.style.left = `${secondaryPaneLeft}px`;
        win.style.top = `${PADDING + index * (secondaryHeight + PADDING)}px`;
        win.style.width = `${secondaryWidth}px`;
        win.style.height = `${secondaryHeight}px`;
        win.style.transform = 'none';
    });
}

    _initUI() {
        this.ui.aiMessageList = document.querySelector('.ai-message-list');
        this.ui.aiTypingIndicator = document.querySelector('.ai-typing-indicator');
        this.ui.audioPlayer = document.getElementById('music-player');
        this.ui.visualizer = document.getElementById('audio-visualizer');
        this.ui.focusTimerDisplay = document.getElementById('focus-timer');
        this.ui.timerMinutes = document.getElementById('timer-minutes');
        this.ui.timerSeconds = document.getElementById('timer-seconds');
        this.ui.timerNotification = document.getElementById('timer-notification');
        // Planner UI
this.ui.plannerWindow = document.querySelector('.planner-window');
this.ui.closePlannerBtn = document.querySelector('.close-planner-btn');
this.ui.plannerForm = document.getElementById('planner-form');
this.ui.plannerInput = document.getElementById('planner-input');
this.ui.plannerInitialView = document.getElementById('planner-initial-view');
this.ui.plannerLoadingView = document.getElementById('planner-loading-view');
this.ui.plannerResultsView = document.getElementById('planner-results-view');
this.ui.appWindowContainer = document.getElementById('app-window-container');
    }

        // ======================================================
    // MUSIC & VISUALIZER LOGIC
    // ======================================================

    _initAudioContext() {
        if (this.isAudioContextInitialized) return;
        
        // Use existing AudioContext or create a new one
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        
        // Connect the audio element to the analyser
        if (!this.sourceNode) {
             this.sourceNode = this.audioContext.createMediaElementSource(this.ui.audioPlayer);
        }
       
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.analyser.fftSize = 256;
        this.isAudioContextInitialized = true;
    }

    _setupVisualizerCanvas() {
        this.visualizerCanvas = this.ui.visualizer;
        this.visualizerCtx = this.visualizerCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = this.visualizerCanvas.getBoundingClientRect();
        this.visualizerCanvas.width = rect.width * dpr;
        this.visualizerCanvas.height = rect.height * dpr;
        this.visualizerCtx.scale(dpr, dpr);
    }

    playMusic(forcePlay = false) {
        // If music is already playing AND we are NOT forcing a new track, then exit.
        if (!forcePlay && this.ui.audioPlayer && !this.ui.audioPlayer.paused) {
            this._addMessageToChat('ai', "Music is already playing.");
            return;
        }

        // Initialize audio context on first user interaction
        if (!this.isAudioContextInitialized) {
            this._initAudioContext();
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const currentTrack = this.musicLibrary[this.currentTrackIndex];
        const newTrackSrc = `assets/music/${currentTrack.file}`;

        const isTrackLoaded = this.ui.audioPlayer.src.endsWith(newTrackSrc);

        if (!isTrackLoaded) {
            this.ui.audioPlayer.src = newTrackSrc;
        }
        
        this.ui.audioPlayer.play().then(() => {
            this._addMessageToChat('ai', `Now playing: **${currentTrack.title}** by ${currentTrack.artist}.`);
            this.ui.visualizer.classList.add('visible');
            this._startVisualizer();
        }).catch(error => {
            console.error("Playback failed:", error);
            this._addMessageToChat('ai', "I couldn't start the music. Please interact with the page first.");
        });
    }

    pauseMusic() {
        this.ui.audioPlayer.pause();
        this._addMessageToChat('ai', 'Music paused.');
        this.ui.visualizer.classList.remove('visible');
        this._stopVisualizer();
    }

    changeMusic(direction = 'next') {
        if (direction === 'next') {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicLibrary.length;
        } else { // 'previous'
            this.currentTrackIndex = (this.currentTrackIndex - 1 + this.musicLibrary.length) % this.musicLibrary.length;
        }
        this.playMusic(true); // Force the player to change the song
    }

    muteMusic() {
        if (this.ui.audioPlayer) {
            this.ui.audioPlayer.muted = true;
            this._addMessageToChat('ai', 'Music has been muted.');
        }
    }

    unmuteMusic() {
        if (this.ui.audioPlayer) {
            this.ui.audioPlayer.muted = false;
            this._addMessageToChat('ai', 'Music has been unmuted.');
        }
    }

    _startVisualizer() {
        if (!this.animationFrameId) {
            this._setupVisualizerCanvas(); // Recalculate size in case of resize
            this.animationFrameId = requestAnimationFrame(() => this._drawVisualizer());
        }
    }
    
    _stopVisualizer() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    _drawVisualizer() {
        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        const { width, height } = this.visualizerCanvas;
        const ctx = this.visualizerCtx;
        
        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height * 0.8;
            
            // Create a glowing effect with a gradient
            const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
        
        this.animationFrameId = requestAnimationFrame(() => this._drawVisualizer());
    }

    // ======================================================
// FOCUS TIMER LOGIC
// ======================================================

_startTimer(minutes, sessionType) {
    if (this.isFocusModeActive) {
        this._addMessageToChat('ai', "A focus session is already in progress.");
        return;
    }

    this.timerSecondsRemaining = minutes * 60;
    this.currentSessionType = sessionType;
    this.isFocusModeActive = true;

    this._updateTimerDisplay();
    this.ui.focusTimerDisplay.classList.add('visible');

    this.timerInterval = setInterval(() => this._tick(), 1000);

    const friendlyType = sessionType === 'work' ? 'focus session' : 'break';
    this._addMessageToChat('ai', `Alright, starting a ${minutes}-minute ${friendlyType}. You've got this!`);
}

_stopTimer() {
    if (!this.isFocusModeActive) return;

    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.isFocusModeActive = false;
    this.ui.focusTimerDisplay.classList.remove('visible');
    this._addMessageToChat('ai', "Focus session cancelled. Ready when you are.");
}

_tick() {
    this.timerSecondsRemaining--;
    this._updateTimerDisplay();

    if (this.timerSecondsRemaining <= 0) {
        this._handleTimerCompletion();
    }
}

_updateTimerDisplay() {
    const minutes = Math.floor(this.timerSecondsRemaining / 60);
    const seconds = this.timerSecondsRemaining % 60;
    this.ui.timerMinutes.textContent = String(minutes).padStart(2, '0');
    this.ui.timerSeconds.textContent = String(seconds).padStart(2, '0');
}

_handleTimerCompletion() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.isFocusModeActive = false;
    this.ui.focusTimerDisplay.classList.remove('visible');
    if (this.ui.timerNotification) this.ui.timerNotification.play();

    if (this.currentSessionType === 'work') {
        const message = "Session complete! Great work. Time for a 5-minute break.";
        const actions = [{ label: 'Start 5-min break', payload: 'start a 5 minute break' }];
        this._addMessageToChat('ai', message, actions);
    } else { // It was a break
        const message = "Break's over! Ready for another focus session?";
        const actions = [{ label: 'Start 25-min session', payload: 'start a 25 minute focus session' }];
        this._addMessageToChat('ai', message, actions);
    }
}

// ======================================================
// AI TRIP PLANNER LOGIC
// ======================================================

openPlanner() {
    this.ui.plannerWindow.classList.add('visible');
}

closePlanner() {
    this.ui.plannerWindow.classList.remove('visible');
    this._resetPlannerView(); // Clear the view when closing
}

_resetPlannerView() {
    this.ui.plannerInitialView.classList.remove('hidden');
    this.ui.plannerLoadingView.classList.add('hidden');
    this.ui.plannerResultsView.classList.add('hidden');
    this.ui.plannerResultsView.innerHTML = '';
    this.ui.plannerInput.value = '';
}

async generateTripPlan(prompt) {
    if (!prompt) return;

    // 1. Switch to loading state
    this.ui.plannerInitialView.classList.add('hidden');
    this.ui.plannerLoadingView.classList.remove('hidden');
    this.ui.plannerResultsView.classList.add('hidden');

    // 2. Construct the detailed prompt for the AI
    const detailedPrompt = `
        You are a helpful travel assistant. Based on the user's request, generate a travel itinerary.
        Your response MUST be a single, valid JSON object and nothing else. Do not include any text before or after the JSON.

        The JSON object must have a key "itinerary" which is an array of day objects.
        Each day object must contain:
        - A "day" number (e.g., 1)
        - A "title" string (e.g., "Day 1: Arrival and Ancient Wonders")
        - An "activities" array, where each activity is an object with a "title" string and a "description" string.

        User's request: "${prompt}"
    `;
    
    try {
        // 3. Get the raw response from the AI
        const rawResponse = await this._getGeminiResponse(detailedPrompt);
        // Clean the response to ensure it's just a JSON object
        const jsonString = rawResponse.match(/```json\n([\s\S]*?)\n```/)?.[1] || rawResponse;
        
        // 4. Parse the JSON
        const data = JSON.parse(jsonString);

        // 5. Render the results
        this._renderPlannerResults(data);

    } catch (error) {
        console.error("Failed to generate or parse trip plan:", error);
        this._addMessageToChat('ai', "Sorry, I couldn't generate a plan. The format might have been a bit unusual. Could you try rephrasing your request?");
        this._resetPlannerView(); // Go back to the start on error
    } finally {
         // 6. Switch to the results view
        this.ui.plannerLoadingView.classList.add('hidden');
        this.ui.plannerResultsView.classList.remove('hidden');
    }
}

_renderPlannerResults(data) {
    this.ui.plannerResultsView.innerHTML = ''; // Clear previous results

    if (!data.itinerary || data.itinerary.length === 0) {
        throw new Error("Invalid itinerary data received from AI.");
    }

    data.itinerary.forEach(dayData => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `<h4>Day ${dayData.day}: ${dayData.title}</h4>`;
        dayColumn.appendChild(dayHeader);

        dayData.activities.forEach(activityData => {
            const activityCard = document.createElement('div');
            activityCard.className = 'activity-card';
            activityCard.innerHTML = `
                <h5>${activityData.title}</h5>
                <p>${activityData.description}</p>
            `;
            dayColumn.appendChild(activityCard);
        });

        this.ui.plannerResultsView.appendChild(dayColumn);
    });
}

    async deliverGreeting() {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        if (this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.remove('hidden');
        await delay(1000);

        const now = new Date();
        const hour = now.getHours();
        let timeGreeting = hour < 12 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!";

        if (this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.add('hidden');
        this._addMessageToChat('ai', timeGreeting);
        
        await delay(600);
        this._addMessageToChat('ai', "Welcome to VibeOS!");

        await delay(800);
        this._addMessageToChat('ai', "What's on your mind today?");
    }

    async _handleCommand(prompt) {
        const lowerCasePrompt = prompt.toLowerCase();

        const plannerKeywords = ['plan a trip', 'trip planner', 'travel plan', 'planner'];
        if (plannerKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            this.openPlanner();
            this._addMessageToChat('ai', 'Opening the trip planner. What adventure is on your mind?');
            return true;
        }

        const muteKeywords = ['mute music', 'mute', 'silence'];
        if (muteKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            this.muteMusic();
            return true;
        }

        const unmuteKeywords = ['unmute music', 'unmute', 'turn sound on'];
        if (unmuteKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            this.unmuteMusic();
            return true;
        }

                        // --- Music Commands ---
        const playKeywords = ['play music', 'play a song', 'start music', 'resume music', 'resume', 'unpause'];
        if (playKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            this.playMusic();
            return true;
        }

        const pauseKeywords = ['pause music', 'stop the music', 'pause'];
        if (pauseKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            this.pauseMusic();
            return true;
        }

        const nextKeywords = ['next song', 'change the music', 'skip song', 'next music', 'another one'];
        if (nextKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            this.changeMusic('next');
            return true;
        }
        
        const prevKeywords = ['previous song', 'last song', 'go back', 'play the last one'];
        if (prevKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            this.changeMusic('previous');
            return true;
        }

            // --- Focus Timer Commands ---
    const stopTimerKeywords = ['stop the timer', 'cancel timer', 'stop focus', 'cancel focus'];
    if (stopTimerKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
        this._stopTimer();
        return true;
    }

    const timerKeywords = ['timer', 'focus session', 'pomodoro', 'break'];
    if (timerKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
        // Regex to find a number in the prompt (e.g., "start a 10 minute timer")
        const durationMatch = prompt.match(/\d+/); 
        const minutes = durationMatch ? parseInt(durationMatch[0], 10) : 25; // Default to 25 mins
        
        const sessionType = lowerCasePrompt.includes('break') ? 'break' : 'work';
        
        this._startTimer(minutes, sessionType);
        return true;
    }
        
        // --- NEW Command: Help & Onboarding ---
        const helpKeywords = ['help', 'what can you do', 'show commands', 'commands'];
        if (helpKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            const helpText = "I can do many things! I can manage your workspace, find apps, and answer questions. Here are a few things to try:";
            const helpActions = [
                { label: 'Change my wallpaper', payload: 'change wallpaper' },
                { label: 'Switch to dark mode', payload: 'dark mode' },
                { label: 'Browse apps', payload: 'browse apps' }
            ];
            this._addMessageToChat('ai', helpText, helpActions);
            return true;
        }

        // --- Note-Taking Commands ---
        const summarizeKeywords = ['summarize this', 'summarize our conversation', 'summarize that'];
        if (summarizeKeywords.some(keyword => lowerCasePrompt.startsWith(keyword))) {
            this._addMessageToChat('ai', "Sure, summarizing the last few messages for you...");
            const recentHistory = this.state.conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n');
            const summaryPrompt = `Based on the following conversation, please provide a concise summary in a bulleted list format. Focus on key decisions, ideas, and action items.\n\n---\n\n${recentHistory}`;
            const summary = await this._getGeminiResponse(summaryPrompt);
            if (this.controls.updateNotes) {
                this.controls.updateNotes(summary, false);
            }
            this._addMessageToChat('ai', "I've added the summary to your scratchpad.");
            return true;
        }

        const noteKeywords = ['take a note', 'remember that', 'add to my notes', 'note to self'];
        for (const keyword of noteKeywords) {
            if (lowerCasePrompt.startsWith(keyword)) {
                const noteContent = prompt.substring(keyword.length).trim();
                if (noteContent && this.controls.updateNotes) {
                    this.controls.updateNotes(noteContent, true);
                    this._addMessageToChat('ai', "Got it. I've added that to your scratchpad.");
                    return true;
                }
            }
        }

        const openNoteKeywords = ['show my notes', 'open scratchpad', 'open notes'];
        if (openNoteKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if(this.controls.openNotes) {
                this.controls.openNotes();
                return true;
            }
        }

        // --- Other commands from previous steps ---
        const darkThemeKeywords = ['dark mode', 'dark theme', 'night mode'];
        if (darkThemeKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if (this.controls.setTheme) {
                this.controls.setTheme('dark'); this._addMessageToChat('ai', 'Switching to dark mode.'); return true;
            }
        }
        const lightThemeKeywords = ['light mode', 'light theme', 'day mode'];
        if (lightThemeKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if (this.controls.setTheme) {
                this.controls.setTheme('light'); this._addMessageToChat('ai', 'Switching to light mode.'); return true;
            }
        }
        const wallpaperKeywords = ['wallpaper', 'background', 'scene'];
        if (wallpaperKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if (this.controls.cycleWallpaper) {
                this._addMessageToChat('ai', this.controls.cycleWallpaper()); return true;
            }
        }
        const appStoreKeywords = ['browse apps', 'show apps', 'open app store', 'find apps'];
        if (appStoreKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if (this.controls.openAppStore) {
                this.controls.openAppStore(); this._addMessageToChat('ai', 'Here are the available apps.'); return true;
            }
        }
        
        const openKeywords = ['open', 'launch', 'go to', 'navigate to'];
if (openKeywords.some(keyword => lowerCasePrompt.startsWith(keyword))) {
    for (const app of this.apps) {
        if (lowerCasePrompt.includes(app.name.toLowerCase())) {
            this.launchApp(app);
            // The launchApp function will decide HOW to open it
            return true; 
        }
    }
}

        const addKeywords = ['add', 'pin', 'dock'];
        if (addKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
             for (const app of this.apps) { if (lowerCasePrompt.includes(app.name.toLowerCase())) { if (this.controls.addAppToDock) { this._addMessageToChat('ai', this.controls.addAppToDock(app.id)); } return true; } }
        }

        const removeKeywords = ['remove', 'unpin', 'undock'];
        if (removeKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
             for (const app of this.apps) { if (lowerCasePrompt.includes(app.name.toLowerCase())) { if (this.controls.removeAppFromDock) { this._addMessageToChat('ai', this.controls.removeAppFromDock(app.id)); } return true; } }
        }

        return false;
    }

    async askAI(prompt) {
        if (!prompt) return;

        this._addMessageToChat('user', prompt);
        this.state.conversationHistory.push({ role: 'user', content: prompt });

        // Await the command handler since it might need to make an API call (for summarization)
        if (await this._handleCommand(prompt)) {
            return;
        }
        
        if(this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.remove('hidden');
        
        try {
            const aiResponse = await this._getGeminiResponse(prompt);
            this._addMessageToChat('ai', aiResponse);
            this.state.conversationHistory.push({ role: 'ai', content: aiResponse });
        } catch (error) {
            console.error("Error communicating with AI:", error);
        } finally {
            if(this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.add('hidden');
        }
    }

    async _getGeminiResponse(prompt) {
        // ... (This function remains unchanged) ...
        if (!this.GEMINI_API_KEY) {
            this._addMessageToChat('ai', "It seems the API key is missing. Please check the `js/config.js` file.");
            throw new Error("API key is missing.");
        }
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.GEMINI_API_KEY}`;
        const requestBody = { "contents": [{ "parts": [{ "text": prompt }] }] };
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: `API request failed with status ${response.status}` } }));
            const errorMessage = errorData.error.message || `An unknown API error occurred.`;
            this._addMessageToChat('ai', `Sorry, an error occurred: ${errorMessage}`);
            throw new Error(errorMessage);
        }
        const data = await response.json();
        try {
            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            const errorMessage = "Could not parse the AI's response.";
            this._addMessageToChat('ai', `Sorry, an error occurred: ${errorMessage}`);
            console.error("Error parsing AI response:", data);
            throw new Error(errorMessage);
        }
    }

    _addMessageToChat(sender, text, actions = []) {
        // ... (This function remains unchanged) ...
        if (!this.ui.aiMessageList) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message from-${sender}`;
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = formattedText;
        messageDiv.appendChild(bubble);
        if (actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'quick-actions-container';
            actions.forEach(action => {
                const actionButton = document.createElement('button');
                actionButton.className = 'quick-action-btn';
                actionButton.textContent = action.label;
                actionButton.dataset.payload = action.payload;
                actionsContainer.appendChild(actionButton);
            });
            messageDiv.appendChild(actionsContainer);
        }
        this.ui.aiMessageList.appendChild(messageDiv);
        const container = this.ui.aiMessageList.closest('.ai-message-list-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
}