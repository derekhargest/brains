// Test helpers and mock data
const createMockMemory = (content, context = {}) => ({
  content,
  context,
  timestamp: new Date().toISOString()
});

const mockEmbedding = new Array(1536).fill(0.1);

const mockOpenAIResponse = {
  data: [{
    embedding: mockEmbedding
  }]
};

module.exports = {
  createMockMemory,
  mockEmbedding,
  mockOpenAIResponse
}; 