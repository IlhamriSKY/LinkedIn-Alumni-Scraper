"""
LinkedIn Login Status Checker

This module provides comprehensive functionality for checking LinkedIn login status,
verifying authentication state, and managing session validation with advanced monitoring.

Classes:
    LoginStatusChecker: Main class for authentication status verification

Features:
    - Real-time authentication status monitoring
    - Comprehensive session validation
    - Advanced login state detection
    - Professional error handling and recovery
    - Integration with service factory architecture
"""

import sys
from datetime import datetime
from typing import Dict, Any

# Import specific classes to avoid circular imports
from core.factory import service_factory
from core.config import config


class LoginStatusChecker:
    """
    LinkedIn authentication status checker and session validator.
    
    This class provides comprehensive methods to verify LinkedIn login status,
    check authentication state, and validate active user sessions. It ensures
    that the scraper operates only with properly authenticated sessions.
    
    Attributes:
        auth_manager: Authentication manager instance from service factory
        driver_manager: WebDriver manager instance from service factory
        
    Methods:
        check_login_status(): Verify current authentication state with detailed reporting
        
    Example:
        checker = LoginStatusChecker()
        status = checker.check_login_status(verbose=True)
        if status['logged_in']:
            print("User is authenticated")
    """
    
    def __init__(self):
        """Initialize the login status checker."""
        self.auth_manager = service_factory.get_auth_manager()
        self.driver_manager = service_factory.get_driver_manager()
    
    def check_login_status(self, verbose: bool = True) -> Dict[str, Any]:
        """
        Check LinkedIn login status with comprehensive details.
        
        Args:
            verbose: Whether to print detailed status information
            
        Returns:
            Dictionary containing login status and details
        """
        try:
            if verbose:
                print("=" * 60)
                print("LinkedIn Login Status Checker")
                print("=" * 60)
                print(f"[TIME] Check performed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print()
            
            # Check driver status
            driver_active = self.driver_manager.driver is not None
            
            if not driver_active:
                result = {
                    "success": True,
                    "driver_active": False,
                    "logged_in": False,
                    "message": "Browser driver is not active",
                    "current_url": None,
                    "page_title": None,
                    "timestamp": datetime.now().isoformat()
                }
                
                if verbose:
                    print("[INFO] Browser driver is not active")
                    print("[WARN] Cannot check login status without active browser")
                    print("[INFO] Start browser first with: python app.py")
                    print("=" * 60)
                
                return result
            
            if verbose:
                print("[INFO] Browser driver is active")
                print("[INFO] Checking LinkedIn login status...")
            
            # Check login status
            is_logged_in = self.auth_manager.is_logged_in()
            
            # Get additional details
            driver = self.driver_manager.driver
            current_url = driver.current_url if driver else "Unknown"
            page_title = driver.title if driver else "Unknown"
            
            result = {
                "success": True,
                "driver_active": True,
                "logged_in": is_logged_in,
                "current_url": current_url,
                "page_title": page_title,
                "message": "Logged in" if is_logged_in else "Not logged in",
                "timestamp": datetime.now().isoformat()
            }
            
            if verbose:
                self._display_results(result)
            
            return result
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "driver_active": False,
                "logged_in": False,
                "timestamp": datetime.now().isoformat()
            }
            
            if verbose:
                print(f"[ERROR] Failed to check login status: {e}")
                print("=" * 60)
            
            return error_result
    
    def _display_results(self, result: Dict[str, Any]):
        """Display detailed login status results."""
        print()
        print("[RESULT] Login Status Check Results:")
        print(f"  - Browser Active: {'[YES]' if result['driver_active'] else '[NO]'}")
        print(f"  - Logged in: {'[YES]' if result['logged_in'] else '[NO]'}")
        print(f"  - Current URL: {result.get('current_url', 'Unknown')}")
        print(f"  - Page Title: {result.get('page_title', 'Unknown')}")
        
        if result['logged_in']:
            print()
            print("[OK] LinkedIn session is active and logged in")
            print("[INFO] You can proceed with scraping operations")
        else:
            print()
            print("[WARN] Not logged in to LinkedIn")
            print("[INFO] You need to login first:")
            print("  1. Start the API server: python app.py")
            print("  2. Use auto-login: POST /api/auth/auto-login")
            print("  3. Or manual login: POST /api/auth/manual-login")
        
        print("=" * 60)
    
    def quick_check(self) -> bool:
        """
        Quick login status check without verbose output.
        
        Returns:
            True if logged in, False otherwise
        """
        try:
            result = self.check_login_status(verbose=False)
            return result.get('logged_in', False)
        except Exception:
            return False
    
    def cleanup(self):
        """Clean up resources."""
        try:
            # Cleanup is handled by the service factory
            pass
        except Exception:
            pass


def console_check():
    """Console utility function for login status check."""
    try:
        checker = LoginStatusChecker()
        result = checker.check_login_status(verbose=True)
        checker.cleanup()
        
        return result.get('logged_in', False)
        
    except Exception as e:
        print(f"[ERROR] Console check failed: {e}")
        return False


def main():
    """Main function for console usage."""
    try:
        print("LinkedIn Scraper - Login Status Checker")
        print("Professional authentication verification system")
        print()
        
        # Check login status
        success = console_check()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n[INFO] Check cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
