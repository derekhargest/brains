export class ReflectiveInsightBank {
  constructor() {
    this.insights = [];
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
    return true;
  }

  async storeInsight(insight) {
    if (!insight.id) {
      insight.id = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    insight.timestamp = new Date().toISOString();
    this.insights.push(insight);
    return insight;
  }

  async getInsights(filter = {}) {
    let filtered = [...this.insights];
    
    if (filter.type) {
      filtered = filtered.filter(i => i.type === filter.type);
    }
    
    if (filter.timeRange) {
      filtered = filtered.filter(i => {
        const timestamp = new Date(i.timestamp);
        return timestamp >= filter.timeRange.start && timestamp <= filter.timeRange.end;
      });
    }
    
    return filtered;
  }

  async getInsightsByType(type) {
    return this.insights.filter(i => i.type === type);
  }

  async getRecentInsights(limit = 10) {
    return this.insights
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async clearInsights() {
    this.insights = [];
    return true;
  }
} 