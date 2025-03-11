const { describe, test } = require('./testUtils');
const NLPPatternDetector = require('../patternMatching/nlpPatternDetector');
const assert = require('assert');

describe('NLP Pattern Detector Tests', () => {
  test('should detect temporal patterns', async () => {
    const detector = new NLPPatternDetector();
    await detector.initialize();
    
    const cases = [
      {
        input: "Meeting at 2pm tomorrow",
        expectedTypes: ['temporal'],
        expectedMatches: 2 // "2pm" and "tomorrow"
      },
      {
        input: "I'll be working on Tuesday morning",
        expectedTypes: ['temporal'],
        expectedMatches: 2 // "Tuesday" and "morning"
      },
      {
        input: "Let's meet in the afternoon",
        expectedTypes: ['temporal'],
        expectedMatches: 1 // "afternoon"
      }
    ];
    
    for (const testCase of cases) {
      const result = await detector.detectPatterns(testCase.input);
      
      // Check that temporal patterns were detected
      if (testCase.expectedTypes.includes('temporal')) {
        assert(result.patterns.temporal, `Expected temporal pattern in: ${testCase.input}`);
        assert(result.patterns.temporal.matches.length >= testCase.expectedMatches, 
               `Expected at least ${testCase.expectedMatches} temporal matches in: ${testCase.input}`);
      }
      
      // Verify confidence score
      if (result.patterns.temporal) {
        assert(result.patterns.temporal.confidence > 0, 
               `Expected positive confidence score for: ${testCase.input}`);
      }
    }
  });
  
  test('should detect relational patterns', async () => {
    const detector = new NLPPatternDetector();
    await detector.initialize();
    
    const cases = [
      {
        input: "Meeting with Sarah about the project",
        expectedNames: ['Sarah'],
        expectedTypes: ['relational']
      },
      {
        input: "John and David are working on the new feature",
        expectedNames: ['John', 'David'],
        expectedTypes: ['relational']
      }
    ];
    
    for (const testCase of cases) {
      const result = await detector.detectPatterns(testCase.input);
      
      // Check for relational patterns
      if (testCase.expectedTypes.includes('relational')) {
        assert(result.patterns.relational, `Expected relational pattern in: ${testCase.input}`);
        
        // Check for names
        if (testCase.expectedNames) {
          const detectedNames = result.patterns.relational.matches
            .filter(m => m.type === 'person')
            .map(m => m.value);
            
          testCase.expectedNames.forEach(name => {
            assert(detectedNames.includes(name), `Expected to find name "${name}" in: ${testCase.input}`);
          });
        }
      }
    }
  });
  
  test('should detect behavioral patterns', async () => {
    const detector = new NLPPatternDetector();
    await detector.initialize();
    
    const cases = [
      {
        input: "Working on the new feature today",
        expectedActions: ['Working'],
        expectedTypes: ['behavioral']
      },
      {
        input: "I always code in the morning",
        expectedActions: ['code'],
        expectedRoutines: ['always'],
        expectedTypes: ['behavioral']
      }
    ];
    
    for (const testCase of cases) {
      const result = await detector.detectPatterns(testCase.input);
      
      // Check for behavioral patterns
      if (testCase.expectedTypes.includes('behavioral')) {
        assert(result.patterns.behavioral, `Expected behavioral pattern in: ${testCase.input}`);
        
        // Check for actions
        if (testCase.expectedActions) {
          const detectedActions = result.patterns.behavioral.matches
            .filter(m => m.type === 'action')
            .map(m => m.value.toLowerCase());
            
          testCase.expectedActions.forEach(action => {
            assert(detectedActions.some(a => a.toLowerCase().includes(action.toLowerCase())), 
                   `Expected to find action "${action}" in: ${testCase.input}`);
          });
        }
      }
    }
  });
  
  test('should detect multiple pattern types', async () => {
    const detector = new NLPPatternDetector();
    await detector.initialize();
    
    const testCases = [
      {
        input: "Meeting with Sarah at 2pm to discuss the AI project",
        expectedTypes: ['temporal', 'relational', 'behavioral', 'topical']
      },
      {
        input: "I'm excited about the new coding challenge tomorrow",
        expectedTypes: ['temporal', 'emotional', 'topical']
      }
    ];
    
    for (const testCase of testCases) {
      const result = await detector.detectPatterns(testCase.input);
      
      // Check that all expected pattern types were detected
      testCase.expectedTypes.forEach(type => {
        assert(result.patterns[type], `Expected to find ${type} pattern in: ${testCase.input}`);
        assert(result.patterns[type].matches.length > 0, 
               `Expected ${type} pattern to have matches in: ${testCase.input}`);
      });
      
      // Check overall confidence
      assert(result.confidence > 0, `Expected positive overall confidence for: ${testCase.input}`);
    }
  });
}); 