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

        this.features = [
            {
                name: "Center Stage Tiling",
                description: "Open multiple apps to see them auto-arrange.",
                action: 'windowTilingDemo',
                layout: 'module-center-stage',
            },
            {
                name: "AI Trip Planner",
                description: "Generate custom itineraries instantly.",
                action: 'startPlannerConversation',
                layout: 'module-ai-planner',
            },
            {
                name: "Dynamic Island",
                description: "Live activities for music and timers.",
                action: 'playMusic',
                layout: 'module-dynamic-island',
                extraHTML: `<div class="visualizer">
                                <div class="visualizer-bar"></div><div class="visualizer-bar"></div>
                                <div class="visualizer-bar"></div><div class="visualizer-bar"></div>
                                <div class="visualizer-bar"></div><div class="visualizer-bar"></div>
                                <div class="visualizer-bar"></div><div class="visualizer-bar"></div>
                            </div>`
            },
            {
                name: "App Store",
                description: "Discover and dock new apps.",
                action: 'openAppStore',
                layout: 'module-app-store',
                extraHTML: `<div class="app-grid">
                                <div class="mini-app"><img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg" /> Amazon</div>
                                <div class="mini-app"><img src="https://upload.wikimedia.org/wikipedia/commons/6/6d/2019_InstructureLogoHorizontal_Color.svg" /> Canvas</div>
                                <div class="mini-app"><img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" /> ChatGPT</div>
                                <div class="mini-app"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" /> Chrome</div>
                            </div>`
            },
            {
                name: "VibeOS",
                action: 'showInfo',
                layout: 'module-vibeos',
                extraHTML: `<h1 class="vibeos-logo">VibeOS</h1>`
            },
            {
                name: "Focus Timer",
                action: 'startTimerDemo',
                layout: 'module-focus-timer module-utility',
                extraHTML: `<div class="utility-icon"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 20a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm0-2a6 6 0 1 1 0-12a6 6 0 0 1 0 12Z M12 7v5h4v-2h-2V7h-2Z"/></svg></div>`
            },
            {
                name: "Toggle Theme",
                action: 'toggleThemeDemo',
                layout: 'module-toggle-theme module-utility',
                extraHTML: `<div class="utility-icon"><div class="theme-icon-indicator"></div></div>`
            },
            {
                name: "Ask AI",
                action: 'askAIDemo', // This new action will just close the grid
                layout: 'module-ask-ai module-utility',
                extraHTML: `<div class="utility-icon"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.6l2.35 2.35L12 7.3l-2.35-2.35L12 2.6m5.05 5.05L19.4 5.3L17.05 3L14.7 5.35l2.35 2.3m-10.1 0L4.6 5.35L2.25 3L4.6 5.3l2.35 2.35M12 9.4l2.35 2.35L12 14.1l-2.35-2.35L12 9.4m5.05 5.05L19.4 12L17.05 9.65L14.7 12l2.35 2.35m-10.1 0L4.6 12.05L2.25 9.7L4.6 12l2.35 2.35M12 16.2l2.35 2.35L12 20.9l-2.35-2.35L12 16.2m5.05 5.05L19.4 18.9L17.05 16.6L14.7 18.95l2.35 2.3Z"/></svg></div>`
            },
        ];
        
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
        this._populateFeaturesGrid();
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

        const win = document.createElement('div');
        win.className = 'app-window';
        win.dataset.appId = app.id;
        win.style.zIndex = this.zIndexCounter;

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

        this.ui.appWindowContainer.appendChild(win);
        
        setTimeout(() => {
            win.classList.add('open');
            setTimeout(() => {
                win.style.transformOrigin = 'center';
            }, 400);
        }, 10);

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

    _tileWindows() {
        const container = this.ui.appWindowContainer;
        const visibleWindows = Array.from(container.querySelectorAll('.app-window:not(.minimized)'));
        const PADDING = 20;
        const CENTER_WIDTH_RATIO = 0.65;
        const SIDE_WIDTH_RATIO = 0.6;
        const SIDE_PEEK_AMOUNT = 120;
        const SIDE_STACK_OFFSET = 15;

        if (visibleWindows.length === 0) return;

        if (visibleWindows.length === 1) {
            const win = visibleWindows[0];
            win.style.left = `${PADDING}px`;
            win.style.top = `${PADDING}px`;
            win.style.width = `calc(100% - ${2 * PADDING}px)`;
            win.style.height = `calc(100% - ${2 * PADDING}px)`;
            win.style.transform = 'none';
            return;
        }

        let primary = visibleWindows.find(win => win.classList.contains('active'));
        if (!primary) {
            primary = visibleWindows[visibleWindows.length - 1];
            primary.classList.add('active');
        }

        const inactiveWindows = visibleWindows.filter(win => win !== primary);
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        const primaryWidth = containerWidth * CENTER_WIDTH_RATIO;
        primary.style.width = `${primaryWidth}px`;
        primary.style.height = `calc(100% - ${2 * PADDING}px)`;
        primary.style.left = `${(containerWidth - primaryWidth) / 2}px`;
        primary.style.top = `${PADDING}px`;
        primary.style.transform = 'scale(1)';

        inactiveWindows.forEach((win, index) => {
            const sideWidth = containerWidth * SIDE_WIDTH_RATIO;
            win.style.width = `${sideWidth}px`;
            win.style.height = `calc(100% - ${2 * PADDING}px)`;
            win.style.top = `${PADDING}px`;
            win.style.left = `${containerWidth - SIDE_PEEK_AMOUNT}px`;
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
        
        this.ui.featureGridOverlay = document.getElementById('feature-grid-overlay');
        this.ui.featureGridContainer = document.getElementById('feature-grid-container');
        this.ui.closeFeatureGridBtn = document.getElementById('close-feature-grid-btn');

        if (this.ui.closeFeatureGridBtn) {
            this.ui.closeFeatureGridBtn.addEventListener('click', () => this._hideFeaturesGrid());
        }
        if (this.ui.featureGridContainer) {
            this.ui.featureGridContainer.addEventListener('click', (e) => this._handleFeatureCardClick(e));
        }
    }

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
    
    stopMusic() {
        const isPlaying = this.ui.audioPlayer && !this.ui.audioPlayer.paused;
        if (!isPlaying && !this.activePods.has('music')) return;

        this.ui.audioPlayer.pause();
        this.ui.audioPlayer.currentTime = 0;
        this._removeActivity('music');
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
    
    startPlannerConversation() {
        this.openPlanner();
        const message = "The AI Trip Planner is ready. To get started, just tell me where you'd like to go and for how long (e.g., 'a 5-day trip to Paris').";
        this._addMessageToChat('ai', message);
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
    
    _addActivity(type, data) {
        if(this.activePods.has(type)) this.activePods.delete(type);
        const newPods = new Map([[type, data], ...this.activePods]);
        this.activePods = new Map(Array.from(newPods).slice(0, 2));
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
        
        this.ui.podCompactView.innerHTML = `
            <span class="pod-compact-text">Now Playing</span>
            ${isPlaying ? '<canvas id="pod-music-visualizer"></canvas>' : this._getIconForType('music')}
        `;

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
        this.ui.podCompactView.innerHTML = `
            ${this._getIconForType('timer')}
            <span class="pod-compact-text">Focus</span>
            <span id="pod-timer-compact" class="pod-compact-text">--:--</span>
        `;
        
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

    async deliverGreeting() {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        if (this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.remove("hidden");
        await delay(1000);
        const now = new Date();
        const hours = now.getHours();
        let greeting = hours < 12 ? "Good morning!" : hours < 18 ? "Good afternoon!" : "Good evening!";
        if (this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.add("hidden");
        this._addMessageToChat("ai", greeting);
        await delay(600);
        this._addMessageToChat("ai", "Welcome to VibeOS!");
        await delay(800);
        this._addMessageToChat("ai", "What's on your mind today?");
    }

    async _handleSearchCommand(prompt) {
        const lowerCasePrompt = prompt.toLowerCase();
        if (lowerCasePrompt.includes("wikipedia for")) {
            const topic = lowerCasePrompt.split("wikipedia for").pop().trim();
            if (!topic) return false;
            this._addMessageToChat("ai", `Searching Wikipedia for a summary of "${topic}"...`);
            try {
                const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&redirects=1&origin=*&titles=${encodeURIComponent(topic)}`;
                const response = await fetch(url);
                const data = await response.json();
                const page = Object.values(data.query.pages)[0];
                if (page.extract) {
                    const summary = page.extract.split(". ").slice(0, 2).join(". ") + ".";
                    const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`;
                    const actions = [{
                        label: `Open full article for "${page.title}"`,
                        payload: `open ${articleUrl}`
                    }];
                    this._addMessageToChat("ai", summary, actions);
                } else {
                    this._addMessageToChat("ai", `Sorry, I couldn't find a Wikipedia article for "${topic}".`);
                }
            } catch (error) {
                this._addMessageToChat("ai", "There was an error while searching Wikipedia.");
            }
            return true;
        }
        return false;
    }

    async _handleCommand(prompt) {
        const t = prompt.toLowerCase();
        if (await this._handleSearchCommand(prompt)) return true;
        if (["plan a trip", "trip planner", "travel plan", "planner"].some(e => t.includes(e))) {
            this.openPlanner();
            this.generateTripPlan(prompt);
            return true;
        }
        if (["play music", "play a song", "start music", "resume music", "resume", "unpause"].some(e => t.includes(e))) return this.playMusic(), true;
        if (["pause music", "pause"].some(e => t.includes(e))) return this.pauseMusic(), true;
        if (["stop music", "stop the music"].some(e => t.includes(e))) return this.stopMusic(), true;
        if (["next song", "change the music", "skip song", "next music", "another one"].some(e => t.includes(e))) return this.changeMusic("next"), true;
        if (["previous song", "last song", "go back", "play the last one"].some(e => t.includes(e))) return this.changeMusic("previous"), true;
        if (["stop the timer", "cancel timer", "stop focus", "cancel focus"].some(e => t.includes(e))) return this._stopTimer(), true;
        if (["timer", "focus session", "pomodoro", "break"].some(i => t.includes(i))) {
            const i = prompt.match(/\d+/);
            const a = i ? parseInt(i[0], 10) : 25;
            const s = t.includes("break") ? "break" : "work";
            return this._startTimer(a, s), true;
        }

        if (["help", "what can you do", "show features", "features", "commands"].some(term => t.includes(term))) {
            this._showFeaturesGrid();
            return true;
        }

        if (["summarize this", "summarize our conversation", "summarize that"].some(e => t.startsWith(e))) {
            this._addMessageToChat("ai", "Sure, summarizing the last few messages for you...");
            const e = this.state.conversationHistory.slice(-6).map(e => `${e.role}: ${e.content}`).join("\n");
            const i = `Based on the following conversation, please provide a concise summary in a bulleted list format. Focus on key decisions, ideas, and action items.\n\n---\n\n${e}`;
            const a = await this._getGeminiResponse(i);
            return this.controls.updateNotes && this.controls.updateNotes(a, false), this._addMessageToChat("ai", "I've added the summary to your scratchpad."), true;
        }
        for (const i of ["take a note", "remember that", "add to my notes", "note to self"])
            if (t.startsWith(i)) {
                const a = prompt.substring(i.length).trim();
                if (a && this.controls.updateNotes) return this.controls.updateNotes(a, true), this._addMessageToChat("ai", "Got it. I've added that to your scratchpad."), true;
            }
        if (["show my notes", "open scratchpad", "open notes"].some(e => t.includes(e))) {
            if (this.controls.openNotes) return this.controls.openNotes(), true;
        }
        if (["dark mode", "dark theme", "night mode"].some(e => t.includes(e))) {
            if (this.controls.setTheme) return this.controls.setTheme("dark"), this._addMessageToChat("ai", "Switching to dark mode."), true;
        }
        if (["light mode", "light theme", "day mode"].some(e => t.includes(e))) {
            if (this.controls.setTheme) return this.controls.setTheme("light"), this._addMessageToChat("ai", "Switching to light mode."), true;
        }
        if (["wallpaper", "background", "scene"].some(e => t.includes(e))) {
            if (this.controls.cycleWallpaper) return this._addMessageToChat("ai", this.controls.cycleWallpaper()), true;
        }
        if (["browse apps", "show apps", "open app store", "find apps"].some(e => t.includes(e))) {
            if (this.controls.openAppStore) return this.controls.openAppStore(), this._addMessageToChat("ai", "Here are the available apps."), true;
        }
        if (["open", "launch", "go to", "navigate to"].some(e => t.startsWith(e))) {
            for (const i of this.apps)
                if (t.includes(i.name.toLowerCase())) return this.launchApp(i), true;
        }
        if (["add", "pin", "dock"].some(e => t.includes(e))) {
            for (const i of this.apps)
                if (t.includes(i.name.toLowerCase())) return this.controls.addAppToDock && this._addMessageToChat("ai", this.controls.addAppToDock(i.id)), true;
        }
        if (["remove", "unpin", "undock"].some(e => t.includes(e))) {
            for (const i of this.apps)
                if (t.includes(i.name.toLowerCase())) return this.controls.removeAppFromDock && this._addMessageToChat("ai", this.controls.removeAppFromDock(i.id)), true;
        }
        return false;
    }

    async askAI(e) {
        if (!e) return;
        if (this._addMessageToChat("user", e), this.state.conversationHistory.push({
                role: "user",
                content: e
            }), await this._handleCommand(e)) return;
        this.ui.aiTypingIndicator && this.ui.aiTypingIndicator.classList.remove("hidden");
        try {
            const t = await this._getGeminiResponse(e);
            this._addMessageToChat("ai", t), this.state.conversationHistory.push({
                role: "ai",
                content: t
            });
        } catch (e) {
            console.error("Error communicating with AI:", e);
        } finally {
            this.ui.aiTypingIndicator && this.ui.aiTypingIndicator.classList.add("hidden");
        }
    }

    async _getGeminiResponse(e) {
        if (!this.GEMINI_API_KEY) return this._addMessageToChat("ai", "It seems the API key is missing. Please check the `js/config.js` file."), new Error("API key is missing.");
        const t = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.GEMINI_API_KEY}`;
        let i = "You are a helpful AI assistant for an operating system called VibeOS.";
        this.state.currentWeather && (i += ` The user's current weather is ${this.state.currentWeather.temp}°C and ${this.state.currentWeather.description}.`);
        const a = {
            contents: [{
                role: "user",
                parts: [{
                    text: i
                }]
            }, {
                role: "model",
                parts: [{
                    text: "Understood. I am VibeOS's assistant."
                }]
            }, {
                role: "user",
                parts: [{
                    text: e
                }]
            }]
        };
        const s = await fetch(t, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(a)
        });
        if (!s.ok) {
            const e = (await s.json().catch(() => ({
                error: {
                    message: `API request failed with status ${s.status}`
                }
            }))).error.message || "An unknown API error occurred.";
            return this._addMessageToChat("ai", `Sorry, an error occurred: ${e}`), new Error(e);
        }
        const o = await s.json();
        try {
            return o.candidates[0].content.parts[0].text;
        } catch (e) {
            const t = "Could not parse the AI's response.";
            return this._addMessageToChat("ai", `Sorry, an error occurred: ${t}`), console.error("Error parsing AI response:", o), new Error(t);
        }
    }
    
    _addMessageToChat(e,t,i=[]){if(!this.ui.aiMessageList)return;const a=document.createElement("div");a.className=`ai-message from-${e}`;const s=t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),o=document.createElement("div");o.className="message-bubble",o.innerHTML=s,a.appendChild(o),i.length>0&&(()=>{const e=document.createElement("div");e.className="quick-actions-container",i.forEach(t=>{const i=document.createElement("button");i.className="quick-action-btn",i.textContent=t.label,i.dataset.payload=t.payload,e.appendChild(i)}),a.appendChild(e)})(),this.ui.aiMessageList.appendChild(a);const n=this.ui.aiMessageList.closest(".ai-message-list-container");n&&(n.scrollTop=n.scrollHeight)}

    _populateFeaturesGrid() {
        if (!this.ui.featureGridContainer) return;
        this.ui.featureGridContainer.innerHTML = '';
    
        this.features.forEach((feature, index) => {
            const module = document.createElement('div');
            module.className = `feature-module ${feature.layout}`;
            module.dataset.action = feature.action;
            module.style.animationDelay = `${index * 50}ms`;
    
            // Don't add description to utility modules or the VibeOS logo
            const hasContent = feature.name !== 'VibeOS' && !module.classList.contains('module-utility');
            
            module.innerHTML = `
                ${feature.extraHTML || ''}
                ${hasContent ? `
                <div class="module-content">
                    <h3>${feature.name}</h3>
                    <p>${feature.description}</p>
                </div>
                ` : ''}
                ${module.classList.contains('module-utility') ? `<h3>${feature.name}</h3>` : ''}
            `;
            
            this.ui.featureGridContainer.appendChild(module);
        });
    }

    _showFeaturesGrid() {
        if (!this.ui.featureGridOverlay) return;
        this.ui.featureGridOverlay.classList.remove('hidden');
        this.ui.featureGridOverlay.classList.add('visible');
    }

    _hideFeaturesGrid() {
        if (!this.ui.featureGridOverlay) return;
        this.ui.featureGridOverlay.classList.remove('visible');
    }

    _handleFeatureCardClick(e) {
        const card = e.target.closest('.feature-module');
        if (!card) return;
    
        const action = card.dataset.action;
        
        if (action === 'showInfo') return; // Do nothing for VibeOS card
    
        const actionMap = {
            'playMusic': () => this.playMusic(),
            'cycleWallpaper': () => this._addMessageToChat('ai', this.controls.cycleWallpaper()),
            'openAppStore': () => this.controls.openAppStore(),
            'startPlannerConversation': () => this.startPlannerConversation(),
            'toggleThemeDemo': () => {
                const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                this.controls.setTheme(newTheme);
            },
            'startTimerDemo': () => this._startTimer(1, 'work'),
            'windowTilingDemo': () => {
                this._hideFeaturesGrid(); // Close grid first for this one
                setTimeout(() => {
                    const spotifyApp = this.apps.find(app => app.id === 'spotify');
                    const youtubeApp = this.apps.find(app => app.id === 'mytube_clone');
                    if (spotifyApp) this.launchApp(spotifyApp);
                    if (youtubeApp) this.launchApp(youtubeApp);
                }, 300); // Small delay for animation
                return; // Use return to avoid double-hiding
            },
            'askAIDemo': () => {
                // This just closes the grid and focuses the input
                this._hideFeaturesGrid();
                document.querySelector('.center-console')?.click();
                return;
            }
        };
    
        if (actionMap[action]) {
            actionMap[action]();
            this._hideFeaturesGrid(); 
        }
    }

    openPlanner() {
        if (!this.ui.plannerWindow) return;
        this.ui.plannerWindow.classList.add('visible');
    }

    closePlanner() {
        if (!this.ui.plannerWindow) return;
        this.ui.plannerWindow.classList.remove('visible');
    }

    async generateTripPlan(prompt) {
        if (!this.ui.plannerLoadingView || !this.ui.plannerResultsView) return;

        this.ui.plannerInitialView.classList.add('hidden');
        this.ui.plannerResultsView.classList.add('hidden');
        this.ui.plannerLoadingView.classList.remove('hidden');

        const fullPrompt = `Generate a travel itinerary based on this request: "${prompt}". 
        Format the response as a simple, unstyled HTML structure. 
        Create a main container div with the class "planner-results-state".
        Inside it, for each day, create a div with the class "day-column".
        Inside each day-column, create a header div with the class "day-header" containing an h4 tag like "<h4>Day 1: Arrival</h4>".
        After the header, list activities. For each activity, create a div with the class "activity-card".
        Inside each activity-card, use an h5 for the time/title (e.g., "<h5>Morning: Explore the Old Town</h5>") and a p tag for the description.
        Do not include any CSS, <style> tags, or any HTML elements other than the ones specified (div, h4, h5, p).`;

        try {
            const response = await this._getGeminiResponse(fullPrompt);
            this.ui.plannerResultsView.innerHTML = response;
            this.ui.plannerLoadingView.classList.add('hidden');
            this.ui.plannerResultsView.classList.remove('hidden');
        } catch (error) {
            this.ui.plannerLoadingView.classList.add('hidden');
            this.ui.plannerInitialView.classList.remove('hidden');
            this._addMessageToChat('ai', "Sorry, I couldn't generate the trip plan right now.");
        }
    }
}