#!/usr/bin/env python3
"""
Setup script for AI Research Journey Platform
This script will:
1. Create virtual environment
2. Install Python dependencies
3. Install Node.js dependencies
4. Set up environment variables
5. Initialize database
6. Start the application
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def run_command(command, cwd=None, shell=True):
    """Run a command and return the result"""
    try:
        result = subprocess.run(
            command, 
            shell=shell, 
            cwd=cwd, 
            capture_output=True, 
            text=True, 
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error: {e.stderr}")
        return None

def check_python():
    """Check if Python is installed"""
    try:
        result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
        print(f"✓ Python found: {result.stdout.strip()}")
        return True
    except:
        print("✗ Python not found. Please install Python 3.8+")
        return False

def check_node():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        print(f"✓ Node.js found: {result.stdout.strip()}")
        return True
    except:
        print("✗ Node.js not found. Please install Node.js 16+")
        return False

def create_virtual_env():
    """Create virtual environment"""
    print("\n📦 Creating virtual environment...")
    venv_path = Path("venv")
    
    if venv_path.exists():
        print("✓ Virtual environment already exists")
        return True
    
    result = run_command(f"{sys.executable} -m venv venv")
    if result is not None:
        print("✓ Virtual environment created")
        return True
    else:
        print("✗ Failed to create virtual environment")
        return False

def get_venv_python():
    """Get the Python executable in virtual environment"""
    if platform.system() == "Windows":
        return "venv\\Scripts\\python.exe"
    else:
        return "venv/bin/python"

def get_venv_pip():
    """Get the pip executable in virtual environment"""
    if platform.system() == "Windows":
        return "venv\\Scripts\\pip.exe"
    else:
        return "venv/bin/pip"

def install_python_deps():
    """Install Python dependencies"""
    print("\n📦 Installing Python dependencies...")
    pip_cmd = get_venv_pip()
    result = run_command(f"{pip_cmd} install -r requirements.txt")
    if result is not None:
        print("✓ Python dependencies installed")
        return True
    else:
        print("✗ Failed to install Python dependencies")
        return False

def install_node_deps():
    """Install Node.js dependencies"""
    print("\n📦 Installing Node.js dependencies...")
    frontend_path = Path("frontend")
    if not frontend_path.exists():
        print("✗ Frontend directory not found")
        return False
    
    result = run_command("npm install", cwd=frontend_path)
    if result is not None:
        print("✓ Node.js dependencies installed")
        return True
    else:
        print("✗ Failed to install Node.js dependencies")
        return False

def setup_env_file():
    """Set up environment file"""
    print("\n🔧 Setting up environment file...")
    env_file = Path("backend/.env")
    env_template = Path("backend/env_template.txt")
    
    if env_file.exists():
        print("✓ Environment file already exists")
        return True
    
    if env_template.exists():
        # Copy template to .env
        with open(env_template, 'r') as f:
            content = f.read()
        with open(env_file, 'w') as f:
            f.write(content)
        print("✓ Environment file created from template")
        print("⚠️  Please update backend/.env with your OpenAI API key")
        return True
    else:
        # Create basic .env file
        env_content = """OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///./research_journey.db
"""
        with open(env_file, 'w') as f:
            f.write(env_content)
        print("✓ Basic environment file created")
        print("⚠️  Please update backend/.env with your OpenAI API key")
        return True

def initialize_database():
    """Initialize the database"""
    print("\n🗄️ Initializing database...")
    python_cmd = get_venv_python()
    
    # Create a simple script to initialize the database
    init_script = """
import sys
import os
sys.path.append('backend')
from backend.db import init_db
init_db()
print("Database initialized successfully!")
"""
    
    with open("init_db.py", "w") as f:
        f.write(init_script)
    
    result = run_command(f"{python_cmd} init_db.py")
    os.remove("init_db.py")
    
    if result is not None:
        print("✓ Database initialized")
        return True
    else:
        print("✗ Failed to initialize database")
        return False

def start_application():
    """Start the application"""
    print("\n🚀 Starting the application...")
    print("\n" + "="*60)
    print("🎉 Setup Complete! Starting the application...")
    print("="*60)
    print("\n📋 Instructions:")
    print("1. Open a new terminal and run: python backend/main.py")
    print("2. Open another terminal and run: cd frontend && npm run dev")
    print("3. Open your browser to http://localhost:5173")
    print("\n⚠️  Don't forget to set your OPENAI_API_KEY in backend/.env")
    print("="*60)

def main():
    """Main setup function"""
    print("🎯 AI Research Journey Platform Setup")
    print("="*50)
    
    # Check prerequisites
    if not check_python():
        return False
    
    if not check_node():
        return False
    
    # Setup steps
    steps = [
        ("Creating virtual environment", create_virtual_env),
        ("Installing Python dependencies", install_python_deps),
        ("Installing Node.js dependencies", install_node_deps),
        ("Setting up environment file", setup_env_file),
        ("Initializing database", initialize_database),
    ]
    
    for step_name, step_func in steps:
        print(f"\n🔄 {step_name}...")
        if not step_func():
            print(f"✗ Setup failed at: {step_name}")
            return False
    
    start_application()
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)


