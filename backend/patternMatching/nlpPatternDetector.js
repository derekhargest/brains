import natural from 'natural';
const { TfIdf } = natural;
const tokenizer = new natural.WordTokenizer();

class NLPPatternDetector {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    this.temporalPatterns = {
      timeRegex: /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b|morning|afternoon|evening|night|today|tomorrow|yesterday/gi,
      dayRegex: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      dateRegex: /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi
    };
    
    this.behavioralPatterns = {
      actionVerbs: /\b(meet(?:ing)?|work(?:ing)?|study(?:ing)?|code|coding|develop(?:ing)?|write|writing|read(?:ing)?|learn(?:ing)?|build(?:ing)?|discuss(?:ing)?|collaborate|collaborate(?:ing)?)\b/i,
      routineIndicators: /\b(always|usually|often|sometimes|rarely|never|daily|weekly|monthly)\b/i
    };
    
    this.topicalPatterns = {
      techTopics: /\b(ai|artificial intelligence|machine learning|coding|programming|software|data|algorithm|computer|technology|app|application|web|internet|cloud|database|api)\b/i,
      workTopics: /\b(meeting|project|deadline|client|team|colleague|manager|presentation|report|email|call|conference|task|goal)\b/i,
      personalTopics: /\b(family|friend|hobby|interest|health|fitness|food|travel|home|personal|life)\b/i
    };
    
    this.emotionalPatterns = {
      positiveEmotions: /\b(happy|excited|glad|pleased|joy|satisfied|proud|enthusiastic|eager|hopeful|looking forward)\b/i,
      negativeEmotions: /\b(sad|disappointed|frustrated|angry|upset|worried|anxious|stressed|tired|overwhelmed)\b/i
    };
    
    this.relationPatterns = {
      names: /(?:^|[.!?]\s+)(?!the|a|an)([A-Z][a-z]+)\b/g,
      commonNames: /\b(John|Jane|Sarah|Mike|David|Lisa|Emily|Michael|Jessica|Chris|Amanda|Mark|Rachel|Tom|Laura)\b/g
    };
    
    this.initialized = true;
    return true;
  }

  async detectPatterns(content, context = {}) {
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return { patterns: {}, confidence: 0 };
    }

    await this.initialize();
    
    console.log('NLPPatternDetector processing:', content);
    
    // Create a map to store all detected patterns
    const patterns = {};
    
    // Use dedicated temporal pattern detection
    const temporalResults = this.detectTemporalPatterns(content);
    if (temporalResults && temporalResults.matches.length > 0) {
      patterns.temporal = temporalResults;
    }
    
    // Rest of pattern detection
    const behavioralMatches = this.detectSimplePatterns(content, this.behavioralPatterns);
    if (behavioralMatches.length > 0) {
      patterns.behavioral = {
        matches: behavioralMatches.map(m => ({ type: 'action', value: m, confidence: 0.85 })),
        confidence: 0.85
      };
    }
    
    const topicalMatches = this.detectSimplePatterns(content, this.topicalPatterns);
    if (topicalMatches.length > 0) {
      patterns.topical = {
        matches: topicalMatches.map(m => ({ type: 'topic', value: m, confidence: 0.8 })),
        confidence: 0.8
      };
    }
    
    const emotionalMatches = this.detectSimplePatterns(content, this.emotionalPatterns);
    if (emotionalMatches.length > 0) {
      patterns.emotional = {
        matches: emotionalMatches.map(m => ({ type: 'emotion', value: m, confidence: 0.75 })),
        confidence: 0.75
      };
    }
    
    // Detect names and relationships
    const nameMatches = this.detectNames(content);
    if (nameMatches.length > 0) {
      patterns.relational = {
        matches: nameMatches.map(m => ({ type: 'person', value: m, confidence: 0.85 })),
        confidence: 0.85
      };
    }
    
    console.log('NLPPatternDetector results:', JSON.stringify(patterns));
    
    // Calculate overall confidence
    const patternTypes = Object.keys(patterns);
    const overallConfidence = patternTypes.length > 0 
      ? patternTypes.reduce((sum, type) => sum + patterns[type].confidence, 0) / patternTypes.length
      : 0;
    
    return { 
      patterns, 
      confidence: overallConfidence
    };
  }

  detectSimplePatterns(content, patternSet) {
    const matches = [];
    
    Object.values(patternSet).forEach(regex => {
      const contentMatches = content.match(regex);
      if (contentMatches) {
        matches.push(...contentMatches);
      }
    });
    
    return [...new Set(matches)]; // Remove duplicates
  }

  detectNames(content) {
    const matches = [];
    let match;
    
    // Reset regex lastIndex
    this.relationPatterns.names.lastIndex = 0;
    this.relationPatterns.commonNames.lastIndex = 0;
    
    // Look for capitalized words
    while ((match = this.relationPatterns.names.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    // Look for common names
    while ((match = this.relationPatterns.commonNames.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    return [...new Set(matches)]; // Remove duplicates
  }

  detectTemporalPatterns(text) {
    const patterns = [];
    
    Object.entries(this.temporalPatterns).forEach(([type, regex]) => {
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

module.exports = NLPPatternDetector; 