/**
 * Relation Pattern Detector
 * Detects relationships between entities in text
 */
export class RelationDetector {
  constructor() {
    this.initialized = false;
    
    // Common relationship indicators
    this.relationPatterns = [
      { regex: /(\w+)\s+(?:with|and)\s+(\w+)/, type: 'association' },
      { regex: /(\w+)\s+(?:is|are|was|were)\s+(\w+)/, type: 'attribute' },
      { regex: /(\w+)\s+(?:has|have|had)\s+(\w+)/, type: 'possession' },
      { regex: /(\w+)\s+(?:to|from|at|in|on)\s+(\w+)/, type: 'spatial' },
      { regex: /(\w+)\s+(?:before|after|during|while)\s+(\w+)/, type: 'temporal' },
      { regex: /(\w+)\s+(?:likes?|loves?|enjoys?|hates?|dislikes?)\s+(\w+)/, type: 'sentiment' }
    ];
    
    // Common relationship entities
    this.people = ['friend', 'colleague', 'coworker', 'boss', 'manager', 'client', 
                  'partner', 'spouse', 'wife', 'husband', 'child', 'son', 'daughter',
                  'mother', 'father', 'sister', 'brother', 'family'];
  }

  async initialize() {
    this.initialized = true;
    return true;
  }

  detectPatterns(text) {
    if (!this.initialized) {
      throw new Error("Detector not initialized");
    }

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return null;
    }

    const matches = [];
    
    // Check for relationship entities
    this.people.forEach(person => {
      const regex = new RegExp(`\\b(my|our|their|his|her)\\s+${person}\\b`, 'i');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        if (!matches.some(m => m.value === match[0])) {
          matches.push({
            type: 'person',
            value: match[0],
            entity: person,
            possessive: match[1],
            confidence: 0.85
          });
        }
      }
    });
    
    // Check for relationship pattern matches
    this.relationPatterns.forEach(pattern => {
      const regex = pattern.regex;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        if (match[1] && match[2] && !matches.some(m => m.value === match[0])) {
          matches.push({
            type: pattern.type,
            value: match[0],
            source: match[1],
            target: match[2],
            confidence: 0.7
          });
        }
      }
    });

    return matches.length > 0 ? {
      matches,
      confidence: 0.75
    } : null;
  }
}

export default RelationDetector; 