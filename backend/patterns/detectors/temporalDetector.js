export class TemporalPatternDetector {
  constructor() {
    this.initialized = false;
    this.patterns = {
      timeRegex: /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b|morning|afternoon|evening|night|today|tomorrow|yesterday/gi,
      dayRegex: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      dateRegex: /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi
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
      while ((match = regex.exec(text)) !== null) {
        // Get the actual matched text
        const value = match[0];
        if (value && !patterns.some(p => p.value === value)) {
          patterns.push({
            type: 'time',
            value: value,
            confidence: 0.9
          });
        }
      }
    });

    return patterns.length > 0 ? {
      matches: patterns,
      confidence: 0.9
    } : null;
  }
}

export default TemporalPatternDetector; 