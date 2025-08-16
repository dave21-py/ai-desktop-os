document.addEventListener('DOMContentLoaded', () => {
    // Initialize the OS Core
    const os = new WarmwindOS();
    os.boot();

    // --- UI Element Selectors ---
    const welcomeOverlay = document.querySelector('.welcome-overlay');
    const enterOsBtn = document.querySelector('#enter-os-btn');
    const background = document.querySelector('.background-image');
    const topDock = document.querySelector('.top-dock');
    const bottomBar = document.querySelector('.bottom-bar');
    
    // Core chat elements
    const centerConsole = document.querySelector('.center-console');
    const compactInput = document.querySelector('#compact-input');
    const compactInputForm = document.querySelector('.compact-input-form');
    const chatOverlay = document.querySelector('.chat-overlay');
    const chatViewContainer = document.querySelector('.chat-view-container');

    // --- 1. Welcome Screen Logic ---
    enterOsBtn.addEventListener('click', () => {
        welcomeOverlay.classList.add('hidden');
        setTimeout(() => background.classList.add('loaded'), 100);
        setTimeout(() => topDock.classList.add('loaded'), 400);
        setTimeout(() => bottomBar.classList.add('loaded'), 600);
    });

    // --- 2. In-Place Input Logic ---
    const openCompactInput = () => {
        document.body.classList.add('compact-active');
        setTimeout(() => compactInput.focus(), 100);
    };

    const closeAllInputs = () => {
        document.body.classList.remove('compact-active');
        document.body.classList.remove('chat-active');
        compactInput.value = ''; // Clear input on close
        compactInput.style.height = 'auto'; // Reset height
    };

    // Open the input when the center console is clicked
    centerConsole.addEventListener('click', (e) => {
        // Only open if the user clicks the avatar or the ask-bar, not the active input itself
        if (!e.target.closest('.compact-input-overlay')) {
            openCompactInput();
        }
    });
    
    // Auto-resize the textarea as user types
    compactInput.addEventListener('input', () => {
        compactInput.style.height = 'auto';
        compactInput.style.height = `${compactInput.scrollHeight}px`;
    });

    // --- 3. AI Form Submission Logic ---
    const handleAISubmission = async (input) => {
        const prompt = input.value.trim();
        if (!prompt) return;

        // Reveal the chat history view
        document.body.classList.add('chat-active');
            
        // Clear the input and reset its height for the next message
        input.value = '';
        input.style.height = 'auto';
            
        // Call the AI
        await os.askAI(prompt);
    };

    compactInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAISubmission(compactInput);
    });

    // --- 4. Closing Logic ---
    // Close when clicking the background overlay
    chatOverlay.addEventListener('click', closeAllInputs);

    // Close when Escape is pressed
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllInputs();
        }
    });

    // When the input loses focus (blur) and is empty, close it
    compactInput.addEventListener('blur', () => {
        // Use a tiny delay to allow form submission to happen before closing
        setTimeout(() => {
            if (compactInput.value.trim() === '' && !document.body.classList.contains('chat-active')) {
                closeAllInputs();
            }
        }, 150);
    });
});