#!/bin/bash

# Start All Services for Integrated Academic Matchmaker
# This script starts:
# 1. Python Flask service (LangGraph workflows) - Port 8080
# 2. Node.js backend (API proxy) - Port 3003
# 3. React frontend (Vite) - Port 3000

echo "🚀 Starting All Services for Academic Matchmaker"
echo "================================================"
echo ""

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    kill $PYTHON_PID $NODE_PID $VITE_PID 2>/dev/null
    wait $PYTHON_PID $NODE_PID $VITE_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Python Flask Service
echo "🐍 [1/3] Starting Python Flask Service (Port 8080)..."
cd "$SCRIPT_DIR/Academic-Mentorship-workflow-using-Langraph"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate 2>/dev/null
pip install -q -r requirements.txt 2>/dev/null
python3 app.py > /tmp/python-service.log 2>&1 &
PYTHON_PID=$!
echo "   ✅ Python service started (PID: $PYTHON_PID)"
sleep 2

# Start Node.js Backend
echo "📡 [2/3] Starting Node.js Backend (Port 3003)..."
cd "$SCRIPT_DIR/rag-backend"
npm start > /tmp/node-backend.log 2>&1 &
NODE_PID=$!
echo "   ✅ Node.js backend started (PID: $NODE_PID)"
sleep 2

# Start React Frontend
echo "⚛️  [3/3] Starting React Frontend (Port 3000)..."
cd "$SCRIPT_DIR"
npm run dev > /tmp/vite-frontend.log 2>&1 &
VITE_PID=$!
echo "   ✅ React frontend started (PID: $VITE_PID)"
sleep 3

echo ""
echo "✅ All services are starting!"
echo "================================================"
echo "📊 Service URLs:"
echo "   🐍 Python Flask:    http://localhost:8080"
echo "   📡 Node.js Backend: http://localhost:3003"
echo "   ⚛️  React Frontend:  http://localhost:3000"
echo ""
echo "📋 Logs:"
echo "   Python: tail -f /tmp/python-service.log"
echo "   Node.js: tail -f /tmp/node-backend.log"
echo "   Frontend: tail -f /tmp/vite-frontend.log"
echo ""
echo "💡 Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait $PYTHON_PID $NODE_PID $VITE_PID

