import PatternLearner from '../patterns/patternLearner.js';
import { InsightGenerator } from '../patterns/insightGenerator.js';
import PatternStorage from '../patterns/storage/patternStorage.js';
import { QdrantVectorStore } from '../vectorStore/qdrantStore.js';

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
    this.memoryService = null;
    this.patterns = [];
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    await this.storage.initialize();
    
    this.patternLearner = new PatternLearner(this.storage);
    await this.patternLearner.initialize();
    
    // We'll lazy-load the memory service when needed
    
    this.initialized = true;
    console.log('Pattern service initialized');
    return true;
  }
  
  // Lazy-load memory service when needed
  async getMemoryService() {
    if (this.memoryService) {
      return this.memoryService;
    }
    
    // Create a new memory service with vector store
    const vectorStore = new QdrantVectorStore({
      baseUrl: process.env.QDRANT_URL || 'http://localhost:6333',
      collectionName: 'memories',
      vectorSize: 384  // Keep consistent with existing collection
    });
    
    await vectorStore.initialize();
    
    // Import dynamically to avoid circular dependency
    const { MemoryService } = await import('./memoryService.js');
    this.memoryService = new MemoryService(vectorStore);
    await this.memoryService.initialize();
    
    return this.memoryService;
  }
  
  /**
   * Process text content to learn patterns
   * @param {string} content - The text content
   * @param {Object} context - Additional context information
   * @returns {Array} The patterns detected
   */
  async processContent(content, context = {}) {
    if (!this.initialized) await this.initialize();
    
    // Process with pattern learner
    const patterns = await this.patternLearner.processContent(content, context);
    
    // Store patterns
    await this.storage.storePatterns(patterns);
    
    return patterns;
  }
  
  /**
   * Get all patterns 
   * @returns {Array} All patterns
   */
  async getAllPatterns() {
    if (!this.initialized) await this.initialize();
    
    // Get all patterns from storage
    const patterns = await this.storage.getAllPatterns();
    
    return patterns;
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

  /**
   * Detect recurring topics in memories
   * @param {Object} options - Options for pattern detection
   * @returns {Array} - Array of detected topic patterns
   */
  async detectTopicPatterns(options = {}) {
    try {
      // Get all memories
      const memoryService = await this.getMemoryService();
      const memories = await memoryService.searchMemories("", {
        limit: options.limit || 100
      });
      
      // Extract topics from metadata
      const topicCounts = {};
      
      memories.forEach(memory => {
        if (memory.metadata && memory.metadata.topic) {
          const topic = memory.metadata.topic;
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      });
      
      // Convert to array and sort by frequency
      const topicPatterns = Object.entries(topicCounts)
        .map(([topic, count]) => ({
          topic,
          count,
          frequency: count / memories.length
        }))
        .filter(pattern => pattern.count >= (options.minCount || 2))
        .sort((a, b) => b.count - a.count);
      
      return topicPatterns;
    } catch (error) {
      console.error('Error detecting topic patterns:', error);
      throw error;
    }
  }
  
  /**
   * Detect entity co-occurrences in memories
   * @param {Object} options - Options for pattern detection
   * @returns {Array} - Array of detected entity co-occurrence patterns
   */
  async detectEntityCooccurrences(options = {}) {
    try {
      // Get all memories
      const memoryService = await this.getMemoryService();
      const memories = await memoryService.searchMemories("", {
        limit: options.limit || 100
      });
      
      // Track entity co-occurrences
      const cooccurrences = {};
      const entityCounts = {};
      
      // Process each memory
      memories.forEach(memory => {
        if (memory.metadata && memory.metadata.entities) {
          const entities = memory.metadata.entities;
          
          // Count individual entities
          entities.forEach(entity => {
            entityCounts[entity] = (entityCounts[entity] || 0) + 1;
          });
          
          // Count co-occurrences
          for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
              const pair = [entities[i], entities[j]].sort().join('::');
              cooccurrences[pair] = (cooccurrences[pair] || 0) + 1;
            }
          }
        }
      });
      
      // Convert to array and sort by frequency
      const cooccurrencePatterns = Object.entries(cooccurrences)
        .map(([pair, count]) => {
          const [entity1, entity2] = pair.split('::');
          return {
            entities: [entity1, entity2],
            count,
            entity1Count: entityCounts[entity1] || 0,
            entity2Count: entityCounts[entity2] || 0,
            strength: count / Math.min(entityCounts[entity1] || 1, entityCounts[entity2] || 1)
          };
        })
        .filter(pattern => pattern.count >= (options.minCount || 2))
        .sort((a, b) => b.strength - a.strength);
      
      return cooccurrencePatterns;
    } catch (error) {
      console.error('Error detecting entity co-occurrences:', error);
      throw error;
    }
  }
  
  /**
   * Detect temporal patterns in memories
   * @param {Object} options - Options for pattern detection
   * @returns {Array} - Array of detected temporal patterns
   */
  async detectTemporalPatterns(options = {}) {
    try {
      // Get all memories
      const memoryService = await this.getMemoryService();
      const memories = await memoryService.searchMemories("", {
        limit: options.limit || 100
      });
      
      // Group memories by time periods
      const timeGroups = {
        daily: {},
        weekly: {},
        monthly: {}
      };
      
      memories.forEach(memory => {
        if (memory.timestamp) {
          const date = new Date(memory.timestamp);
          
          // Daily pattern (hour of day)
          const hour = date.getHours();
          timeGroups.daily[hour] = (timeGroups.daily[hour] || 0) + 1;
          
          // Weekly pattern (day of week)
          const dayOfWeek = date.getDay();
          timeGroups.weekly[dayOfWeek] = (timeGroups.weekly[dayOfWeek] || 0) + 1;
          
          // Monthly pattern (day of month)
          const dayOfMonth = date.getDate();
          timeGroups.monthly[dayOfMonth] = (timeGroups.monthly[dayOfMonth] || 0) + 1;
        }
      });
      
      // Process daily patterns
      const dailyPatterns = Object.entries(timeGroups.daily)
        .map(([hour, count]) => ({
          type: 'daily',
          hour: parseInt(hour),
          count,
          frequency: count / memories.length
        }))
        .sort((a, b) => b.count - a.count);
      
      // Process weekly patterns
      const weeklyPatterns = Object.entries(timeGroups.weekly)
        .map(([day, count]) => ({
          type: 'weekly',
          day: parseInt(day),
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
          count,
          frequency: count / memories.length
        }))
        .sort((a, b) => b.count - a.count);
      
      // Process monthly patterns
      const monthlyPatterns = Object.entries(timeGroups.monthly)
        .map(([day, count]) => ({
          type: 'monthly',
          day: parseInt(day),
          count,
          frequency: count / memories.length
        }))
        .sort((a, b) => b.count - a.count);
      
      return {
        daily: dailyPatterns,
        weekly: weeklyPatterns,
        monthly: monthlyPatterns
      };
    } catch (error) {
      console.error('Error detecting temporal patterns:', error);
      throw error;
    }
  }
  
  /**
   * Find all patterns in memories
   * @param {Object} options - Options for pattern detection
   * @returns {Object} - Object containing all detected patterns
   */
  async findAllPatterns(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const [topicPatterns, entityCooccurrences, temporalPatterns] = await Promise.all([
        this.detectTopicPatterns(options),
        this.detectEntityCooccurrences(options),
        this.detectTemporalPatterns(options)
      ]);
      
      return {
        topics: topicPatterns,
        entityCooccurrences,
        temporal: temporalPatterns,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error finding all patterns:', error);
      throw error;
    }
  }

  /**
   * Detect patterns in content without storing it
   * @param {string} content - The content to analyze
   * @returns {Promise<Array>} Array of detected patterns
   */
  async detectPatternsInContent(content) {
    if (!this.initialized) await this.initialize();
    
    try {
      return await this.processContent(content, {
        timestamp: new Date().toISOString(),
        context: { source: 'direct-analysis' }
      });
    } catch (error) {
      console.error('Error detecting patterns:', error);
      return [];
    }
  }

  async learnFromMemory(memory) {
    const patterns = await this.detectPatternsInContent(memory.content);
    await this.storage.storePatterns(patterns);
    return patterns;
  }

  async generateInsights(options = {}) {
    const patterns = await this.storage.searchPatterns(options);
    return this.insightGenerator.generateFromPatterns(patterns);
  }
}

export function detectTemporalPatterns(text) {
  // Implementation from lines 45-78
  // ... existing code ...
}

export default PatternService; 