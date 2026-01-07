/**
 * Chatbot Module
 * Handles AI chatbot interactions with Gemini backend
 */

const API_URL = '/api';  // Relative path works for both local (with proxy) and production

class ChatBot {
    constructor() {
        this.container = document.getElementById('youngin-chatbot');
        this.chatWindow = document.getElementById('chat-window');
        this.toggleBtn = document.getElementById('chatbot-toggle');
        this.closeBtn = document.getElementById('close-chat');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-chat-btn');
        this.messagesContainer = document.getElementById('chat-messages');

        if (!this.container) return; // Guard logic

        this.setupListeners();
    }

    setupListeners() {
        // Toggle Chat Window
        this.toggleBtn.addEventListener('click', () => {
            this.chatWindow.classList.toggle('hidden');
            if (!this.chatWindow.classList.contains('hidden')) {
                this.input.focus();
            }
        });

        // Close Chat Window
        this.closeBtn.addEventListener('click', () => {
            this.chatWindow.classList.add('hidden');
        });

        // Send Message
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    }

    setVisible(visible) {
        if (!this.container) return;
        if (visible) {
            this.container.classList.remove('hidden');
        } else {
            this.container.classList.add('hidden');
            this.chatWindow.classList.add('hidden'); // Also close window
        }
    }

    async handleSend() {
        const text = this.input.value.trim();
        if (!text) return;

        // Add User Message
        this.addMessage(text, 'user');
        this.input.value = '';

        // Show Typing Indicator (optional, or just wait)
        const loadingId = this.addLoadingIndicator();

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            this.removeMessage(loadingId);

            if (!response.ok) {
                throw new Error("Server Error");
            }

            const data = await response.json();
            if (data.reply) {
                this.addMessage(data.reply, 'bot');
            } else if (data.error) {
                this.addMessage("Error: " + data.error, 'bot');
            }

        } catch (error) {
            this.removeMessage(loadingId);
            this.addMessage("Sorry, I'm having trouble connecting to the server. Please ensure app.py is running.", 'bot');
            console.error("Chat Error:", error);
        }
    }

    addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'msg-avatar';
        avatar.textContent = sender === 'bot' ? 'AI' : 'You';

        const content = document.createElement('div');
        content.className = 'msg-content';
        content.textContent = text;

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);

        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    addLoadingIndicator() {
        const id = 'loading-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot';
        msgDiv.id = id;

        const avatar = document.createElement('div');
        avatar.className = 'msg-avatar';
        avatar.textContent = 'AI';

        const content = document.createElement('div');
        content.className = 'msg-content';
        content.textContent = '...'; // Simple typing indicator

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);

        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
        return id;
    }

    removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Export initialization function
export function initChatbot() {
    return new ChatBot();
}
