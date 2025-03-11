export class PredictionService {
  async forecastNextEvents() {
    const patterns = await patternService.detectTemporalPatterns();
    return patterns.map(pattern => ({
      type: pattern.type,
      predictedOccurrence: this.calculateNextOccurrence(pattern),
      confidence: pattern.confidence
    }));
  }

  calculateNextOccurrence(pattern) {
    const now = Date.now();
    const interval = pattern.averageInterval;
    return new Date(now + interval * pattern.occurrences.length);
  }
} 