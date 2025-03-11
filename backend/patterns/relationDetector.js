export class RelationDetector {
  constructor() {
    this.initialized = false;
    this.patterns = {
      person: /\b(friend|family|mother|father|brother|sister|colleague|coworker|boss|manager|partner|spouse|husband|wife)\b/i,
      relationship: /\b(with|and|to|from|for|by|about)\b/i
    };
  }

  async initialize() {
    this.initialized = true;
    return true;
  }

  detectPatterns(text) {
    if (!this.initialized) {
      throw new Error("Detector not initialized");
    }

    const patterns = [];
    
    // Simple person detection
    const personMatches = [];
    let match;
    const personRegex = new RegExp(this.patterns.person);
    
    while ((match = personRegex.exec(text)) !== null) {
      if (match[0] && !personMatches.includes(match[0])) {
        personMatches.push(match[0]);
      }
    }
    
    if (personMatches.length > 0) {
      patterns.push({
        type: 'relation',
        value: 'person',
        matches: personMatches,
        confidence: 0.7
      });
    }

    return patterns.length > 0 ? {
      matches: patterns,
      confidence: 0.7
    } : null;
  }
}

export default RelationDetector; 