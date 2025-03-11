export class MemoryHealthDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.chart = null;
  }

  async refresh() {
    const response = await fetch('/api/memory/health');
    const data = await response.json();
    
    this.renderChart({
      labels: ['High', 'Medium', 'Low'],
      data: [
        data.importanceDistribution.high,
        data.importanceDistribution.medium,
        data.importanceDistribution.low
      ]
    });
  }

  renderChart(dataset) {
    if (this.chart) this.chart.destroy();
    
    this.chart = new Chart(this.container, {
      type: 'doughnut',
      data: {
        labels: dataset.labels,
        datasets: [{
          data: dataset.data,
          backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
        }]
      }
    });
  }
} 