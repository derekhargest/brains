require('dotenv').config();
const { OpenAI } = require('openai');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

class DeepSeekClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
  }

  async chatCompletionsCreate(options) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('DeepSeek API request failed:', error);
      throw error; // Rethrow to trigger fallback
    }
  }
}

class OpenAIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async chatCompletionsCreate(options) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }
}

class PatternHelpers {
  static modelProvider = 'openai';
  static fastMode = false;
  static openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  static deepseek = new DeepSeekClient(process.env.DEEPSEEK_API_KEY);

  static setModelProvider(provider) {
    if (!['openai', 'deepseek'].includes(provider)) {
      throw new Error('Unsupported model provider. Use "openai" or "deepseek"');
    }
    this.modelProvider = provider;
  }

  static setFastMode(enabled) {
    this.fastMode = enabled;
  }

  static getModel() {
    return this.fastMode ? 
      (this.modelProvider === 'openai' ? 'gpt-3.5-turbo' : 'deepseek-chat') :
      (this.modelProvider === 'openai' ? 'gpt-4-turbo-preview' : 'deepseek-chat');
  }

  static _formatResponse(response) {
    try {
      if (typeof response === 'string') {
        return JSON.parse(response);
      }
      return response;
    } catch (e) {
      console.error('Error parsing response:', e);
      return [];
    }
  }

  static async extractNames(content) {
    if (!content) return [];
    
    try {
      if (this.modelProvider === 'openai') {
        console.log('Attempting OpenAI API for names extraction...');
        return await this._extractNamesOpenAI(content);
      } else {
        console.log('Attempting DeepSeek API for names extraction...');
        return await this._extractNamesDeepSeek(content);
      }
    } catch (error) {
      console.error(`Error extracting names with ${this.modelProvider}:`, error);
      
      // Only attempt fallback if not already using OpenAI
      if (this.modelProvider !== 'openai') {
        console.log('Falling back to OpenAI...');
        try {
          return await this._extractNamesOpenAI(content);
        } catch (fallbackError) {
          console.error('Fallback to OpenAI failed:', fallbackError);
        }
      }
      return [];
    }
  }

  static async extractTopics(content) {
    if (!content) return [];
    
    try {
      if (this.modelProvider === 'openai') {
        console.log('Attempting OpenAI API for topics extraction...');
        return await this._extractTopicsOpenAI(content);
      } else {
        console.log('Attempting DeepSeek API for topics extraction...');
        return await this._extractTopicsDeepSeek(content);
      }
    } catch (error) {
      console.error(`Error extracting topics with ${this.modelProvider}:`, error);
      
      // Only attempt fallback if not already using OpenAI
      if (this.modelProvider !== 'openai') {
        console.log('Falling back to OpenAI...');
        try {
          return await this._extractTopicsOpenAI(content);
        } catch (fallbackError) {
          console.error('Fallback to OpenAI failed:', fallbackError);
        }
      }
      return [];
    }
  }

  static async _extractNamesOpenAI(content) {
    if (!content) return [];
    
    const response = await this.openai.chat.completions.create({
      model: this.getModel(),
      messages: [{
        role: "system",
        content: "Extract all person names from this text. Return as JSON array of strings."
      }, {
        role: "user",
        content
      }],
      response_format: { type: "json_object" }
    });

    const result = this._formatResponse(response.choices[0].message.content);
    return Array.isArray(result) ? result : (result.names || []);
  }

  static async _extractTopicsOpenAI(content) {
    if (!content) return [];
    
    const response = await this.openai.chat.completions.create({
      model: this.getModel(),
      messages: [{
        role: "system",
        content: "Extract main topics from this text. Return as JSON array of {topic: string, confidence: number}."
      }, {
        role: "user",
        content
      }],
      response_format: { type: "json_object" }
    });

    const result = this._formatResponse(response.choices[0].message.content);
    return Array.isArray(result) ? result : (result.topics || []);
  }

  static getTopTerms(tfidf, count = 5) {
    const terms = [];
    tfidf.listTerms(0 /* document index */).slice(0, count)
      .forEach(item => {
        terms.push(item.term);
      });
    return terms;
  }

  static isTimeMatch(time1, time2) {
    // Convert times to minutes for comparison
    const getMinutes = (time) => {
      const match = time.toLowerCase().match(/(\d+)(?::(\d+))?\s*(am|pm)?/);
      if (!match) return null;
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2] || '0');
      const meridian = match[3];

      if (meridian === 'pm' && hours < 12) hours += 12;
      if (meridian === 'am' && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const minutes1 = getMinutes(time1);
    const minutes2 = getMinutes(time2);

    if (minutes1 === null || minutes2 === null) return false;
    return Math.abs(minutes1 - minutes2) <= 30; // Within 30 minutes
  }

  static async _extractNamesDeepSeek(content) {
    if (!content) return [];
    
    try {
      const model = this.getModel();

      const options = {
        model,
        messages: [
          {
            role: "system",
            content: "Extract all person names from this text. Return as JSON array. Include only clear person references."
          },
          {
            role: "user",
            content
          }
        ],
        response_format: { type: "json_object" }
      };

      const response = await this.deepseek.chatCompletionsCreate(options);

      return JSON.parse(response.choices[0].message.content).names || [];
    } catch (error) {
      console.error('Error extracting names:', error);
      return [];
    }
  }

  static async _extractTopicsDeepSeek(content) {
    if (!content) return [];
    
    try {
      const model = this.getModel();

      // Use TF-IDF to identify important terms
      const tfidf = new natural.TfIdf();
      const tokens = tokenizer.tokenize(content);
      tfidf.addDocument(tokens);
      const topTerms = this.getTopTerms(tfidf, 5);

      const options = {
        model,
        messages: [
          {
            role: "system",
            content: `Extract main topics from this text. Consider:
            1. Subject matter
            2. Key themes
            3. Recurring concepts
            4. Important terms: ${topTerms.join(', ')}
            
            Return as JSON array with confidence scores.`
          },
          {
            role: "user",
            content
          }
        ],
        response_format: { type: "json_object" }
      };

      const response = await this.deepseek.chatCompletionsCreate(options);

      return JSON.parse(response.choices[0].message.content).topics;
    } catch (error) {
      console.error('Error extracting topics:', error);
      return [];
    }
  }
}

module.exports = PatternHelpers; 