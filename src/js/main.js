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

    // NEW: Compact input elements
    const compactInputOverlay = document.querySelector('.compact-input-overlay');
    const compactInput = document.querySelector('#compact-input');
    const compactInputForm = document.querySelector('.compact-input-form');

    // --- 1. Welcome Screen Logic ---
    enterOsBtn.addEventListener('click', () => {
        // Hide the welcome screen
        welcomeOverlay.classList.add('hidden');
        // Trigger the OS homepage animations
        setTimeout(() => background.classList.add('loaded'), 100);
        setTimeout(() => topDock.classList.add('loaded'), 400);
        setTimeout(() => bottomBar.classList.add('loaded'), 600);
    });

    // --- 2. Progressive Command Center Logic ---
    const openCompactInput = () => {
        document.body.classList.add('compact-active');
        // Add a small delay to ensure the element is visible before focusing
        setTimeout(() => {
            compactInput.focus();
            compactInput.select(); // This ensures immediate typing capability
        }, 100);
    };

    const expandToFullChat = () => {
        document.body.classList.remove('compact-active');
        document.body.classList.add('command-active');
        commandCenterInput.focus();
    };

    const closeAllInputs = () => {
        document.body.classList.remove('compact-active');
        document.body.classList.remove('command-active');
    };

    // Open compact input when center console is clicked
    centerConsole.addEventListener('click', openCompactInput);

    // Expand to full chat when user starts typing more (after content gets longer)
    compactInput.addEventListener('input', () => {
        // Auto-resize the compact textarea
        compactInput.style.height = 'auto';
        const newHeight = Math.min(compactInput.scrollHeight, 80);
        compactInput.style.height = `${newHeight}px`;
        
        // If content gets too long, expand to full chat
        if (compactInput.scrollHeight > 60) {
            const content = compactInput.value;
            expandToFullChat();
            // Transfer content to full input
            setTimeout(() => {
                commandCenterInput.value = content;
                commandCenterInput.style.height = 'auto';
                commandCenterInput.style.height = `${commandCenterInput.scrollHeight}px`;
                commandCenterInput.focus();
                // Set cursor to end
                commandCenterInput.setSelectionRange(commandCenterInput.value.length, commandCenterInput.value.length);
            }, 200);
        }
    });

    // Also expand when Enter is pressed with Shift (new line)
    compactInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            const content = compactInput.value;
            expandToFullChat();
            setTimeout(() => {
                commandCenterInput.value = content + '\n';
                commandCenterInput.style.height = 'auto';
                commandCenterInput.style.height = `${commandCenterInput.scrollHeight}px`;
                commandCenterInput.focus();
                commandCenterInput.setSelectionRange(commandCenterInput.value.length, commandCenterInput.value.length);
            }, 200);
        }
    });

    // Close when clicking outside
    compactInputOverlay.addEventListener('click', (e) => {
        if (e.target === compactInputOverlay) {
            closeAllInputs();
        }
    });

    commandCenterOverlay.addEventListener('click', (e) => {
        if (e.target === commandCenterOverlay) {
            closeAllInputs();
        }
    });

    // Close when Escape is pressed
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.body.classList.contains('command-active') || 
                document.body.classList.contains('compact-active')) {
                closeAllInputs();
            }
        }
    });

    // --- 3. Auto-Expanding Textarea Logic (for both inputs) ---
    const setupAutoExpand = (textarea) => {
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        });
    };

    setupAutoExpand(commandCenterInput);
    // Note: compactInput auto-expand is handled above with expansion logic

    // --- 4. AI Form Submission Logic (for both forms) ---
    const handleAISubmission = async (input) => {
        const prompt = input.value.trim();
        if (prompt) {
            // Clear the input and reset its height
            input.value = '';
            input.style.height = 'auto';
            
            // Ensure we're in full chat mode for the conversation
            if (!document.body.classList.contains('command-active')) {
                expandToFullChat();
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            // Call the AI
            await os.askAI(prompt);
        }
    };

    // Handle submissions from both forms
    aiInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAISubmission(commandCenterInput);
    });

    compactInputForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAISubmission(compactInput);
    });

    // --- 5. Enhanced UX: Auto-focus management ---
    // When compact input loses focus and is empty, close it
    compactInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (compactInput.value.trim() === '' && document.body.classList.contains('compact-active')) {
                closeAllInputs();
            }
        }, 150); // Small delay to prevent immediate closing during form submission
    });

    // Prevent closing when clicking inside the compact input
    compactInputOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Prevent closing when clicking inside the command center
    document.querySelector('.command-center').addEventListener('click', (e) => {
        e.stopPropagation();
    });
});