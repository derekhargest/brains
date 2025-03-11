/**
 * Behavioral Pattern Detector
 * Detects activities, habits, and behaviors in text
 */
export class BehavioralPatternDetector {
  constructor() {
    this.initialized = false;
    this.activities = [
      // Common activities
      { activity: 'reading', variants: ['read', 'book', 'article', 'document'] },
      { activity: 'meeting', variants: ['meet', 'appointment', 'discussion', 'call'] },
      { activity: 'coding', variants: ['code', 'programming', 'development', 'debugging'] },
      { activity: 'exercise', variants: ['workout', 'gym', 'run', 'jog', 'fitness'] },
      { activity: 'sleeping', variants: ['sleep', 'nap', 'rest', 'bed'] },
      { activity: 'eating', variants: ['eat', 'meal', 'lunch', 'dinner', 'breakfast'] },
      { activity: 'writing', variants: ['write', 'note', 'document', 'email'] },
      { activity: 'traveling', variants: ['travel', 'commute', 'drive', 'flight'] }
    ];
    
    // Common behavior indicators
    this.behaviorPatterns = [
      { regex: /feel(?:ing)?\s+(tired|exhausted|energetic|motivated|stressed|anxious|happy|sad)/i, type: 'mood' },
      { regex: /(?:always|constantly|regularly|every\s+day)\s+(\w+)/i, type: 'habit' },
      { regex: /(?:plan|intend|going)\s+to\s+(\w+)/i, type: 'intention' },
      { regex: /(?:finished|completed|accomplished|achieved)\s+(\w+)/i, type: 'achievement' }
    ];
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
    
    // Check for activity matches
    this.activities.forEach(activityObj => {
      const allTerms = [activityObj.activity, ...activityObj.variants];
      
      allTerms.forEach(term => {
        // Simple word boundary check
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        if (regex.test(textLower) && !matches.some(m => m.value === term)) {
          matches.push({
            type: 'activity',
            value: term,
            parentActivity: activityObj.activity,
            confidence: 0.8
          });
        }
      });
    });
    
    // Check for behavior pattern matches
    this.behaviorPatterns.forEach(pattern => {
      const regex = pattern.regex;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        if (match[1] && !matches.some(m => m.value === match[0])) {
          matches.push({
            type: pattern.type,
            value: match[0],
            behavior: match[1],
            confidence: 0.7
          });
        }
      }
    });

    return matches.length > 0 ? {
      matches,
      confidence: 0.8
    } : null;
  }
}

export default BehavioralPatternDetector; 