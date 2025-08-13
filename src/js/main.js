/**
 * src/js/main.js
 * 
 * The "remote control" for the UI.
 * This file connects the HTML elements to the core OS logic in os-core.js.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. BOOT THE OS ---
    const os = new WarmwindOS();
    os.boot();

    // --- 2. SELECT INTERACTIVE ELEMENTS ---
    const browseAppsBtn = document.querySelector('.browse-apps-btn');
    const closeModalBtn = document.querySelector('.close-modal-btn'); // NEW: Find the close button
    const centralAskAvatar = document.querySelector('.central-ask-avatar');
    const askText = document.querySelector('.ask-text');
    const addBtn = document.querySelector('.add-btn');

    // --- 3. ATTACH EVENT LISTENERS ---
    
    if (browseAppsBtn) {
        browseAppsBtn.addEventListener('click', () => {
            // This correctly calls the function to show the modal
            os.launchApp('app-drawer'); 
        });
    }

    // NEW: Add an event listener for the close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            // This calls the new function to hide the modal
            os._closeAppDrawer();
        });
    }

    if (centralAskAvatar) {
        centralAskAvatar.addEventListener('click', () => {
            os.askAI("User clicked the avatar to ask something.");
        });
    }

    if (askText) {
        askText.addEventListener('click', () => {
            os.askAI("User clicked the text to ask something.");
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            os.launchApp('new-item-wizard');
        });
    }

});