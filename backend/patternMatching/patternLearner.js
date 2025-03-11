import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { NLPPatternDetector } from '../patterns/detectors/nlpDetector.js';
import { natural } from 'natural';
import { TfIdf } from 'natural';
import PatternStorage from './patternStorage';

export class PatternLearner extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      minConfidence: 0.7,
      maxPatterns: 1000,
      ...options
    };
    this.patterns = new Map();
    this.detector = new NLPPatternDetector();
    this.initialized = false;
    this.state = 'uninitialized';
    this.storage = new TestPatternStorage();
    this.conceptGraph = new ConceptGraph();
  }

  async initialize() {
    if (this.state !== 'uninitialized') return;
    
    try {
      await this.storage.initialize();
      await this.detector.initialize();
      this.state = 'ready';
      return true;
    } catch (error) {
      console.error('Error initializing pattern learner:', error);
      throw error;
    }
  }

  initializeEventHandlers() {
    this.on('pattern:detected', this.handlePattern.bind(this));
    this.on('error', this.handleError.bind(this));
  }

  async learnFromMemory(content, context = {}) {
    if (!content || typeof content !== 'string' || content.trim() === '') {
      console.log('Skipping empty or invalid content');
      return [];
    }
    
    console.log(`Learning from memory: "${content}"`);
    
    try {
      // Use our NLPDetector to find patterns
      const detectedPatterns = await this.detectPatterns(content, context);
      console.log(`Detected ${detectedPatterns.length} patterns`);
      
      // Process each detected pattern
      for (const pattern of detectedPatterns) {
        await this.handlePattern(pattern);
      }
      
      return detectedPatterns;
    } catch (error) {
      console.error('PatternLearner error:', error);
      return [];
    }
  }

  async detectPatterns(content, context = {}) {
    if (!content || content.trim() === '') {
      console.log('Empty content in detectPatterns');
      return [];
    }
    
    try {
      console.log(`Detecting patterns in: "${content}"`);
      
      // First, use the legacy detection methods for compatibility
      const temporalPattern = this.detectTemporalPattern(content);
      const relationalPattern = this.detectRelationalPattern(content);
      const topicalPattern = this.detectTopicalPattern(content);
      
      const patterns = [];
      
      // Add legacy patterns if found
      if (temporalPattern) {
        patterns.push(temporalPattern);
      }
      if (relationalPattern) {
        patterns.push(relationalPattern);
      }
      if (topicalPattern) {
        patterns.push(topicalPattern);
      }
      
      // Use the NLPPatternDetector for more sophisticated detection
      if (this.detector) {
        console.log('Using NLPPatternDetector...');
        const result = await this.detector.detectPatterns(content, context);
        console.log('NLPPatternDetector result:', JSON.stringify(result));
        
        if (result && result.patterns) {
          // For each pattern type (temporal, relational, etc.)
          Object.entries(result.patterns).forEach(([type, patternData]) => {
            if (patternData && patternData.matches && patternData.matches.length > 0) {
              // Create a pattern object for each match
              patterns.push({
                type,
                matches: patternData.matches,
                confidence: patternData.confidence,
                timestamp: context.timestamp || Date.now(),
                id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
              });
            }
          });
        }
      }
      
      console.log(`Total patterns detected: ${patterns.length}`);
      return patterns;
    } catch (error) {
      console.error('Error detecting patterns:', error);
      return [];
    }
  }

  async handlePattern(pattern) {
    if (!pattern || !pattern.type) {
      console.log('Invalid pattern in handlePattern');
      return false;
    }
    
    console.log(`Handling pattern of type: ${pattern.type}`);
    
    try {
      // Store the pattern
      await this.storage.storePattern(pattern);
      
      // Extract concepts from the pattern for the concept graph
      const concepts = this.extractConcepts(pattern);
      if (concepts && concepts.length > 0) {
        this.conceptGraph.addConcepts(concepts, pattern.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error handling pattern:', error);
      return false;
    }
  }

  // Legacy pattern detection methods for compatibility
  detectTemporalPattern(content) {
    const timeRegex = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|morning|afternoon|evening|night|today|tomorrow|yesterday)\b/i;
    const matches = content.match(timeRegex);
    
    return matches ? {
      type: 'temporal',
      matches: matches.map(m => ({ type: 'time', value: m, confidence: 0.9 })),
      confidence: 0.9,
      timestamp: Date.now(),
      id: `temporal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    } : null;
  }

  detectRelationalPattern(content) {
    // Simple name detection (capitalized words that aren't at the start of the sentence)
    const nameRegex = /(?:^|[.!?]\s+)(?!the|a|an)([A-Z][a-z]+)\b/g;
    let match;
    const matches = [];
    
    while ((match = nameRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    // Also check for common names anywhere
    const commonNames = /\b(John|Jane|Sarah|Mike|David|Lisa|Emily|Michael|Jessica|Chris|Amanda|Mark|Rachel|Tom|Laura)\b/g;
    while ((match = commonNames.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    return matches.length > 0 ? {
      type: 'relational',
      matches: matches.map(m => ({ type: 'person', value: m, confidence: 0.85 })),
      confidence: 0.85,
      timestamp: Date.now(),
      id: `relational-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    } : null;
  }

  detectTopicalPattern(content) {
    const topicPattern = /\b(technology|science|business|health|education|coding|ai|meeting|project|presentation)\b/i;
    const matches = content.match(topicPattern);
    
    return matches ? {
      type: 'topical',
      matches: matches.map(m => ({ type: 'topic', value: m, confidence: 0.8 })),
      confidence: 0.8,
      timestamp: Date.now(),
      id: `topical-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    } : null;
  }

  extractConcepts(pattern) {
    if (!pattern || !pattern.matches) return [];
    
    const concepts = new Set();
    
    pattern.matches.forEach(match => {
      if (match.value) {
        const concept = match.value.toLowerCase();
        concepts.add(concept);
      }
    });
    
    return Array.from(concepts);
  }

  handleError(error) {
    console.error('PatternLearner error:', error);
    if (this.storage && typeof this.storage.logMiss === 'function') {
      this.storage.logMiss('Error processing memory');
    }
  }

  async getInsights(options = {}) {
    try {
      const stats = await this.storage.getStats() || { patterns: {} };
      const allPatterns = [];
      
      // Defensive check for stats.patterns
      if (!stats.patterns) {
        stats.patterns = {};
      }
      
      Object.entries(stats.patterns).forEach(([type, patterns]) => {
        if (Array.isArray(patterns)) {
          allPatterns.push(...patterns);
        }
      });
      
      // Find central concepts from topical and behavioral patterns
      const conceptMap = new Map();
      
      allPatterns.forEach(pattern => {
        if (!pattern) return;
        
        if (pattern.type === 'topical' || pattern.type === 'behavioral') {
          if (Array.isArray(pattern.matches)) {
            pattern.matches.forEach(match => {
              if (!match || typeof match.value !== 'string') return;
              
              const concept = match.value.toLowerCase();
              if (!conceptMap.has(concept)) {
                conceptMap.set(concept, {
                  concept,
                  frequency: 1,
                  relatedConcepts: new Set(),
                  confidence: match.confidence || 0.5,
                  strength: 1
                });
              } else {
                const existing = conceptMap.get(concept);
                existing.frequency++;
                existing.strength++;
                existing.confidence = Math.max(existing.confidence || 0, match.confidence || 0);
              }
              
              // Build relationships between concepts in same memory
              if (Array.isArray(pattern.matches)) {
                pattern.matches.forEach(otherMatch => {
                  if (!otherMatch || typeof otherMatch.value !== 'string') return;
                  
                  const otherConcept = otherMatch.value.toLowerCase();
                  if (otherConcept !== concept) {
                    conceptMap.get(concept).relatedConcepts.add(otherConcept);
                  }
                });
              }
            });
          }
        }
      });

      // Convert to array and sort by frequency
      const centralConcepts = Array.from(conceptMap.values())
        .map(c => ({
          ...c,
          relatedConcepts: Array.from(c.relatedConcepts),
          strength: c.relatedConcepts.size + c.frequency
        }))
        .sort((a, b) => b.strength - a.strength);

      // Generate relationship insights
      const relationshipInsights = [];
      centralConcepts.forEach(concept => {
        concept.relatedConcepts.forEach(related => {
          if (conceptMap.has(related)) {
            relationshipInsights.push({
              source: concept.concept,
              target: related,
              strength: concept.frequency * (conceptMap.get(related)?.frequency || 1),
              confidence: (concept.confidence + (conceptMap.get(related)?.confidence || 0)) / 2
            });
          }
        });
      });

      // Generate emerging patterns
      const emergingPatterns = this.findEmergingPatterns(allPatterns);

      // Generate temporal insights
      const temporalPatterns = allPatterns.filter(p => p.type === 'temporal');
      
      // Safe fallbacks for all returned properties
      return {
        conceptualInsights: {
          centralConcepts: centralConcepts || [],
          timestamp: new Date().toISOString()
        },
        relationshipInsights: relationshipInsights?.sort((a, b) => b.strength - a.strength) || [],
        emergingPatterns: emergingPatterns || [],
        temporalInsights: {
          patterns: temporalPatterns || [],
          distribution: this.analyzeTemporalDistribution(temporalPatterns || [])
        }
      };
    } catch (error) {
      console.error("Error generating insights:", error);
      // Return a safe fallback structure if anything fails
      return {
        conceptualInsights: { centralConcepts: [], timestamp: new Date().toISOString() },
        relationshipInsights: [],
        emergingPatterns: [],
        temporalInsights: { patterns: [], distribution: { hourly: [], daily: [], peakHour: 0, peakDay: 0 } }
      };
    }
  }

  // Helper method to find emerging patterns
  findEmergingPatterns(allPatterns) {
    const patternGroups = new Map();
    
    allPatterns.forEach(pattern => {
      pattern.matches?.forEach(match => {
        if (!match || !match.value) return;
        
        const key = `${pattern.type}:${match.value.toLowerCase()}`;
        if (!patternGroups.has(key)) {
          patternGroups.set(key, []);
        }
        patternGroups.get(key).push(pattern);
      });
    });
    
    const emergingPatterns = [];
    
    patternGroups.forEach((patterns, key) => {
      if (patterns.length >= 2) {
        const [patternType, patternValue] = key.split(':');
        
        emergingPatterns.push({
          pattern: patternValue,
          type: patternType,
          occurrences: patterns.length,
          firstSeen: Math.min(...patterns.map(p => p.timestamp || 0)),
          lastSeen: Math.max(...patterns.map(p => p.timestamp || 0))
        });
      }
    });
    
    return emergingPatterns.sort((a, b) => b.occurrences - a.occurrences);
  }

  // Helper method to analyze temporal distribution
  analyzeTemporalDistribution(temporalPatterns) {
    const hourDistribution = Array(24).fill(0);
    const dayDistribution = Array(7).fill(0);
    
    temporalPatterns.forEach(pattern => {
      if (pattern.timestamp) {
        const date = new Date(pattern.timestamp);
        const hour = date.getHours();
        const day = date.getDay();
        
        hourDistribution[hour]++;
        dayDistribution[day]++;
      }
    });
    
    return {
      hourly: hourDistribution,
      daily: dayDistribution,
      peakHour: hourDistribution.indexOf(Math.max(...hourDistribution)),
      peakDay: dayDistribution.indexOf(Math.max(...dayDistribution))
    };
  }
}

export default PatternLearner; 