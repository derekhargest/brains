import { describe, test, beforeAll, after } from './testUtils.js';
import { PatternLearner, NLPPatternDetector } from '../patternMatching/patternLearner.js';
import assert from 'assert';
import path from 'path';
import { promises as fs } from 'fs';
import { TfIdf } from 'natural';
import PatternSystem from '../patternMatching/patternSystem.js';

describe('Pattern System', () => {
  let system;

  beforeEach(() => {
    system = new PatternSystem();
  });

  test('should detect basic patterns', async () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const patterns = await system.detectPatterns(text);
    
    assert(Array.isArray(patterns));
    assert(patterns.length > 0);
    assert(patterns[0].hasOwnProperty('type'));
  });

  test('should calculate pattern similarity', () => {
    const pattern1 = {
      type: 'sequence',
      content: 'test pattern one',
      confidence: 0.8
    };
    
    const pattern2 = {
      type: 'sequence',
      content: 'test pattern two',
      confidence: 0.7
    };
    
    const similarity = system.calculatePatternSimilarity(pattern1, pattern2);
    assert(typeof similarity === 'number');
    assert(similarity >= 0 && similarity <= 1);
  });

  test('should merge similar patterns', async () => {
    const patterns = [
      { type: 'sequence', content: 'first pattern', confidence: 0.8 },
      { type: 'sequence', content: 'similar pattern', confidence: 0.7 },
      { type: 'sequence', content: 'completely different', confidence: 0.9 }
    ];
    
    const merged = await system.mergePatterns(patterns);
    assert(Array.isArray(merged));
    assert(merged.length < patterns.length);
  });

  test('should handle empty input', async () => {
    const patterns = await system.detectPatterns('');
    assert(Array.isArray(patterns));
    assert(patterns.length === 0);
  });
});

describe('Pattern Recognition System Integration Tests', () => {
  let learner;
  
  beforeAll(async () => {
    // Create a fresh pattern learner for the entire test suite
    learner = new PatternLearner();
    await learner.initialize();
  });
  
  test('should process a series of related memories and build concept graph', async () => {
    // Series of memories with related concepts and patterns
    const memories = [
      "Morning coffee while coding at 9am",
      "Team meeting with Sarah at 2pm about the AI project",
      "Debugging session with David went well",
      "Working on the new machine learning model until late",
      "Coffee with Sarah to discuss project progress at 10am",
      "Feeling excited about the AI demo tomorrow morning"
    ];
    
    // Process each memory in sequence
    for (const memory of memories) {
      const patterns = await learner.learnFromMemory(memory);
      assert(patterns.length > 0, `Expected patterns for memory: ${memory}`);
      
      // Verify each pattern has required properties
      patterns.forEach(pattern => {
        assert(pattern.type, 'Pattern should have a type');
        assert(pattern.confidence > 0, 'Pattern should have confidence > 0');
        assert(pattern.timestamp, 'Pattern should have timestamp');
      });
    }
    
    // Get stats and verify patterns were stored
    const stats = await learner.storage.getStats();
    console.log('Final stats:', JSON.stringify(stats, null, 2));
    
    // Check that different pattern types were detected
    assert(stats.patterns.temporal.length > 0, 'Expected temporal patterns');
    assert(stats.patterns.relational.length > 0, 'Expected relational patterns');
    
    // Check for specific pattern matches
    const allPatterns = Object.values(stats.patterns).flat();
    
    // Find patterns related to key concepts
    const aiPatterns = allPatterns.filter(p => 
      p.matches && p.matches.some(m => 
        m.value && m.value.toLowerCase().includes('ai')));
    
    const sarahPatterns = allPatterns.filter(p => 
      p.matches && p.matches.some(m => 
        m.value && m.value.toLowerCase().includes('sarah')));
    
    assert(aiPatterns.length > 0, 'Expected to find AI-related patterns');
    assert(sarahPatterns.length > 0, 'Expected to find Sarah-related patterns');
  });
  
  test('should generate meaningful insights from detected patterns', async () => {
    // Get insights
    const insights = await learner.getInsights();
    console.log('Generated insights:', JSON.stringify(insights, null, 2));
    
    // Check concept insights
    assert(insights.conceptualInsights.centralConcepts.length > 0, 
      'Expected to find central concepts');
    
    // Check relationship insights
    assert(insights.relationshipInsights.length > 0, 
      'Expected to find relationship insights');
    
    // Check for emerging patterns
    assert(insights.emergingPatterns.length > 0, 
      'Expected to find emerging patterns');
    
    // Verify that concepts are connected in the concept graph
    const aiConcept = insights.conceptualInsights.centralConcepts
      .find(c => c.concept && c.concept.toLowerCase().includes('ai'));
    
    if (aiConcept) {
      assert(aiConcept.relatedConcepts.length > 0, 
        'Expected AI concept to have related concepts');
    }
    
    // Check temporal insights
    assert(insights.temporalInsights.patterns.length > 0,
      'Expected to find temporal insights');
  });
  
  test('should detect complex patterns from a single detailed memory', async () => {
    // A complex memory with multiple pattern types
    const complexMemory = 
      "Had an important team meeting on Tuesday morning with Sarah and David " +
      "to plan the AI project timeline. Everyone felt excited about the new " +
      "machine learning approach, but we're worried about the tight deadline. " +
      "We agreed to start coding next Monday and meet daily at 9am for updates.";
    
    // Learn from the complex memory
    const patterns = await learner.learnFromMemory(complexMemory);
    
    // Check pattern diversity
    const patternTypes = patterns.map(p => p.type);
    const uniqueTypes = [...new Set(patternTypes)];
    
    console.log('Detected pattern types:', uniqueTypes);
    assert(uniqueTypes.length >= 4, 
      'Expected at least 4 different pattern types from complex memory');
    
    // Check for specific patterns
    assert(patternTypes.includes('temporal'), 
      'Expected temporal patterns in complex memory');
    assert(patternTypes.includes('relational'), 
      'Expected relational patterns in complex memory');
    assert(patternTypes.includes('emotional'), 
      'Expected emotional patterns in complex memory');
    assert(patternTypes.includes('behavioral') || patternTypes.includes('topical'), 
      'Expected behavioral or topical patterns in complex memory');
    
    // Check for multiple temporal patterns (Tuesday, Monday, 9am)
    const temporalPatterns = patterns.filter(p => p.type === 'temporal');
    assert(temporalPatterns.length >= 3, 
      'Expected at least 3 temporal patterns in complex memory');
    
    // Check for multiple people (Sarah, David)
    const relationalPatterns = patterns.filter(p => p.type === 'relational');
    const people = new Set();
    
    relationalPatterns.forEach(pattern => {
      if (pattern.matches) {
        pattern.matches.forEach(match => {
          if (match.type === 'person' && match.value) {
            people.add(match.value.toLowerCase());
          }
        });
      }
    });
    
    assert(people.size >= 2, 
      'Expected at least 2 people in relational patterns');
  });
  
  test('should recognize pattern evolution over time', async () => {
    // Add a series of memories that show a pattern evolving
    const evolutionMemories = [
      "Started learning about machine learning basics",
      "Reading more advanced machine learning tutorials",
      "Building my first neural network model",
      "Experimenting with different AI architectures",
      "Successfully deployed my machine learning model to production"
    ];
    
    // Process each memory with timestamps one day apart
    let timestamp = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (const memory of evolutionMemories) {
      // Mock the timestamp to simulate passage of time
      const patterns = await learner.detectPatterns(memory, { timestamp });
      
      // Store patterns with the mocked timestamp
      for (const pattern of patterns) {
        await learner.handlePattern(pattern);
      }
      
      // Advance timestamp by one day
      timestamp += dayInMs;
    }
    
    // Get insights with a specific focus on the learning concept
    const insights = await learner.getInsights({ 
      conceptFilter: 'learning',
      timeRange: 7 * dayInMs  // Look at the last 7 days
    });
    
    // Check emerging patterns related to the learning journey
    const learningPatterns = insights.emergingPatterns.filter(p => 
      p.pattern.includes('learning') || 
      p.pattern.includes('model') || 
      p.pattern.includes('ai'));
    
    assert(learningPatterns.length > 0, 
      'Expected to find learning-related emerging patterns');
    
    // At least one pattern should show progression
    const progressionFound = learningPatterns.some(p => p.occurrences >= 2);
    assert(progressionFound, 
      'Expected to find at least one recurring learning pattern');
  });
  
  test('should handle ambiguous and mixed pattern content', async () => {
    // Ambiguous memory with potential for misclassification
    const ambiguousMemory = 
      "Looking forward to Spring, when April showers bring May flowers. " +
      "My friend April and I are planning a trip.";
    
    // Learn from ambiguous memory
    const patterns = await learner.learnFromMemory(ambiguousMemory);
    
    // Check that "April" was detected as both a month and a person
    const temporalPatterns = patterns.filter(p => p.type === 'temporal');
    const relationalPatterns = patterns.filter(p => p.type === 'relational');
    
    // We should have both temporal and relational patterns
    assert(temporalPatterns.length > 0, 'Expected temporal patterns for ambiguous memory');
    assert(relationalPatterns.length > 0, 'Expected relational patterns for ambiguous memory');
    
    // Check for April as a month
    const aprilAsMonth = temporalPatterns.some(p => 
      p.matches && p.matches.some(m => 
        m.value && m.value.toLowerCase().includes('april')));
    
    // Check for April as a person
    const aprilAsPerson = relationalPatterns.some(p => 
      p.matches && p.matches.some(m => 
        m.value && m.value.toLowerCase() === 'april'));
    
    // One of these should be true, depending on how the detector handles ambiguity
    assert(aprilAsMonth || aprilAsPerson, 
      'Expected to detect "April" as either month or person');
    
    // Check for emotional patterns in "looking forward"
    const emotionalPatterns = patterns.filter(p => p.type === 'emotional');
    assert(emotionalPatterns.length > 0, 
      'Expected emotional patterns for "looking forward"');
  });
}); 