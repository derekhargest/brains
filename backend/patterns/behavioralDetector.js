export class BehavioralPatternDetector {
  constructor() {
    this.initialized = false;
    this.patterns = {
      action: /\b(did|made|created|built|developed|designed|organized|planned|executed|implemented)\b/i,
      habit: /\b(always|usually|often|sometimes|rarely|never|daily|weekly|monthly|regularly)\b/i,
      preference: /\b(like|dislike|love|hate|prefer|enjoy|favorite|interested in|passionate about)\b/i
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
    
    Object.entries(this.patterns).forEach(([type, regex]) => {
      let match;
      const tempRegex = new RegExp(regex);
      while ((match = tempRegex.exec(text)) !== null) {
        if (match[0]) {
          patterns.push({
            type: 'behavior',
            subtype: type,
            value: match[0],
            confidence: 0.75
          });
        }
      }
    });

    return patterns.length > 0 ? {
      matches: patterns,
      confidence: 0.75
    } : null;
  }
}

export default BehavioralPatternDetector; 