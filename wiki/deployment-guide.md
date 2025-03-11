---
title: Deployment Guide
created: 2025-03-05T22:01:04Z
updated: 2025-03-05T22:01:04Z
---

# 🚀 AI Brain - Deployment Guide

This guide provides detailed instructions for deploying the AI Brain system in various environments, with a focus on Docker-based deployments for both development and production.

## Prerequisites

Before deploying the AI Brain system, ensure you have the following:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Git](https://git-scm.com/)
- OpenAI API key (optional, but recommended for production-quality embeddings)

## 🐳 Docker Setup

### Qdrant Vector Database

Qdrant is the recommended vector database for production deployments. Set it up with:

```bash
# Create a directory for persistent storage
mkdir -p ~/qdrant_storage

# Run Qdrant with a volume mount for persistence
docker run -d --name qdrant_db \
  -p 6333:6333 -p 6334:6334 \
  -v ~/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

[... rest of the deployment guide content ...]
