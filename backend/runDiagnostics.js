/**
 * Run system diagnostics
 */
import express from 'express';
import dotenv from 'dotenv';
import { KnowledgeGraphService } from './services/knowledgeGraphService.js';
import { MiniGraphService } from './services/miniGraphService.js';
import { MemoryService } from './services/memoryService.js';
import runDiagnostics from './diagnostics.js';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting diagnostics runner...');
  
  // Create a minimal express app for testing
  const app = express();
  
  // Initialize services
  console.log('Initializing services...');
  const knowledgeGraphService = new KnowledgeGraphService();
  await knowledgeGraphService.initialize();
  
  const miniGraphService = new MiniGraphService();
  
  const memoryService = new MemoryService({ 
    // Mock vector store
    vectorStore: {
      upsert: async () => true,
      query: async () => []
    } 
  });
  memoryService.knowledgeGraphService = knowledgeGraphService;
  await memoryService.initialize();
  
  // Add services to app.locals
  app.locals.services = {
    knowledgeGraphService,
    miniGraphService,
    memoryService
  };
  
  // Add a simple test route
  app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route works' });
  });
  
  // Mock route registration structure
  app.use('/api/graph', (req, res, next) => {
    // This simulates the router middleware
    next();
  });
  
  // Run diagnostics
  const report = await runDiagnostics(app);
  
  // Print key findings
  console.log('\n🔍 KEY FINDINGS:');
  console.log('=================');
  
  if (report.recommendations.length > 0) {
    report.recommendations.forEach((rec, i) => {
      console.log(`${i+1}. [${rec.priority.toUpperCase()}] ${rec.area}: ${rec.issue}`);
      console.log(`   Solution: ${rec.solution}`);
    });
  } else {
    console.log('No issues detected.');
  }
  
  console.log('\nDetailed report saved to diagnostics-report.json');
}

main().catch(error => {
  console.error('Diagnostics runner failed:', error);
  process.exit(1); 