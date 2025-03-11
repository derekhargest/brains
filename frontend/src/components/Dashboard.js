import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = 'http://localhost:3001/api';

const Dashboard = () => {
  const [memories, setMemories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newMemory, setNewMemory] = useState({ content: '', metadata: { type: 'note', importance: 0.5 } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [similarMemories, setSimilarMemories] = useState([]);
  
  // Fetch memories on component mount
  useEffect(() => {
    fetchMemories();
  }, []);
  
  // Fetch memories from API
  const fetchMemories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/memories`);
      setMemories(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch memories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Search memories
  const searchMemories = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/memories`, {
        params: { query: searchQuery }
      });
      setSearchResults(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to search memories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Store a new memory
  const storeMemory = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/memories`, newMemory);
      setMemories([...memories, response.data]);
      setNewMemory({ content: '', metadata: { type: 'note', importance: 0.5 } });
      setError(null);
    } catch (err) {
      setError('Failed to store memory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a memory
  const deleteMemory = async (id) => {
    setLoading(true);
    
    try {
      await axios.delete(`${API_URL}/memories/${id}`);
      setMemories(memories.filter(memory => memory.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete memory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Find patterns
  const findPatterns = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/patterns`);
      setPatterns(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to find patterns');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Find similar memories
  const findSimilarMemories = async (memory) => {
    setSelectedMemory(memory);
    setLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/memories/similar/${memory.id}`);
      setSimilarMemories(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to find similar memories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>brains!!! dashboard</h1>
        <p>Your personal cognitive system</p>
      </header>
      
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Add New Memory</h2>
          <form onSubmit={storeMemory} className="memory-form">
            <textarea
              placeholder="Enter memory content..."
              value={newMemory.content}
              onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
              required
            />
            
            <div className="form-row">
              <label>
                Type:
                <select
                  value={newMemory.metadata.type}
                  onChange={(e) => setNewMemory({
                    ...newMemory,
                    metadata: { ...newMemory.metadata, type: e.target.value }
                  })}
                >
                  <option value="note">Note</option>
                  <option value="idea">Idea</option>
                  <option value="task">Task</option>
                  <option value="research">Research</option>
                  <option value="personal">Personal</option>
                </select>
              </label>
              
              <label>
                Importance:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={newMemory.metadata.importance}
                  onChange={(e) => setNewMemory({
                    ...newMemory,
                    metadata: { ...newMemory.metadata, importance: parseFloat(e.target.value) }
                  })}
                />
                <span>{newMemory.metadata.importance}</span>
              </label>
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Storing...' : 'Store Memory'}
            </button>
          </form>
        </div>
        
        <div className="dashboard-section">
          <h2>Search Memories</h2>
          <form onSubmit={searchMemories} className="search-form">
            <input
              type="text"
              placeholder="Search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
          
          <div className="search-results">
            <h3>Search Results</h3>
            {searchResults.length > 0 ? (
              <ul className="memory-list">
                {searchResults.map(memory => (
                  <li key={memory.id} className="memory-item">
                    <div className="memory-content">{memory.content}</div>
                    <div className="memory-metadata">
                      <span className="memory-type">{memory.metadata?.type}</span>
                      <span className="memory-importance">
                        Importance: {memory.metadata?.importance}
                      </span>
                      <span className="memory-timestamp">
                        {new Date(memory.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="memory-actions">
                      <button onClick={() => findSimilarMemories(memory)}>
                        Find Similar
                      </button>
                      <button onClick={() => deleteMemory(memory.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No search results</p>
            )}
          </div>
        </div>
        
        <div className="dashboard-section">
          <h2>Recent Memories</h2>
          {memories.length > 0 ? (
            <ul className="memory-list">
              {memories.slice(0, 5).map(memory => (
                <li key={memory.id} className="memory-item">
                  <div className="memory-content">{memory.content}</div>
                  <div className="memory-metadata">
                    <span className="memory-type">{memory.metadata?.type}</span>
                    <span className="memory-importance">
                      Importance: {memory.metadata?.importance}
                    </span>
                    <span className="memory-timestamp">
                      {new Date(memory.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="memory-actions">
                    <button onClick={() => findSimilarMemories(memory)}>
                      Find Similar
                    </button>
                    <button onClick={() => deleteMemory(memory.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No memories found</p>
          )}
        </div>
        
        <div className="dashboard-section">
          <h2>Patterns & Insights</h2>
          <button onClick={findPatterns} disabled={loading}>
            {loading ? 'Finding Patterns...' : 'Find Patterns'}
          </button>
          
          {patterns && (
            <div className="patterns-container">
              {patterns.topics && patterns.topics.length > 0 && (
                <div className="pattern-group">
                  <h3>Topic Patterns</h3>
                  <ul>
                    {patterns.topics.map((topic, index) => (
                      <li key={index}>
                        <strong>{topic.topic}</strong>: {topic.count} occurrences
                        ({Math.round(topic.frequency * 100)}%)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {patterns.entityCooccurrences && patterns.entityCooccurrences.length > 0 && (
                <div className="pattern-group">
                  <h3>Entity Co-occurrences</h3>
                  <ul>
                    {patterns.entityCooccurrences.map((cooccurrence, index) => (
                      <li key={index}>
                        <strong>{cooccurrence.entities[0]}</strong> and{' '}
                        <strong>{cooccurrence.entities[1]}</strong>: {cooccurrence.count} times
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {patterns.temporal && (
                <div className="pattern-group">
                  <h3>Temporal Patterns</h3>
                  <div className="temporal-patterns">
                    <div>
                      <h4>Daily Patterns</h4>
                      <ul>
                        {patterns.temporal.daily.slice(0, 3).map((pattern, index) => (
                          <li key={index}>
                            <strong>{pattern.hour}:00</strong>: {pattern.count} memories
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4>Weekly Patterns</h4>
                      <ul>
                        {patterns.temporal.weekly.slice(0, 3).map((pattern, index) => (
                          <li key={index}>
                            <strong>{pattern.dayName}</strong>: {pattern.count} memories
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {selectedMemory && (
          <div className="dashboard-section">
            <h2>Similar Memories</h2>
            <div className="selected-memory">
              <h3>Selected Memory</h3>
              <div className="memory-content">{selectedMemory.content}</div>
            </div>
            
            {similarMemories.length > 0 ? (
              <ul className="memory-list">
                {similarMemories.map(memory => (
                  <li key={memory.id} className="memory-item">
                    <div className="memory-content">{memory.content}</div>
                    <div className="memory-metadata">
                      <span className="memory-type">{memory.metadata?.type}</span>
                      <span className="memory-score">
                        Similarity: {Math.round(memory.score * 100)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No similar memories found</p>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 