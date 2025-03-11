/**
 * Simple System Diagnostics Tool
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.join(__dirname, 'diagnostics-report.json');

/**
 * Run a simplified diagnostic check
 */
export async function runSimpleDiagnostics(app) {
  console.log('🔍 Starting simple system diagnostics...');
  
  const report = {
    timestamp: new Date().toISOString(),
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform
    },
    services: {},
    routes: {},
    recommendations: []
  };
  
  // Check services
  try {
    const services = app?.locals?.services || {};
    report.services = {
      available: Object.keys(services),
      count: Object.keys(services).length
    };
    
    // Check knowledge graph service specifically
    if (services.knowledgeGraphService) {
      const kgService = services.knowledgeGraphService;
      report.services.knowledgeGraph = {
        initialized: !!kgService.initialized,
        nodesCount: kgService.nodes?.size || 0,
        edgesCount: kgService.edges?.size || 0,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(kgService))
          .filter(name => typeof kgService[name] === 'function')
      };
    }
    
    // Check mini graph service if available
    if (services.miniGraphService) {
      const miniService = services.miniGraphService;
      report.services.miniGraph = {
        initialized: !!miniService.initialized,
        nodesCount: miniService.nodes?.size || 0,
        edgesCount: miniService.edges?.size || 0
      };
    }
  } catch (error) {
    report.services.error = error.message;
  }
  
  // Add recommendations based on findings
  if (!report.services.knowledgeGraph) {
    report.recommendations.push({
      priority: 'high',
      message: 'Knowledge graph service not found in app.locals.services'
    });
  } else if (report.services.knowledgeGraph.nodesCount === 0) {
    report.recommendations.push({
      priority: 'medium',
      message: 'Knowledge graph has no nodes. Try creating test data.'
    });
  }
  
  // Save report
  try {
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`Report saved to ${outputFile}`);
  } catch (error) {
    console.error('Error saving report:', error);
  }
  
  return report;
}

export default runSimpleDiagnostics; 