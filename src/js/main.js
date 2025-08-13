/**
 * src/js/main.js
 * 
 * The "remote control" for the UI.
 * This file connects the HTML elements to the core OS logic in os-core.js.
 * It handles event listeners for user interactions.
 */

// We wrap our entire script in a DOMContentLoaded listener.
// This ensures that the HTML is fully loaded before we try to interact with it.
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. BOOT THE OS ---
    // Create an instance of our operating system from os-core.js
    const os = new WarmwindOS();
    // Run the boot sequence
    os.boot();


    // --- 2. SELECT INTERACTIVE ELEMENTS ---
    // We use document.querySelector to get a reference to our HTML elements.
    const browseAppsBtn = document.querySelector('.browse-apps-btn');
    const centralAskAvatar = document.querySelector('.central-ask-avatar');
    const askText = document.querySelector('.ask-text');
    const addBtn = document.querySelector('.add-btn');


    // --- 3. ATTACH EVENT LISTENERS ---
    // Now, we tell our elements what to do when they are clicked.
    
    if (browseAppsBtn) {
        browseAppsBtn.addEventListener('click', () => {
            // Tell the OS core to launch the app browser
            os.launchApp('app-browser'); 
        });
    }

    if (centralAskAvatar) {
        centralAskAvatar.addEventListener('click', () => {
            // Tell the OS core that the user wants to ask the AI
            os.askAI("User clicked the avatar to ask something.");
        });
    }

    if (askText) {
        askText.addEventListener('click', () => {
            // This does the same thing, providing a larger click area
            os.askAI("User clicked the text to ask something.");
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', (event) => {
            // Stop the click from doing anything else (like submitting a form if it's in one)
            event.preventDefault(); 
            // Tell the OS core to open a "new item" dialog or app
            os.launchApp('new-item-wizard');
        });
    }

});