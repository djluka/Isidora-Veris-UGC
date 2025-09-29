#!/bin/bash

# Video Optimizer - Start Script
echo "🎬 Starting Video Optimizer..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose could not be found. Please install docker-compose and try again."
    exit 1
fi

echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Video Optimizer is running!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8000 (proxied through frontend)"
    echo ""
    echo "To stop the application, run: ./scripts/stop.sh"
    echo "To view logs, run: docker-compose logs -f"
else
    echo "❌ Failed to start services. Check the logs with: docker-compose logs"
    exit 1
fi
