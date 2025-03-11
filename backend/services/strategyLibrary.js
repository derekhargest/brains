export class StrategyLibrary {
  constructor() {
    this.strategies = new Map();
    this.initialize();
  }

  initialize() {
    // Initialize with default strategies
    this.strategies.set('exploration', {
      name: 'exploration',
      parameters: {
        explorationRate: 0.3,
        decayFactor: 0.95,
        minExploration: 0.1
      }
    });

    this.strategies.set('memory', {
      name: 'memory',
      parameters: {
        retentionThreshold: 0.5,
        consolidationInterval: 3600,
        pruningThreshold: 0.2
      }
    });

    this.strategies.set('reasoning', {
      name: 'reasoning',
      parameters: {
        inferenceDepth: 3,
        confidenceThreshold: 0.7,
        maxBranches: 5
      }
    });
  }

  getStrategy(name) {
    return this.strategies.get(name);
  }

  updateStrategy(name, parameters) {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.parameters = { ...strategy.parameters, ...parameters };
      this.strategies.set(name, strategy);
    }
  }

  getAllStrategies() {
    return Array.from(this.strategies.values());
  }
} 