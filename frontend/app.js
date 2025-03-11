// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const healthCheckBtn = document.getElementById('healthCheckBtn');
const extractMemoriesBtn = document.getElementById('extractMemoriesBtn');
const apiResponse = document.getElementById('apiResponse');
const searchMemoriesBtn = document.getElementById('searchMemoriesBtn');
const searchContainer = document.getElementById('searchContainer');
const searchQuery = document.getElementById('searchQuery');
const performSearchBtn = document.getElementById('performSearchBtn');
const refreshStatsBtn = document.getElementById('refreshStatsBtn');

// Stats Elements
const totalMemories = document.getElementById('totalMemories');
const storageMode = document.getElementById('storageMode');
const oldestMemory = document.getElementById('oldestMemory');
const newestMemory = document.getElementById('newestMemory');
const sourceStats = document.getElementById('sourceStats');
const typeStats = document.getElementById('typeStats');
const importanceStats = document.getElementById('importanceStats');
const recentMemories = document.getElementById('recentMemories');

// Backend API URL - adjust if needed
const API_URL = 'http://localhost:3002/api';

// Event Listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
healthCheckBtn.addEventListener('click', checkHealth);
extractMemoriesBtn.addEventListener('click', extractMemories);
searchMemoriesBtn.addEventListener('click', toggleSearchContainer);
performSearchBtn.addEventListener('click', performSearch);
refreshStatsBtn.addEventListener('click', fetchAndDisplayStats);

// Functions
function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;
  
  // Add user message to chat
  addMessageToChat('user', message);
  
  // Clear input
  userInput.value = '';
  
  // Send to backend
  fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  })
  .then(response => response.json())
  .then(data => {
    // Add response to chat
    addMessageToChat('system', data.response || 'No response from server');
  })
  .catch(error => {
    console.error('Error:', error);
    addMessageToChat('system', 'Error: Could not connect to server');
  });
}

function addMessageToChat(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}-message`;
  
  // Create proper message content based on role
  if (role === 'user') {
    messageDiv.innerHTML = `
      <div class="message-header">You:</div>
      <div class="message-content">${content}</div>
    `;
  } else if (role === 'system') {
    messageDiv.innerHTML = `
      <div class="message-header">AI:</div>
      <div class="message-content">${content}</div>
    `;
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function checkHealth() {
  fetch(`${API_URL}/health`)
    .then(response => response.json())
    .then(data => {
      displayApiResponse(data);
      // Update storage mode in stats
      if (data.storageMode) {
        storageMode.textContent = data.storageMode;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      displayApiResponse({ error: 'Could not connect to server' });
    });
}

function extractMemories() {
  // Get chat data from messages
  const messages = Array.from(chatMessages.children).map(child => {
    const role = child.classList.contains('user-message') ? 'user' : 'system';
    return {
      role,
      content: child.textContent,
      timestamp: new Date().toISOString()
    };
  });
  
  fetch(`${API_URL}/extract-memories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages })
  })
  .then(response => response.json())
  .then(data => {
    displayApiResponse(data);
    // Refresh stats after extraction
    fetchAndDisplayStats();
  })
  .catch(error => {
    console.error('Error:', error);
    displayApiResponse({ error: 'Could not connect to server' });
  });
}

function toggleSearchContainer() {
  searchContainer.style.display = searchContainer.style.display === 'none' ? 'flex' : 'none';
}

function performSearch() {
  const query = searchQuery.value.trim();
  if (!query) return;
  
  fetch(`${API_URL}/memories/search?query=${encodeURIComponent(query)}&limit=5`)
    .then(response => response.json())
    .then(data => {
      displayApiResponse(data);
    })
    .catch(error => {
      console.error('Error:', error);
      displayApiResponse({ error: 'Could not connect to server' });
    });
}

function displayApiResponse(data) {
  apiResponse.textContent = JSON.stringify(data, null, 2);
}

// Statistics Functions
function fetchAndDisplayStats() {
  fetch(`${API_URL}/statistics`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.statistics) {
        displayStats(data.statistics);
      } else {
        console.error('Invalid statistics data', data);
      }
    })
    .catch(error => {
      console.error('Error fetching statistics:', error);
    });
}

function displayStats(stats) {
  // Update overview stats
  totalMemories.textContent = stats.totalMemories;
  
  // Check for oldest memory
  if (stats.oldestMemory) {
    const oldestDate = new Date(stats.oldestMemory.timestamp);
    oldestMemory.textContent = oldestDate.toLocaleDateString();
  } else {
    oldestMemory.textContent = 'N/A';
  }
  
  // Check for newest memory
  if (stats.newestMemory) {
    const newestDate = new Date(stats.newestMemory.timestamp);
    newestMemory.textContent = newestDate.toLocaleDateString();
  } else {
    newestMemory.textContent = 'N/A';
  }
  
  // Display source distribution
  displayDistribution(sourceStats, stats.bySource, 'Sources');
  
  // Display type distribution
  displayDistribution(typeStats, stats.byType, 'Types');
  
  // Display importance distribution
  displayDistribution(importanceStats, stats.importanceDistribution, 'Importance');
  
  // Display recent memories
  displayRecentMemories(stats.recentMemories);
}

function displayDistribution(container, data, title) {
  container.innerHTML = '';
  
  if (!data || Object.keys(data).length === 0) {
    container.innerHTML = `<p>No ${title.toLowerCase()} data available</p>`;
    return;
  }
  
  // Calculate total for percentages
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  // Create distribution items
  Object.entries(data).forEach(([key, value]) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    const item = document.createElement('div');
    item.className = 'distribution-item';
    
    const label = document.createElement('div');
    label.className = 'distribution-label';
    label.innerHTML = `
      <span>${key}</span>
      <span>${value} (${percentage.toFixed(1)}%)</span>
    `;
    
    const bar = document.createElement('div');
    bar.className = 'distribution-bar';
    bar.style.width = `${percentage}%`;
    
    item.appendChild(label);
    item.appendChild(bar);
    container.appendChild(item);
  });
}

function displayRecentMemories(memories) {
  recentMemories.innerHTML = '';
  
  if (!memories || memories.length === 0) {
    recentMemories.innerHTML = '<p>No recent memories available</p>';
    return;
  }
  
  memories.forEach(memory => {
    const item = document.createElement('div');
    item.className = 'memory-item';
    
    const date = new Date(memory.timestamp).toLocaleString();
    const source = memory.metadata?.source || 'unknown';
    const importance = memory.metadata?.importance || 0;
    
    item.innerHTML = `
      <div class="memory-item-header">
        <span>${date}</span>
        <span>Source: ${source} | Importance: ${importance.toFixed(1)}</span>
      </div>
      <div class="memory-content">${memory.content}</div>
    `;
    
    recentMemories.appendChild(item);
  });
}

// Initialize
function initialize() {
  // Add initial system message
  addMessageToChat('system', 'Welcome to the Derek Brain testing interface. How can I help you today?');
  
  // Check server health on load
  checkHealth();
  
  // Load initial statistics
  fetchAndDisplayStats();
}

// Start the application
initialize();

let lastMessageTime = 0;
const DEBOUNCE_TIME = 500; // milliseconds

function handleSendMessage() {
  const now = Date.now();
  if (now - lastMessageTime < DEBOUNCE_TIME) {
    console.log('Message sending debounced');
    return; // Prevent rapid-fire messages
  }
  
  const message = userInput.value.trim();
  if (message) {
    lastMessageTime = now;
    userInput.value = '';
    
    addMessageToChat('user', message);
    processMessage(message);
  }
}

async function processMessage(message) {
  try {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message loading';
    loadingDiv.innerHTML = '<div class="message-header">AI:</div><div class="message-content">Thinking...</div>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Call API to get AI response
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get response');
    }
    
    const data = await response.json();
    
    // Remove loading indicator
    chatMessages.removeChild(loadingDiv);
    
    // Add actual AI response
    // Fix: Use data.response or the correct property from your API
    addMessageToChat('system', data.response || data.message || 'I received your message');
    
  } catch (error) {
    console.error('Error processing message:', error);
    // Remove loading indicator if it exists
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      chatMessages.removeChild(loadingElement);
    }
    
    // Show error message
    addMessageToChat('system', 'Sorry, I encountered an error processing your message.');
  }
}

// Example function to perform an advanced memory search
async function searchMemories(query, filters = {}) {
  try {
    const response = await fetch('/api/memories/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        filters,
        limit: 10
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }
    
    return data.results;
  } catch (error) {
    console.error('Error searching memories:', error);
    throw error;
  }
}

// Example usage:
// searchMemories("team meeting", {
//   "type": "event",
//   "metadata.category": "work",
//   "temporal.timestamp": {
//     gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
//   }
// }).then(results => console.log(results)); 