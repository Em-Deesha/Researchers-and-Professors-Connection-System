#!/usr/bin/env python3
"""
Start the FastAPI backend server
"""

import os
import sys
import subprocess
from pathlib import Path

def get_venv_python():
    """Get the Python executable in virtual environment"""
    if os.name == 'nt':  # Windows
        return "venv\\Scripts\\python.exe"
    else:
        return "venv/bin/python"

def start_backend():
    """Start the FastAPI backend"""
    print("🚀 Starting FastAPI backend server...")
    print("📍 Backend will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("="*50)
    
    python_cmd = get_venv_python()
    backend_path = Path("backend")
    
    if not backend_path.exists():
        print("✗ Backend directory not found")
        return False
    
    # Change to backend directory and start the server
    os.chdir(backend_path)
    
    try:
        # Start the server
        subprocess.run([python_cmd, "main.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Backend server stopped")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error starting backend: {e}")
        return False
    
    return True

if __name__ == "__main__":
    start_backend()


