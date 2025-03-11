export class AIDebugger {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.decisionTree = new vis.DataSet();
    this.network = null;
  }

  async showReasoningChain(memoryId) {
    const chain = await fetch(`/api/debug/reasoning-chain/${memoryId}`);
    this.renderDecisionTree(chain);
  }

  renderDecisionTree(nodes) {
    const options = {
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed'
        }
      }
    };
    this.network = new vis.Network(
      this.container, 
      { nodes: this.decisionTree, edges: new vis.DataSet() },
      options
    );
  }
} 