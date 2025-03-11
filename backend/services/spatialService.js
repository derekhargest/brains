export class SpatialService {
  constructor() {
    this.locationTree = new RBush();
    this.geoFences = new Map();
  }

  async processLocationMemory(memory) {
    if (memory.metadata?.location) {
      const point = this.parseGeoPoint(memory.metadata.location);
      this.locationTree.insert({
        minX: point.lng,
        minY: point.lat,
        maxX: point.lng,
        maxY: point.lat,
        memoryId: memory.id
      });
    }
  }

  getMemoriesInRadius(center, radiusKm) {
    const bbox = this.calculateBoundingBox(center, radiusKm);
    return this.locationTree.search(bbox).map(item => 
      memoryService.getMemory(item.memoryId)
    );
  }
} 