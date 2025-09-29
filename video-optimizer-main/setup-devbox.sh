#!/bin/bash

# Video Optimizer DevBox Setup, Deploy & Verify Script
echo "🚀 Setting up and deploying Video Optimizer for existing Traefik on devbox.zone"
echo ""

# Function to check if command was successful
check_command() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# Step 1: Prerequisites check
echo "📋 Checking prerequisites..."

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose (plugin) not found. Please install Docker Compose v2"
    exit 1
fi
echo "✅ Docker Compose available"

# Create the external web network if it doesn't exist (should already exist with Traefik)
echo "🌐 Checking for external web network..."
docker network create web 2>/dev/null && echo "✅ Created 'web' network" || echo "✅ Network 'web' already exists (expected with existing Traefik)"

# Step 2: Deploy services
echo ""
echo "🚀 Deploying Video Optimizer services..."
docker compose -f devbox.docker-compose.yml up -d --build
check_command "Services deployment"

# Step 3: Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start (15 seconds)..."
sleep 15

# Step 4: Verify deployment
echo ""
echo "🔍 Verifying deployment status..."
echo ""

# Check container status
echo "📦 Container Status:"
docker compose -f devbox.docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Check if containers are healthy
backend_status=$(docker inspect video-optimizer-backend --format='{{.State.Status}}' 2>/dev/null)
frontend_status=$(docker inspect video-optimizer-frontend --format='{{.State.Status}}' 2>/dev/null)

if [ "$backend_status" = "running" ]; then
    echo "✅ Backend container is running"
else
    echo "⚠️  Backend container status: $backend_status"
fi

if [ "$frontend_status" = "running" ]; then
    echo "✅ Frontend container is running"
else
    echo "⚠️  Frontend container status: $frontend_status"
fi

# Test backend health internally
echo ""
echo "🏥 Testing backend health..."
backend_health=$(docker exec video-optimizer-backend curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ 2>/dev/null || echo "failed")

if [ "$backend_health" = "200" ]; then
    echo "✅ Backend health check passed (HTTP 200)"
else
    echo "⚠️  Backend health check: $backend_health"
fi

# Step 5: Show deployment information
echo ""
echo "🎯 DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
echo "🌐 Your Video Optimizer is available at:"
echo "   https://video-optimizer.devbox.zone"
echo ""
echo "📊 Service Status Summary:"
echo "   Backend (Internal):  $backend_status"
echo "   Frontend (Public):   $frontend_status" 
echo "   Backend Health:      $backend_health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:     docker compose -f devbox.docker-compose.yml logs -f"
echo "   Stop services: docker compose -f devbox.docker-compose.yml down"
echo "   Restart:       docker compose -f devbox.docker-compose.yml restart"
echo "   Update:        docker compose -f devbox.docker-compose.yml up -d --build"
echo ""
echo "📋 Important Notes:"
echo "   • Ensure DNS record 'video-optimizer.devbox.zone' points to this server"
echo "   • Frontend is exposed via Traefik with SSL AND on port 8601"
echo "   • Backend is accessible on port 8602 for direct API access"
echo "   • Videos are processed with aggressive compression (60-80% size reduction)"
echo ""
echo "🔌 Direct Access (for development/debugging):"
echo "   Frontend: http://localhost:8601"
echo "   Backend API: http://localhost:8602"
echo ""

# Check if we can resolve the domain
echo "🔍 DNS Check:"
if nslookup video-optimizer.devbox.zone &>/dev/null; then
    echo "✅ DNS resolution for video-optimizer.devbox.zone successful"
else
    echo "⚠️  DNS resolution failed - ensure 'video-optimizer.devbox.zone' points to this server"
fi

echo ""
echo "🎬 Ready to optimize videos!"
echo "=================================================="