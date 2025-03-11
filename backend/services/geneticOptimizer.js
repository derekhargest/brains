export class GeneticAlgorithmOptimizer {
  constructor(options = {}) {
    this.populationSize = options.populationSize || 100;
    this.mutationRate = options.mutationRate || 0.1;
    this.crossoverRate = options.crossoverRate || 0.7;
    this.generations = options.generations || 50;
    this.elitismCount = options.elitismCount || 2;
  }

  async optimize(initialDNA) {
    let population = this._initializePopulation(initialDNA);
    let bestSolution = null;
    let bestFitness = -Infinity;

    for (let gen = 0; gen < this.generations; gen++) {
      // Evaluate fitness for each individual
      const fitnessScores = await Promise.all(
        population.map(individual => this._evaluateFitness(individual))
      );

      // Find best solution in current generation
      const genBest = population[fitnessScores.indexOf(Math.max(...fitnessScores))];
      const genBestFitness = Math.max(...fitnessScores);

      if (genBestFitness > bestFitness) {
        bestSolution = genBest;
        bestFitness = genBestFitness;
      }

      // Create next generation
      population = this._createNextGeneration(population, fitnessScores);
    }

    return bestSolution;
  }

  _initializePopulation(baseDNA) {
    const population = [];
    for (let i = 0; i < this.populationSize; i++) {
      population.push(this._mutate({ ...baseDNA }));
    }
    return population;
  }

  _evaluateFitness(dna) {
    // Simple fitness function based on parameter values
    return Object.values(dna).reduce((sum, value) => {
      if (typeof value === 'number') {
        return sum + value;
      }
      return sum;
    }, 0);
  }

  _createNextGeneration(population, fitnessScores) {
    const nextGen = [];
    
    // Elitism - keep best solutions
    const sortedIndices = fitnessScores
      .map((score, idx) => ({ score, idx }))
      .sort((a, b) => b.score - a.score);
    
    for (let i = 0; i < this.elitismCount; i++) {
      nextGen.push({ ...population[sortedIndices[i].idx] });
    }

    // Fill rest of population with crossover and mutation
    while (nextGen.length < this.populationSize) {
      const parent1 = this._selectParent(population, fitnessScores);
      const parent2 = this._selectParent(population, fitnessScores);
      
      if (Math.random() < this.crossoverRate) {
        const [child1, child2] = this._crossover(parent1, parent2);
        nextGen.push(this._mutate(child1));
        if (nextGen.length < this.populationSize) {
          nextGen.push(this._mutate(child2));
        }
      } else {
        nextGen.push(this._mutate({ ...parent1 }));
        if (nextGen.length < this.populationSize) {
          nextGen.push(this._mutate({ ...parent2 }));
        }
      }
    }

    return nextGen;
  }

  _selectParent(population, fitnessScores) {
    // Tournament selection
    const tournamentSize = 3;
    let bestIdx = Math.floor(Math.random() * population.length);
    let bestFitness = fitnessScores[bestIdx];

    for (let i = 1; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * population.length);
      if (fitnessScores[idx] > bestFitness) {
        bestIdx = idx;
        bestFitness = fitnessScores[idx];
      }
    }

    return population[bestIdx];
  }

  _crossover(parent1, parent2) {
    const child1 = {};
    const child2 = {};

    Object.keys(parent1).forEach(key => {
      if (Math.random() < 0.5) {
        child1[key] = parent1[key];
        child2[key] = parent2[key];
      } else {
        child1[key] = parent2[key];
        child2[key] = parent1[key];
      }
    });

    return [child1, child2];
  }

  _mutate(individual) {
    const mutated = { ...individual };
    
    Object.keys(mutated).forEach(key => {
      if (typeof mutated[key] === 'number' && Math.random() < this.mutationRate) {
        // Add or subtract up to 10% of the current value
        const change = (Math.random() - 0.5) * 0.2 * mutated[key];
        mutated[key] = Math.max(0, mutated[key] + change);
      }
    });

    return mutated;
  }
} 