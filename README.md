# brains!!!: Personal Cognitive System

A personal cognitive system that functions as a "second brain" with a sophisticated memory architecture designed to store, retrieve, and organize knowledge in a way that mimics human cognition.

## 🧠 Overview

brains!!! is a cognitive architecture that provides:

- **Intelligent Memory Storage** - Store memories with rich context and metadata
- **Semantic Search** - Find information through meaning, not just keywords
- **Pattern Detection** - Identify connections and recurring themes
- **Knowledge Graph** - Visualize relationships between concepts and memories
- **Reflective Learning** - The system improves its organization over time

## 🚀 MVP Features

The current MVP demonstrates the core functionality of the system:

- **Memory Operations** - Store, retrieve, search, update, and delete memories
- **Vector-Based Retrieval** - Semantic search using Qdrant vector database
- **Entity Tracking** - Track people, topics, and recurring concepts
- **Pattern Detection** - Identify connections between stored memories
- **Knowledge Graph** - Visualize relationships between different pieces of knowledge
- **Basic Dashboard** - Simple UI for interacting with the system

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Qdrant vector database (running locally or remote)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/brains.git
cd brains
```

2. **Install dependencies**

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. **Configure environment variables**

Create a `.env` file in the root directory with the following variables:

```
QDRANT_URL=http://localhost:6333
OPENAI_API_KEY=your_openai_api_key  # Optional, for enhanced features
PORT=3001
```

4. **Start Qdrant**

If you're running Qdrant locally, you can use Docker:

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

### Running the System

1. **Populate with test data (optional)**

```bash
node backend/scripts/populateDummyData.js
```

2. **Start the backend server**

```bash
node backend/server.js
```

3. **Start the frontend development server**

```bash
cd frontend
npm start
```

4. **Access the dashboard**

Open your browser and navigate to:
```
http://localhost:3000
```

## 🧪 Testing the System

The MVP includes several test scripts to verify functionality:

```bash
# Test memory core functionality
node backend/scripts/testMemoryCore.js

# Test query and retrieval layer
node backend/scripts/testQueryLayer.js
```

## 📚 API Endpoints

The system provides the following API endpoints:

### Memory Operations

- `GET /api/memories` - Search memories with optional query and filters
- `GET /api/memories/:id` - Retrieve a specific memory
- `POST /api/memories` - Store a new memory
- `PUT /api/memories/:id` - Update a memory
- `DELETE /api/memories/:id` - Delete a memory
- `POST /api/memories/query` - Advanced query with full options
- `GET /api/memories/similar/:id` - Find memories similar to a specific memory

### Pattern Detection

- `GET /api/patterns` - Find all patterns in memories
- `GET /api/patterns/topics` - Find topic patterns
- `GET /api/patterns/entities` - Find entity co-occurrence patterns
- `GET /api/patterns/temporal` - Find temporal patterns

### Knowledge Graph

- `GET /api/knowledge-graph` - Get the current knowledge graph
- `POST /api/knowledge-graph/create` - Create a knowledge graph from memories
- `GET /api/knowledge-graph/nodes` - Get all nodes in the knowledge graph
- `GET /api/knowledge-graph/edges` - Get all edges in the knowledge graph
- `GET /api/knowledge-graph/paths` - Find paths between nodes
- `POST /api/knowledge-graph/node` - Add a node to the knowledge graph
- `POST /api/knowledge-graph/edge` - Add an edge to the knowledge graph

## 📋 Next Steps

After the MVP, planned enhancements include:

- Advanced UI with visualizations for the knowledge graph
- Automated reflection and memory reorganization
- Integration with external data sources
- Natural language interface for queries
- Personalized insights and recommendations

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, please reach out to [your-email@example.com](mailto:your-email@example.com)
