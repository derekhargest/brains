// Initialize socket connection with error handling
let socket;
try {
    // Connect to the same host as the page
    socket = io();
    
    // Set up connection event
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        addMessage('⚠️ Connection error. Please try again later.', false);
    });
} catch (e) {
    console.error('Socket.io initialization error:', e);
    // Add a fallback message to the chat if io() fails
    setTimeout(() => {
        addMessage("⚠️ Chat service unavailable. Please try again later.", false);
    }, 1000);
}

// DOM Elements
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.createElement('div');
typingIndicator.className = 'typing-indicator';
typingIndicator.innerHTML = '<span></span><span></span><span></span>';
chatHistory.appendChild(typingIndicator);

// Chat history for context (will be sent to the server)
let chatMessages = [];

// Add memory access tracking
let memoryAccessLog = [];

function trackMemoryAccess(memoryIds) {
  memoryAccessLog.push(...memoryIds);
  if (memoryAccessLog.length > 100) memoryAccessLog.shift();
}

function getRecentMemoryAccess() {
  return [...new Set(memoryAccessLog)]; // Return unique IDs
}

// Function to add a message to the chat
function addMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    messageDiv.textContent = message;
    
    // Add timestamp
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = timestamp;
    messageDiv.appendChild(timeDiv);
    
    chatHistory.appendChild(messageDiv);
    
    // Clear any existing typing indicator by removing and re-adding it
    if (chatHistory.contains(typingIndicator)) {
        chatHistory.removeChild(typingIndicator);
    }
    chatHistory.appendChild(typingIndicator);
    
    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // Save message to history
    chatMessages.push({
        role: isUser ? 'user' : 'assistant',
        content: message,
        timestamp: new Date().toISOString()
    });
    
    // Store user messages in the AI brain
    if (isUser) {
        storeMemory(message);
    }
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'block';
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Store user messages as memories
async function storeMemory(content) {
    try {
        await fetch('/api/memories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content,
                metadata: {
                    type: "chat",
                    source: "chat-interface",
                    importance: 0.7
                }
            })
        });
    } catch (error) {
        console.error('Failed to store memory:', error);
    }
}

// Send a message
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, true);
    
    // Clear input
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to server (with error handling)
    if (socket && socket.connected) {
        socket.emit('chat message', {
            message,
            history: chatMessages.slice(-5),
            accessedMemories: getRecentMemoryAccess() // Track which memories were used
        });
    } else {
        hideTypingIndicator();
        addMessage("⚠️ Not connected to chat server. Please refresh the page.", false);
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Socket event listeners
socket.on('ai response', (response) => {
    // Hide typing indicator
    hideTypingIndicator();
    
    // Add AI response to chat
    addMessage(response, false);
});

// Add an initial greeting
setTimeout(() => {
    addMessage("Hello! I'm your Brains!!! assistant. How can I help you today?", false);
}, 1000); 