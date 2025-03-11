export class MemoryTimeline {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chart = null;
  }

  update(memories) {
    const data = this._processData(memories);
    this._renderChart(data);
  }

  _processData(memories) {
    return memories.map(m => ({
      x: new Date(m.timestamp),
      y: m.metadata.importance,
      content: m.content
    }));
  }
} 