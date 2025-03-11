/**
 * Comprehensive System Diagnostics Tool
 * This script tests all aspects of the knowledge graph system
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Configure __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output file for diagnostic results
const outputFile = path.join(__dirname, 'diagnostics-report.json');

/**
 * Run diagnostic tests and generate a comprehensive report
 */
export async function runDiagnostics(app) {
  console.log('🔍 Starting comprehensive system diagnostics...');
  const startTime = Date.now();
  
  const report = {
    timestamp: new Date().toISOString(),
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
    },
    tests: {},
    summary: {
      passingTests: 0,
      failingTests: 0,
      warnings: 0
    }
  };
  
  // 1. Check environment
  report.tests.environment = await testEnvironment();
  
  // 2. Check services initialization
  report.tests.services = await testServices(app);
  
  // 3. Check routes registration
  report.tests.routes = testRoutes(app);
  
  // 4. Test knowledge graph functionality
  report.tests.knowledgeGraph = await testKnowledgeGraph(app);
  
  // 5. Test memory service integration
  report.tests.memoryIntegration = await testMemoryIntegration(app);
  
  // 6. Test visualization endpoints
  report.tests.visualization = await testVisualization(app);
  
  // Calculate summary statistics
  const summary = calculateSummary(report);
  report.summary = summary;
  report.duration = `${((Date.now() - startTime) / 1000).toFixed(2)} seconds`;
  
  // Generate recommendations based on results
  report.recommendations = generateRecommendations(report);
  
  // Save report to file
  saveReport(report);
  
  console.log(`✅ Diagnostics complete. Report saved to ${outputFile}`);
  console.log(`📊 Summary: ${summary.passingTests} passing, ${summary.failingTests} failing, ${summary.warnings} warnings`);
  
  return report;
}

/**
 * Test the environment configuration
 */
async function testEnvironment() {
  const results = {
    status: 'running',
    tests: {}
  };
  
  // Check environment variables
  results.tests.envVars = {
    status: 'pass',
    details: {
      nodeEnv: process.env.NODE_ENV || 'not set',
      port: process.env.PORT || 'not set (default: 3001)',
      openaiKey: process.env.OPENAI_API_KEY ? 'set' : 'not set',
    }
  };
  
  // Check file permissions for important directories
  try {
    fs.accessSync(path.join(__dirname, 'api'), fs.constants.R_OK);
    fs.accessSync(path.join(__dirname, 'services'), fs.constants.R_OK);
    results.tests.filePermissions = {
      status: 'pass',
      details: 'API and services directories are readable'
    };
  } catch (error) {
    results.tests.filePermissions = {
      status: 'fail',
      details: `File permission issue: ${error.message}`
    };
  }
  
  // Overall status
  const failingTests = Object.values(results.tests).filter(t => t.status === 'fail').length;
  results.status = failingTests > 0 ? 'fail' : 'pass';
  
  return results;
}

/**
 * Test services initialization
 */
async function testServices(app) {
  const results = {
    status: 'running',
    tests: {}
  };
  
  // Check if services are available in app.locals
  const services = app?.locals?.services || {};
  results.tests.servicesAvailable = {
    status: Object.keys(services).length > 0 ? 'pass' : 'fail',
    details: {
      availableServices: Object.keys(services),
      count: Object.keys(services).length
    }
  };
  
  // Check knowledge graph service specifically
  const kgService = services.knowledgeGraphService;
  results.tests.knowledgeGraphService = {
    status: kgService ? 'pass' : 'fail',
    details: kgService ? {
      initialized: kgService.initialized || false,
      nodesMapExists: kgService.nodes instanceof Map,
      edgesMapExists: kgService.edges instanceof Map,
      nodeCount: kgService.nodes?.size || 0,
      edgeCount: kgService.edges?.size || 0,
      availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(kgService))
        .filter(name => typeof kgService[name] === 'function')
    } : {
      error: 'Knowledge graph service not found in app.locals.services'
    }
  };
  
  // Check memory service specifically
  const memoryService = services.memoryService;
  results.tests.memoryService = {
    status: memoryService ? 'pass' : 'fail',
    details: memoryService ? {
      initialized: memoryService.initialized || false,
      hasKnowledgeGraphReference: !!memoryService.knowledgeGraphService,
      availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(memoryService))
        .filter(name => typeof memoryService[name] === 'function')
    } : {
      error: 'Memory service not found in app.locals.services'
    }
  };
  
  // Check for miniGraphService if present
  if (services.miniGraphService) {
    results.tests.miniGraphService = {
      status: 'pass',
      details: {
        initialized: services.miniGraphService.initialized || false,
        nodeCount: services.miniGraphService.nodes?.size || 0,
        edgeCount: services.miniGraphService.edges?.size || 0
      }
    };
  }
  
  // Overall status
  const failingTests = Object.values(results.tests).filter(t => t.status === 'fail').length;
  results.status = failingTests > 0 ? 'fail' : 'pass';
  
  return results;
}

/**
 * Test routes registration
 */
function testRoutes(app) {
  const results = {
    status: 'running',
    tests: {}
  };
  
  // Check if app has router stack
  if (!app || !app._router || !app._router.stack) {
    results.status = 'fail';
    results.error = 'App router not properly initialized';
    return results;
  }
  
  // Analyze router stack
  const routerStack = app._router.stack;
  
  // Check for route matchers
  const routes = routerStack
    .filter(layer => layer.route)
    .map(layer => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods)
    }));
  
  results.tests.directRoutes = {
    status: routes.length > 0 ? 'pass' : 'warning',
    details: {
      count: routes.length,
      routes: routes
    }
  };
  
  // Check for router middleware (mounted routes)
  const routerMiddleware = routerStack
    .filter(layer => layer.name === 'router' && layer.regexp)
    .map(layer => {
      // Extract the path from the regexp
      const regexStr = layer.regexp.toString();
      const pathMatch = regexStr.match(/\/\^\\([^\\]*)/);
      const path = pathMatch ? '/' + pathMatch[1].replace(/\\\//g, '/') : 'unknown';
      
      return {
        path,
        regexp: regexStr
      };
    });
  
  results.tests.routerMiddleware = {
    status: routerMiddleware.length > 0 ? 'pass' : 'warning',
    details: {
      count: routerMiddleware.length,
      routers: routerMiddleware
    }
  };
  
  // Check specifically for graph routes
  const hasGraphRoutes = routerMiddleware.some(r => r.path.includes('/api/graph'));
  const hasGraph2Routes = routerMiddleware.some(r => r.path.includes('/api/graph2'));
  
  results.tests.graphRoutes = {
    status: hasGraphRoutes || hasGraph2Routes ? 'pass' : 'fail',
    details: {
      hasGraphRoutes,
      hasGraph2Routes
    }
  };
  
  // Overall status
  const failingTests = Object.values(results.tests).filter(t => t.status === 'fail').length;
  results.status = failingTests > 0 ? 'fail' : 'pass';
  
  return results;
}

/**
 * Test knowledge graph functionality directly
 */
async function testKnowledgeGraph(app) {
  const results = {
    status: 'running',
    tests: {}
  };
  
  const kgService = app?.locals?.services?.knowledgeGraphService;
  
  if (!kgService) {
    results.status = 'fail';
    results.error = 'Knowledge graph service not available';
    return results;
  }
  
  // Test node creation
  try {
    const testId = `test-node-${Date.now()}`;
    const node = kgService.addNode('TEST', testId, { testProperty: true });
    
    results.tests.nodeCreation = {
      status: node ? 'pass' : 'fail',
      details: node ? {
        node,
        nodeExists: kgService.nodes.has(`test:${testId}`.toLowerCase())
      } : {
        error: 'Node creation returned null or undefined'
      }
    };
    
    // If node creation passed, test edge creation
    if (node) {
      const secondNode = kgService.addNode('TEST', `${testId}-target`, { testProperty: true });
      
      if (secondNode) {
        try {
          const edge = kgService.addEdge(node, secondNode, 'TEST_RELATION');
          
          results.tests.edgeCreation = {
            status: edge ? 'pass' : 'fail',
            details: edge ? {
              edge,
              fromNode: node.id,
              toNode: secondNode.id
            } : {
              error: 'Edge creation returned null or undefined'
            }
          };
        } catch (error) {
          results.tests.edgeCreation = {
            status: 'fail',
            details: {
              error: `Edge creation error: ${error.message}`
            }
          };
        }
      } else {
        results.tests.edgeCreation = {
          status: 'skip',
          details: {
            reason: 'Second node creation failed, cannot test edge creation'
          }
        };
      }
    } else {
      results.tests.edgeCreation = {
        status: 'skip',
        details: {
          reason: 'Node creation failed, cannot test edge creation'
        }
      };
    }
  } catch (error) {
    results.tests.nodeCreation = {
      status: 'fail',
      details: {
        error: `Node creation error: ${error.message}`,
        stack: error.stack
      }
    };
  }
  
  // Test visualization data method
  try {
    const visualizationData = await kgService.getVisualizationData();
    
    results.tests.visualization = {
      status: visualizationData ? 'pass' : 'fail',
      details: visualizationData ? {
        nodeCount: visualizationData.nodes?.length || 0,
        edgeCount: visualizationData.edges?.length || 0,
        firstNode: visualizationData.nodes?.[0] || null
      } : {
        error: 'Visualization data method returned null or undefined'
      }
    };
  } catch (error) {
    results.tests.visualization = {
      status: 'fail',
      details: {
        error: `Visualization data error: ${error.message}`,
        stack: error.stack
      }
    };
  }
  
  // Overall status
  const failingTests = Object.values(results.tests).filter(t => t.status === 'fail').length;
  results.status = failingTests > 0 ? 'fail' : 'pass';
  
  return results;
}

/**
 * Test memory service integration with knowledge graph
 */
async function testMemoryIntegration(app) {
  const results = {
    status: 'running',
    tests: {}
  };
  
  const services = app?.locals?.services || {};
  const memoryService = services.memoryService;
  const kgService = services.knowledgeGraphService;
  
  if (!memoryService) {
    results.status = 'fail';
    results.error = 'Memory service not available';
    return results;
  }
  
  if (!kgService) {
    results.status = 'fail';
    results.error = 'Knowledge graph service not available';
    return results;
  }
  
  // Check if memory service has reference to knowledge graph service
  results.tests.serviceReference = {
    status: memoryService.knowledgeGraphService === kgService ? 'pass' : 'fail',
    details: {
      hasReference: !!memoryService.knowledgeGraphService,
      isSameInstance: memoryService.knowledgeGraphService === kgService
    }
  };
  
  // Test memory storage with entities
  try {
    const testMemory = {
      id: `test-memory-${uuidv4()}`,
      content: "Had lunch with John Doe from Acme Corp at Central Park yesterday.",
      entities: {
        people: ["John Doe"],
        organizations: ["Acme Corp"],
        places: ["Central Park"]
      },
      timestamp: new Date().toISOString()
    };
    
    // Record initial node and edge counts
    const initialNodeCount = kgService.nodes.size;
    const initialEdgeCount = kgService.edges.size;
    
    // Store the memory
    const storedMemory = await memoryService.storeMemory(testMemory);
    
    // Check if memory was stored
    results.tests.memoryStorage = {
      status: storedMemory ? 'pass' : 'fail',
      details: storedMemory ? {
        memoryId: storedMemory.id,
        originalContent: testMemory.content,
        storedContent: storedMemory.content
      } : {
        error: 'Memory storage returned null or undefined'
      }
    };
    
    // Check if knowledge graph was updated
    const newNodeCount = kgService.nodes.size;
    const newEdgeCount = kgService.edges.size;
    
    results.tests.graphUpdate = {
      status: newNodeCount > initialNodeCount ? 'pass' : 'fail',
      details: {
        initialNodeCount,
        newNodeCount,
        nodesAdded: newNodeCount - initialNodeCount,
        initialEdgeCount,
        newEdgeCount,
        edgesAdded: newEdgeCount - initialEdgeCount
      }
    };
    
    // Check if expected nodes were created
    const expectedNodes = ['John Doe', 'Acme Corp', 'Central Park'];
    const foundNodes = expectedNodes.map(name => {
      // Try different node types
      const types = ['PERSON', 'ORGANIZATION', 'PLACE'];
      for (const type of types) {
        const key = `${type}:${name}`.toLowerCase();
        if (kgService.nodes.has(key)) {
          return { name, type, found: true };
        }
      }
      return { name, found: false };
    });
    
    results.tests.expectedNodes = {
      status: foundNodes.every(n => n.found) ? 'pass' : 'fail',
      details: {
        expectedNodes: foundNodes
      }
    };
    
  } catch (error) {
    results.tests.memoryStorage = {
      status: 'fail',
      details: {
        error: `Memory storage error: ${error.message}`,
        stack: error.stack
      }
    };
  }
  
  // Overall status
  const failingTests = Object.values(results.tests).filter(t => t.status === 'fail').length;
  results.status = failingTests > 0 ? 'fail' : 'pass';
  
  return results;
}

/**
 * Test visualization endpoints
 */
async function testVisualization(app) {
  const results = {
    status: 'running',
    tests: {}
  };
  
  // Since we can't directly call endpoints from here,
  // we'll check if the visualization controller and route exist
  
  const kgService = app?.locals?.services?.knowledgeGraphService;
  
  if (!kgService) {
    results.status = 'fail';
    results.error = 'Knowledge graph service not available';
    return results;
  }
  
  // Check for visualization data function
  results.tests.visualizationMethod = {
    status: typeof kgService.getVisualizationData === 'function' ? 'pass' : 'fail',
    details: {
      methodExists: typeof kgService.getVisualizationData === 'function'
    }
  };
  
  // Check for visualization route
  const router = app._router;
  const hasVisualizationRoute = router?.stack?.some(layer => {
    // Check direct routes
    if (layer.route && layer.route.path === '/api/graph/visualization') {
      return true;
    }
    
    // Check router middleware
    if (layer.name === 'router') {
      const regexp = layer.regexp.toString();
      return regexp.includes('/api/graph') && 
             layer.handle?.stack?.some(r => r.route?.path === '/visualization');
    }
    
    return false;
  });
  
  results.tests.visualizationRoute = {
    status: hasVisualizationRoute ? 'pass' : 'warning',
    details: {
      routeFound: hasVisualizationRoute
    }
  };
  
  // Check for HTML visualization page
  let hasVisualHtml = false;
  try {
    const publicDir = path.join(__dirname, '..', 'public');
    const files = fs.readdirSync(publicDir);
    hasVisualHtml = files.includes('graph.html');
    
    results.tests.visualizationHtml = {
      status: hasVisualHtml ? 'pass' : 'warning',
      details: {
        htmlFound: hasVisualHtml,
        filesInPublic: files.length
      }
    };
  } catch (error) {
    results.tests.visualizationHtml = {
      status: 'warning',
      details: {
        error: `Error checking for HTML file: ${error.message}`
      }
    };
  }
  
  // Overall status - less strict for visualization
  const failingTests = Object.values(results.tests)
    .filter(t => t.status === 'fail')
    .length;
  
  results.status = failingTests > 0 ? 'warning' : 'pass';
  
  return results;
}

/**
 * Calculate summary statistics for the report
 */
function calculateSummary(report) {
  let passingTests = 0;
  let failingTests = 0;
  let warnings = 0;
  
  // Count test results
  Object.values(report.tests).forEach(category => {
    if (category.tests) {
      Object.values(category.tests).forEach(test => {
        if (test.status === 'pass') passingTests++;
        else if (test.status === 'fail') failingTests++;
        else if (test.status === 'warning') warnings++;
      });
    }
  });
  
  return {
    passingTests,
    failingTests,
    warnings,
    overallStatus: failingTests > 0 ? 'ISSUES DETECTED' : 'OK'
  };
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(report) {
  const recommendations = [];
  
  // Check environment issues
  if (report.tests.environment.status === 'fail') {
    recommendations.push({
      priority: 'high',
      area: 'Environment',
      issue: 'Environment configuration issues detected',
      solution: 'Check environment variables and file permissions'
    });
  }
  
  // Check services issues
  if (report.tests.services.status === 'fail') {
    if (report.tests.services.tests.knowledgeGraphService?.status === 'fail') {
      recommendations.push({
        priority: 'high',
        area: 'Services',
        issue: 'Knowledge graph service not properly initialized',
        solution: 'Check KnowledgeGraphService constructor and initialization method'
      });
    }
    
    if (report.tests.services.tests.memoryService?.status === 'fail') {
      recommendations.push({
        priority: 'high',
        area: 'Services',
        issue: 'Memory service not properly initialized',
        solution: 'Check MemoryService constructor and initialization method'
      });
    }
  }
  
  // Check routes issues
  if (report.tests.routes.status === 'fail') {
    if (report.tests.routes.tests.graphRoutes?.status === 'fail') {
      recommendations.push({
        priority: 'high',
        area: 'Routes',
        issue: 'Graph routes not properly registered',
        solution: 'Check that graphRoutes.js exports the router and it\'s properly imported in server.js'
      });
    }
  }
  
  // Check knowledge graph functionality issues
  if (report.tests.knowledgeGraph.status === 'fail') {
    if (report.tests.knowledgeGraph.tests.nodeCreation?.status === 'fail') {
      recommendations.push({
        priority: 'high',
        area: 'Knowledge Graph',
        issue: 'Unable to create nodes in the knowledge graph',
        solution: 'Check the addNode method in KnowledgeGraphService'
      });
    }
    
    if (report.tests.knowledgeGraph.tests.edgeCreation?.status === 'fail') {
      recommendations.push({
        priority: 'high',
        area: 'Knowledge Graph',
        issue: 'Unable to create edges in the knowledge graph',
        solution: 'Check the addEdge method in KnowledgeGraphService'
      });
    }
    
    if (report.tests.knowledgeGraph.tests.visualization?.status === 'fail') {
      recommendations.push({
        priority: 'medium',
        area: 'Knowledge Graph',
        issue: 'Visualization data generation is failing',
        solution: 'Check the getVisualizationData method in KnowledgeGraphService'
      });
    }
  }
  
  // Check memory integration issues
  if (report.tests.memoryIntegration.status === 'fail') {
    if (report.tests.memoryIntegration.tests.serviceReference?.status === 'fail') {
      recommendations.push({
        priority: 'high',
        area: 'Integration',
        issue: 'Memory service doesn\'t have reference to knowledge graph service',
        solution: 'Ensure the memory service has access to the knowledge graph service in initialization'
      });
    }
    
    if (report.tests.memoryIntegration.tests.graphUpdate?.status === 'fail') {
      recommendations.push({
        priority: 'high',
        area: 'Integration',
        issue: 'Storing memories doesn\'t update the knowledge graph',
        solution: 'Check that processMemory is being called when storing memories'
      });
    }
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'info',
      area: 'General',
      issue: 'No major issues detected',
      solution: 'Continue monitoring the system'
    });
  }
  
  return recommendations;
}

/**
 * Save the report to a file
 */
function saveReport(report) {
  try {
    fs.writeFileSync(
      outputFile,
      JSON.stringify(report, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error('Error saving report:', error);
  }
}

export default runDiagnostics; 