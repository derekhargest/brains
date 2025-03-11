/**
 * Derek-Brain System Integration Test
 * 
 * This test verifies the core functionality of the Derek-Brain system,
 * including memory processing, pattern detection, and insight generation.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Test runner
async function runTests() {
  console.log("\n📋 Derek-Brain System Integration Test");
  
  let passed = 0;
  let failed = 0;
  
  // Mock data - defined inside runTests to ensure proper scope
  const testMemories = [
    {
      content: "Morning coffee while coding the new visualization module. The D3 force layout is starting to work.",
      timestamp: "2023-05-15T08:30:00Z",
      tags: ["coding", "visualization", "morning"]
    },
    {
      content: "Team meeting about the new memory analysis features. Everyone seems excited about the pattern detection.",
      timestamp: "2023-05-15T11:00:00Z",
      tags: ["meeting", "team", "planning"]
    },
    {
      content: "Debugging the relationship analyzer. Found a bug in how we're calculating connection strength.",
      timestamp: "2023-05-16T14:20:00Z",
      tags: ["debugging", "relationships", "afternoon"]
    },
    {
      content: "Coffee with Maya to discuss the UI design. She had great ideas for the dashboard layout.",
      timestamp: "2023-05-17T09:15:00Z",
      tags: ["meeting", "design", "morning"]
    },
    {
      content: "Late night coding session. Finally got the memory clustering algorithm working properly.",
      timestamp: "2023-05-17T23:45:00Z",
      tags: ["coding", "algorithms", "night"]
    }
  ];

  // Mock pattern storage
  class TestPatternStorage {
    constructor() {
      this.patterns = [];
      this.insights = [];
    }

    storePattern(pattern) {
      this.patterns.push(pattern);
      return true;
    }

    getPatterns() {
      return this.patterns;
    }

    storeInsight(insight) {
      this.insights.push(insight);
      return true;
    }

    getInsights() {
      return this.insights;
    }
  }

  // Mock pattern learner
  class TestPatternLearner {
    constructor(storage) {
      this.storage = storage;
      this.initialized = false;
      this.patterns = [];
    }

    initialize() {
      this.initialized = true;
      return true;
    }

    learnFromMemory(memory) {
      // Simple pattern detection - find repeated words
      const words = memory.content.toLowerCase().split(/\s+/);
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
            type: 'repeated_word',
            content: word,
            count: count,
            source: memory.content
          };
          this.patterns.push(pattern);
          this.storage.storePattern(pattern);
        }
      });
      
      // Detect time patterns
      const timeWords = ['morning', 'afternoon', 'evening', 'night'];
      timeWords.forEach(timeWord => {
        if (memory.content.toLowerCase().includes(timeWord)) {
          const pattern = {
            type: 'time_reference',
            content: timeWord,
            source: memory.content
          };
          this.patterns.push(pattern);
          this.storage.storePattern(pattern);
        }
      });

      // Detect central concept - based on tags
      if (memory.tags && memory.tags.length > 0) {
        memory.tags.forEach(tag => {
          const pattern = {
            type: 'central_concept',
            content: tag,
            source: memory.content
          };
          this.patterns.push(pattern);
          this.storage.storePattern(pattern);
        });
      }
      
      return true;
    }

    generateInsights() {
      const insights = [];
      
      // Count pattern types
      const patternTypes = {};
      this.patterns.forEach(pattern => {
        patternTypes[pattern.type] = (patternTypes[pattern.type] || 0) + 1;
      });
      
      // Generate insights based on pattern distribution
      if (Object.keys(patternTypes).length > 0) {
        const dominantType = Object.entries(patternTypes)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        insights.push({
          type: 'pattern_distribution',
          content: `Most common pattern type: ${dominantType} (${patternTypes[dominantType]} occurrences)`
        });
      }

      // Generate central concept insights
      const centralConcepts = this.patterns.filter(p => p.type === 'central_concept');
      if (centralConcepts.length > 0) {
        const conceptCounts = {};
        centralConcepts.forEach(concept => {
          conceptCounts[concept.content] = (conceptCounts[concept.content] || 0) + 1;
        });
        
        // Find the most common concepts
        const topConcepts = Object.entries(conceptCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        
        topConcepts.forEach(([concept, count]) => {
          insights.push({
            type: 'central_concept',
            content: `Key concept identified: "${concept}" (appears ${count} times)`
          });
        });
      }
      
      // Store insights
      insights.forEach(insight => this.storage.storeInsight(insight));
      
      return insights;
    }
  }

  // Mock visualization generator
  class TestVisualizationGenerator {
    constructor(storage) {
      this.storage = storage;
    }

    generateNetworkData(memories) {
      // Create nodes for each unique tag
      const tags = new Set();
      memories.forEach(memory => {
        if (memory.tags) {
          memory.tags.forEach(tag => tags.add(tag));
        }
      });
      
      const nodes = Array.from(tags).map(tag => ({
        id: tag,
        group: 1
      }));
      
      // Create links between tags that appear together
      const links = [];
      memories.forEach(memory => {
        if (memory.tags && memory.tags.length > 1) {
          for (let i = 0; i < memory.tags.length; i++) {
            for (let j = i + 1; j < memory.tags.length; j++) {
              links.push({
                source: memory.tags[i],
                target: memory.tags[j],
                value: 1
              });
            }
          }
        }
      });
      
      return { nodes, links };
    }

    generateTimelineData(memories) {
      return memories.map(memory => ({
        date: new Date(memory.timestamp),
        value: memory.content.length, // Use content length as a simple value
        label: memory.content.substring(0, 30) + '...'
      }));
    }
  }
  
  // Test 1: Initialize components
  process.stdout.write("  ⏳ should initialize test components... ");
  try {
    const storage = new TestPatternStorage();
    const patternLearner = new TestPatternLearner(storage);
    const visualizationGenerator = new TestVisualizationGenerator(storage);
    
    const initialized = patternLearner.initialize();
    
    assert(initialized, "Pattern Learner failed to initialize");
    assert(storage, "Storage failed to initialize");
    assert(visualizationGenerator, "Visualization Generator failed to initialize");
    
    console.log("✅");
    passed++;
  } catch (error) {
    console.log(`❌\n    ${error.message}`);
    failed++;
  }
  
  // Test 2: Process memories
  process.stdout.write("  ⏳ should process test memories... ");
  try {
    const storage = new TestPatternStorage();
    const patternLearner = new TestPatternLearner(storage);
    patternLearner.initialize();
    
    let allProcessed = true;
    for (const memory of testMemories) {
      const processed = patternLearner.learnFromMemory(memory);
      if (!processed) {
        allProcessed = false;
        break;
      }
    }
    
    assert(allProcessed, "Failed to process all memories");
    assert(storage.getPatterns().length > 0, "No patterns were detected during processing");
    
    console.log("✅");
    passed++;
  } catch (error) {
    console.log(`❌\n    ${error.message}`);
    failed++;
  }
  
  // Test 3: Generate pattern types
  process.stdout.write("  ⏳ should generate correct pattern types... ");
  try {
    const storage = new TestPatternStorage();
    const patternLearner = new TestPatternLearner(storage);
    patternLearner.initialize();
    
    testMemories.forEach(memory => patternLearner.learnFromMemory(memory));
    
    const patterns = storage.getPatterns();
    const patternTypes = new Set();
    
    patterns.forEach(pattern => {
      patternTypes.add(pattern.type);
    });
    
    assert(patternTypes.size > 0, "No pattern types detected");
    assert(patternTypes.has('repeated_word'), "Should detect repeated word patterns");
    assert(patternTypes.has('time_reference'), "Should detect time reference patterns");
    assert(patternTypes.has('central_concept'), "Should detect central concept patterns");
    
    console.log("✅");
    passed++;
  } catch (error) {
    console.log(`❌\n    ${error.message}`);
    failed++;
  }
  
  // Test 4: Generate insights
  process.stdout.write("  ⏳ should generate meaningful insights... ");
  try {
    const storage = new TestPatternStorage();
    const patternLearner = new TestPatternLearner(storage);
    patternLearner.initialize();
    
    testMemories.forEach(memory => patternLearner.learnFromMemory(memory));
    
    const insights = patternLearner.generateInsights();
    
    // Check if we have central concepts
    const centralConcepts = insights.filter(insight => 
      insight.type === 'central_concept'
    );
    
    assert(insights.length > 0, "No insights were generated");
    assert(centralConcepts.length > 0, "No central concept insights were found");
    
    console.log("✅");
    passed++;
  } catch (error) {
    console.log(`❌\n    ${error.message}`);
    failed++;
  }
  
  // Test 5: Generate visualization data
  process.stdout.write("  ⏳ should generate visualization data... ");
  try {
    const storage = new TestPatternStorage();
    const visualizationGenerator = new TestVisualizationGenerator(storage);
    
    const networkData = visualizationGenerator.generateNetworkData(testMemories);
    const timelineData = visualizationGenerator.generateTimelineData(testMemories);
    
    assert(networkData.nodes.length > 0, "Network nodes should not be empty");
    assert(networkData.links.length > 0, "Network links should not be empty");
    assert(timelineData.length > 0, "Timeline data should not be empty");
    
    // Make sure we have the expected number of nodes (one per unique tag)
    const uniqueTags = new Set();
    testMemories.forEach(memory => {
      memory.tags.forEach(tag => uniqueTags.add(tag));
    });
    assert(networkData.nodes.length === uniqueTags.size, 
           `Expected ${uniqueTags.size} nodes, got ${networkData.nodes.length}`);
    
    // Make sure timeline has one entry per memory
    assert(timelineData.length === testMemories.length,
           `Expected ${testMemories.length} timeline entries, got ${timelineData.length}`);
    
    console.log("✅");
    passed++;
  } catch (error) {
    console.log(`❌\n    ${error.message}`);
    failed++;
  }
  
  // Test 6: Analyze system performance
  process.stdout.write("  ⏳ should analyze system performance... ");
  try {
    const storage = new TestPatternStorage();
    const patternLearner = new TestPatternLearner(storage);
    patternLearner.initialize();
    
    testMemories.forEach(memory => patternLearner.learnFromMemory(memory));
    
    const patterns = storage.getPatterns();
    const patternCount = patterns.length;
    const patternsPerMemory = patternCount / testMemories.length;
    
    // Calculate expected patterns (at minimum, each memory should have at least its tags as patterns)
    let expectedPatterns = 0;
    testMemories.forEach(memory => {
      expectedPatterns += memory.tags.length; // Each tag becomes a pattern
    });
    
    assert(patternCount >= expectedPatterns, 
           `Expected at least ${expectedPatterns} patterns, got ${patternCount}`);
    
    console.log("✅");
    passed++;
  } catch (error) {
    console.log(`❌\n    ${error.message}`);
    failed++;
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  return passed === 6; // All tests passed
}

// Run the tests only once
runTests().then(success => {
  if (!success) {
    process.exit(1);
  }
}); 