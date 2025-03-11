import { ReflectiveInsightBank } from './reflectiveInsightBank.js';
import { LearningPatternAnalyzer } from './learningPatternAnalyzer.js';

/**
 * Reflective Learning Module
 * Enables self-assessment and meta-cognitive evaluation
 */
export class ReflectiveLearning {
  constructor(knowledgeGraph, memoryService, metaLearner) {
    this.kg = knowledgeGraph;
    this.memory = memoryService;
    this.metaLearner = metaLearner;
    this.insightBank = new ReflectiveInsightBank();
    this.analysisEngines = [
      new LearningPatternAnalyzer()
    ];
    this.initialized = false;
  }

  async initialize() {
    await this.insightBank.initialize();
    await Promise.all(
      this.analysisEngines.map(engine => engine.initialize())
    );
    this._startReflectionCycle(3600); // Reflect hourly
    this.initialized = true;
    return true;
  }

  async performDeepReflection() {
    const reflectionData = await this._gatherReflectionData();
    const insights = await this._analyzeLearningProcess(reflectionData);
    await this._integrateInsights(insights);
    return this._generateImprovementPlan(insights);
  }

  async _gatherReflectionData() {
    return {
      learningHistory: await this.memory.retrieveLearningHistory(),
      knowledgeSnapshot: await this.kg.getKnowledgeSnapshot(),
      performanceMetrics: await this.metaLearner.getPerformanceMetrics(),
      errorLogs: await this.memory.retrieveErrorLogs()
    };
  }

  async _analyzeLearningProcess(data) {
    const insights = [];
    
    for(const engine of this.analysisEngines) {
      insights.push(...await engine.analyze(data));
    }
    
    return this._resolveInsightConflicts(insights);
  }

  async _integrateInsights(insights) {
    // Store insights in knowledge graph
    await this.kg.storeInsights(insights);
    
    // Update learning strategies
    const strategyUpdates = this._convertInsightsToStrategies(insights);
    await this.metaLearner.updateStrategies(strategyUpdates);
    
    // Modify curiosity parameters
    const curiosityParams = this._extractCuriosityParameters(insights);
    await this.metaLearner.adjustCuriosity(curiosityParams);
  }

  _resolveInsightConflicts(insights) {
    // Simple conflict resolution - keep highest confidence insights
    const groupedInsights = new Map();
    
    insights.forEach(insight => {
      const key = `${insight.type}_${insight.context || ''}`;
      if (!groupedInsights.has(key) || 
          groupedInsights.get(key).confidence < insight.confidence) {
        groupedInsights.set(key, insight);
      }
    });
    
    return Array.from(groupedInsights.values());
  }

  _convertInsightsToStrategies(insights) {
    return insights.map(insight => ({
      type: insight.type,
      adjustments: insight.recommendations || [],
      confidence: insight.confidence
    }));
  }

  _extractCuriosityParameters(insights) {
    const relevantInsights = insights.filter(i => 
      i.type === 'exploration_pattern' || 
      i.type === 'curiosity_adjustment'
    );
    
    return relevantInsights.reduce((params, insight) => {
      if (insight.parameters) {
        Object.assign(params, insight.parameters);
      }
      return params;
    }, {});
  }

  _generateImprovementPlan(insights) {
    return {
      strategyAdjustments: this._convertInsightsToStrategies(insights),
      curiosityParameters: this._extractCuriosityParameters(insights),
      timestamp: new Date().toISOString()
    };
  }

  _startReflectionCycle(intervalSeconds) {
    setInterval(async () => {
      try {
        await this.performDeepReflection();
      } catch (error) {
        console.error('Reflection cycle failed:', error);
      }
    }, intervalSeconds * 1000);
  }
} 