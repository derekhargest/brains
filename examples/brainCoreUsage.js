import brainCore from '../backend/api/brainCore.js';

async function main() {
  try {
    // Initialize with default collection name ('memories')
    await brainCore.initialize();
    console.log('Brain initialized with default collection');

    // Store and process some memories
    const memory1 = await brainCore.storeMemory(
      "Neural networks excel at pattern recognition tasks",
      {
        importance: 0.9,
        tags: ['AI', 'neural-networks', 'patterns']
      }
    );
    console.log('Stored memory:', memory1);

    // Search for memories
    const searchResults = await brainCore.searchMemories('neural networks');
    console.log('Search results:', searchResults);

    // Get insights
    const insights = await brainCore.getInsights();
    console.log('Generated insights:', insights);

    // Clean up
    if (brainCore.vectorStore) {
      await brainCore.vectorStore.deleteCollection('memories');
    }

    // Example with custom collection
    const customCollectionName = `example_${Date.now()}`;
    await brainCore.initialize(customCollectionName);
    console.log('Brain initialized with custom collection:', customCollectionName);

    // Store memory in custom collection
    const memory2 = await brainCore.storeMemory(
      "Learning to adapt and improve through experience",
      {
        importance: 0.85,
        tags: ['learning', 'adaptation']
      }
    );
    console.log('Stored memory in custom collection:', memory2);

    // Clean up custom collection
    if (brainCore.vectorStore) {
      await brainCore.vectorStore.deleteCollection(customCollectionName);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 