class WarmwindOS {
    constructor(apps = [], controls = {}) {
        this.GEMINI_API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
        this.apps = apps;
        this.controls = controls; // Stores all our control functions
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

    async deliverGreeting() {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        if (this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.remove('hidden');
        await delay(1000);

        const now = new Date();
        const hour = now.getHours();
        let timeGreeting = hour < 12 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!";

        if (this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.add('hidden');
        this._addMessageToChat('ai', timeGreeting);
        
        await delay(600);
        this._addMessageToChat('ai', "Welcome to VibeOS!");

        await delay(800);
        this._addMessageToChat('ai', "What's on your mind today?");
    }

    async _handleCommand(prompt) {
        const lowerCasePrompt = prompt.toLowerCase();
        
        // --- NEW Command: Help & Onboarding ---
        const helpKeywords = ['help', 'what can you do', 'show commands', 'commands'];
        if (helpKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            const helpText = "I can do many things! I can manage your workspace, find apps, and answer questions. Here are a few things to try:";
            const helpActions = [
                { label: 'Change my wallpaper', payload: 'change wallpaper' },
                { label: 'Switch to dark mode', payload: 'dark mode' },
                { label: 'Browse apps', payload: 'browse apps' }
            ];
            this._addMessageToChat('ai', helpText, helpActions);
            return true;
        }

        // --- Note-Taking Commands ---
        const summarizeKeywords = ['summarize this', 'summarize our conversation', 'summarize that'];
        if (summarizeKeywords.some(keyword => lowerCasePrompt.startsWith(keyword))) {
            this._addMessageToChat('ai', "Sure, summarizing the last few messages for you...");
            const recentHistory = this.state.conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n');
            const summaryPrompt = `Based on the following conversation, please provide a concise summary in a bulleted list format. Focus on key decisions, ideas, and action items.\n\n---\n\n${recentHistory}`;
            const summary = await this._getGeminiResponse(summaryPrompt);
            if (this.controls.updateNotes) {
                this.controls.updateNotes(summary, false);
            }
            this._addMessageToChat('ai', "I've added the summary to your scratchpad.");
            return true;
        }

        const noteKeywords = ['take a note', 'remember that', 'add to my notes', 'note to self'];
        for (const keyword of noteKeywords) {
            if (lowerCasePrompt.startsWith(keyword)) {
                const noteContent = prompt.substring(keyword.length).trim();
                if (noteContent && this.controls.updateNotes) {
                    this.controls.updateNotes(noteContent, true);
                    this._addMessageToChat('ai', "Got it. I've added that to your scratchpad.");
                    return true;
                }
            }
        }

        const openNoteKeywords = ['show my notes', 'open scratchpad', 'open notes'];
        if (openNoteKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if(this.controls.openNotes) {
                this.controls.openNotes();
                return true;
            }
        }

        // --- Other commands from previous steps ---
        const darkThemeKeywords = ['dark mode', 'dark theme', 'night mode'];
        if (darkThemeKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if (this.controls.setTheme) {
                this.controls.setTheme('dark'); this._addMessageToChat('ai', 'Switching to dark mode.'); return true;
            }
        }
        const lightThemeKeywords = ['light mode', 'light theme', 'day mode'];
        if (lightThemeKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if (this.controls.setTheme) {
                this.controls.setTheme('light'); this._addMessageToChat('ai', 'Switching to light mode.'); return true;
            }
        }
        const wallpaperKeywords = ['wallpaper', 'background', 'scene'];
        if (wallpaperKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if (this.controls.cycleWallpaper) {
                this._addMessageToChat('ai', this.controls.cycleWallpaper()); return true;
            }
        }
        const appStoreKeywords = ['browse apps', 'show apps', 'open app store', 'find apps'];
        if (appStoreKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
            if (this.controls.openAppStore) {
                this.controls.openAppStore(); this._addMessageToChat('ai', 'Here are the available apps.'); return true;
            }
        }
        
        const openKeywords = ['open', 'launch', 'go to', 'navigate to'];
        if (openKeywords.some(keyword => lowerCasePrompt.startsWith(keyword))) {
            for (const app of this.apps) { if (lowerCasePrompt.includes(app.name.toLowerCase())) { window.open(app.url, '_blank'); this._addMessageToChat('ai', `Opening ${app.name} for you...`); return true; } }
        }

        const addKeywords = ['add', 'pin', 'dock'];
        if (addKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
             for (const app of this.apps) { if (lowerCasePrompt.includes(app.name.toLowerCase())) { if (this.controls.addAppToDock) { this._addMessageToChat('ai', this.controls.addAppToDock(app.id)); } return true; } }
        }

        const removeKeywords = ['remove', 'unpin', 'undock'];
        if (removeKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
             for (const app of this.apps) { if (lowerCasePrompt.includes(app.name.toLowerCase())) { if (this.controls.removeAppFromDock) { this._addMessageToChat('ai', this.controls.removeAppFromDock(app.id)); } return true; } }
        }

        return false;
    }

    async askAI(prompt) {
        if (!prompt) return;

        this._addMessageToChat('user', prompt);
        this.state.conversationHistory.push({ role: 'user', content: prompt });

        // Await the command handler since it might need to make an API call (for summarization)
        if (await this._handleCommand(prompt)) {
            return;
        }
        
        if(this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.remove('hidden');
        
        try {
            const aiResponse = await this._getGeminiResponse(prompt);
            this._addMessageToChat('ai', aiResponse);
            this.state.conversationHistory.push({ role: 'ai', content: aiResponse });
        } catch (error) {
            console.error("Error communicating with AI:", error);
        } finally {
            if(this.ui.aiTypingIndicator) this.ui.aiTypingIndicator.classList.add('hidden');
        }
    }

    async _getGeminiResponse(prompt) {
        // ... (This function remains unchanged) ...
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
            const errorData = await response.json().catch(() => ({ error: { message: `API request failed with status ${response.status}` } }));
            const errorMessage = errorData.error.message || `An unknown API error occurred.`;
            this._addMessageToChat('ai', `Sorry, an error occurred: ${errorMessage}`);
            throw new Error(errorMessage);
        }
        const data = await response.json();
        try {
            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            const errorMessage = "Could not parse the AI's response.";
            this._addMessageToChat('ai', `Sorry, an error occurred: ${errorMessage}`);
            console.error("Error parsing AI response:", data);
            throw new Error(errorMessage);
        }
    }

    _addMessageToChat(sender, text, actions = []) {
        // ... (This function remains unchanged) ...
        if (!this.ui.aiMessageList) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message from-${sender}`;
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = formattedText;
        messageDiv.appendChild(bubble);
        if (actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'quick-actions-container';
            actions.forEach(action => {
                const actionButton = document.createElement('button');
                actionButton.className = 'quick-action-btn';
                actionButton.textContent = action.label;
                actionButton.dataset.payload = action.payload;
                actionsContainer.appendChild(actionButton);
            });
            messageDiv.appendChild(actionsContainer);
        }
        this.ui.aiMessageList.appendChild(messageDiv);
        const container = this.ui.aiMessageList.closest('.ai-message-list-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
}