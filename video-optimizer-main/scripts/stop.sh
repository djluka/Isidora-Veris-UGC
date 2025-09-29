#!/bin/bash

# Video Optimizer - Stop Script
echo "🛑 Stopping Video Optimizer..."

# Stop and remove containers
docker-compose down

echo "✅ Video Optimizer has been stopped."
echo "💡 To start again, run: ./scripts/start.sh"
