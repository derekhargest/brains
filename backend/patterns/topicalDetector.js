export class TopicalPatternDetector {
  constructor() {
    this.initialized = false;
    this.topics = {
      technology: /\b(computer|software|hardware|tech|programming|code|application|website|internet|digital)\b/i,
      health: /\b(health|doctor|medical|medicine|fitness|exercise|diet|nutrition|wellness)\b/i,
      finance: /\b(money|financial|finance|bank|investment|stock|market|economy|budget|expense|income|salary)\b/i,
      education: /\b(education|school|college|university|learn|study|student|teacher|professor|course|class)\b/i,
      entertainment: /\b(movie|film|tv|television|show|music|concert|game|gaming|book|novel|art|entertainment)\b/i,
      travel: /\b(travel|trip|vacation|journey|flight|hotel|destination|tourism|tourist|explore|adventure)\b/i
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
    
    Object.entries(this.topics).forEach(([topic, regex]) => {
      let match;
      const matches = [];
      const tempRegex = new RegExp(regex);
      
      while ((match = tempRegex.exec(text)) !== null) {
        if (match[0] && !matches.includes(match[0])) {
          matches.push(match[0]);
        }
      }
      
      if (matches.length > 0) {
        patterns.push({
          type: 'topic',
          value: topic,
          matches,
          confidence: 0.8
        });
      }
    });

    return patterns.length > 0 ? {
      matches: patterns,
      confidence: 0.8
    } : null;
  }
}

export default TopicalPatternDetector; 