/**
 * Topical Pattern Detector
 * Detects topics and concepts in text
 */
export class TopicalPatternDetector {
  constructor() {
    this.initialized = false;
    this.topics = {
      technology: /\b(computer|software|hardware|tech|programming|code|application|website|internet|digital)\b/i,
      health: /\b(health|doctor|medical|medicine|fitness|exercise|diet|nutrition)\b/i,
      work: /\b(job|office|working|project|meeting|deadline|task)\b/i,
      family: /\b(kids|children|parents|mom|dad|sister|brother)\b/i,
      food: /\b(eat|lunch|dinner|breakfast|restaurant|cooking|meal)\b/i,
      travel: /\b(trip|vacation|flight|hotel|airport|journey|destination)\b/i,
      education: /\b(school|university|college|learning|study|class|course)\b/i,
      entertainment: /\b(movie|film|tv|show|music|concert|game)\b/i
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

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return null;
    }

    const textLower = text.toLowerCase();
    const matches = [];
    
    // Check for topic matches
    for (const topic in this.topics) {
      const regex = this.topics[topic];
      let match;
      while ((match = regex.exec(textLower)) !== null) {
        const term = match[0];
        if (!matches.some(m => m.value === term)) {
          matches.push({
            type: topic,
            value: term,
            parentTopic: topic,
            confidence: 0.8
          });
        }
      }
    }

    return matches.length > 0 ? {
      matches,
      confidence: 0.8
    } : null;
  }
}

export default TopicalPatternDetector; 