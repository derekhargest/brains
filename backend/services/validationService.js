export class ValidationService {
  async checkFactConsistency(memory) {
    const related = await knowledgeGraphService.findRelatedFacts(memory);
    return this.llmValidate(`
      Validate consistency between these statements:
      New: ${memory.content}
      Existing: ${related.map(r => r.content).join('\n')}
    `);
  }

  async llmValidate(prompt) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'Analyze factual consistency. Respond with JSON: {consistent: bool, conflicts: [string]}'
      }, {
        role: 'user', 
        content: prompt
      }]
    });
    return JSON.parse(response.choices[0].message.content);
  }
} 