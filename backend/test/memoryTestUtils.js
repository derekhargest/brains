/**
 * Memory testing utilities
 */

// Generate a simple embedding function for testing
function generateTestEmbedding(text) {
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

/**
 * Compare the similarity between two text strings using their embeddings
 */
function compareTextSimilarity(text1, text2) {
  const embedding1 = generateTestEmbedding(text1);
  const embedding2 = generateTestEmbedding(text2);
  
  // Calculate cosine similarity
  let dotProduct = 0;
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
  }
  
  return dotProduct; // Vectors are already normalized, so dot product = cosine similarity
}

/**
 * Check if memories contain similar text to the query
 */
function analyzeTestMemories(memories, query) {
  console.log('\nAnalyzing test memories for similarity to query:');
  console.log(`Query: "${query}"`);
  console.log('-----------------------------------');
  
  memories.forEach((memory, index) => {
    const similarity = compareTextSimilarity(memory.content, query);
    console.log(`Memory ${index + 1}: Similarity = ${similarity.toFixed(4)}`);
    console.log(`Content: "${memory.content.substring(0, 80)}${memory.content.length > 80 ? '...' : ''}"`);
    console.log('-----------------------------------');
  });
}

module.exports = {
  generateTestEmbedding,
  compareTextSimilarity,
  analyzeTestMemories
}; 