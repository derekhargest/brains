/**
 * Insight Generator
 * 
 * Generates meaningful insights from patterns
 */

export class InsightGenerator {
  constructor() {
    this.storage = {
      patterns: []
    };
    this.initialized = false;
    this.models = {};
  }
  
  async initialize() {
    // Initialization code
    this.initialized = true;
    return true;
  }
  
  async generateInsights(patterns) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Store patterns locally for processing
    this.storage.patterns = [...patterns];
    
    const insights = [];
    
    // Process central concepts
    const centralConcepts = this._processCentralConcepts(patterns);
    
    // Generate central concept insights
    centralConcepts.slice(0, 3).forEach(concept => {
      insights.push({
        id: `concept-insight-${concept.concept}-${Date.now()}`,
        type: 'central_concept',
        content: `Key concept identified: "${concept.concept}" (appears ${concept.frequency} times)`,
        confidence: concept.confidence,
        timestamp: new Date().toISOString(),
        relatedConcepts: concept.relatedConcepts
      });
    });
    
    // Generate temporal insights
    const temporalPatterns = patterns.filter(p => p.type === 'time_reference');
    if (temporalPatterns.length > 0) {
      insights.push({
        id: `temporal-insight-${Date.now()}`,
        type: 'temporal',
        content: `You have ${temporalPatterns.length} memories with time references`,
        confidence: 0.7,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Generate relationship insights
    const relationPatterns = patterns.filter(p => p.type === 'relational');
    const peopleSet = new Set();
    
    relationPatterns.forEach(pattern => {
      peopleSet.add(pattern.content.toLowerCase());
    });
    
    if (peopleSet.size > 0) {
      const peopleList = Array.from(peopleSet).join(', ');
      insights.push({
        id: `relationship-insight-${Date.now()}`,
        type: 'relationship',
        content: `People mentioned in your memories: ${peopleList}`,
        confidence: 0.7,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Generate topic insights
    const topicPatterns = patterns.filter(p => p.type === 'topical');
    const topicCounts = {};
    
    topicPatterns.forEach(pattern => {
      const topic = pattern.content.toLowerCase();
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    // Find top topics
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (topTopics.length > 0) {
      const topicText = topTopics.map(([topic, count]) => `${topic} (${count})`).join(', ');
      insights.push({
        id: `topic-insight-${Date.now()}`,
        type: 'topic_frequency',
        content: `Your most frequent topics are: ${topicText}`,
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      });
    }
    
    return {
      insights: insights,
      meta: {
        processedMemories: patterns.length,
        generatedAt: new Date().toISOString()
      }
    };
  }
  
  _processCentralConcepts(patterns) {
    // Find central concepts from topical and behavioral patterns
    const conceptMap = new Map();
    
    patterns.forEach(pattern => {
      if (pattern.type === 'topical' || pattern.type === 'central_concept') {
        const concept = pattern.content.toLowerCase();
        
        if (!conceptMap.has(concept)) {
          conceptMap.set(concept, {
            concept,
            frequency: 1,
            relatedConcepts: new Set(),
            confidence: pattern.confidence
          });
        } else {
          const existing = conceptMap.get(concept);
          existing.frequency++;
          existing.confidence = Math.max(existing.confidence, pattern.confidence);
        }
        
        // Build relationships between concepts in same memory
        patterns.forEach(otherPattern => {
          if (otherPattern.source === pattern.source && 
              (otherPattern.type === 'topical' || otherPattern.type === 'central_concept') &&
              otherPattern.content.toLowerCase() !== concept) {
            
            conceptMap.get(concept).relatedConcepts.add(otherPattern.content.toLowerCase());
          }
        });
      }
    });
    
    // Convert to array and calculate strength
    const centralConcepts = Array.from(conceptMap.values())
      .map(c => ({
        ...c,
        relatedConcepts: Array.from(c.relatedConcepts),
        strength: c.frequency + (c.relatedConcepts.length * 2)
      }))
      .sort((a, b) => b.strength - a.strength);
    
    return centralConcepts;
  }
}

export default InsightGenerator; 