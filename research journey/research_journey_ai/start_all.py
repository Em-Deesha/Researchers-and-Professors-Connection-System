#!/usr/bin/env python3
"""
Start both backend and frontend servers
"""

import os
import sys
import subprocess
import threading
import time
from pathlib import Path

def get_venv_python():
    """Get the Python executable in virtual environment"""
    if os.name == 'nt':  # Windows
        return "venv\\Scripts\\python.exe"
    else:
        return "venv/bin/python"

def start_backend():
    """Start the FastAPI backend in a separate thread"""
    print("🚀 Starting FastAPI backend server...")
    python_cmd = get_venv_python()
    backend_path = Path("backend")
    
    if not backend_path.exists():
        print("✗ Backend directory not found")
        return
    
    os.chdir(backend_path)
    
    try:
        subprocess.run([python_cmd, "main.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Backend server stopped")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error starting backend: {e}")

def start_frontend():
    """Start the React frontend in a separate thread"""
    print("🚀 Starting React frontend development server...")
    frontend_path = Path("frontend")
    
    if not frontend_path.exists():
        print("✗ Frontend directory not found")
        return
    
    os.chdir(frontend_path)
    
    try:
        subprocess.run(["npm", "run", "dev"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error starting frontend: {e}")

def main():
    """Start both servers"""
    print("🎯 Starting AI Research Journey Platform")
    print("="*50)
    print("📍 Backend: http://localhost:8000")
    print("📍 Frontend: http://localhost:5173")
    print("📚 API Docs: http://localhost:8000/docs")
    print("="*50)
    print("\n⚠️  Make sure to set your OPENAI_API_KEY in backend/.env")
    print("🛑 Press Ctrl+C to stop both servers")
    print("="*50)
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Wait a moment for backend to start
    time.sleep(3)
    
    # Start frontend in a separate thread
    frontend_thread = threading.Thread(target=start_frontend, daemon=True)
    frontend_thread.start()
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping all servers...")
        sys.exit(0)

if __name__ == "__main__":
    main()


