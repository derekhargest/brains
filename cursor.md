# AI Brain Project: Technology Stack Reference

## Project Information
- **Project Name**: AI Brain Memory System
- **Version**: 0.1.0

## Technology Stack

### Backend
- **Language**: JavaScript (Node.js)
- **Server**: Express
- **Realtime Communication**: Socket.io
- **Vector Database**: Qdrant
- **AI Provider**: OpenAI API

### Frontend
- **Core**: Vanilla JavaScript
- **UI**: HTML5 + CSS3
- **Visualization**: Chart.js
- **Realtime**: Socket.io Client

### Persistence
- **Memory**: Qdrant collections
- **Backup**: JSON files
- **Temporary**: Local storage

## Key Files

### Server
- `server.js` - Main application server

### Frontend
- `frontend/index.html` - Main application page
- `frontend/chat.html` - Chat interface
- `frontend/app.js` - Core application logic
- `frontend/chat.js` - Chat functionality
- `frontend/data-generator.html` - Data generation UI
- `frontend/data-generator.js` - Data generation logic

### Backend
- `backend/wiki.js` - Wiki system functionality
- `backend/vectorStore.js` - Vector database interface

### Documentation
- `project-status.js` - Project status documentation

## Project Rules

1. **Technology Rule**: DO NOT suggest alternative technologies or databases. This project uses Qdrant, Express, and vanilla JavaScript.

2. **Structure Rule**: Maintain the existing file structure and naming conventions.

3. **Implementation Rule**: Focus on enhancing current components rather than creating duplicates.

4. **Memory System Rule**: All memory operations must go through a unified memory interface with proper metadata and timestamps.

5. **Development Rule**: Document all components and maintain a record of changes.
