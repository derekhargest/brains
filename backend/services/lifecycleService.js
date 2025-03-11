export class LifecycleService {
  states = ['RAW', 'PROCESSED', 'ENRICHED', 'ARCHIVED'];
  
  async transitionMemory(memoryId, newState) {
    const validTransitions = {
      RAW: ['PROCESSED'],
      PROCESSED: ['ENRICHED', 'ARCHIVED'],
      ENRICHED: ['ARCHIVED'],
      ARCHIVED: []
    };

    const current = await this.getMemoryState(memoryId);
    if (!validTransitions[current].includes(newState)) {
      throw new Error(`Invalid state transition: ${current} → ${newState}`);
    }
    
    await this.updateState(memoryId, newState);
    return this.applyStateActions(memoryId, newState);
  }
} 