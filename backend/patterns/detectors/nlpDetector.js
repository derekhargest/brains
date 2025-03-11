import TemporalPatternDetector from './temporalDetector.js';
import TopicalPatternDetector from './topicalDetector.js';
import BehavioralPatternDetector from './behavioralDetector.js';
import RelationDetector from './relationDetector.js';

export class NLPPatternDetector {
  constructor() {
    this.initialized = false;
    this.detectors = {
      temporal: new TemporalPatternDetector(),
      topical: new TopicalPatternDetector(),
      behavioral: new BehavioralPatternDetector(),
      relational: new RelationDetector()
    };
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    // Initialize all detectors
    for (const [type, detector] of Object.entries(this.detectors)) {
      await detector.initialize();
    }
    
    this.initialized = true;
    return true;
  }
  
  async detectPatterns(text, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return { patterns: {}, confidence: 0 };
    }
    
    const patterns = {};
    let totalConfidence = 0;
    let detectorCount = 0;
    
    // Run all detectors
    for (const [type, detector] of Object.entries(this.detectors)) {
      try {
        const result = await detector.detectPatterns(text, context);
        
        if (result && result.matches && result.matches.length > 0) {
          patterns[type] = result;
          totalConfidence += result.confidence || 0;
          detectorCount++;
        }
      } catch (error) {
        console.error(`Error in ${type} detector:`, error);
      }
    }
    
    // Calculate overall confidence
    const overallConfidence = detectorCount > 0 ? totalConfidence / detectorCount : 0;
    
    return {
      patterns,
      confidence: overallConfidence
    };
  }
}

export default NLPPatternDetector; 