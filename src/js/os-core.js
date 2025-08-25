class WarmwindOS {
    constructor(apps = [], controls = {}) {
        this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        this.OPENWEATHER_API_KEY = typeof OPENWEATHER_API_KEY !== 'undefined' ? OPENWEATHER_API_KEY : '';
        this.apps = apps;
        this.controls = controls;
        this.state = {
            conversationHistory: [],
            currentWeather: null,
        };
        this.ui = {};
        this.musicLibrary = [
            { title: "Lost in the City Lights", artist: "Cool Cat", file: "track1.mp3" },
            { title: "Ocean Drive", artist: "Synthwave Kid", file: "track2.mp3" },
            { title: "Midnight Stroll", artist: "Lofi Girl", file: "track3.mp3" }
        ];
        this.timerInterval = null;
        this.timerSecondsRemaining = 0;
        this.activePods = new Map();
        this.currentTrackIndex = 0;
        this.isAudioContextInitialized = false;
        this.audioElement = null;
        this.audioContext = null;
        this.analyser = null;
        this.sourceNode = null;
        this.zIndexCounter = 100;
        this.openWindows = new Set();
        this.podVisualizerCanvas = null;
        this.podVisualizerCtx = null;
        this.podAnimationFrameId = null;
    }

    async getWeather(lat, lon) {
        if (!this.OPENWEATHER_API_KEY) {
            console.warn("OpenWeather API key is missing.");
            return null;
        }
        const API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.OPENWEATHER_API_KEY}&units=metric`;
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            const weatherInfo = {
                temp: Math.round(data.main.temp),
                description: data.weather[0].description,
                icon: data.weather[0].icon,
            };
            this.state.currentWeather = weatherInfo;
            return weatherInfo;
        } catch (error) {
            console.error("Error fetching weather from OpenWeather:", error);
            return null;
        }
    }

    boot() {
        this._initUI();
        this._updatePodDisplay();
        console.log("AI OS Core Booted Successfully.");
    }

    openSettings() {
        if (!this.ui.settingsWindow) return;
        this.ui.settingsWindow.classList.remove('hidden');
        setTimeout(() => {
            this.ui.settingsWindow.classList.add('visible');
        }, 10);
        this._populateSettings();
    }

    _populateSettings() {
        if (!this.ui.wallpaperOptionsContainer || !this.ui.dockedAppsList) return;
        this.ui.wallpaperOptionsContainer.innerHTML = '';
        const isDark = document.body.classList.contains('dark-theme');
        const wallpapers = isDark ? darkWallpapers : lightWallpapers;
        wallpapers.forEach((wp) => {
            const option = document.createElement('div');
            option.className = 'settings-wallpaper-option';
            option.dataset.wallpaper = wp;
            option.style.backgroundImage = `url('../assets/wallpapers/${wp}')`;
            if (wp === currentWallpaper) {
                option.classList.add('active');
            }
            option.addEventListener('click', () => {
                document.querySelectorAll('.settings-wallpaper-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                setWallpaper(wp);
            });
            this.ui.wallpaperOptionsContainer.appendChild(option);
        });
        this.ui.dockedAppsList.innerHTML = '';
        dockedApps.forEach(app => {
            const listItem = document.createElement('li');
            listItem.className = 'settings-app-item';
            listItem.innerHTML = `
                 <img src="${app.icon}" alt="${app.name}">
                 <span>${app.name}</span>
                 <button aria-label="Remove ${app.name}" data-app-id="${app.id}">Remove</button>
             `;
            this.ui.dockedAppsList.appendChild(listItem);
        });
        this.ui.dockedAppsList.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appId = e.target.dataset.appId;
                if (this.controls.removeAppFromDock) {
                    this.controls.removeAppFromDock(appId);
                    this._populateSettings();
                }
            });
        });
    }

    launchApp(app, clickEvent = null) {
        if (!app) return;
        if (app.action && typeof this[app.action] === 'function') {
            this[app.action]();
            return;
        }
        if (app.openInWindow && app.url) {
            if (this.openWindows.has(app.id)) {
                this._restoreAppWindow(app.id);
            } else {
                this._createAppWindow(app, clickEvent);
            }
        } else if (app.url) {
            window.open(app.url, '_blank');
            this._addMessageToChat('ai', `Opening ${app.name} in a new tab for you.`);
        }
    }

    _createAppWindow(app, clickEvent = null) {
        this.zIndexCounter++;
        this.openWindows.add(app.id);
        if (this.controls.appOpened) this.controls.appOpened(app.id);

        // This is the main window container. It gets the blurred background.
        const win = document.createElement('div');
        win.className = 'app-window';
        win.dataset.appId = app.id;
        win.style.zIndex = this.zIndexCounter;

        // Animation origin logic (no changes here)
        if (clickEvent && clickEvent.target) {
            const sourceElement = clickEvent.target.closest('.dock-item, .app-item');
            if (sourceElement) {
                const sourceRect = sourceElement.getBoundingClientRect();
                const containerRect = this.ui.appWindowContainer.getBoundingClientRect();
                const originX = sourceRect.left + sourceRect.width / 2 - containerRect.left;
                const originY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
                win.style.transformOrigin = `${originX}px ${originY}px`;
            }
        }
        
        // --- MODIFIED HTML STRUCTURE ---
        // We're creating the new detached title bar and the inset content wrapper.
        win.innerHTML = `
            <div class="window-title-bar">
                <div class="window-title-details">
                    <img src="${app.icon}" class="window-app-icon" alt="${app.name} icon">
                    <div class="window-title">${app.name}</div>
                </div>
                <div class="window-controls">
                    <button class="window-control-btn minimize" aria-label="Minimize Window">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 14H4v-4h16"/></svg>
                    </button>
                    <button class="window-control-btn close" aria-label="Close Window">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6L6.4 19Z"/></svg>
                    </button>
                </div>
            </div>
            <div class="window-content">
                <iframe src="${app.url}" title="${app.name}"></iframe>
            </div>
        `;
        // --- END OF MODIFIED STRUCTURE ---

        this.ui.appWindowContainer.appendChild(win);
        
        // Animation logic (no changes here)
        setTimeout(() => {
            win.classList.add('open');
            setTimeout(() => {
                win.style.transformOrigin = 'center';
            }, 400);
        }, 10);

        // Event listener logic (no changes here)
        const closeBtn = win.querySelector('.window-control-btn.close');
        closeBtn.addEventListener('click', () => this._closeAppWindow(win));
        const minimizeBtn = win.querySelector('.window-control-btn.minimize');
        minimizeBtn.addEventListener('click', () => this._minimizeAppWindow(win, app));
        win.addEventListener('mousedown', () => this._focusWindow(win));
        
        this._focusWindow(win);
        this._tileWindows();
    }

    _closeAppWindow(win) {
        const appId = win.dataset.appId;
        if (!this._animateWindowToDock(win)) {
            win.classList.remove('open');
        }
        setTimeout(() => {
            if (appId) {
                this.openWindows.delete(appId);
                if (this.controls.appClosed) this.controls.appClosed(appId);
            }
            win.remove();
            this._tileWindows();
        }, 400);
    }

    _minimizeAppWindow(win, app) {
        win.classList.remove('active');
        if (!this._animateWindowToDock(win)) {
            win.classList.remove('open');
        }
        setTimeout(() => {
            win.classList.add('minimized');
            win.dataset.minimized = 'true';
            if (this.controls.addMinimizedAppToDock) {
                this.controls.addMinimizedAppToDock(app);
            }
            this._tileWindows();
        }, 400);
    }

    _restoreAppWindow(appId) {
        const win = document.querySelector(`.app-window[data-app-id="${appId}"]`);
        if (win && win.dataset.minimized === 'true') {
            const dockIcon = document.querySelector(`.dock-item[data-app-id="${appId}"]`);
            if (dockIcon) {
                const iconRect = dockIcon.getBoundingClientRect();
                const containerRect = this.ui.appWindowContainer.getBoundingClientRect();
                const originX = iconRect.left + iconRect.width / 2 - containerRect.left;
                const originY = iconRect.top + iconRect.height / 2 - containerRect.top;
                win.style.transformOrigin = `${originX}px ${originY}px`;
            }
            win.classList.remove('minimized');
            delete win.dataset.minimized;
            win.style.transform = '';
            win.style.opacity = '';
            win.style.filter = '';
            void win.offsetWidth;
            win.classList.add('open');
            this._focusWindow(win);
            setTimeout(() => {
                win.style.transformOrigin = 'center';
            }, 400);
        } else if (win) {
            this._focusWindow(win);
        }
    }

    _focusWindow(win) {
        this.zIndexCounter++;
        win.style.zIndex = this.zIndexCounter;
        document.querySelectorAll('.app-window.active').forEach(activeWin => {
            if (activeWin !== win) activeWin.classList.remove('active');
        });
        win.classList.add('active');
        this._tileWindows();
    }

    _animateWindowToDock(win) {
        const appId = win.dataset.appId;
        if (!appId) return false;
        const dockIcon = document.querySelector(`.dock-item[data-app-id="${appId}"]`);
        if (dockIcon) {
            const winRect = win.getBoundingClientRect();
            const iconRect = dockIcon.getBoundingClientRect();
            const translateX = (iconRect.left + iconRect.width / 2) - (winRect.left + winRect.width / 2);
            const translateY = (iconRect.top + iconRect.height / 2) - (winRect.top + winRect.height / 2);
            win.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.1)`;
            win.style.opacity = '0';
            win.style.filter = 'blur(10px)';
            return true;
        }
        return false;
    }

    // This is the NEW function. Paste this in place of the old one.
_tileWindows() {
    const container = this.ui.appWindowContainer;
    const visibleWindows = Array.from(container.querySelectorAll('.app-window:not(.minimized)'));

    // --- You can tweak these values to change the look ---
    const PADDING = 20; // Overall spacing from the container edges
    const CENTER_WIDTH_RATIO = 0.65; // How wide the active window is
    const SIDE_WIDTH_RATIO = 0.6;   // How wide the side windows are
    const SIDE_PEEK_AMOUNT = 120;   // How much of the side windows are visible
    const SIDE_STACK_OFFSET = 15;   // The cascade effect for multiple side windows

    if (visibleWindows.length === 0) return;

    // --- Case 1: Only one window is open ---
    if (visibleWindows.length === 1) {
        const win = visibleWindows[0];
        win.style.left = `${PADDING}px`;
        win.style.top = `${PADDING}px`;
        win.style.width = `calc(100% - ${2 * PADDING}px)`;
        win.style.height = `calc(100% - ${2 * PADDING}px)`;
        win.style.transform = 'none';
        return;
    }

    // --- Case 2: Multiple windows are open (Center Stage layout) ---
    let primary = visibleWindows.find(win => win.classList.contains('active'));
    if (!primary) {
        primary = visibleWindows[visibleWindows.length - 1];
        primary.classList.add('active');
    }

    const inactiveWindows = visibleWindows.filter(win => win !== primary);
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Position the ACTIVE window in the center
    const primaryWidth = containerWidth * CENTER_WIDTH_RATIO;
    primary.style.width = `${primaryWidth}px`;
    primary.style.height = `calc(100% - ${2 * PADDING}px)`;
    primary.style.left = `${(containerWidth - primaryWidth) / 2}px`;
    primary.style.top = `${PADDING}px`;
    primary.style.transform = 'scale(1)'; // Ensure it's full size

    // Position all INACTIVE windows stacked on the right
    inactiveWindows.forEach((win, index) => {
        const sideWidth = containerWidth * SIDE_WIDTH_RATIO;
        win.style.width = `${sideWidth}px`;
        win.style.height = `calc(100% - ${2 * PADDING}px)`;
        win.style.top = `${PADDING}px`;
        
        // Push it off-screen, then pull it back by the "peek" amount
        win.style.left = `${containerWidth - SIDE_PEEK_AMOUNT}px`;
        
        // Apply a scale and cascade effect
        win.style.transform = `scale(0.95) translateX(${index * SIDE_STACK_OFFSET}px) translateY(${index * SIDE_STACK_OFFSET}px)`;
    });
}

    _initUI() {
        this.ui.aiMessageList = document.querySelector('.ai-message-list');
        this.ui.aiTypingIndicator = document.querySelector('.ai-typing-indicator');
        this.ui.audioPlayer = document.getElementById('music-player');
        this.ui.timerNotification = document.getElementById('timer-notification');
        this.ui.plannerWindow = document.querySelector('.planner-window');
        this.ui.closePlannerBtn = document.querySelector('.close-planner-btn');
        this.ui.plannerForm = document.getElementById('planner-form');
        this.ui.plannerInput = document.getElementById('planner-input');
        this.ui.plannerInitialView = document.getElementById('planner-initial-view');
        this.ui.plannerLoadingView = document.getElementById('planner-loading-view');
        this.ui.plannerResultsView = document.getElementById('planner-results-view');
        this.ui.appWindowContainer = document.getElementById('app-window-container');
        this.ui.settingsWindow = document.getElementById('settings-window');
        this.ui.settingsNavItems = document.querySelectorAll('.settings-nav-item');
        this.ui.settingsPanes = document.querySelectorAll('.settings-pane');
        this.ui.closeSettingsBtn = document.getElementById('close-settings-btn');
        this.ui.themeOptionBtns = document.querySelectorAll('.settings-option-btn[data-theme]');
        this.ui.wallpaperOptionsContainer = document.getElementById('wallpaper-options');
        this.ui.dockedAppsList = document.getElementById('settings-docked-apps-list');
        
        this.ui.topBarContainer = document.getElementById('top-bar-container');
        this.ui.activityPod = document.getElementById('activity-pod');
        this.ui.podCompactView = this.ui.activityPod.querySelector('.pod-compact-view');
        this.ui.podExpandedMain = this.ui.activityPod.querySelector('.pod-expanded-main');
        this.ui.podExpandedActions = this.ui.activityPod.querySelector('.pod-expanded-actions');
        this.ui.secondaryPod = document.getElementById('secondary-pod');
    }

    // ======================================================
    // MUSIC LOGIC
    // ======================================================
    _initAudioContext() {
        if (this.isAudioContextInitialized) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        if (!this.sourceNode) {
            this.sourceNode = this.audioContext.createMediaElementSource(this.ui.audioPlayer);
        }
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.isAudioContextInitialized = true;
    }

    playMusic(forcePlay = false, isResume = false) {
        const isPlaying = this.ui.audioPlayer && !this.ui.audioPlayer.paused;
        if (!forcePlay && isPlaying) return;

        if (!this.isAudioContextInitialized) this._initAudioContext();
        else if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const currentTrack = this.musicLibrary[this.currentTrackIndex];
        const newTrackSrc = `assets/music/${currentTrack.file}`;
        const isTrackLoaded = this.ui.audioPlayer.src.endsWith(newTrackSrc);

        if (!isTrackLoaded) this.ui.audioPlayer.src = newTrackSrc;
        
        this.ui.audioPlayer.play().then(() => {
            if (!isResume) {
                 this._addMessageToChat('ai', `Now playing: **${currentTrack.title}** by ${currentTrack.artist}.`);
            }
            this._addActivity('music', { ...currentTrack, isPlaying: true });
        }).catch(error => {
            console.error("Playback failed:", error);
            this._addMessageToChat('ai', "I couldn't start the music.");
        });
    }

    pauseMusic() {
        const isPlaying = this.ui.audioPlayer && !this.ui.audioPlayer.paused;
        if (!isPlaying) return;

        this.ui.audioPlayer.pause();
        this._stopPodVisualizer();
        this._addMessageToChat('ai', 'Music paused.');
        
        const currentTrack = this.musicLibrary[this.currentTrackIndex];
        this._addActivity('music', { ...currentTrack, isPlaying: false });
    }

    // NEW: Method to fully stop music and remove the island
    stopMusic() {
        const isPlaying = this.ui.audioPlayer && !this.ui.audioPlayer.paused;
        // Check if music is playing or if the pod is visible (even if paused)
        if (!isPlaying && !this.activePods.has('music')) return;

        this.ui.audioPlayer.pause();
        this.ui.audioPlayer.currentTime = 0; // Rewind the track
        this._removeActivity('music'); // This is the key change to remove the island
        this._addMessageToChat('ai', 'Music stopped.');
    }
    
    changeMusic(direction = 'next') {
        this._stopPodVisualizer();
        if (direction === 'next') {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicLibrary.length;
        } else {
            this.currentTrackIndex = (this.currentTrackIndex - 1 + this.musicLibrary.length) % this.musicLibrary.length;
        }
        this.playMusic(true);
    }

    // ======================================================
    // VISUALIZER LOGIC
    // ======================================================
    _setupPodVisualizerCanvas(canvasId) {
        this.podVisualizerCanvas = document.getElementById(canvasId);
        if (!this.podVisualizerCanvas) return false;
        this.podVisualizerCtx = this.podVisualizerCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = this.podVisualizerCanvas.getBoundingClientRect();
        this.podVisualizerCanvas.width = rect.width * dpr;
        this.podVisualizerCanvas.height = rect.height * dpr;
        this.podVisualizerCtx.scale(dpr, dpr);
        return true;
    }

    _startPodVisualizer(canvasId) {
        if (this.podAnimationFrameId) cancelAnimationFrame(this.podAnimationFrameId);
        if (this._setupPodVisualizerCanvas(canvasId)) {
            this.analyser.fftSize = 64;
            this.analyser.smoothingTimeConstant = 0.8;
            this._drawPodVisualizer();
        }
    }

    _stopPodVisualizer() {
        if (this.podAnimationFrameId) {
            cancelAnimationFrame(this.podAnimationFrameId);
            this.podAnimationFrameId = null;
        }
    }

    _drawPodVisualizer() {
        if (!this.analyser || !this.podVisualizerCtx || !this.podVisualizerCanvas) {
            this._stopPodVisualizer();
            return;
        }
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        const ctx = this.podVisualizerCtx;
        const { width, height } = this.podVisualizerCanvas.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);
        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#8A2BE2');
        gradient.addColorStop(0.5, '#4682B4');
        gradient.addColorStop(1, '#00BFFF');
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height * 0.9;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, height - barHeight, barWidth, barHeight, [2]);
            ctx.fill();
            x += barWidth + 2;
        }
        this.podAnimationFrameId = requestAnimationFrame(() => this._drawPodVisualizer());
    }

    // ======================================================
    // FOCUS TIMER LOGIC
    // ======================================================
    _startTimer(minutes, sessionType) {
        if (this.activePods.has('timer')) {
            this._addMessageToChat('ai', "A focus session is already in progress.");
            return;
        }
        this.timerSecondsRemaining = minutes * 60;
        this._addActivity('timer', { sessionType });
        this.timerInterval = setInterval(() => this._tick(), 1000);
        const friendlyType = sessionType === 'work' ? 'focus session' : 'break';
        this._addMessageToChat('ai', `Alright, starting a ${minutes}-minute ${friendlyType}. You've got this!`);
    }

    _stopTimer() {
        if (!this.activePods.has('timer')) return;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this._removeActivity('timer');
        this._addMessageToChat('ai', "Focus session cancelled. Ready when you are.");
    }

    _tick() {
        this.timerSecondsRemaining--;
        this._updateTimerDisplay();
        if (this.timerSecondsRemaining <= 0) this._handleTimerCompletion();
    }
    
    _handleTimerCompletion() {
        clearInterval(this.timerInterval);
        const currentSessionType = this.activePods.get('timer')?.sessionType;
        this._removeActivity('timer');
        if (this.ui.timerNotification) this.ui.timerNotification.play();
        if (currentSessionType === 'work') {
            const message = "Session complete! Great work. Time for a 5-minute break.";
            const actions = [{ label: 'Start 5-min break', payload: 'start a 5 minute break' }];
            this._addMessageToChat('ai', message, actions);
        } else {
            const message = "Break's over! Ready for another focus session?";
            const actions = [{ label: 'Start 25-min session', payload: 'start a 25 minute focus session' }];
            this._addMessageToChat('ai', message, actions);
        }
    }
    
    // ======================================================
    // MASTER ACTIVITY POD CONTROLLER (DYNAMIC ISLAND)
    // ======================================================
    _addActivity(type, data) {
        if(this.activePods.has(type)) this.activePods.delete(type); // Remove to re-insert at the top
        const newPods = new Map([[type, data], ...this.activePods]);
        this.activePods = new Map(Array.from(newPods).slice(0, 2)); // Limit to 2 activities
        this._updatePodDisplay();
    }

    _removeActivity(type) {
        this.activePods.delete(type);
        if (type === 'music') this._stopPodVisualizer();
        this._updatePodDisplay();
    }

    _swapActivities() {
        if (this.activePods.size < 2) return;
        const entries = Array.from(this.activePods.entries());
        this.activePods = new Map([entries[1], entries[0]]);
        this._updatePodDisplay();
    }
    
    _updatePodDisplay() {
        const pod = this.ui.activityPod;
        const secondaryPod = this.ui.secondaryPod;
        const container = this.ui.topBarContainer;

        // Reset views
        pod.className = 'activity-pod';
        this.ui.podCompactView.innerHTML = '';
        this.ui.podExpandedMain.innerHTML = '';
        this.ui.podExpandedActions.innerHTML = '';
        secondaryPod.innerHTML = '';
        secondaryPod.className = 'secondary-pod';
        secondaryPod.onclick = null;

        const activeTypes = Array.from(this.activePods.keys());
        if (activeTypes.length === 0) return;

        const primaryType = activeTypes[0];
        const primaryData = this.activePods.get(primaryType);
        
        pod.classList.add(`${primaryType}-active`);
        this._renderPodContent(primaryType, primaryData);

        if (activeTypes.length > 1) {
            const secondaryType = activeTypes[1];
            const secondaryData = this.activePods.get(secondaryType);
            secondaryPod.innerHTML = `<div class="pod-icon-container">${this._getIconForType(secondaryType, secondaryData)}</div>`;
            secondaryPod.classList.add('visible');
            secondaryPod.onclick = () => this._swapActivities();
        }
    }

    _renderPodContent(type, data) {
        switch(type) {
            case 'music': this._renderMusicPod(data); break;
            case 'timer': this._renderTimerPod(data); break;
        }
    }
    
    _getIconForType(type, data) {
        if (type === 'music') return `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4V7h4V3h-6Z"/></svg>`;
        if (type === 'timer') return `<svg style="color: #ff9f0a;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 20a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm0-2a6 6 0 1 1 0-12a6 6 0 0 1 0 12Z M12 7v5h4v-2h-2V7h-2Z"/></svg>`;
        return '';
    }

    _renderMusicPod(data) {
        const { isPlaying } = data;
        
        // Compact View (Not Hovered)
        this.ui.podCompactView.innerHTML = `
            <span class="pod-compact-text">Now Playing</span>
            ${isPlaying ? '<canvas id="pod-music-visualizer"></canvas>' : this._getIconForType('music')}
        `;

        // Expanded View (Hovered)
        this.ui.podExpandedMain.className = 'music';
        this.ui.podExpandedMain.innerHTML = `
            <div class="pod-track-info">
                <div class="title">${data.title}</div>
                <div class="artist">${data.artist}</div>
            </div>
        `;
        const playPauseIcon = isPlaying 
            ? `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
            : `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`;
        this.ui.podExpandedActions.innerHTML = `
            <button class="pod-action-btn" id="pod-prev-btn" aria-label="Previous Song"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
            <button class="pod-action-btn" id="pod-play-pause-btn" aria-label="${isPlaying ? 'Pause' : 'Play'}">${playPauseIcon}</button>
            <button class="pod-action-btn" id="pod-next-btn" aria-label="Next Song"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
        `;
        
        document.getElementById('pod-prev-btn').onclick = () => this.changeMusic('previous');
        document.getElementById('pod-play-pause-btn').onclick = () => isPlaying ? this.pauseMusic() : this.playMusic(true, true);
        document.getElementById('pod-next-btn').onclick = () => this.changeMusic('next');
        
        if (isPlaying) this._startPodVisualizer('pod-music-visualizer');
        else this._stopPodVisualizer();
    }

    _renderTimerPod(data) {
        // Compact View (Not Hovered)
        this.ui.podCompactView.innerHTML = `
            ${this._getIconForType('timer')}
            <span class="pod-compact-text">Focus</span>
            <span id="pod-timer-compact" class="pod-compact-text">--:--</span>
        `;
        
        // Expanded View (Hovered)
        this.ui.podExpandedMain.className = 'timer';
        this.ui.podExpandedMain.innerHTML = `<span id="pod-timer-expanded">--:--</span>`;
        this.ui.podExpandedActions.innerHTML = `
            <button class="pod-action-btn" id="pod-stop-timer-btn" aria-label="Stop Timer"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z"/></svg></button>
        `;
        document.getElementById('pod-stop-timer-btn').onclick = () => this._stopTimer();
        this._updateTimerDisplay();
    }

    _updateTimerDisplay() {
        if (!this.activePods.has('timer')) return;
        const minutes = Math.floor(this.timerSecondsRemaining / 60);
        const seconds = this.timerSecondsRemaining % 60;
        const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const compactEl = document.getElementById('pod-timer-compact');
        if (compactEl) compactEl.textContent = timeString;
        const expandedEl = document.getElementById('pod-timer-expanded');
        if (expandedEl) expandedEl.textContent = timeString;
    }

    // MODIFIED: The _handleCommand logic has been split to handle "stop" differently from "pause"
    async deliverGreeting(){const delay=e=>new Promise(t=>setTimeout(t,e));this.ui.aiTypingIndicator&&this.ui.aiTypingIndicator.classList.remove("hidden"),await delay(1e3);const e=new Date,t=e.getHours();let i=t<12?"Good morning!":t<18?"Good afternoon!":"Good evening!";this.ui.aiTypingIndicator&&this.ui.aiTypingIndicator.classList.add("hidden"),this._addMessageToChat("ai",i),await delay(600),this._addMessageToChat("ai","Welcome to VibeOS!"),await delay(800),this._addMessageToChat("ai","What's on your mind today?")}async _handleSearchCommand(e){const t=e.toLowerCase();if(t.includes("wikipedia for")){const i=t.split("wikipedia for").pop().trim();if(!i)return!1;this._addMessageToChat("ai",`Searching Wikipedia for a summary of "${i}"...`);try{const e=`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&redirects=1&origin=*&titles=${encodeURIComponent(i)}`,t=await fetch(e),a=await t.json(),s=Object.values(a.query.pages)[0];if(s.extract){const e=s.extract.split(". ").slice(0,2).join(". ")+".",t=`https://en.wikipedia.org/wiki/${encodeURIComponent(s.title)}`,a=[{label:`Open full article for "${s.title}"`,payload:`open ${t}`}];this._addMessageToChat("ai",e,a)}else this._addMessageToChat("ai",`Sorry, I couldn't find a Wikipedia article for "${i}".`)}catch(e){this._addMessageToChat("ai","There was an error while searching Wikipedia.")}return!0}return!1}async _handleCommand(e){const t=e.toLowerCase();if(await this._handleSearchCommand(e))return!0;if(["plan a trip","trip planner","travel plan","planner"].some(e=>t.includes(e)))return this.openPlanner(),this._addMessageToChat("ai","Opening the trip planner. What adventure is on your mind?"),!0;if(["play music","play a song","start music","resume music","resume","unpause"].some(e=>t.includes(e)))return this.playMusic(),!0;if(["pause music","pause"].some(e=>t.includes(e)))return this.pauseMusic(),!0;if(["stop music","stop the music"].some(e=>t.includes(e)))return this.stopMusic(),!0;if(["next song","change the music","skip song","next music","another one"].some(e=>t.includes(e)))return this.changeMusic("next"),!0;if(["previous song","last song","go back","play the last one"].some(e=>t.includes(e)))return this.changeMusic("previous"),!0;if(["stop the timer","cancel timer","stop focus","cancel focus"].some(e=>t.includes(e)))return this._stopTimer(),!0;if(["timer","focus session","pomodoro","break"].some(i=>t.includes(i))){const i=e.match(/\d+/),a=i?parseInt(i[0],10):25,s=t.includes("break")?"break":"work";return this._startTimer(a,s),!0}if(["help","what can you do","show commands","commands"].some(e=>t.includes(e))){const e="I can do many things! Here are a few things to try:",i=[{label:"Change my wallpaper",payload:"change wallpaper"},{label:"Switch to dark mode",payload:"dark mode"},{label:"Browse apps",payload:"browse apps"}];return this._addMessageToChat("ai",e,i),!0}if(["summarize this","summarize our conversation","summarize that"].some(e=>t.startsWith(e))){this._addMessageToChat("ai","Sure, summarizing the last few messages for you...");const e=this.state.conversationHistory.slice(-6).map(e=>`${e.role}: ${e.content}`).join("\n"),i=`Based on the following conversation, please provide a concise summary in a bulleted list format. Focus on key decisions, ideas, and action items.\n\n---\n\n${e}`,a=await this._getGeminiResponse(i);return this.controls.updateNotes&&this.controls.updateNotes(a,!1),this._addMessageToChat("ai","I've added the summary to your scratchpad."),!0}for(const i of["take a note","remember that","add to my notes","note to self"])if(t.startsWith(i)){const a=e.substring(i.length).trim();if(a&&this.controls.updateNotes)return this.controls.updateNotes(a,!0),this._addMessageToChat("ai","Got it. I've added that to your scratchpad."),!0}if(["show my notes","open scratchpad","open notes"].some(e=>t.includes(e))){if(this.controls.openNotes)return this.controls.openNotes(),!0}if(["dark mode","dark theme","night mode"].some(e=>t.includes(e))){if(this.controls.setTheme)return this.controls.setTheme("dark"),this._addMessageToChat("ai","Switching to dark mode."),!0}if(["light mode","light theme","day mode"].some(e=>t.includes(e))){if(this.controls.setTheme)return this.controls.setTheme("light"),this._addMessageToChat("ai","Switching to light mode."),!0}if(["wallpaper","background","scene"].some(e=>t.includes(e))){if(this.controls.cycleWallpaper)return this._addMessageToChat("ai",this.controls.cycleWallpaper()),!0}if(["browse apps","show apps","open app store","find apps"].some(e=>t.includes(e))){if(this.controls.openAppStore)return this.controls.openAppStore(),this._addMessageToChat("ai","Here are the available apps."),!0}if(["open","launch","go to","navigate to"].some(e=>t.startsWith(e))){for(const i of this.apps)if(t.includes(i.name.toLowerCase()))return this.launchApp(i),!0}if(["add","pin","dock"].some(e=>t.includes(e))){for(const i of this.apps)if(t.includes(i.name.toLowerCase()))return this.controls.addAppToDock&&this._addMessageToChat("ai",this.controls.addAppToDock(i.id)),!0}if(["remove","unpin","undock"].some(e=>t.includes(e))){for(const i of this.apps)if(t.includes(i.name.toLowerCase()))return this.controls.removeAppFromDock&&this._addMessageToChat("ai",this.controls.removeAppFromDock(i.id)),!0}return!1}async askAI(e){if(!e)return;if(this._addMessageToChat("user",e),this.state.conversationHistory.push({role:"user",content:e}),await this._handleCommand(e))return;this.ui.aiTypingIndicator&&this.ui.aiTypingIndicator.classList.remove("hidden");try{const t=await this._getGeminiResponse(e);this._addMessageToChat("ai",t),this.state.conversationHistory.push({role:"ai",content:t})}catch(e){console.error("Error communicating with AI:",e)}finally{this.ui.aiTypingIndicator&&this.ui.aiTypingIndicator.classList.add("hidden")}}async _getGeminiResponse(e){if(!this.GEMINI_API_KEY)return this._addMessageToChat("ai","It seems the API key is missing. Please check the `js/config.js` file."),new Error("API key is missing.");const t=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.GEMINI_API_KEY}`;let i="You are a helpful AI assistant for an operating system called VibeOS.";this.state.currentWeather&&(i+=` The user's current weather is ${this.state.currentWeather.temp}°C and ${this.state.currentWeather.description}.`);const a={contents:[{role:"user",parts:[{text:i}]},{role:"model",parts:[{text:"Understood. I am VibeOS's assistant."}]},{role:"user",parts:[{text:e}]}]},s=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});if(!s.ok){const e=(await s.json().catch(()=>({error:{message:`API request failed with status ${s.status}`}}))).error.message||"An unknown API error occurred.";return this._addMessageToChat("ai",`Sorry, an error occurred: ${e}`),new Error(e)}const o=await s.json();try{return o.candidates[0].content.parts[0].text}catch(e){const t="Could not parse the AI's response.";return this._addMessageToChat("ai",`Sorry, an error occurred: ${t}`),console.error("Error parsing AI response:",o),new Error(t)}}
    _addMessageToChat(e,t,i=[]){if(!this.ui.aiMessageList)return;const a=document.createElement("div");a.className=`ai-message from-${e}`;const s=t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),o=document.createElement("div");o.className="message-bubble",o.innerHTML=s,a.appendChild(o),i.length>0&&(()=>{const e=document.createElement("div");e.className="quick-actions-container",i.forEach(t=>{const i=document.createElement("button");i.className="quick-action-btn",i.textContent=t.label,i.dataset.payload=t.payload,e.appendChild(i)}),a.appendChild(e)})(),this.ui.aiMessageList.appendChild(a);const n=this.ui.aiMessageList.closest(".ai-message-list-container");n&&(n.scrollTop=n.scrollHeight)}
}