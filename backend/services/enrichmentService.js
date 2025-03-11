/**
 * Memory Enrichment Service
 * Processes raw memories to extract entities, topics, and sentiment
 */
import OpenAI from 'openai';
import { EntityService } from './entityService.js';
import dotenv from 'dotenv';

dotenv.config();

export class EnrichmentService {
  constructor(options = {}) {
    this.options = options;
    this.initialized = false;
    this.entityService = new EntityService();
    
    // Initialize OpenAI client if API key exists
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    try {
      await this.entityService.initialize();
      this.initialized = true;
      console.log('✅ Enrichment service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing EnrichmentService:', error);
      return false;
    }
  }
  
  /**
   * Enrich a memory with additional metadata
   * @param {Object} memory - The memory object to enrich
   * @returns {Object} The enriched memory
   */
  async enrichMemory(memory) {
    if (!memory || !memory.content) {
      console.warn('Cannot enrich empty memory');
      return memory;
    }
    
    try {
      // Extract entities using OpenAI - more reliable than rule-based extraction
      const entities = await this.extractEntitiesWithAI(memory.content);
      console.log("Extracted entities:", entities);
      
      // Generate tags
      const tags = await this.generateTags(memory.content);
      
      // Analyze sentiment
      const sentiment = await this.analyzeSentiment(memory.content);
      
      // Return the enriched memory
      return {
        ...memory,
        entities, // Use the AI-extracted entities
        tags,
        sentiment
      };
    } catch (error) {
      console.error('Error enriching memory:', error);
      // Return the original memory if enrichment fails
      return memory;
    }
  }
  
  /**
   * Generate tags for a text using OpenAI
   */
  async generateTags(text) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a tagging assistant. Extract 3-7 relevant keywords or tags from the provided text. Return only a JSON array of tag strings, nothing else."
          },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      return Array.isArray(result.tags) ? result.tags : [];
    } catch (error) {
      console.error('Error generating tags:', error);
      return this.generateSimpleTags(text);
    }
  }
  
  /**
   * Simple tag generation without OpenAI
   */
  generateSimpleTags(text) {
    // Common words to exclude
    const stopWords = new Set([
      'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
      'by', 'about', 'as', 'is', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'so', 'than', 'then'
    ]);
    
    // Tokenize and filter
    const tokens = text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 3 && !stopWords.has(word)); // Filter short words and stopwords
    
    // Count word frequency
    const wordCounts = {};
    tokens.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Sort by frequency and take top 5
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
  
  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment of the text. Return a JSON object with a 'score' (-1 to 1, where -1 is very negative, 0 is neutral, and 1 is very positive) and a 'label' (one of: very negative, negative, neutral, positive, very positive)."
          },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      });
      
      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Default to neutral sentiment
      return { score: 0, label: 'neutral' };
    }
  }
  
  // Add this function to use OpenAI for entity extraction
  async extractEntitiesWithAI(text) {
    if (!this.openai) {
      console.warn("OpenAI client not available for entity extraction");
      return { people: [], places: [], organizations: [], dates: [], concepts: [] };
    }
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Extract entities from the following text. Return a JSON object with these arrays: 'people' (names of people), 'places' (locations), 'organizations' (companies, institutions), 'dates' (date references), and 'concepts' (abstract ideas or topics)."
          },
          { 
            role: "user", 
            content: text 
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      return {
        people: result.people || [],
        places: result.places || [],
        organizations: result.organizations || [],
        dates: result.dates || [],
        concepts: result.concepts || []
      };
    } catch (error) {
      console.error('Error extracting entities with AI:', error);
      return { people: [], places: [], organizations: [], dates: [], concepts: [] };
    }
  }
}

export default EnrichmentService; 