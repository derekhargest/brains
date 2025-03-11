/**
 * Simple NLP utilities
 */

const nlpUtils = {
  /**
   * Extract potential entities from text
   */
  extractEntities(text) {
    // Simplified entity extraction implementation
    const entities = [];
    
    // Add basic regex patterns for entity detection
    const patterns = [
      { type: 'person', regex: /\b([A-Z][a-z]+)\b/g },
      { type: 'location', regex: /\b(at|in|from|to) ([A-Z][a-z]+)\b/g },
      { type: 'time', regex: /\b(\d{1,2}:\d{2})\b/g },
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        entities.push({
          type: pattern.type,
          value: match[1],
          position: match.index
        });
      }
    });
    
    return entities;
  },
  
  /**
   * Tokenize text into words
   */
  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
  },
  
  /**
   * Calculate simple similarity between texts
   */
  calculateSimilarity(text1, text2) {
    const tokens1 = new Set(this.tokenize(text1));
    const tokens2 = new Set(this.tokenize(text2));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }
};

module.exports = nlpUtils; 