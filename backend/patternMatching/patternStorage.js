import fs from 'fs/promises';
import path from 'path';

export class PatternStorage {
  constructor(storageDir = 'data/patterns') {
    this.storageDir = storageDir;
    this.storageFile = path.join(storageDir, 'patterns.json');
    this.logFile = path.join(storageDir, 'pattern_log.json');
    this.memorySourceFile = path.join(storageDir, 'memory_sources.json');
    this.initialized = false;
  }

  async initialize() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      
      // Create files if they don't exist
      try {
        await fs.access(this.storageFile);
      } catch {
        await fs.writeFile(this.storageFile, JSON.stringify({
          temporal: [],
          behavioral: [],
          relational: [],
          topical: [],
          lastUpdated: new Date().toISOString()
        }, null, 2));
      }

      try {
        await fs.access(this.logFile);
      } catch {
        await fs.writeFile(this.logFile, JSON.stringify({
          matches: [],
          misses: [],
          stats: {
            totalMatches: 0,
            totalMisses: 0,
            averageConfidence: 0
          }
        }, null, 2));
      }

      try {
        await fs.access(this.memorySourceFile);
      } catch {
        await fs.writeFile(this.memorySourceFile, JSON.stringify({
          memories: [],
          stats: {
            openai: 0,
            deepseek: 0,
            total: 0
          }
        }, null, 2));
      }
    } catch (error) {
      console.error('Error initializing pattern storage:', error);
      throw error;
    }
  }

  async savePatterns(patterns) {
    try {
      const serializedPatterns = this.serializePatterns(patterns);
      await fs.writeFile(
        this.storageFile,
        JSON.stringify({
          ...serializedPatterns,
          lastUpdated: new Date().toISOString()
        }, null, 2)
      );
    } catch (error) {
      console.error('Error saving patterns:', error);
      throw error;
    }
  }

  async loadPatterns() {
    try {
      const data = await fs.readFile(this.storageFile, 'utf8');
      return this.deserializePatterns(JSON.parse(data));
    } catch (error) {
      console.error('Error loading patterns:', error);
      throw error;
    }
  }

  async logMatch(pattern, confidence, timestamp = new Date().toISOString()) {
    try {
      let logData;
      try {
        const fileContent = await fs.readFile(this.logFile, 'utf8');
        if (!fileContent.trim().startsWith('{')) {
          throw new Error('Corrupted JSON - resetting file');
        }
        logData = JSON.parse(fileContent);
      } catch (error) {
        logData = {
          matches: [],
          misses: [],
          stats: {
            totalMatches: 0,
            totalMisses: 0,
            averageConfidence: 0
          }
        };
      }
      
      logData.matches.push({
        type: pattern.type,
        confidence,
        timestamp
      });

      logData.stats.totalMatches++;
      logData.stats.averageConfidence = 
        logData.matches.reduce((acc, m) => acc + m.confidence, 0) / logData.matches.length;

      await fs.writeFile(this.logFile, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Error logging pattern match:', error);
    }
  }

  async logMiss(patternType, content, timestamp = new Date().toISOString()) {
    try {
      const logData = JSON.parse(await fs.readFile(this.logFile, 'utf8'));
      
      logData.misses.push({
        type: patternType,
        content,
        timestamp
      });

      logData.stats.totalMisses++;

      await fs.writeFile(this.logFile, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Error logging pattern miss:', error);
    }
  }

  async getStats() {
    try {
      const logData = JSON.parse(await fs.readFile(this.logFile, 'utf8'));
      return logData.stats;
    } catch (error) {
      console.error('Error getting pattern stats:', error);
      return null;
    }
  }

  async logMemorySource(content, modelProvider, patterns, timestamp = new Date().toISOString()) {
    try {
      const sourceData = JSON.parse(await fs.readFile(this.memorySourceFile, 'utf8'));
      
      sourceData.memories.push({
        content,
        modelProvider,
        patterns,
        timestamp
      });

      sourceData.stats[modelProvider]++;
      sourceData.stats.total++;

      await fs.writeFile(this.memorySourceFile, JSON.stringify(sourceData, null, 2));
    } catch (error) {
      console.error('Error logging memory source:', error);
    }
  }

  async getMemorySourceStats() {
    try {
      const sourceData = JSON.parse(await fs.readFile(this.memorySourceFile, 'utf8'));
      return sourceData.stats;
    } catch (error) {
      console.error('Error getting memory source stats:', error);
      return null;
    }
  }

  serializePatterns(patterns) {
    const serialized = {};
    for (const [type, patternMap] of Object.entries(patterns)) {
      serialized[type] = Array.from(patternMap.entries()).map(([key, pattern]) => ({
        ...pattern,
        contexts: Array.from(pattern.contexts || []),
        relationships: pattern.relationships ? 
          Array.from(pattern.relationships.entries()).map(([k, v]) => ({
            name: k,
            ...v,
            contexts: Array.from(v.contexts || [])
          })) : []
      }));
    }
    return serialized;
  }

  deserializePatterns(data) {
    const deserialized = {};
    for (const [type, patterns] of Object.entries(data)) {
      if (type === 'lastUpdated') continue;
      deserialized[type] = new Map(
        patterns.map(pattern => [
          pattern.topic || pattern.name || pattern.action || pattern.time,
          {
            ...pattern,
            contexts: new Set(pattern.contexts),
            relationships: pattern.relationships ? 
              new Map(pattern.relationships.map(r => [
                r.name,
                { ...r, contexts: new Set(r.contexts) }
              ])) : undefined
          }
        ])
      );
    }
    return deserialized;
  }
}

export default PatternStorage; 