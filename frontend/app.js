// Simple app.js for MVP version
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const memoryContent = document.getElementById('memoryContent');
  const importanceSlider = document.getElementById('importanceSlider');
  const importanceValue = document.getElementById('importanceValue');
  const storeMemoryBtn = document.getElementById('storeMemoryBtn');
  const searchQuery = document.getElementById('searchQuery');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');

  // Update importance value display
  importanceSlider.addEventListener('input', () => {
    importanceValue.textContent = importanceSlider.value;
  });

  // Store memory
  storeMemoryBtn.addEventListener('click', async () => {
    const content = memoryContent.value.trim();
    if (!content) return;

    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          metadata: {
            importance: parseFloat(importanceSlider.value),
            source: 'web-ui'
          }
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      // Clear form
      memoryContent.value = '';
      alert('Memory stored successfully!');
    } catch (error) {
      console.error('Error storing memory:', error);
      alert('Error storing memory: ' + error.message);
    }
  });

  // Search memories
  searchBtn.addEventListener('click', async () => {
    const query = searchQuery.value.trim();
    if (!query) return;

    try {
      const response = await fetch(`/api/memories/search?query=${encodeURIComponent(query)}`);
      const memories = await response.json();

      // Display results
      searchResults.innerHTML = '';
      
      if (memories.length === 0) {
        searchResults.innerHTML = '<p>No memories found.</p>';
        return;
      }

      memories.forEach(memory => {
        const memoryEl = document.createElement('div');
        memoryEl.className = 'memory-item';
        
        // Safely get the date and importance
        const timestamp = memory.timestamp ? new Date(memory.timestamp).toLocaleString() : 'No date';
        const importance = memory.metadata?.importance || 0;
        const content = memory.content || 'No content';
        
        memoryEl.innerHTML = `
          <div class="memory-header">
            <span>${timestamp}</span>
            <span>Importance: ${importance.toFixed(1)}</span>
          </div>
          <div class="memory-content">${content}</div>
        `;
        
        searchResults.appendChild(memoryEl);
      });
    } catch (error) {
      console.error('Error searching memories:', error);
      searchResults.innerHTML = '<p>Error searching memories: ' + error.message + '</p>';
    }
  });

  // Check health on load
  fetch('/api/test-health')
    .then(response => response.json())
    .then(data => {
      console.log('Server health:', data);
    })
    .catch(error => {
      console.error('Server health check failed:', error);
    });
}); 