export class VersioningService {
  constructor() {
    this.memoryVersions = new Map();
  }

  async createMemoryVersion(memoryId, update) {
    const current = await memoryService.getMemory(memoryId);
    const version = {
      timestamp: new Date(),
      content: current.content,
      metadata: {...current.metadata}
    };
    
    if (!this.memoryVersions.has(memoryId)) {
      this.memoryVersions.set(memoryId, []);
    }
    this.memoryVersions.get(memoryId).push(version);
    
    return this.applyUpdate(memoryId, update);
  }
} 