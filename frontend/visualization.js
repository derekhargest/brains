// Temporal data visualization utilities

// Main visualization controller
class TemporalVisualizer {
  constructor(data) {
    this.data = data;
    this.chart = null;
    this.detectedPatterns = [];
  }
  
  // Process data for visualizations
  processData() {
    // Group events by day of week and hour
    this.weeklyHeatmapData = this.generateWeeklyHeatmapData();
    
    // Group events by time of day
    this.timeDistributionData = this.generateTimeDistributionData();
    
    // Detect patterns
    this.detectedPatterns = this.detectPatterns();
  }
  
  // Generate data for weekly heatmap
  generateWeeklyHeatmapData() {
    const heatmapData = Array(7).fill().map(() => Array(24).fill(0));
    
    this.data.forEach(item => {
      const date = new Date(item.temporal.timestamp);
      const dayOfWeek = date.getDay(); // 0-6
      const hour = date.getHours(); // 0-23
      
      heatmapData[dayOfWeek][hour]++;
    });
    
    return heatmapData;
  }
  
  // Generate time-of-day distribution
  generateTimeDistributionData() {
    const hourCounts = Array(24).fill(0);
    
    this.data.forEach(item => {
      const date = new Date(item.temporal.timestamp);
      const hour = date.getHours();
      hourCounts[hour]++;
    });
    
    return {
      labels: Array(24).fill().map((_, i) => `${i}:00`),
      data: hourCounts
    };
  }
  
  // Basic pattern detection
  detectPatterns() {
    const patterns = [];
    
    // Detect weekly patterns
    const weekdayEvents = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    this.data.forEach(item => {
      const date = new Date(item.temporal.timestamp);
      const dayOfWeek = date.getDay();
      weekdayEvents[dayOfWeek]++;
    });
    
    // Find days with significantly more events
    const avgEvents = weekdayEvents.reduce((sum, count) => sum + count, 0) / 7;
    const activeWeekdays = [];
    
    weekdayEvents.forEach((count, dayIndex) => {
      if (count > avgEvents * 1.5) {
        activeWeekdays.push({
          day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex],
          count: count,
          confidence: Math.min(count / (avgEvents * 2), 0.95)
        });
      }
    });
    
    if (activeWeekdays.length > 0) {
      patterns.push({
        type: 'weekly_pattern',
        description: `Regular activity on ${activeWeekdays.map(d => d.day).join(', ')}`,
        confidence: activeWeekdays.reduce((sum, d) => sum + d.confidence, 0) / activeWeekdays.length,
        details: activeWeekdays
      });
    }
    
    // Group similar events
    const eventGroups = {};
    this.data.forEach(item => {
      if (!eventGroups[item.title]) {
        eventGroups[item.title] = [];
      }
      eventGroups[item.title].push(item);
    });
    
    // Find recurring events
    Object.entries(eventGroups).forEach(([title, events]) => {
      if (events.length >= 3) {
        // Sort by timestamp
        events.sort((a, b) => new Date(a.temporal.timestamp) - new Date(b.temporal.timestamp));
        
        // Check for regular intervals
        const intervals = [];
        for (let i = 1; i < events.length; i++) {
          const prev = new Date(events[i-1].temporal.timestamp);
          const curr = new Date(events[i].temporal.timestamp);
          intervals.push(Math.round((curr - prev) / (1000 * 60 * 60 * 24))); // days
        }
        
        // Check if intervals are consistent
        const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
        const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
        
        if (variance < 2 && events.length >= 3) {
          const intervalType = 
            avgInterval === 1 ? 'daily' :
            avgInterval === 7 ? 'weekly' :
            avgInterval === 14 ? 'bi-weekly' :
            avgInterval === 30 ? 'monthly' :
            `every ${Math.round(avgInterval)} days`;
          
          patterns.push({
            type: 'recurring_event',
            title: title,
            description: `${title} occurs ${intervalType}`,
            confidence: Math.min(0.95, 1 - (variance / 10)),
            count: events.length,
            interval: avgInterval
          });
        }
      }
    });
    
    return patterns;
  }
  
  // Render weekly heatmap
  renderWeeklyHeatmap(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Prepare data for Chart.js
    const data = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        data.push({
          x: hour,
          y: day,
          v: this.weeklyHeatmapData[day][hour]
        });
      }
    }
    
    // Destroy previous chart if exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Create heatmap
    this.chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          data: data,
          backgroundColor: (context) => {
            const value = context.dataset.data[context.dataIndex].v;
            const alpha = Math.min(0.8, 0.1 + (value / 10));
            return `rgba(54, 162, 235, ${alpha})`;
          },
          pointRadius: (context) => {
            const value = context.dataset.data[context.dataIndex].v;
            return 10 + value * 2;
          },
          pointHoverRadius: (context) => {
            const value = context.dataset.data[context.dataIndex].v;
            return 12 + value * 2;
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            min: 0,
            max: 23,
            title: {
              display: true,
              text: 'Hour of Day'
            },
            ticks: {
              callback: (value) => `${value}:00`
            }
          },
          y: {
            min: 0,
            max: 6,
            title: {
              display: true,
              text: 'Day of Week'
            },
            ticks: {
              callback: (value) => days[value]
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Weekly Activity Heatmap',
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.dataset.data[context.dataIndex].v;
                const day = days[context.dataset.data[context.dataIndex].y];
                const hour = context.dataset.data[context.dataIndex].x;
                return `${day} at ${hour}:00: ${value} activities`;
              }
            }
          }
        }
      }
    });
  }
  
  // Render time distribution
  renderTimeDistribution(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Destroy previous chart if exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Create bar chart
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.timeDistributionData.labels,
        datasets: [{
          label: 'Activity Count',
          data: this.timeDistributionData.data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Activities'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Hour of Day'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Time-of-Day Activity Distribution',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
  
  // Render pattern confidence
  renderPatternConfidence(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Prepare data
    const labels = this.detectedPatterns.map(p => p.description);
    const confidenceData = this.detectedPatterns.map(p => p.confidence * 100);
    
    // Destroy previous chart if exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Create horizontal bar chart
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Confidence (%)',
          data: confidenceData,
          backgroundColor: confidenceData.map(val => 
            val > 80 ? 'rgba(75, 192, 192, 0.5)' : 
            val > 60 ? 'rgba(54, 162, 235, 0.5)' : 
            val > 40 ? 'rgba(255, 206, 86, 0.5)' : 
            'rgba(255, 99, 132, 0.5)'
          ),
          borderColor: confidenceData.map(val => 
            val > 80 ? 'rgb(75, 192, 192)' : 
            val > 60 ? 'rgb(54, 162, 235)' : 
            val > 40 ? 'rgb(255, 206, 86)' : 
            'rgb(255, 99, 132)'
          ),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Confidence (%)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Pattern Detection Confidence',
            font: {
              size: 16
            }
          }
        }
      }
    });
  }
  
  // Display detected patterns
  displayPatterns(elementId) {
    const patternsElement = document.getElementById(elementId);
    
    if (this.detectedPatterns.length === 0) {
      patternsElement.innerHTML = '<p>No clear patterns detected in this dataset.</p>';
      return;
    }
    
    // Sort by confidence
    const sortedPatterns = [...this.detectedPatterns].sort((a, b) => b.confidence - a.confidence);
    
    let html = '<ul class="patterns-list">';
    
    sortedPatterns.forEach(pattern => {
      const confidencePercent = Math.round(pattern.confidence * 100);
      const confidenceClass = 
        confidencePercent > 80 ? 'high-confidence' : 
        confidencePercent > 60 ? 'medium-confidence' : 
        'low-confidence';
      
      html += `
        <li class="pattern-item">
          <div class="pattern-header">
            <h4>${pattern.description}</h4>
            <span class="confidence-badge ${confidenceClass}">${confidencePercent}% confident</span>
          </div>
          <div class="pattern-details">
            <p>Type: ${pattern.type.replace('_', ' ')}</p>
            ${pattern.count ? `<p>Occurrences: ${pattern.count}</p>` : ''}
            ${pattern.interval ? `<p>Average interval: ${Math.round(pattern.interval)} days</p>` : ''}
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    patternsElement.innerHTML = html;
  }
  
  // Generate the selected visualization
  generateVisualization(type, canvasId, patternsElementId) {
    this.processData();
    
    switch(type) {
      case 'weekly-heatmap':
        this.renderWeeklyHeatmap(canvasId);
        break;
      case 'time-distribution':
        this.renderTimeDistribution(canvasId);
        break;
      case 'pattern-confidence':
        this.renderPatternConfidence(canvasId);
        break;
      default:
        console.error('Unsupported visualization type:', type);
    }
    
    this.displayPatterns(patternsElementId);
  }
}

// Export for use in other files
window.TemporalVisualizer = TemporalVisualizer; 