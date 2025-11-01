#!/bin/bash

# Stop Docker containers that might be blocking ports 3000 and 5001
# This is useful when you need to run the Academic Matchmaker instead

echo "🐳 Stopping Docker containers on ports 3000 and 5001..."

# Try without sudo first
if docker stop docker-frontend docker-backend 2>/dev/null; then
    echo "✅ Stopped containers: docker-frontend, docker-backend"
else
    # Try with sudo
    if sudo docker stop docker-frontend docker-backend 2>/dev/null; then
        echo "✅ Stopped containers (with sudo): docker-frontend, docker-backend"
    else
        echo "⚠️  Could not stop containers. They may not be running."
    fi
fi

# Optional: Remove containers if you want to clean up
read -p "Do you want to remove these containers? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if docker rm docker-frontend docker-backend 2>/dev/null; then
        echo "✅ Removed containers"
    elif sudo docker rm docker-frontend docker-backend 2>/dev/null; then
        echo "✅ Removed containers (with sudo)"
    fi
fi

echo ""
echo "💡 Ports 3000 and 5001 should now be available"
echo "🚀 You can now start your Academic Matchmaker with:"
echo "   ./start-all-services.sh"
echo "   or"
echo "   npm run dev"

