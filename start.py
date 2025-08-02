#!/usr/bin/env python3
"""
LinkedIn Alumni Scraper - Main Launcher
Simplified launcher that starts both frontend and backend in one command
"""

import os
import sys
import subprocess
import time
import signal
import platform
import shutil
from pathlib import Path

def print_banner():
    """Print application banner"""
    print("\n" + "="*60)
    print("LinkedIn Alumni Scraper")
    print("="*60)
    print("Starting frontend and backend servers...")
    print("="*60 + "\n")

def check_requirements():
    """Check if Python and Node.js are installed"""
    print("[INFO] Checking system requirements...")
    
    # Check Python
    try:
        result = subprocess.run(['python', '--version'], capture_output=True, text=True)
        print(f"[OK] Python found: {result.stdout.strip()}")
    except:
        print("[ERROR] Python not found! Please install Python.")
        return False
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        print(f"[OK] Node.js found: {result.stdout.strip()}")
    except:
        print("[ERROR] Node.js not found! Please install Node.js.")
        return False
    
    return True

def install_dependencies():
    """Install required dependencies"""
    script_dir = Path(__file__).parent
    alumni_dir = script_dir / "Linkedin Alumni Scraper"
    frontend_dir = alumni_dir / "frontend"
    requirements_file = script_dir / "requirements.txt"
    
    # Install Python dependencies
    if requirements_file.exists():
        print("[INFO] Installing Python dependencies...")
        try:
            subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)
            ], check=True, capture_output=True)
            print("[OK] Python dependencies installed")
        except subprocess.CalledProcessError:
            print("[WARNING] Some Python dependencies may not have installed correctly")
    
    # Install Node.js dependencies
    if frontend_dir.exists():
        node_modules = frontend_dir / "node_modules"
        if not node_modules.exists():
            print("[INFO] Installing frontend dependencies...")
            try:
                subprocess.run(['npm', 'install'], 
                             cwd=frontend_dir, 
                             check=True, 
                             shell=platform.system() == 'Windows')
                print("[OK] Frontend dependencies installed")
            except subprocess.CalledProcessError:
                print("[ERROR] Failed to install frontend dependencies")
                return False
        else:
            print("[OK] Frontend dependencies already installed")
    
    return True

def start_frontend():
    """Start the frontend server in a separate process"""
    alumni_dir = Path(__file__).parent / "Linkedin Alumni Scraper"
    frontend_dir = alumni_dir / "frontend"
    
    if not frontend_dir.exists():
        print("[ERROR] Frontend directory not found!")
        return None
    
    print("[FRONTEND] Starting Vite development server...")
    try:
        # Start frontend in a new console window on Windows
        if platform.system() == 'Windows':
            process = subprocess.Popen([
                'cmd', '/c', 'start', 'cmd', '/k', 
                'echo [FRONTEND] Vite Development Server && cd /d', str(frontend_dir), 
                '&& npm run dev'
            ], shell=True)
        else:
            process = subprocess.Popen([
                'gnome-terminal', '--', 'bash', '-c',
                f'cd "{frontend_dir}" && npm run dev; exec bash'
            ])
        
        print("[FRONTEND] Frontend starting in separate window...")
        print("[FRONTEND] Will be available at: http://localhost:3000")
        return process
        
    except Exception as e:
        print(f"[ERROR] Failed to start frontend: {e}")
        return None

def start_backend():
    """Start the backend server"""
    alumni_dir = Path(__file__).parent / "Linkedin Alumni Scraper"
    
    print("[BACKEND] Starting Flask server...")
    
    try:
        # Start backend as NON-BLOCKING subprocess using modern OOP API
        print("[BACKEND] Starting modern OOP Flask server as subprocess on http://localhost:5000")
        
        # Use Popen to start backend WITHOUT blocking - using server mode
        process = subprocess.Popen([
            sys.executable, 'run.py', '--server'
        ], cwd=alumni_dir)
        
        print("[BACKEND] Backend started successfully")
        return process
        
    except Exception as e:
        print(f"[ERROR] Failed to start backend: {e}")
        return None

def main():
    """Main launcher function"""
    print_banner()
    
    # Check system requirements
    if not check_requirements():
        print("\n[ERROR] System requirements not met!")
        input("Press Enter to exit...")
        return
    
    print()
    
    # Install dependencies
    if not install_dependencies():
        print("\n[ERROR] Failed to install dependencies!")
        input("Press Enter to exit...")
        return
    
    print()
    
    # Start frontend in separate window
    frontend_process = start_frontend()
    
    # Give frontend time to start
    print("[INFO] Waiting for frontend to initialize...")
    time.sleep(5)  # Increased from 3 to 5 seconds
    
    # Start backend (non-blocking)
    backend_process = start_backend()
    
    if backend_process is None:
        print("\n[ERROR] Failed to start backend!")
        input("Press Enter to exit...")
        return
    
    # Give backend time to start
    print("[INFO] Waiting for backend to initialize...")
    time.sleep(8)  # Increased from 5 to 8 seconds
    
    print("\n" + "="*60)
    print("Application URLs:")
    print("="*60)
    print("Frontend: http://localhost:3000")
    print("Backend:  http://localhost:5000")
    print("Health:   http://localhost:5000/health")
    print("="*60)
    print("Tip: Press Ctrl+C to stop all servers")
    print("Both frontend and backend will close together")
    print("="*60 + "\n")
    
    # Wait for processes (this will block until user stops)
    try:
        print("[INFO] Application is ready! Press Ctrl+C to stop...")
        backend_process.wait()
    except KeyboardInterrupt:
        print("\n[STOP] Stopping all servers...")
        if backend_process:
            backend_process.terminate()
            backend_process.wait()
        if frontend_process:
            frontend_process.terminate()
            frontend_process.wait()
        print("[OK] All servers stopped")
    except Exception as e:
        print(f"\n[ERROR] Backend server error: {e}")
    
    print("[OK] Launcher finished")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n[STOP] Launcher interrupted by user")
    finally:
        input("\nPress Enter to exit...")
