class WarmwindOS {
    constructor(apps = [], controls = {}) {
        this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        this.apps = apps;
        this.controls = controls; // Contains { addAppToDock, removeAppFromDock, openAppStore }
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
        this.ui.aiMessageList = document.querySelector('.ai-message-list');
        this.ui.aiTypingIndicator = document.querySelector('.ai-typing-indicator');
    }

    /**
     * Checks if the user's prompt is a local command.
     * @param {string} prompt - The user's input text.
     * @returns {boolean} - True if a command was handled, false otherwise.
     */
    _handleCommand(prompt) {
        const lowerCasePrompt = prompt.toLowerCase();
        
        // --- Command: Open App Store ---
        const appStoreKeywords = ['browse apps', 'show apps', 'open app store', 'find apps'];
        if (appStoreKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if (this.controls.openAppStore) {
                this.controls.openAppStore();
                this._addMessageToChat('ai', 'Here are the available apps.');
                return true;
            }
        }

        // --- Command: Open Specific App ---
        const openKeywords = ['open', 'launch', 'go to', 'navigate to'];
        if (openKeywords.some(keyword => lowerCasePrompt.startsWith(keyword))) {
            for (const app of this.apps) {
                if (lowerCasePrompt.includes(app.name.toLowerCase())) {
                    window.open(app.url, '_blank');
                    this._addMessageToChat('ai', `Opening ${app.name} for you...`);
                    return true;
                }
            }
        }

        // --- Command: Add to Dock ---
        const addKeywords = ['add', 'pin', 'dock'];
        if (addKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
             for (const app of this.apps) {
                if (lowerCasePrompt.includes(app.name.toLowerCase())) {
                    if (this.controls.addAppToDock) {
                        const message = this.controls.addAppToDock(app.id);
                        this._addMessageToChat('ai', message);
                    }
                    return true;
                }
            }
        }

        // --- Command: Remove from Dock ---
        const removeKeywords = ['remove', 'unpin', 'undock'];
        if (removeKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
             for (const app of this.apps) {
                if (lowerCasePrompt.includes(app.name.toLowerCase())) {
                    if (this.controls.removeAppFromDock) {
                        const message = this.controls.removeAppFromDock(app.id);
                        this._addMessageToChat('ai', message);
                    }
                    return true;
                }
            }
        }

        return false; // This was not a recognized command
    }

    async askAI(prompt) {
        if (!prompt) return;

        this._addMessageToChat('user', prompt);

        if (this._handleCommand(prompt)) {
            return;
        }
        
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
        
        const container = this.ui.aiMessageList.closest('.ai-message-list-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
}