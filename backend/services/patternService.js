import PatternLearner from '../patterns/patternLearner.js';
import { InsightGenerator } from '../patterns/insightGenerator.js';
import PatternStorage from '../patterns/storage/patternStorage.js';

/**
 * Service for pattern-related operations
 * Acts as a facade for the pattern subsystem
 */
export class PatternService {
  constructor(storage = null) {
    this.storage = storage || new PatternStorage();
    this.patternLearner = null;
    this.insightGenerator = new InsightGenerator();
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    await this.storage.initialize();
    
    this.patternLearner = new PatternLearner(this.storage);
    await this.patternLearner.initialize();
    
    this.initialized = true;
    return true;
  }
  
  /**
   * Process text content to learn patterns
   * @param {string} content - The text content
   * @param {Object} context - Additional context information
   * @returns {Array} The patterns detected
   */
  async processContent(content, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.patternLearner.learnFromMemory(content, context);
  }
  
  /**
   * Get all patterns 
   * @returns {Array} All patterns
   */
  async getAllPatterns() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.storage.getAllPatterns();
  }
  
  /**
   * Get patterns by type
   * @param {string} type - Pattern type
   * @returns {Array} Patterns of the specified type
   */
  async getPatternsByType(type) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.storage.getPatternsByType(type);
  }
  
  /**
   * Get patterns by source
   * @param {string} source - Source text
   * @returns {Array} Patterns from the specified source
   */
  async getPatternsBySource(source) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.storage.getPatternsBySource(source);
  }
  
  /**
   * Get insights from patterns
   * @returns {Object} Insights generated from patterns
   */
  async getInsights() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.insightGenerator.getInsights();
  }
  
  /**
   * Get network visualization data
   * @returns {Object} Data for network visualization
   */
  async getNetworkVisualizationData() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const insights = await this.insightGenerator.getInsights();
    
    // Transform insights into visualization format
    const nodes = [];
    const links = [];
    
    // Add central concepts as nodes
    insights.conceptualInsights.centralConcepts.forEach(concept => {
      nodes.push({
        id: concept.concept,
        label: concept.concept,
        value: concept.frequency,
        title: `${concept.concept} (${concept.frequency} occurrences)`
      });
    });
    
    // Add relationship edges
    insights.relationshipInsights.forEach(relation => {
      links.push({
        id: `${relation.source}:${relation.target}`,
        from: relation.source,
        to: relation.target,
        value: relation.strength,
        title: `Strength: ${relation.strength.toFixed(2)}`
      });
    });
    
    return { nodes, links };
  }
  
  /**
   * Get timeline visualization data
   * @returns {Array} Data for timeline visualization
   */
  async getTimelineVisualizationData() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const patterns = await this.storage.getAllPatterns();
    
    // Group patterns by day
    const patternsByDay = {};
    
    patterns.forEach(pattern => {
      if (!pattern.timestamp) return;
      
      const date = new Date(pattern.timestamp);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!patternsByDay[dayKey]) {
        patternsByDay[dayKey] = {
          date: dayKey,
          patterns: {}
        };
      }
      
      const typeKey = pattern.type;
      patternsByDay[dayKey].patterns[typeKey] = (patternsByDay[dayKey].patterns[typeKey] || 0) + 1;
    });
    
    // Convert to array format
    return Object.values(patternsByDay).sort((a, b) => a.date.localeCompare(b.date));
  }

  async detectTemporalPatterns(memories) {
    return {
      weekly: this._analyzeWeeklyPatterns(memories),
      daily: this._analyzeHourlyPatterns(memories),
      intervals: this._findRecurringIntervals(memories),
      durations: this._analyzeActivityDurations(memories)
    };
  }

  _analyzeWeeklyPatterns(memories) {
    const dayCounts = Array(7).fill(0);
    memories.forEach(m => {
      const day = new Date(m.timestamp).getDay();
      dayCounts[day]++;
    });
    
    const total = memories.length;
    return dayCounts.map((count, idx) => ({
      day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][idx],
      count,
      confidence: count / total,
      percentage: (count / total * 100).toFixed(1) + '%'
    }));
  }

  _analyzeHourlyPatterns(memories) {
    const hourCounts = Array(24).fill(0);
    memories.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      hourCounts[hour]++;
    });
    
    const total = memories.length;
    return hourCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      count,
      confidence: count / total,
      percentage: (count / total * 100).toFixed(1) + '%'
    }));
  }

  _findRecurringIntervals(memories) {
    const events = memories
      .map(m => new Date(m.timestamp).getTime())
      .sort((a, b) => a - b);

    const intervals = [];
    for (let i = 1; i < events.length; i++) {
      intervals.push(events[i] - events[i-1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    
    return {
      averageIntervalMs: avgInterval,
      variance,
      stdDev: Math.sqrt(variance),
      confidence: 1 - (variance / avgInterval)
    };
  }

  _analyzeActivityDurations(memories) {
    const durationEvents = memories.filter(m => m.metadata?.duration);
    return {
      totalActivities: durationEvents.length,
      averageDuration: durationEvents.reduce((sum, m) => sum + m.metadata.duration, 0) / durationEvents.length,
      longestDuration: Math.max(...durationEvents.map(m => m.metadata.duration)),
      shortestDuration: Math.min(...durationEvents.map(m => m.metadata.duration))
    };
  }
}

export function detectTemporalPatterns(text) {
  // Implementation from lines 45-78
  // ... existing code ...
}

export default PatternService; 