/**
 * Abstract pattern storage interface
 * This defines the contract that all pattern storage implementations must follow
 */
import fs from 'fs/promises';
import path from 'path';

export class PatternStorage {
  constructor(options = {}) {
    this.dbPath = options.dbPath || './patterns.json';
    this.patterns = [];
    this.loaded = false;
    this.initialized = false;
    this.stats = {
      totalPatterns: 0,
      totalMatches: 0,
      totalMisses: 0,
      averageConfidence: 0
    };
  }
  
  async initialize() {
    this.initialized = true;
    return true;
  }
  
  async storePattern(pattern) {
    throw new Error('Method not implemented: storePattern');
  }
  
  async getPattern(id) {
    throw new Error('Method not implemented: getPattern');
  }
  
  async getPatternsByType(type) {
    throw new Error('Method not implemented: getPatternsByType');
  }
  
  async getPatternsBySource(source) {
    throw new Error('Method not implemented: getPatternsBySource');
  }
  
  async getAllPatterns() {
    throw new Error('Method not implemented: getAllPatterns');
  }
  
  async deletePattern(id) {
    throw new Error('Method not implemented: deletePattern');
  }
  
  async clearPatterns() {
    throw new Error('Method not implemented: clearPatterns');
  }
  
  async getStats() {
    return this.stats;
  }
  
  async storeInsight(insight) {
    throw new Error('Method not implemented: storeInsight');
  }
  
  async getInsights() {
    throw new Error('Method not implemented: getInsights');
  }
}

export default PatternStorage; 