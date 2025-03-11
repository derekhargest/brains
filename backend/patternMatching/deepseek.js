class DeepSeekClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async chatCompletionsCreate(options) {
    // Stub implementation for testing
    return {
      choices: [{
        message: {
          content: JSON.stringify({ 
            names: [],
            topics: []
          })
        }
      }]
    };
  }
}

module.exports = { DeepSeekClient }; 