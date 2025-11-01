#!/usr/bin/env python3
"""
Start the React frontend development server
"""

import os
import sys
import subprocess
from pathlib import Path

def start_frontend():
    """Start the React frontend"""
    print("🚀 Starting React frontend development server...")
    print("📍 Frontend will be available at: http://localhost:5173")
    print("="*50)
    
    frontend_path = Path("frontend")
    
    if not frontend_path.exists():
        print("✗ Frontend directory not found")
        return False
    
    # Change to frontend directory and start the server
    os.chdir(frontend_path)
    
    try:
        # Start the development server
        subprocess.run(["npm", "run", "dev"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error starting frontend: {e}")
        return False
    
    return True

if __name__ == "__main__":
    start_frontend()


