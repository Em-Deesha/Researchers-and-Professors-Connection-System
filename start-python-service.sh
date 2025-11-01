#!/bin/bash

# Start Python Flask Service for LangGraph Workflows
# This script starts the Academic Mentorship workflow service

cd "$(dirname "$0")/Academic-Mentorship-workflow-using-Langraph"

echo "🐍 Starting Python Flask Service (LangGraph Workflows)..."
echo "📁 Working directory: $(pwd)"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing/updating dependencies..."
pip install -q -r requirements.txt

# Check for GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  Warning: GEMINI_API_KEY not set in environment"
    echo "   Please set it before running: export GEMINI_API_KEY=your_key_here"
fi

# Start Flask app
echo "🚀 Starting Flask service on port 8080..."
echo "💡 Service will be available at: http://localhost:8080"
echo "🎓 Mentorship endpoint: http://localhost:8080/api/mentorship"
echo "📄 Paper analysis: http://localhost:8080/api/paper-analysis"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

python3 app.py

