"""
LinkedIn Alumni Scraper - Launcher Script

Multi-mode launcher script for the LinkedIn Alumni Scraper application.
Supports API server mode, console scraping mode, login checking, and dependency verification.
"""

import os
import sys
import argparse
from typing import Optional

def run_api_server():
    """Run the API server."""
    try:
        print("Starting LinkedIn Alumni Scraper API Server")
        print("=" * 60)
        
        # Import and run API server
        from app import main
        main()
        
    except ImportError as e:
        print(f"[ERROR] Failed to import API server: {e}")
        print("[INFO] Some dependencies might be missing.")
        return False
    except Exception as e:
        print(f"[ERROR] Failed to start API server: {e}")
        return False
    
    return True

def run_login_check():
    """Run login status check."""
    try:
        print("LinkedIn Login Status Check")
        print("=" * 60)
        
        # Import and use login checker
        from core.login_checker import console_check
        
        success = console_check()
        
        if success:
            print("Login check completed - User is logged in!")
        else:
            print("Login check completed - User is not logged in")
        
        return success
        
    except ImportError as e:
        print(f"[ERROR] Failed to import login checker: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Login check failed: {e}")
        return False

def run_console_scraper():
    """Run the scraper directly from console."""
    try:
        print("Starting LinkedIn Alumni Scraper (Console Mode)")
        print("=" * 60)
        
        # Import modern scraper
        from core import get_scraper
        
        scraper = get_scraper()
        
        # Run with default settings
        success = scraper.run_scraper(
            max_profiles=10,
            auto_detect=True,
            resume_scraping=True
        )
        
        if success:
            print("Scraping completed successfully!")
        else:
            print("Scraping failed or was interrupted")
        
        return success
        
    except ImportError as e:
        print(f"[ERROR] Failed to import scraper: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Scraping failed: {e}")
        return False

def check_dependencies():
    """Check if all required dependencies are available."""
    required_modules = [
        'flask', 'flask_cors', 'selenium', 'pandas', 
        'bs4', 'dotenv'  # Use actual import names
    ]
    
    missing_modules = []
    
    for module in required_modules:
        try:
            __import__(module)
        except ImportError:
            # Map back to pip package names for user
            if module == 'bs4':
                missing_modules.append('beautifulsoup4')
            elif module == 'dotenv':
                missing_modules.append('python-dotenv')
            else:
                missing_modules.append(module)
    
    if missing_modules:
        print("Missing required dependencies:")
        for module in missing_modules:
            print(f"   - {module}")
        print("\nPlease install missing dependencies:")
        print(f"   pip install {' '.join(missing_modules)}")
        return False
    
    print("All dependencies are available")
    return True

def print_help():
    """Print help information."""
    print("LinkedIn Alumni Scraper - Launcher")
    print("=" * 40)
    print("Available commands:")
    print("  --server, -s       Run API server (default)")
    print("  --console, -c      Run scraper directly in console mode")
    print("  --login-check, -lc Check LinkedIn login status")
    print("  --check, -k        Check dependencies")
    print("  --help, -h         Show this help message")
    print()
    print("Examples:")
    print("  python run.py --server")
    print("  python run.py --console")
    print("  python run.py --login-check")
    print("  python run.py --check")

def main():
    """Main launcher function."""
    parser = argparse.ArgumentParser(
        description="LinkedIn Alumni Scraper Launcher",
        add_help=False
    )
    
    parser.add_argument('--server', '-s', action='store_true',
                       help='Run API server')
    parser.add_argument('--console', '-c', action='store_true',
                       help='Run scraper in console mode')
    parser.add_argument('--login-check', '-lc', action='store_true',
                       help='Check LinkedIn login status')
    parser.add_argument('--check', '-k', action='store_true',
                       help='Check dependencies')
    parser.add_argument('--help', '-h', action='store_true',
                       help='Show help message')
    
    args = parser.parse_args()
    
    # Show help if no arguments or help flag
    if not any(vars(args).values()) or args.help:
        print_help()
        return
    
    # Check dependencies first
    if args.check:
        if check_dependencies():
            print("All dependencies are ready!")
        else:
            sys.exit(1)
        return
    
    # Run appropriate mode
    try:
        if args.server:
            success = run_api_server()
        elif args.console:
            success = run_console_scraper()
        elif args.login_check:
            success = run_login_check()
        else:
            # Default to API server
            success = run_api_server()
        
        if not success:
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\nGoodbye!")
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
