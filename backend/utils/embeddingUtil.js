/**
 * Simple embedding generation for testing
 * In production, you would use a real embedding model
 */
function generateEmbedding(text) {
  // Simple hash function to convert text to a number
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
  
  // Generate a deterministic but simple embedding based on the text
  const tokens = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  // Use token positions to influence the embedding
  tokens.forEach((token, i) => {
    const hashValue = simpleHash(token);
    const position = Math.abs(hashValue) % 384;
    embedding[position] += 1.0;
    
    // Add some influence from neighboring positions
    embedding[(position + 1) % 384] += 0.5;
    embedding[(position + 2) % 384] += 0.25;
  });
  
  // Normalize the embedding to unit length
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  const normalizedEmbedding = embedding.map(val => val / magnitude);
  
  return normalizedEmbedding;
}

module.exports = { generateEmbedding }; 