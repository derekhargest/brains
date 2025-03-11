/**
 * Emotional Intelligence & Belief System
 * Models emotional responses and belief structures
 */
export class EmotionalIntelligence {
  constructor() {
    this.emotionalState = {
      joy: 0.5,
      sadness: 0.1,
      anger: 0.1,
      fear: 0.2,
      surprise: 0.3,
      disgust: 0.1,
      trust: 0.6
    };
    
    this.personalityTraits = {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.4,
      agreeableness: 0.6,
      neuroticism: 0.3
    };
    
    this.beliefSystem = new BeliefNetwork();
    this.emotionRegulation = new EmotionRegulationSystem();
    this.emotionalMemory = [];
  }
  
  async initialize() {
    await this.beliefSystem.initialize();
    return true;
  }
  
  async processEvent(event) {
    // Analyze event for emotional content
    const emotionalImpact = await this.analyzeEmotionalContent(event);
    
    // Update emotional state
    this.updateEmotionalState(emotionalImpact);
    
    // Process implications for beliefs
    const beliefUpdates = await this.beliefSystem.processEvent(event);
    
    // Store emotional memory
    this.emotionalMemory.push({
      event: event.id,
      emotionalResponse: { ...this.emotionalState },
      beliefUpdates,
      timestamp: new Date().toISOString()
    });
    
    // Apply emotion regulation strategies
    await this.emotionRegulation.regulate(this.emotionalState, event);
    
    return {
      emotionalState: this.emotionalState,
      beliefUpdates
    };
  }
  
  async analyzeEmotionalContent(event) {
    // Placeholder for sentiment and emotion analysis
    // Would integrate with NLP or other emotion detection systems
    return {
      joy: Math.random() * 0.5,
      sadness: Math.random() * 0.3,
      // Other emotions...
    };
  }
  
  updateEmotionalState(emotionalImpact) {
    // Emotion dynamics model
    // 1. Apply impact based on personality (e.g., neurotic = stronger negative emotions)
    // 2. Consider current state (emotions have momentum)
    // 3. Apply natural decay
    
    const decayRate = 0.1;
    const personalityInfluence = 0.2;
    
    for (const emotion in this.emotionalState) {
      if (emotionalImpact[emotion] !== undefined) {
        // Calculate personality influence
        let traitInfluence = 0;
        if (emotion === 'joy' || emotion === 'trust') {
          // Positive emotions
          traitInfluence = (this.personalityTraits.extraversion - 0.5) * personalityInfluence;
        } else if (emotion === 'sadness' || emotion === 'fear') {
          // Negative emotions
          traitInfluence = (this.personalityTraits.neuroticism - 0.5) * personalityInfluence;
        }
        
        // Update with impact and personality
        this.emotionalState[emotion] = Math.max(0, Math.min(1,
          this.emotionalState[emotion] * (1 - decayRate) + 
          emotionalImpact[emotion] +
          traitInfluence
        ));
      } else {
        // Decay emotions not affected by the event
        this.emotionalState[emotion] *= (1 - decayRate);
      }
    }
  }
  
  getCurrentMood() {
    // Aggregate emotional state into overall mood
    const positiveEmotions = this.emotionalState.joy + this.emotionalState.trust;
    const negativeEmotions = this.emotionalState.sadness + this.emotionalState.anger + 
                             this.emotionalState.fear + this.emotionalState.disgust;
    
    const moodLevel = positiveEmotions - negativeEmotions;
    
    // Map to labels
    if (moodLevel > 0.6) return 'Excellent';
    if (moodLevel > 0.2) return 'Good';
    if (moodLevel > -0.2) return 'Neutral';
    if (moodLevel > -0.6) return 'Poor';
    return 'Terrible';
  }
  
  getMoodInfluenceOnDecisions() {
    // Current emotional state affects decision parameters
    const mood = this.getCurrentMood();
    
    switch (mood) {
      case 'Excellent':
        return {
          riskTolerance: 0.7,
          optimismBias: 0.3,
          creativityBoost: 0.3
        };
      case 'Good':
        return {
          riskTolerance: 0.6,
          optimismBias: 0.2,
          creativityBoost: 0.2
        };
      case 'Neutral':
        return {
          riskTolerance: 0.5,
          optimismBias: 0,
          creativityBoost: 0
        };
      case 'Poor':
        return {
          riskTolerance: 0.4,
          optimismBias: -0.2,
          creativityBoost: -0.1
        };
      case 'Terrible':
        return {
          riskTolerance: 0.3,
          optimismBias: -0.3,
          creativityBoost: -0.2
        };
    }
  }
}

class BeliefNetwork {
  constructor() {
    this.beliefs = new Map();
    this.evidenceLog = new Map();
  }
  
  async initialize() {
    // Initial set of beliefs with confidence levels
    this.beliefs.set('world_is_safe', {
      value: 0.7,
      connections: ['people_are_trustworthy'],
      updateFunction: this.updateWithEvidence
    });
    
    this.beliefs.set('people_are_trustworthy', {
      value: 0.6,
      connections: ['world_is_safe', 'cooperation_is_beneficial'],
      updateFunction: this.updateWithEvidence
    });
    
    // More beliefs...
    
    return true;
  }
  
  async processEvent(event) {
    // Extract relevant evidence
    const evidence = this.extractEvidence(event);
    
    // Track evidence
    for (const [beliefKey, evidenceValue] of Object.entries(evidence)) {
      if (!this.evidenceLog.has(beliefKey)) {
        this.evidenceLog.set(beliefKey, []);
      }
      
      this.evidenceLog.get(beliefKey).push({
        value: evidenceValue,
        source: event.id,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update affected beliefs
    const updates = {};
    for (const [beliefKey, evidenceValue] of Object.entries(evidence)) {
      if (this.beliefs.has(beliefKey)) {
        const oldValue = this.beliefs.get(beliefKey).value;
        const newValue = this.beliefs.get(beliefKey).updateFunction(
          oldValue, evidenceValue
        );
        
        this.beliefs.get(beliefKey).value = newValue;
        updates[beliefKey] = {
          from: oldValue,
          to: newValue
        };
        
        // Propagate to connected beliefs
        const connectedBeliefs = this.beliefs.get(beliefKey).connections || [];
        for (const connectedKey of connectedBeliefs) {
          if (this.beliefs.has(connectedKey)) {
            const influence = (newValue - oldValue) * 0.3; // Indirect update is weaker
            const connectedOldValue = this.beliefs.get(connectedKey).value;
            const connectedNewValue = Math.max(0, Math.min(1, 
              connectedOldValue + influence
            ));
            
            this.beliefs.get(connectedKey).value = connectedNewValue;
            updates[connectedKey] = {
              from: connectedOldValue,
              to: connectedNewValue,
              indirectUpdate: true
            };
          }
        }
      }
    }
    
    return updates;
  }
  
  extractEvidence(event) {
    // In a real system, this would analyze the event for evidence that affects beliefs
    // This is a placeholder implementation
    return {
      'world_is_safe': Math.random() > 0.7 ? 0.6 : 0.4,
      'people_are_trustworthy': Math.random() > 0.6 ? 0.7 : 0.3
    };
  }
  
  updateWithEvidence(currentBelief, evidence) {
    // Bayesian-inspired belief update
    // Weight existing belief more heavily than new evidence (belief persistence)
    const beliefWeight = 0.8;
    const evidenceWeight = 0.2;
    
    return (currentBelief * beliefWeight) + (evidence * evidenceWeight);
  }
  
  getBeliefs() {
    // Return all current beliefs
    const result = {};
    for (const [key, data] of this.beliefs.entries()) {
      result[key] = data.value;
    }
    return result;
  }
}

class EmotionRegulationSystem {
  constructor() {
    this.strategies = [
      {
        name: 'cognitive_reappraisal',
        conditions: state => state.sadness > 0.7 || state.anger > 0.7,
        effect: this.reappraisal
      },
      {
        name: 'distraction',
        conditions: state => state.fear > 0.8,
        effect: this.distraction
      },
      {
        name: 'acceptance',
        conditions: state => true, // Default strategy
        effect: this.acceptance
      }
    ];
  }
  
  async regulate(emotionalState, triggeringEvent) {
    // Find applicable strategies
    const applicableStrategies = this.strategies.filter(
      strategy => strategy.conditions(emotionalState)
    );
    
    // Apply the most effective strategy for the current state
    if (applicableStrategies.length > 0) {
      // In a real system, would select based on past effectiveness
      const selected = applicableStrategies[0];
      return selected.effect(emotionalState, triggeringEvent);
    }
    
    return emotionalState;
  }
  
  reappraisal(state, event) {
    // Cognitive reappraisal: reinterpret the situation in a more positive light
    const newState = { ...state };
    newState.sadness = Math.max(0, state.sadness - 0.2);
    newState.anger = Math.max(0, state.anger - 0.2);
    return newState;
  }
  
  distraction(state, event) {
    // Distraction: shift attention away from the emotional trigger
    const newState = { ...state };
    newState.fear = Math.max(0, state.fear - 0.3);
    return newState;
  }
  
  acceptance(state, event) {
    // Acceptance: acknowledge emotions without trying to change them
    // This naturally reduces emotional intensity slightly
    const newState = { ...state };
    for (const emotion in newState) {
      newState[emotion] = Math.max(0, state[emotion] - 0.05);
    }
    return newState;
  }
} 