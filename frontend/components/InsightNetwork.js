export class InsightNetwork {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.network = null;
    this.nodes = new vis.DataSet();
    this.edges = new vis.DataSet();
  }

  async refresh() {
    const response = await fetch('/api/insights');
    const { clusters } = await response.json();
    
    this.nodes.clear();
    this.edges.clear();
    
    clusters.forEach(cluster => {
      // Add cluster node
      this.nodes.add({
        id: cluster.id,
        label: cluster.summary.theme,
        group: 'cluster'
      });
      
      // Add memory nodes
      cluster.memories.forEach(memory => {
        this.nodes.add({
          id: memory.id,
          label: memory.content.substring(0, 20),
          title: memory.content,
          group: 'memory'
        });
        
        this.edges.add({
          from: cluster.id,
          to: memory.id,
          label: 'contains'
        });
      });
    });
    
    this.drawNetwork();
  }

  drawNetwork() {
    const data = { nodes: this.nodes, edges: this.edges };
    const options = {
      nodes: {
        shape: 'dot',
        size: 20,
        font: { size: 12 }
      },
      edges: {
        arrows: 'to',
        smooth: true
      }
    };
    
    this.network = new vis.Network(this.container, data, options);
  }
} 