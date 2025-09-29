#!/bin/bash

# Video Optimizer - Development Mode Script
echo "🚀 Starting Video Optimizer in development mode..."

# Function to cleanup background processes
cleanup() {
    echo "🧹 Cleaning up..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not available. Please install Python 3.11+ and try again."
    exit 1
fi

# Check if Node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not available. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if FFmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not available. Please install FFmpeg and try again."
    echo "   On macOS: brew install ffmpeg"
    echo "   On Ubuntu: sudo apt install ffmpeg"
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

echo "🏃 Starting backend server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd ../frontend
echo "📦 Installing frontend dependencies..."
npm install

echo "🏃 Starting frontend development server..."
npm start &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait
