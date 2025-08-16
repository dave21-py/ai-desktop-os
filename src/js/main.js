document.addEventListener('DOMContentLoaded', () => {
    // Initialize the OS Core but don't show the UI yet
    const os = new WarmwindOS();
    os.boot();

    // --- UI Element Selectors ---
    const welcomeOverlay = document.querySelector('.welcome-overlay');
    const enterOsBtn = document.querySelector('#enter-os-btn');
    
    const background = document.querySelector('.background-image');
    const topDock = document.querySelector('.top-dock');
    const bottomBar = document.querySelector('.bottom-bar');

    const centerConsole = document.querySelector('.center-console');
    const commandCenterOverlay = document.querySelector('.command-center-overlay');
    const commandCenterInput = document.querySelector('#command-center-input');
    const aiInputForm = document.querySelector('.ai-input-form');

    // --- 1. Welcome Screen Logic ---
    enterOsBtn.addEventListener('click', () => {
        // Hide the welcome screen
        welcomeOverlay.classList.add('hidden');
        
        // Trigger the OS homepage animations
        setTimeout(() => background.classList.add('loaded'), 100);
        setTimeout(() => topDock.classList.add('loaded'), 400);
        setTimeout(() => bottomBar.classList.add('loaded'), 600);
    });

    // --- 2. Command Center Expansion Logic ---
    const openCommandCenter = () => {
        document.body.classList.add('command-active');
        commandCenterInput.focus();
    };

    const closeCommandCenter = () => {
        document.body.classList.remove('command-active');
    };

    // Open when the center console is clicked
    centerConsole.addEventListener('click', openCommandCenter);

    // Close when the background overlay is clicked
    commandCenterOverlay.addEventListener('click', (e) => {
        if (e.target === commandCenterOverlay) {
            closeCommandCenter();
        }
    });

    // Close when the 'Escape' key is pressed
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('command-active')) {
            closeCommandCenter();
        }
    });

    // --- 3. Auto-Expanding Textarea Logic ---
    commandCenterInput.addEventListener('input', () => {
        // Reset height to auto to get the correct scrollHeight
        commandCenterInput.style.height = 'auto';
        // Set the height to the scrollHeight to fit the content
        commandCenterInput.style.height = `${commandCenterInput.scrollHeight}px`;
    });

    // --- 4. AI Form Submission Logic ---
    aiInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = commandCenterInput.value.trim();

        if (prompt) {
            // Clear the input and reset its height
            commandCenterInput.value = '';
            commandCenterInput.style.height = 'auto';
            
            // Call the AI and let os-core handle the rest
            await os.askAI(prompt);
        }
    });
});