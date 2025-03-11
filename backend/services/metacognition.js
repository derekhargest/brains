/**
 * Metacognitive Monitoring System
 * Monitors cognitive processes and improves system performance over time
 */
export class MetacognitionSystem {
  constructor(aiSystems) {
    this.systems = aiSystems; // Reference to all AI subsystems
    this.performanceMetrics = new Map();
    this.errorTracker = new ErrorTracker();
    this.improvementStrategies = new Map();
    this.learningCurve = {};
  }
  
  async initialize() {
    // Initialize tracking for each system
    for (const [systemName, system] of Object.entries(this.systems)) {
      this.performanceMetrics.set(systemName, {
        successes: 0,
        failures: 0,
        latency: [],
        confidence: [],
        lastEvaluation: null
      });
      
      this.improvementStrategies.set(systemName, []);
    }
    
    // Initial self-evaluation
    await this.performSelfEvaluation();
    
    return true;
  }
  
  async monitorOperation(systemName, operation, params) {
    const startTime = performance.now();
    let result, error, confidence;
    
    try {
      // Execute the operation
      result = await operation(...params);
      
      // Extract confidence if available
      confidence = result.confidence || 1.0;
      
      // Record success
      this.recordSuccess(systemName, startTime, confidence);
    } catch (err) {
      // Record failure
      error = err;
      this.recordFailure(systemName, startTime, err);
    }
    
    // Return result or throw error
    if (error) throw error;
    return result;
  }
  
  recordSuccess(systemName, startTime, confidence = 1.0) {
    if (!this.performanceMetrics.has(systemName)) return;
    
    const metrics = this.performanceMetrics.get(systemName);
    metrics.successes++;
    metrics.latency.push(performance.now() - startTime);
    metrics.confidence.push(confidence);
    
    // Trim arrays if they get too long
    if (metrics.latency.length > 100) {
      metrics.latency = metrics.latency.slice(-100);
      metrics.confidence = metrics.confidence.slice(-100);
    }
  }
  
  recordFailure(systemName, startTime, error) {
    if (!this.performanceMetrics.has(systemName)) return;
    
    const metrics = this.performanceMetrics.get(systemName);
    metrics.failures++;
    metrics.latency.push(performance.now() - startTime);
    
    // Track the error
    this.errorTracker.trackError(systemName, error);
  }
  
  async performSelfEvaluation() {
    const evaluation = {};
    
    for (const [systemName, metrics] of this.performanceMetrics.entries()) {
      // Calculate performance metrics
      const totalOperations = metrics.successes + metrics.failures;
      const successRate = totalOperations > 0 ? metrics.successes / totalOperations : 0;
      
      const avgLatency = metrics.latency.length > 0 
        ? metrics.latency.reduce((sum, val) => sum + val, 0) / metrics.latency.length
        : 0;
        
      const avgConfidence = metrics.confidence.length > 0
        ? metrics.confidence.reduce((sum, val) => sum + val, 0) / metrics.confidence.length
        : 0;
      
      // Get common errors
      const commonErrors = this.errorTracker.getCommonErrors(systemName);
      
      // Generate improvement strategies
      const strategies = this.generateImprovementStrategies(
        systemName, 
        successRate, 
        avgLatency, 
        avgConfidence,
        commonErrors
      );
      
      // Store strategies
      this.improvementStrategies.set(systemName, strategies);
      
      // Record evaluation
      evaluation[systemName] = {
        successRate,
        avgLatency,
        avgConfidence,
        commonErrors: commonErrors.slice(0, 3),  // Top 3 errors
        recommendedStrategies: strategies,
        timestamp: new Date().toISOString()
      };
      
      // Update learning curve
      if (!this.learningCurve[systemName]) {
        this.learningCurve[systemName] = [];
      }
      this.learningCurve[systemName].push({
        successRate,
        timestamp: new Date().toISOString()
      });
      
      // Store last evaluation
      metrics.lastEvaluation = evaluation[systemName];
    }
    
    return evaluation;
  }
  
  generateImprovementStrategies(systemName, successRate, latency, confidence, errors) {
    const strategies = [];
    
    // Success rate improvements
    if (successRate < 0.9) {
      if (errors.length > 0) {
        strategies.push({
          target: 'error_handling',
          description: `Implement specific handling for common error: ${errors[0].type}`,
          expectedImprovement: 'Increase success rate by handling common failures'
        });
      }
      
      strategies.push({
        target: 'robustness',
        description: 'Add input validation and edge case detection',
        expectedImprovement: 'Prevent failures from invalid inputs'
      });
    }
    
    // Latency improvements
    if (latency > 500) {  // If operations take more than 500ms on average
      strategies.push({
        target: 'performance',
        description: 'Optimize core algorithms or add caching',
        expectedImprovement: 'Reduce average latency'
      });
    }
    
    // Confidence improvements
    if (confidence < 0.7) {
      strategies.push({
        target: 'accuracy',
        description: 'Enhance data quality or refine decision models',
        expectedImprovement: 'Increase result confidence'
      });
    }
    
    return strategies;
  }
  
  async implementStrategy(systemName, strategyIndex) {
    if (!this.improvementStrategies.has(systemName)) {
      return { success: false, error: 'System not found' };
    }
    
    const strategies = this.improvementStrategies.get(systemName);
    if (strategyIndex >= strategies.length) {
      return { success: false, error: 'Strategy index out of bounds' };
    }
    
    const strategy = strategies[strategyIndex];
    
    // In a real system, this would apply specific improvements
    // For now, we'll just log the attempted implementation
    console.log(`Implementing strategy for ${systemName}: ${strategy.description}`);
    
    return {
      success: true,
      strategy,
      timestamp: new Date().toISOString()
    };
  }
  
  getLearningProgress() {
    const progress = {};
    
    for (const [systemName, curve] of Object.entries(this.learningCurve)) {
      if (curve.length < 2) continue;
      
      const initialRate = curve[0].successRate;
      const currentRate = curve[curve.length - 1].successRate;
      const improvement = currentRate - initialRate;
      
      progress[systemName] = {
        initialPerformance: initialRate,
        currentPerformance: currentRate,
        improvement,
        learningRate: improvement / curve.length,
        dataPoints: curve.length
      };
    }
    
    return progress;
  }
}

class ErrorTracker {
  constructor() {
    this.errors = new Map();  // System -> error counts
  }
  
  trackError(systemName, error) {
    if (!this.errors.has(systemName)) {
      this.errors.set(systemName, new Map());
    }
    
    const systemErrors = this.errors.get(systemName);
    const errorType = error.name || 'Unknown';
    const errorMessage = error.message || 'No message';
    const errorKey = `${errorType}: ${errorMessage}`;
    
    if (!systemErrors.has(errorKey)) {
      systemErrors.set(errorKey, {
        type: errorType,
        message: errorMessage,
        count: 0,
        firstSeen: new Date().toISOString(),
        lastSeen: null,
        samples: []
      });
    }
    
    const errorData = systemErrors.get(errorKey);
    errorData.count++;
    errorData.lastSeen = new Date().toISOString();
    
    // Store error samples (up to 10)
    if (errorData.samples.length < 10) {
      errorData.samples.push({
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  getCommonErrors(systemName) {
    if (!this.errors.has(systemName)) {
      return [];
    }
    
    const systemErrors = this.errors.get(systemName);
    return Array.from(systemErrors.values())
      .sort((a, b) => b.count - a.count);
  }
  
  getErrorTrends() {
    const trends = {};
    
    for (const [systemName, systemErrors] of this.errors.entries()) {
      const errorsByType = new Map();
      
      for (const errorData of systemErrors.values()) {
        if (!errorsByType.has(errorData.type)) {
          errorsByType.set(errorData.type, 0);
        }
        errorsByType.set(errorData.type, errorsByType.get(errorData.type) + errorData.count);
      }
      
      trends[systemName] = Array.from(errorsByType.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
    }
    
    return trends;
  }
} 