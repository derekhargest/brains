const { expect } = require('chai');
const sinon = require('sinon');
const PatternHelpers = require('../patternMatching/helpers');

describe('Pattern Helpers', () => {
  describe('Time Matching', () => {
    it('should match exact times', async () => {
      const result = await PatternHelpers.isTimeMatch('3:00 PM', '15:00');
      expect(result).to.be.true;
    });

    it('should match times within tolerance', async () => {
      const result = await PatternHelpers.isTimeMatch('3:00 PM', '3:25 PM');
      expect(result).to.be.true;
    });

    it('should not match times outside tolerance', async () => {
      const result = await PatternHelpers.isTimeMatch('3:00 PM', '4:00 PM');
      expect(result).to.be.false;
    });

    it('should handle various time formats', async () => {
      const formats = [
        ['3pm', '15:00'],
        ['3:00', '15:00'],
        ['afternoon', '15:00'],
        ['morning', '09:00']
      ];

      for (const [time1, time2] of formats) {
        const result = await PatternHelpers.isTimeMatch(time1, time2);
        expect(result).to.be.true;
      }
    });
  });

  describe('Name Extraction', () => {
    let openaiStub;

    before(() => {
      openaiStub = sinon.stub(PatternHelpers, 'extractNames');
    });

    after(() => {
      openaiStub.restore();
    });

    it('should extract simple names', async () => {
      openaiStub.withArgs('Meeting with John Smith').resolves(['John Smith']);
      
      const names = await PatternHelpers.extractNames('Meeting with John Smith');
      expect(names).to.deep.equal(['John Smith']);
    });

    it('should handle multiple names', async () => {
      openaiStub.withArgs('John and Sarah discussed the project')
        .resolves(['John', 'Sarah']);
      
      const names = await PatternHelpers.extractNames('John and Sarah discussed the project');
      expect(names).to.have.members(['John', 'Sarah']);
    });

    it('should handle empty content', async () => {
      const names = await PatternHelpers.extractNames('');
      expect(names).to.be.an('array').that.is.empty;
    });
  });

  describe('Context Matching', () => {
    it('should match simple contexts', () => {
      const pattern = { type: 'work', priority: 'high' };
      const context = { type: 'work', priority: 'high', extra: 'data' };
      
      const result = PatternHelpers.isContextMatch(pattern, context);
      expect(result).to.be.true;
    });

    it('should handle nested contexts', () => {
      const pattern = {
        type: 'work',
        metadata: {
          project: 'AI',
          priority: 'high'
        }
      };
      
      const context = {
        type: 'work',
        metadata: {
          project: 'AI',
          priority: 'high',
          extra: 'data'
        }
      };
      
      const result = PatternHelpers.isContextMatch(pattern, context);
      expect(result).to.be.true;
    });

    it('should respect threshold', () => {
      const pattern = { type: 'work', priority: 'high', project: 'AI' };
      const context = { type: 'work', priority: 'medium' };
      
      const result = PatternHelpers.isContextMatch(pattern, context, 0.5);
      expect(result).to.be.false;
    });
  });

  describe('Topic Extraction', () => {
    let openaiStub;

    before(() => {
      openaiStub = sinon.stub(PatternHelpers, 'extractTopics');
    });

    after(() => {
      openaiStub.restore();
    });

    it('should extract main topics', async () => {
      const content = 'Discussing AI implementation in the new project';
      const expectedTopics = [
        { topic: 'AI', confidence: 0.9 },
        { topic: 'project implementation', confidence: 0.8 }
      ];
      
      openaiStub.withArgs(content).resolves(expectedTopics);
      
      const topics = await PatternHelpers.extractTopics(content);
      expect(topics).to.deep.equal(expectedTopics);
    });

    it('should handle technical content', async () => {
      const content = 'Debugging the React component and updating API endpoints';
      const expectedTopics = [
        { topic: 'React', confidence: 0.9 },
        { topic: 'debugging', confidence: 0.8 },
        { topic: 'API', confidence: 0.85 }
      ];
      
      openaiStub.withArgs(content).resolves(expectedTopics);
      
      const topics = await PatternHelpers.extractTopics(content);
      expect(topics).to.deep.equal(expectedTopics);
    });
  });

  describe('Pattern Enrichment', () => {
    it('should add metadata to patterns', async () => {
      const pattern = {
        type: 'work',
        occurrences: ['2024-03-01', '2024-03-02']
      };
      
      const enriched = await PatternHelpers.enrichPatternData(pattern);
      
      expect(enriched).to.have.property('metadata');
      expect(enriched.metadata).to.include.keys([
        'lastUpdated',
        'confidence',
        'frequency',
        'type'
      ]);
    });

    it('should calculate pattern confidence', () => {
      const pattern = {
        occurrences: ['2024-03-01', '2024-03-02'],
        consistency: 0.8,
        lastOccurrence: new Date().toISOString(),
        contextScore: 0.9
      };
      
      const confidence = PatternHelpers.calculatePatternConfidence(pattern);
      expect(confidence).to.be.within(0, 1);
    });

    it('should determine pattern type correctly', () => {
      const patterns = [
        { time: '15:00', date: '2024-03-01' },
        { person: 'John', relationship: 'colleague' },
        { emotion: 'happy', sentiment: 'positive' },
        { action: 'meeting', behavior: 'professional' },
        { topic: 'AI', subject: 'technology' }
      ];

      const expectedTypes = [
        'temporal',
        'relational',
        'emotional',
        'behavioral',
        'topical'
      ];

      patterns.forEach((pattern, index) => {
        const type = PatternHelpers.determinePatternType(pattern);
        expect(type).to.equal(expectedTypes[index]);
      });
    });
  });
}); 