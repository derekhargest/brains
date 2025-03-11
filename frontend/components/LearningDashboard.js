export class LearningDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.metrics = {
      conceptRetention: new Chart(),
      patternGrowth: new Chart(),
      priorityChanges: new Chart()
    };
  }

  async refresh() {
    const response = await fetch('/api/learning/metrics');
    const data = await response.json();
    
    this.metrics.conceptRetention.update(data.conceptRetention);
    this.metrics.patternGrowth.update(data.patternGrowth);
    this.metrics.priorityChanges.update(data.priorityChanges);
  }
} 