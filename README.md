# Brains!!! - Cognitive Memory System

A sophisticated memory system that uses vector embeddings to store and retrieve memories with semantic understanding. This system includes pattern detection, knowledge graph relationships, and proactive learning capabilities.

## Features

- **Vector-based Memory Storage**: Store memories as semantic vectors for intelligent retrieval
- **Temporal Pattern Recognition**: Detect patterns in time-based data
- **Knowledge Graph**: Map relationships between entities and concepts
- **Proactive Learning**: Self-improvement based on usage patterns
- **Multimodal Input**: Process text, structured data, and conversations
- **Interactive Visualizations**: View memory insights and connections

## Prerequisites

- Node.js (v16+)
- Docker (for running Qdrant vector database)
- OpenAI API key (for embeddings and AI features)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-brain.git
   cd ai-brain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   PORT=3002
   ```

4. **Start Qdrant vector database**
   ```bash
   docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3002`

## Test Data Generation

You can create synthetic test data to explore the system:

1. Open `http://localhost:3002/data-generator.html`
2. Configure the generator parameters
3. Click "Generate Data"
4. Click "Import to Vector Store" to add the data to your system

## Testing

Run the test suite:
```bash
npm test
```

Run specific test modules:
```bash
npm run test:patterns   # Test pattern detection
npm run test:nlp        # Test NLP capabilities
npm run test:system     # Run system integration tests
```

Check Qdrant connection:
```bash
npm run check:qdrant
```

## System Architecture

- **Backend**: Node.js with Express
- **Vector Database**: Qdrant
- **Embeddings**: OpenAI embeddings API
- **Frontend**: Vanilla JavaScript with Chart.js and vis-network

## License

MIT License
