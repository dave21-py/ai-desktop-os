class WarmwindOS {
    constructor(apps = []) { // EDITED: Accept the list of apps
        this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        this.apps = apps; // EDITED: Store the app list
        this.state = {
            conversationHistory: []
        };
        this.ui = {};
    }

    boot() {
        this._initUI();
        console.log("AI OS Core Booted Successfully.");
    }

    _initUI() {
        this.ui.askBar = document.querySelector('.ask-bar');
        this.ui.commandCenterOverlay = document.querySelector('.command-center-overlay');
        this.ui.commandCenterInput = document.querySelector('#command-center-input');
        this.ui.aiMessageList = document.querySelector('.ai-message-list');
        this.ui.aiTypingIndicator = document.querySelector('.ai-typing-indicator');
    }

    // --- NEW: Command Handler ---
    /**
     * Checks if the user's prompt is a local command (e.g., "open spotify").
     * @param {string} prompt - The user's input text.
     * @returns {boolean} - True if a command was handled, false otherwise.
     */
    _handleCommand(prompt) {
        const lowerCasePrompt = prompt.toLowerCase();
        const keywords = ['open', 'launch', 'go to', 'navigate to'];

        // Check if the prompt starts with one of our action keywords
        const isACommand = keywords.some(keyword => lowerCasePrompt.startsWith(keyword));

        if (isACommand) {
            for (const app of this.apps) {
                // Check if the prompt includes an app name
                if (lowerCasePrompt.includes(app.name.toLowerCase())) {
                    // Command Matched!
                    window.open(app.url, '_blank');
                    this._addMessageToChat('ai', `Opening ${app.name} for you...`);
                    return true; // Command was successfully handled
                }
            }
        }
        return false; // This was not a recognized command
    }


    async askAI(prompt) {
        if (!prompt) return;

        // Add the user's message to the screen immediately.
        this._addMessageToChat('user', prompt);

        // EDITED: Check for local commands BEFORE calling the AI.
        if (this._handleCommand(prompt)) {
            return; // Stop the function if a command was handled.
        }
        
        // If it wasn't a command, proceed with the Gemini API call.
        if(this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.remove('hidden');
        
        try {
            const aiResponse = await this._getGeminiResponse(prompt);
            this._addMessageToChat('ai', aiResponse);
        } catch (error) {
            console.error("Error communicating with AI:", error);
            this._addMessageToChat('ai', `Sorry, an error occurred: ${error.message}`);
        } finally {
            if(this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.add('hidden');
        }
    }

    async _getGeminiResponse(prompt) {
        if (!this.GEMINI_API_KEY) {
            throw new Error("API key is missing. Please check your config.js file.");
        }
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.GEMINI_API_KEY}`;
        const requestBody = { "contents": [{ "parts": [{ "text": prompt }] }] };
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `API request failed with status ${response.status}`);
        }
        const data = await response.json();
        try {
            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            console.error("Error parsing AI response:", data);
            throw new Error("Could not parse the AI's response.");
        }
    }

    _addMessageToChat(sender, text) {
        if (!this.ui.aiMessageList) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message from-${sender}`;
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        messageDiv.innerHTML = `<div class="message-bubble">${formattedText}</div>`;
        this.ui.aiMessageList.appendChild(messageDiv);
        this.ui.aiMessageList.parentElement.scrollTop = this.ui.aiMessageList.parentElement.scrollHeight;
    }
}