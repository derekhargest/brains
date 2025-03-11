/**
 * Run simple system diagnostics
 */
import express from 'express';
import dotenv from 'dotenv';
import { KnowledgeGraphService } from './services/knowledgeGraphService.js';
import { MiniGraphService } from './services/miniGraphService.js';
import runSimpleDiagnostics from './simpleDiagnostics.js';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting simple diagnostics runner...');
  
  // Create a minimal express app for testing
  const app = express();
  
  try {
    // Initialize services
    console.log('Initializing test services...');
    const knowledgeGraphService = new KnowledgeGraphService();
    await knowledgeGraphService.initialize();
    
    const miniGraphService = new MiniGraphService();
    
    // Add services to app.locals
    app.locals.services = {
      knowledgeGraphService,
      miniGraphService
    };
    
    // Run diagnostics
    const report = await runSimpleDiagnostics(app);
    
    // Print key findings
    console.log('\n🔍 KEY FINDINGS:');
    console.log('=================');
    
    if (report.services.available) {
      console.log(`Services available: ${report.services.available.join(', ')}`);
    }
    
    if (report.services.knowledgeGraph) {
      const kg = report.services.knowledgeGraph;
      console.log(`\nKnowledge Graph Service:`);
      console.log(`  - Initialized: ${kg.initialized}`);
      console.log(`  - Nodes: ${kg.nodesCount}`);
      console.log(`  - Edges: ${kg.edgesCount}`);
      console.log(`  - Methods available: ${kg.methods.join(', ')}`);
    }
    
    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`${i+1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
    }
    
    console.log('\nDetailed report saved to diagnostics-report.json');
  } catch (error) {
    console.error('Diagnostics failed:', error);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error in diagnostics runner:', error);
  process.exit(1);
}); 