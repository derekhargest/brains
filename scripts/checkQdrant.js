import { checkQdrantAvailability } from '../backend/vectorStore.js';

async function main() {
  try {
    const available = await checkQdrantAvailability();
    console.log(`Qdrant connection: ${available ? '✅ Operational' : '❌ Failed'}`);
    process.exit(available ? 0 : 1);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

main(); 