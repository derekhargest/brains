const PatternStorage = require('./patternStorage');
const fileStorage = require('../../utils/fileStorage');

/**
 * Pattern storage with file persistence
 */
class TestPatternStorage extends PatternStorage {
  constructor() {
    super();
    this.patterns = [];
    this.insights = [];
    this.filename = 'patterns.json';
    this.insightsFilename = 'insights.json';
  }
  
  async initialize() {
    // Load data from files
    const patternsData = await fileStorage.load(this.filename, { patterns: [], stats: this.stats });
    this.patterns = patternsData.patterns || [];
    this.stats = patternsData.stats || this.stats;
    
    const insightsData = await fileStorage.load(this.insightsFilename, { insights: [] });
    this.insights = insightsData.insights || [];
    
    console.log(`Loaded ${this.patterns.length} patterns and ${this.insights.length} insights`);
    
    this.initialized = true;
    return true;
  }
  
  async _savePatterns() {
    return fileStorage.save(this.filename, {
      patterns: this.patterns,
      stats: this.stats
    });
  }
  
  async _saveInsights() {
    return fileStorage.save(this.insightsFilename, {
      insights: this.insights
    });
  }
  
  async storePattern(pattern) {
    if (!pattern || !pattern.id) {
      throw new Error('Invalid pattern: missing id');
    }
    
    // Update an existing pattern or add a new one
    const existingIndex = this.patterns.findIndex(p => p.id === pattern.id);
    
    if (existingIndex >= 0) {
      this.patterns[existingIndex] = { ...pattern };
    } else {
      this.patterns.push({ ...pattern });
      this.stats.totalPatterns++;
    }
    
    // Update stats
    this.stats.totalMatches++;
    this.stats.averageConfidence = (
      (this.stats.averageConfidence * (this.stats.totalMatches - 1)) + 
      (pattern.confidence || 0)
    ) / this.stats.totalMatches;
    
    await this._savePatterns();
    return true;
  }
  
  async getPattern(id) {
    return this.patterns.find(p => p.id === id) || null;
  }
  
  async getPatternsByType(type) {
    return this.patterns.filter(p => p.type === type);
  }
  
  async getPatternsBySource(source) {
    return this.patterns.filter(p => p.source === source);
  }
  
  async getAllPatterns() {
    return [...this.patterns];
  }
  
  async deletePattern(id) {
    const initialLength = this.patterns.length;
    this.patterns = this.patterns.filter(p => p.id !== id);
    
    if (this.patterns.length < initialLength) {
      await this._savePatterns();
      return true;
    }
    return false;
  }
  
  async clearPatterns() {
    this.patterns = [];
    this.stats = {
      totalPatterns: 0,
      totalMatches: 0,
      totalMisses: 0,
      averageConfidence: 0
    };
    
    await this._savePatterns();
    return true;
  }
  
  async storeInsight(insight) {
    if (!insight || !insight.id) {
      throw new Error('Invalid insight: missing id');
    }
    
    // Update an existing insight or add a new one
    const existingIndex = this.insights.findIndex(i => i.id === insight.id);
    
    if (existingIndex >= 0) {
      this.insights[existingIndex] = { ...insight };
    } else {
      this.insights.push({ ...insight });
    }
    
    await this._saveInsights();
    return true;
  }
  
  async getInsights() {
    return [...this.insights];
  }
}

module.exports = TestPatternStorage; 