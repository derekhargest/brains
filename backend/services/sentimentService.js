export class SentimentService {
  async analyzeMemoryTone(memory) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'Analyze emotional tone. Respond with JSON: {sentiment: string, intensity: 0-1, emotions: [string]}'
      }, {
        role: 'user',
        content: memory.content
      }]
    });
    
    const analysis = JSON.parse(response.choices[0].message.content);
    return {
      ...analysis,
      impactScore: this.calculateImpactScore(analysis)
    };
  }
} 