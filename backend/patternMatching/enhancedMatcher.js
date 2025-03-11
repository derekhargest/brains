export class EnhancedPatternMatcher {
  static async matchPatterns(content, patterns, context = {}) {
    try {
      // Simple pattern matching for demo
      return {
        temporal: await this.findTemporalPatterns(content),
        relational: await this.findRelationalPatterns(content, patterns),
        topical: await this.findTopicalPatterns(content, patterns),
        behavioral: { matches: [], confidence: 0 },
        insights: this.generateInsights(content, patterns),
        confidence: 0.875
      };
    } catch (error) {
      console.error('Error in pattern matching:', error);
      throw error;
    }
  }

  static async findTemporalPatterns(content) {
    const timeRegex = /\b(\d{1,2}[:]\d{2}|am|pm)\b/gi;
    const matches = content.match(timeRegex) || [];
    
    return {
      matches: matches.map(time => ({
        time,
        confidence: 0.9
      })),
      confidence: matches.length ? 0.9 : 0
    };
  }

  static async findRelationalPatterns(content, patterns) {
    const names = Object.keys(patterns.relationships || {});
    const matches = names.filter(name => 
      content.toLowerCase().includes(name.toLowerCase())
    );
    
    return {
      matches: matches.map(name => ({
        name,
        confidence: 0.95
      })),
      confidence: matches.length ? 0.95 : 0
    };
  }

  static async findTopicalPatterns(content, patterns) {
    // Ensure patterns.topicalPatterns exists and is an array
    const topics = (patterns.topicalPatterns || []).filter(topic => topic && topic.topic);
    
    const matches = topics.filter(topic => 
      content.toLowerCase().includes(topic.topic.toLowerCase())
    );
    
    return {
      matches,
      confidence: matches.length ? 0.85 : 0
    };
  }

  static generateInsights(content, patterns) {
    // Basic insights based on content
    const insights = [];
    
    // Time-based insights
    if (content.match(/\b(\d{1,2}[:]\d{2}|am|pm)\b/gi)) {
      insights.push('Contains time-specific information');
    }
    
    // Name-based insights
    const names = Object.keys(patterns.relationships || {});
    const mentionedNames = names.filter(name => 
      content.toLowerCase().includes(name.toLowerCase())
    );
    if (mentionedNames.length > 0) {
      insights.push(`Involves interaction with ${mentionedNames.join(', ')}`);
    }
    
    // Project/Topic insights
    if (content.toLowerCase().includes('ai')) {
      insights.push('Related to AI project');
    }
    if (content.toLowerCase().includes('meeting')) {
      insights.push('Meeting/collaboration context');
    }

    return insights;
  }
}

export default EnhancedPatternMatcher; 