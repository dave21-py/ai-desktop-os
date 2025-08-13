/**
 * src/js/os-core.js
 * 
 * The "brain" of VibeOS.
 * Manages core state and functionalities.
 */

class WarmwindOS {
    constructor() {
        console.log("VibeOS Core: Initializing...");
        
        this.state = {
            activeTheme: 'light',
            openWindows: [],
        };

        this.ui = {};
    }

    /**
     * Boots the operating system.
     */
    boot() {
        console.log("VibeOS Core: Boot sequence started.");
        this._initUI(); // Find and store key UI elements
        console.log("System is ready. Welcome to the new AI operating system!");
    }

    /**
     * Finds key UI elements and stores them for easy access.
     */
    _initUI() {
        // We only need a reference to the modal overlay, which controls the app drawer.
        this.ui.modalOverlay = document.querySelector('.modal-overlay');
    }

    /**
     * Handles launching an application or a system view.
     * @param {string} appId - The ID of the app or view to launch.
     */
    launchApp(appId) {
        console.log(`Core: Received request to launch: ${appId}`);

        if (appId === 'app-drawer') {
            this._showAppDrawer();
        } else {
            // Future logic for launching app windows will go here.
            console.log(`Placeholder for launching a window for: ${appId}`);
        }
    }
    
    /**
     * Shows the App Drawer modal window.
     */
    _showAppDrawer() {
        if (!this.ui.modalOverlay) {
            console.error("Core Error: modalOverlay element not found.");
            return;
        }

        console.log("Core: Showing App Drawer modal.");
        // We simply remove the 'hidden' class from the overlay.
        // The CSS handles the fade-in and positioning.
        this.ui.modalOverlay.classList.remove('hidden');
    }

    /**
     * NEW: Hides the App Drawer modal window.
     */
    _closeAppDrawer() {
        if (!this.ui.modalOverlay) return;

        console.log("Core: Closing App Drawer modal.");
        // We add the 'hidden' class back to the overlay.
        this.ui.modalOverlay.classList.add('hidden');
    }

    /**
     * Placeholder for AI chat functionality.
     * @param {string} query - The user's question.
     */
    askAI(query) {
        console.log(`Core: Received AI query: "${query}"`);
    }
}