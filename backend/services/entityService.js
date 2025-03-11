import natural from 'natural';
import { 
  storeMemory, 
  advancedSearch 
} from '../vectorStore.js';

// Use the appropriate NER implementation from natural
// natural.NER is not a constructor, use a different approach
export class EntityService {
  constructor(options = {}) {
    this.initialized = false;
    this.options = options;
    this.entityCache = new Map();
    
    // Initialize tokenizer for basic entity extraction
    this.tokenizer = new natural.WordTokenizer();
    
    // Initialize lexicon for basic named entity recognition
    this.lexicon = new natural.Lexicon('EN', 'N', 'NNP');
    
    // Use the natural.js tagger for POS tagging
    this.tagger = new natural.BrillPOSTagger(this.lexicon);
    
    // Common entity markers
    this.personTitles = new Set(['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Sir', 'Lady', 'Lord']);
    this.orgSuffixes = new Set(['Inc', 'LLC', 'Ltd', 'Corp', 'Corporation', 'Company', 'Co', 'Group', 'GmbH', 'AG']);
    this.placePrefixes = new Set(['in', 'at', 'to', 'from']);
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Add initialization logic here
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing EntityService:', error);
      return false;
    }
  }
  
  async extractEntities(text) {
    try {
      if (!text) {
        return { people: [], places: [], organizations: [], dates: [], concepts: [] };
      }
      
      // Tokenize the text
      const tokens = this.tokenizer.tokenize(text);
      const taggedWords = this.tagger.tag(tokens).taggedWords;
      
      // Extract proper nouns (NNP) as potential entities
      const properNouns = [];
      const people = [];
      const places = [];
      const organizations = [];
      
      // Identify multi-word proper nouns
      let currentEntity = [];
      let lastWasProperNoun = false;
      
      for (let i = 0; i < taggedWords.length; i++) {
        const { token, tag } = taggedWords[i];
        const isProperNoun = tag === 'NNP' || tag === 'NNPS';
        
        // Check for person titles (Mr, Mrs, Dr, etc.)
        if (this.personTitles.has(token) && i < taggedWords.length - 1) {
          const nextToken = taggedWords[i+1].token;
          people.push(`${token} ${nextToken}`);
          i++; // Skip the next token
          continue;
        }
        
        // Handle proper nouns
        if (isProperNoun) {
          currentEntity.push(token);
          lastWasProperNoun = true;
        } else {
          if (lastWasProperNoun && currentEntity.length > 0) {
            const entity = currentEntity.join(' ');
            properNouns.push(entity);
            
            // Categorize entity
            if (this.isPerson(entity, i, taggedWords)) {
              people.push(entity);
            } else if (this.isPlace(entity, i, taggedWords)) {
              places.push(entity);
            } else if (this.isOrganization(entity)) {
              organizations.push(entity);
            }
            
            currentEntity = [];
          }
          lastWasProperNoun = false;
        }
      }
      
      // Handle the last entity
      if (currentEntity.length > 0) {
        const entity = currentEntity.join(' ');
        properNouns.push(entity);
        
        if (this.isPerson(entity)) {
          people.push(entity);
        } else if (this.isPlace(entity)) {
          places.push(entity);
        } else if (this.isOrganization(entity)) {
          organizations.push(entity);
        }
      }
      
      // Extract dates
      const dateRegex = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b|\b(yesterday|tomorrow|today|next week|last week|next month|last month|next Monday|next Tuesday|next Wednesday|next Thursday|next Friday|next Saturday|next Sunday)\b/gi;
      const dates = [...text.matchAll(dateRegex)].map(match => match[0]);
      
      // Extract concepts (keywords that aren't entities)
      const concepts = this.extractConcepts(text, [...people, ...places, ...organizations]);
      
      return {
        people: [...new Set(people)],
        places: [...new Set(places)],
        organizations: [...new Set(organizations)],
        dates: [...new Set(dates)],
        concepts: [...new Set(concepts)]
      };
    } catch (error) {
      console.error('Error extracting entities:', error);
      return { people: [], places: [], organizations: [], dates: [], concepts: [] };
    }
  }
  
  isPerson(entity, position = -1, taggedWords = []) {
    // Check for common person indicators
    if (this.personTitles.has(entity.split(' ')[0])) return true;
    
    // Check for first-name/last-name pattern (two words)
    if (entity.split(' ').length === 2) return true;
    
    // Check for preceding words like "met with" or "talked to"
    if (position > 2) {
      const prevTokens = taggedWords.slice(position-3, position).map(w => w.token.toLowerCase());
      const personVerbs = ['met', 'talked', 'spoke', 'called', 'emailed', 'texted', 'messaged'];
      if (personVerbs.some(v => prevTokens.includes(v))) return true;
    }
    
    return false;
  }
  
  isPlace(entity, position = -1, taggedWords = []) {
    // Check for common place suffixes
    const placeSuffixes = ['Street', 'Road', 'Avenue', 'Boulevard', 'Lane', 'Drive', 
                         'Park', 'Square', 'Plaza', 'City', 'Town', 'Village', 'District',
                         'County', 'State', 'Country', 'River', 'Mountain', 'Lake', 'Ocean',
                         'Station', 'Airport', 'Hospital', 'School', 'University', 'College'];
    
    for (const suffix of placeSuffixes) {
      if (entity.endsWith(suffix) || entity.includes(` ${suffix}`)) return true;
    }
    
    // Check for preceding prepositions like "in", "at", "to", "from"
    if (position > 0) {
      const prevToken = taggedWords[position-1].token.toLowerCase();
      if (this.placePrefixes.has(prevToken)) return true;
    }
    
    return false;
  }
  
  isOrganization(entity) {
    // Check for common organization suffixes
    for (const suffix of this.orgSuffixes) {
      if (entity.endsWith(suffix) || entity.includes(` ${suffix}`)) return true;
    }
    
    // Check for institution words
    const institutionWords = ['University', 'College', 'School', 'Institute', 'Association', 
                             'Department', 'Agency', 'Bureau', 'Ministry', 'Committee'];
    
    for (const word of institutionWords) {
      if (entity.includes(word)) return true;
    }
    
    return false;
  }
  
  extractConcepts(text, entities) {
    // Remove entities from text
    let cleanText = text;
    entities.forEach(entity => {
      cleanText = cleanText.replace(new RegExp(entity, 'gi'), '');
    });
    
    // Tokenize and get key terms
    const tokens = this.tokenizer.tokenize(cleanText);
    const taggedWords = this.tagger.tag(tokens).taggedWords;
    
    // Get nouns and noun phrases as concepts
    const concepts = taggedWords
      .filter(word => word.tag.startsWith('NN') && word.token.length > 3)
      .map(word => word.token);
    
    return concepts.slice(0, 5); // Return top 5 concepts
  }
  
  async storeEntityRelationships(memory, entities) {
    // Implement entity relationship storage
    return entities;
  }
  
  async searchByEntity(entityType, entityValue) {
    try {
      // Use advancedSearch with entity filters
      return await advancedSearch({
        filters: [
          {
            field: `entities.${entityType}`,
            value: entityValue,
            operator: 'contains'
          }
        ]
      });
    } catch (error) {
      console.error(`Error searching by ${entityType}:`, error);
      return [];
    }
  }
}

export default EntityService; 