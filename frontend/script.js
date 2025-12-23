class StudyAIChat {
    constructor() {
        this.messages = [];
        this.currentTopic = 'general';
        this.messageCount = 0;
        this.isDarkTheme = false;
        this.temperature = 0.7;
        this.maxTokens = 1000;
        this.streamingEnabled = false; // Disable streaming for now

        this.initializeElements();
        this.initializeEventListeners();
        this.loadSettings();
        this.loadHistory();
        this.updateMessageCount();
    }

    initializeElements() {
        this.elements = {
            chatMessages: document.getElementById('chatMessages'),
            userInput: document.getElementById('userInput'),
            sendBtn: document.getElementById('sendBtn'),
            typingIndicator: document.getElementById('typingIndicator'),
            themeToggle: document.getElementById('themeToggle'),
            clearChat: document.getElementById('clearChat'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            saveSettings: document.getElementById('saveSettings'),
            resetSettings: document.getElementById('resetSettings'),
            historyList: document.getElementById('historyList'),
            messageCount: document.getElementById('messageCount'),
            scrollToBottom: document.getElementById('scrollToBottom'),
            temperature: document.getElementById('temperature'),
            responseLength: document.getElementById('responseLength'),
            modelSelect: document.getElementById('modelSelect'),
            streaming: document.getElementById('streaming'),
            tempValue: document.getElementById('tempValue'),
            lengthValue: document.getElementById('lengthValue')
        };
    }

    initializeEventListeners() {
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.elements.userInput.addEventListener('input', this.autoResizeTextarea);

        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.clearChat.addEventListener('click', () => this.clearChat());
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        this.elements.settingsModal.querySelector('.close-modal').addEventListener('click', () => this.hideSettings());
        this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
        this.elements.resetSettings.addEventListener('click', () => this.resetSettings());

        document.querySelectorAll('.quick-question').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.target.dataset.question;
                this.elements.userInput.value = question;
                this.sendMessage();
            });
        });

        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.topic-btn').classList.add('active');
                this.currentTopic = e.target.closest('.topic-btn').dataset.topic;
                this.addSystemMessage(`Switched to ${this.getTopicName()} mode. How can I help you with ${this.getTopicName().toLowerCase()}?`);
            });
        });

        this.elements.temperature.addEventListener('input', (e) => {
            this.elements.tempValue.textContent = e.target.value;
        });

        this.elements.responseLength.addEventListener('input', (e) => {
            this.elements.lengthValue.textContent = `${e.target.value} tokens`;
        });

        this.elements.scrollToBottom.addEventListener('click', () => this.scrollToBottom());

        this.elements.chatMessages.addEventListener('scroll', () => this.handleScroll());

        document.querySelector('.voice-btn').addEventListener('click', () => {
            this.showToast('Voice input coming soon!', 'info');
        });
    }

    autoResizeTextarea() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    }

    async sendMessage() {
        const message = this.elements.userInput.value.trim();
        if (!message) return;

        this.elements.userInput.disabled = true;
        this.elements.sendBtn.disabled = true;

        this.addUserMessage(message);
        this.elements.userInput.value = '';
        this.autoResizeTextarea.call(this.elements.userInput);

        this.showTypingIndicator();

        try {
            await this.fetchResponse(message);
            this.saveToHistory(message);
            this.updateMessageCount();
        } catch (error) {
            console.error('Error:', error);
            this.addErrorMessage('Sorry, I encountered an error. Please try again.');
        } finally {
            this.hideTypingIndicator();
            this.elements.userInput.disabled = false;
            this.elements.sendBtn.disabled = false;
            this.elements.userInput.focus();
            this.scrollToBottom();
        }
    }

    async fetchResponse(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                topic: this.currentTopic,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.reply || "Sorry, I couldn't process your request.";
        this.addBotMessage(reply);
    }

    addUserMessage(message) {
        const messageElement = this.createMessageElement('user', message);
        this.elements.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    addBotMessage(message) {
        const messageElement = this.createMessageElement('bot', message);
        this.elements.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    addSystemMessage(message) {
        const messageElement = this.createMessageElement('system', message);
        this.elements.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    addErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${message}</span>`;
        this.elements.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
    }

    createMessageElement(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const avatar = type === 'user' ? '<i class="fas fa-user"></i>' :
            type === 'system' ? '<i class="fas fa-info-circle"></i>' :
            '<i class="fas fa-robot"></i>';

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                <div class="message-time"><i class="far fa-clock"></i> ${time}</div>
            </div>
        `;
        return messageDiv;
    }

    formatMessage(content) {
        let formatted = content
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const language = lang || 'text';
                return `
                    <div class="code-block">
                        <div class="code-header">
                            <span class="code-language">${language}</span>
                            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.parentElement.querySelector('pre').textContent)">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <pre><code>${this.escapeHtml(code.trim())}</code></pre>
                    </div>
                `;
            })
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() { this.elements.typingIndicator.classList.add('active'); }
    hideTypingIndicator() { this.elements.typingIndicator.classList.remove('active'); }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.documentElement.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
        localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
        const icon = this.elements.themeToggle.querySelector('i');
        icon.className = this.isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
        this.showToast(`Switched to ${this.isDarkTheme ? 'dark' : 'light'} theme`, 'success');
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat?')) {
            this.elements.chatMessages.innerHTML = '';
            this.messageCount = 0;
            this.updateMessageCount();
            this.showToast('Chat cleared', 'success');
        }
    }

    showSettings() { this.elements.settingsModal.classList.add('active'); }
    hideSettings() { this.elements.settingsModal.classList.remove('active'); }

    saveSettings() {
        this.temperature = parseFloat(this.elements.temperature.value);
        this.maxTokens = parseInt(this.elements.responseLength.value);
        this.streamingEnabled = this.elements.streaming.checked;
        const settings = {
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            streaming: this.streamingEnabled,
            model: this.elements.modelSelect.value
        };
        localStorage.setItem('studyai-settings', JSON.stringify(settings));
        this.hideSettings();
        this.showToast('Settings saved successfully', 'success');
    }

    resetSettings() {
        this.elements.temperature.value = 0.7;
        this.elements.responseLength.value = 1000;
        this.elements.streaming.checked = false;
        this.elements.modelSelect.value = 'llama3.1-8b';
        this.elements.tempValue.textContent = '0.7';
        this.elements.lengthValue.textContent = '1000 tokens';
        this.showToast('Settings reset to defaults', 'info');
    }

    loadSettings() {
        const saved = localStorage.getItem('studyai-settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.temperature = settings.temperature || 0.7;
                this.maxTokens = settings.maxTokens || 1000;
                this.streamingEnabled = settings.streaming || false;
                this.elements.temperature.value = this.temperature;
                this.elements.responseLength.value = this.maxTokens;
                this.elements.streaming.checked = this.streamingEnabled;
                this.elements.modelSelect.value = settings.model || 'llama3.1-8b';
                this.elements.tempValue.textContent = this.temperature;
                this.elements.lengthValue.textContent = `${this.maxTokens} tokens`;
            } catch (e) { console.error('Error loading settings:', e); }
        }

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.isDarkTheme = savedTheme === 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
            const icon = this.elements.themeToggle.querySelector('i');
            icon.className = this.isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    saveToHistory(message) {
        const history = JSON.parse(localStorage.getItem('studyai-history') || '[]');
        const historyItem = { id: Date.now(), message: message.substring(0, 100), time: new Date().toLocaleString(), topic: this.currentTopic };
        history.unshift(historyItem);
        if (history.length > 50) history.pop();
        localStorage.setItem('studyai-history', JSON.stringify(history));
        this.loadHistory();
    }

    loadHistory() {
        const history = JSON.parse(localStorage.getItem('studyai-history') || '[]');
        this.elements.historyList.innerHTML = '';
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `<div class="history-title">${this.escapeHtml(item.message)}</div><div class="history-time">${item.time}</div>`;
            div.addEventListener('click', () => this.loadHistoryItem(item));
            this.elements.historyList.appendChild(div);
        });
    }

    loadHistoryItem(item) { this.addSystemMessage(`Loading conversation from ${item.time}...`); }
    updateMessageCount() { this.elements.messageCount.textContent = this.elements.chatMessages.querySelectorAll('.message').length - 1; }
    getTopicName() {
        const topics = { 'general': 'General', 'programming': 'Programming', 'math': 'Mathematics', 'science': 'Science', 'debug': 'Debugging', 'study-tips': 'Study Tips', 'interview': 'Interview Prep' };
        return topics[this.currentTopic] || 'General';
    }
    scrollToBottom() { this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight; this.elements.scrollToBottom.classList.remove('visible'); }
    handleScroll() {
        const messages = this.elements.chatMessages;
        const isAtBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight < 100;
        this.elements.scrollToBottom.classList.toggle('visible', !isAtBottom);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':type==='error'?'exclamation-circle':'info-circle'}"></i><span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.chat = new StudyAIChat(); });
