/**
 * Simple script to test the KnowledgeGraphService in isolation
 */
import { KnowledgeGraphService } from './services/knowledgeGraphService.js';
import { MiniGraphService } from './services/miniGraphService.js';

// Choose which service to test
const useMinifiedVersion = true;

async function testGraph() {
  console.log('🔬 Starting Knowledge Graph Service Test');
  
  try {
    // Initialize the appropriate service
    const graphService = useMinifiedVersion 
      ? new MiniGraphService() 
      : new KnowledgeGraphService();
    
    if (typeof graphService.initialize === 'function') {
      await graphService.initialize();
    }
    
    console.log('\n✅ Service initialized successfully');
    console.log(`- Using: ${useMinifiedVersion ? 'MiniGraphService' : 'KnowledgeGraphService'}`);
    console.log(`- Nodes map exists: ${graphService.nodes instanceof Map}`);
    console.log(`- Edges map exists: ${graphService.edges instanceof Map}`);
    
    // Test creating nodes
    console.log('\n📝 Creating test nodes...');
    const personNode = graphService.addNode('PERSON', 'Test Person', { test: true });
    const placeNode = graphService.addNode('PLACE', 'Test Place', { test: true });
    const memoryNode = graphService.addNode('MEMORY', 'Test Memory', { 
      content: 'Test Person visited Test Place' 
    });
    
    // Print node details
    console.log('\n📊 Nodes created:');
    console.log('- Person:', personNode);
    console.log('- Place:', placeNode);
    console.log('- Memory:', memoryNode);
    
    // Test creating edges
    console.log('\n🔄 Creating test edges...');
    const edge1 = graphService.addEdge(personNode, placeNode, 'VISITED');
    const edge2 = graphService.addEdge(personNode, memoryNode, 'MENTIONED_IN');
    const edge3 = graphService.addEdge(memoryNode, placeNode, 'HAPPENED_AT');
    
    // Print edge details
    console.log('\n📊 Edges created:');
    console.log('- Person->Place:', edge1);
    console.log('- Person->Memory:', edge2);
    console.log('- Memory->Place:', edge3);
    
    // Get counts
    console.log('\n📈 Graph stats:');
    console.log(`- Total nodes: ${graphService.nodes.size}`);
    console.log(`- Total edges: ${graphService.edges.size}`);
    
    if (typeof graphService.getVisualizationData === 'function') {
      console.log('\n🔍 Testing visualization data...');
      const vizData = await graphService.getVisualizationData();
      console.log(`- Visualization nodes: ${vizData?.nodes?.length || 0}`);
      console.log(`- Visualization edges: ${vizData?.edges?.length || 0}`);
    }
    
    console.log('\n✅ Knowledge Graph test completed successfully');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testGraph().catch(err => {
  console.error('Unhandled error in test:', err);
}); 