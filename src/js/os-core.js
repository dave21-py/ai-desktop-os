class WarmwindOS {
    constructor() {
        // The API key is loaded from the config.js file
        this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        
        // The state is now much simpler, focused only on the conversation.
        this.state = {
            conversationHistory: [] // We will use this later for multi-turn chat
        };
        
        // This will hold references to our UI elements.
        this.ui = {};
    }

    /**
     * Boots the OS. For Phase 2, this is very simple.
     */
    boot() {
        this._initUI();
        console.log("AI OS Core Booted Successfully for Phase 2.");
    }

    /**
     * Finds and stores references to the essential UI elements for the AI chat.
     */
    _initUI() {
        // We will add these elements to index.html in the next step.
        this.ui.askBar = document.querySelector('.ask-bar');
        this.ui.commandCenterOverlay = document.querySelector('.command-center-overlay');
        this.ui.commandCenterInput = document.querySelector('#command-center-input');
        this.ui.aiMessageList = document.querySelector('.ai-message-list');
        this.ui.aiTypingIndicator = document.querySelector('.ai-typing-indicator');
    }

    // --- Core AI Interaction Logic ---

    /**
     * The main public method to interact with the AI.
     * @param {string} prompt - The user's input text.
     */
    async askAI(prompt) {
        if (!prompt) return;

        // Add the user's message to the screen immediately.
        this._addMessageToChat('user', prompt);

        // Show a typing indicator to give feedback.
        if(this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.remove('hidden');
        
        try {
            // Get the response from the Gemini API.
            const aiResponse = await this._getGeminiResponse(prompt);
            this._addMessageToChat('ai', aiResponse);
        } catch (error) {
            console.error("Error communicating with AI:", error);
            this._addMessageToChat('ai', `Sorry, an error occurred: ${error.message}`);
        } finally {
            // Always hide the typing indicator when done.
            if(this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.add('hidden');
        }
    }

    /**
     * Handles the actual API call to Google Gemini.
     * @param {string} prompt - The user's input text.
     * @returns {Promise<string>} - The AI's text response.
     */
    async _getGeminiResponse(prompt) {
        if (!this.GEMINI_API_KEY) {
            throw new Error("API key is missing. Please check your config.js file.");
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.GEMINI_API_KEY}`;
        
        const requestBody = {
            // For now, we send just the current prompt.
            // Later, we can send the whole this.state.conversationHistory for context.
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        };

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
            // Extract the text content from the Gemini response.
            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            console.error("Error parsing AI response:", data);
            throw new Error("Could not parse the AI's response.");
        }
    }

    /**
     * Creates and appends a new message bubble to the chat UI.
     * @param {'user' | 'ai'} sender - Who sent the message.
     * @param {string} text - The message content.
     */
    _addMessageToChat(sender, text) {
        if (!this.ui.aiMessageList) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message from-${sender}`;
        
        // Simple markdown for bold text, can be expanded later.
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        messageDiv.innerHTML = `<div class="message-bubble">${formattedText}</div>`;
        
        this.ui.aiMessageList.appendChild(messageDiv);
        
        // Auto-scroll to the latest message.
        this.ui.aiMessageList.scrollTop = this.ui.aiMessageList.scrollHeight;
    }
}