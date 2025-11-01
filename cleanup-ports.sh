#!/bin/bash

# Cleanup script to free ports 3000 and 5001 from Docker containers
# This ensures your Academic Matchmaker can run properly

echo "🧹 Cleaning up ports for Academic Matchmaker..."
echo ""

# Stop and remove Docker containers
echo "🐳 Stopping Docker containers..."
sudo docker stop docker-frontend docker-backend 2>/dev/null
sudo docker rm docker-frontend docker-backend 2>/dev/null
echo "✅ Docker containers cleaned up"
echo ""

# Check what's using port 3000
echo "🔍 Checking port 3000..."
PORT_3000_PID=$(lsof -ti :3000 2>/dev/null | head -1)
if [ -n "$PORT_3000_PID" ]; then
    echo "   Found process $PORT_3000_PID on port 3000"
    ps -p $PORT_3000_PID -o comm= 2>/dev/null || echo "   (Process details unavailable)"
    read -p "   Kill process $PORT_3000_PID? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PORT_3000_PID 2>/dev/null && echo "   ✅ Killed process on port 3000"
    else
        echo "   ⚠️  Port 3000 still in use by PID $PORT_3000_PID"
    fi
else
    echo "   ✅ Port 3000 is free"
fi
echo ""

# Check what's using port 5001
echo "🔍 Checking port 5001..."
PORT_5001_PID=$(lsof -ti :5001 2>/dev/null | head -1)
if [ -n "$PORT_5001_PID" ]; then
    echo "   Found process $PORT_5001_PID on port 5001"
    kill -9 $PORT_5001_PID 2>/dev/null && echo "   ✅ Freed port 5001"
else
    echo "   ✅ Port 5001 is free"
fi
echo ""

# Final status
echo "📊 Port Status:"
echo "   Port 3000: $(lsof -ti :3000 >/dev/null 2>&1 && echo '❌ IN USE' || echo '✅ FREE')"
echo "   Port 5001: $(lsof -ti :5001 >/dev/null 2>&1 && echo '❌ IN USE' || echo '✅ FREE')"
echo "   Port 3003: $(lsof -ti :3003 >/dev/null 2>&1 && echo '✅ Node.js Backend Running' || echo '⏸️  Not Running')"
echo "   Port 8080: $(lsof -ti :8080 >/dev/null 2>&1 && echo '✅ Python Service Running' || echo '⏸️  Not Running')"
echo ""

echo "🚀 Ready to start Academic Matchmaker!"
echo "   Run: ./start-all-services.sh"
echo "   Or: npm run dev (in project root)"


