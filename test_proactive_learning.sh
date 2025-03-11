#!/bin/bash

# Start server in background
node server.js &
SERVER_PID=$!
sleep 10 # Wait for server to start

# Run demo initialization
curl -X POST http://localhost:3002/api/demo/init

# Simulate learning cycles
for i in {1..5}; do
  echo "Running learning cycle $i"
  curl -X POST http://localhost:3002/api/demo/learn-cycle
  sleep 2
done

# Get final memory states
curl http://localhost:3002/api/memories

# Cleanup
kill $SERVER_PID 