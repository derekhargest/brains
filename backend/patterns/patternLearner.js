/**
 * Pattern Learner
 * 
 * Detects patterns in memories and extracts meaningful information
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

export class PatternLearner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      minConfidence: 0.7,
      maxPatterns: 1000,
      ...options
    };
    this.patterns = new Map();
    this.storage = {
      patterns: []
    };
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return true;
    // Initialization code
    this.initialized = true;
    return true;
  }
  
  async storePattern(pattern) {
    this.storage.patterns.push(pattern);
    return pattern;
  }
  
  getPatterns() {
    return this.storage.patterns;
  }
  
  async learnFromMemory(content, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // If content is an object with a content property, extract just the text
    const text = typeof content === 'object' && content.content 
      ? content.content 
      : content;
    
    const patterns = [];
    
    // Simple pattern detection - find repeated words
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = {};
    
    words.forEach(word => {
      if (word.length > 3) { // Only consider words longer than 3 chars
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    // Find words that appear multiple times
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count > 1) {
        const pattern = {
          id: `repeated-${word}-${Date.now()}`,
          type: 'repeated_word',
          content: word,
          count: count,
          source: text,
          confidence: 0.5 + (count * 0.1) // Higher count = higher confidence
        };
        patterns.push(pattern);
        this.storePattern(pattern);
      }
    });
    
    // Detect time patterns
    const timeWords = ['morning', 'afternoon', 'evening', 'night', 'tomorrow', 'yesterday', 'today'];
    timeWords.forEach(timeWord => {
      if (text.toLowerCase().includes(timeWord)) {
        const pattern = {
          id: `time-${timeWord}-${Date.now()}`,
          type: 'time_reference',
          content: timeWord,
          source: text,
          confidence: 0.8
        };
        patterns.push(pattern);
        this.storePattern(pattern);
      }
    });
    
    // Detect people references (very simple implementation)
    const nameMatches = text.match(/\b[A-Z][a-z]+\b/g);
    if (nameMatches) {
      nameMatches.forEach(name => {
        const pattern = {
          id: `person-${name}-${Date.now()}`,
          type: 'relational',
          content: name,
          source: text,
          confidence: 0.7
        };
        patterns.push(pattern);
        this.storePattern(pattern);
      });
    }
    
    // Look for time expressions (e.g., 2pm)
    const timeRegex = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/gi;
    let timeMatch;
    while ((timeMatch = timeRegex.exec(text)) !== null) {
      const pattern = {
        id: `time-exact-${timeMatch[1]}-${Date.now()}`,
        type: 'temporal',
        content: timeMatch[1],
        source: text,
        confidence: 0.9
      };
      patterns.push(pattern);
      this.storePattern(pattern);
    }
    
    // Detect topic patterns - common terms in business/tech
    const topics = ['meeting', 'project', 'database', 'performance', 'issue', 'problem', 'solution'];
    topics.forEach(topic => {
      if (text.toLowerCase().includes(topic.toLowerCase())) {
        const pattern = {
          id: `topic-${topic}-${Date.now()}`,
          type: 'topical',
          content: topic,
          source: text,
          confidence: 0.75
        };
        patterns.push(pattern);
        this.storePattern(pattern);
      }
    });
    
    return patterns;
  }
  
  async detectPatterns(content, options = {}) {
    return this.learnFromMemory(content, options);
  }
  
  async getInsights(options = {}) {
    const patterns = this.getPatterns();
    
    // Find central concepts
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
    
    return {
      centralConcepts,
      temporalPatterns: patterns.filter(p => p.type === 'temporal' || p.type === 'time_reference'),
      relationalPatterns: patterns.filter(p => p.type === 'relational')
    };
  }

  /**
   * Process content to detect patterns
   * @param {string} content - The content to analyze
   * @param {object} options - Processing options
   * @returns {Promise<Array>} Array of detected patterns
   */
  async processContent(content, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Extract text if content is an object
    const text = typeof content === 'object' && content.content 
      ? content.content 
      : content;

    // Detect patterns
    const patterns = await this.detectPatterns(text, options);

    // Store patterns
    for (const pattern of patterns) {
      await this.storePattern(pattern);
    }

    return patterns;
  }
}

export default PatternLearner; 