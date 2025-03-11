/**
 * Tool for extracting memories from chat conversations
 */

/**
 * Extracts key points and memories from a chat conversation
 * @param {Object} chatData - The chat data to extract memories from
 * @returns {Array} An array of extracted memory objects
 */
function extractMemories(chatData) {
  const memories = [];
  
  // Basic implementation - this would be more sophisticated in a real system
  if (chatData && chatData.messages) {
    chatData.messages.forEach((message, index) => {
      if (message.role === 'user') {
        // Extract potential memory from user messages
        memories.push({
          id: `memory-${Date.now()}-${index}`,
          type: 'chat',
          content: message.content,
          timestamp: message.timestamp || new Date().toISOString(),
          source: 'user-message',
          importance: calculateImportance(message.content)
        });
      }
    });
  }
  
  return memories;
}

/**
 * Calculate a basic importance score for a text
 * @param {string} text - The text to analyze
 * @returns {number} An importance score between 0-1
 */
function calculateImportance(text = '') {
  // This is a very basic implementation
  // In a real system, this would use NLP techniques
  
  const importantKeywords = [
    'remember', 'important', 'don\'t forget', 
    'always', 'never', 'must', 'deadline',
    'birthday', 'anniversary', 'meeting'
  ];
  
  let score = 0;
  importantKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      score += 0.2; // Increase score for each important keyword
    }
  });
  
  // Cap at 1.0
  return Math.min(score, 1.0);
}

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ChatMemoryExtractor {
  constructor(options = {}) {
    this.inputDir = options.inputDir || './transcripts';
    this.outputDir = options.outputDir || './memories';
    this.dateFormat = options.dateFormat || 'YYYY-MM-DD';
  }
  
  // Keep existing methods
}

export { ChatMemoryExtractor }; 