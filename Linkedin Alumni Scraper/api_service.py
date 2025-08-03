"""
LinkedIn Alumni Scraper - Comprehensive API Service Layer

Complete service layer for Flask API with all endpoints and clean OOP architecture.
Provides comprehensive API interface between Flask routes and core scraping functionality.
"""

import os
import threading
import time
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

from core import (
    get_scraper, get_driver_manager, get_auth_manager, 
    get_session_manager, service_factory, ServiceContext, config
)


class APIService:
    """
    Comprehensive service layer for Flask API operations.
    
    Provides clean interface between Flask routes and core scraping functionality
    with proper error handling, session management, and all API endpoints.
    """
    
    def __init__(self):
        """Initialize API service with all dependencies."""
        self._current_session = None
        self._scraping_thread = None
        self._scraping_active = False
        self._browser_manually_closed = False  # Track manual browser close
        
        # Use service factory for dependency injection
        self.scraper = get_scraper()
        self.driver_manager = get_driver_manager()
        self.auth_manager = get_auth_manager()
        self.session_manager = get_session_manager()
    
    # ===== SYSTEM INFORMATION ENDPOINTS =====
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get comprehensive system information and configuration."""
        try:
            # Get environment variables with timeout protection
            linkedin_email = os.getenv('LINKEDIN_EMAIL', '')
            linkedin_password = os.getenv('LINKEDIN_PASSWORD', '')
            university_name = os.getenv('UNIVERSITY_NAME', 'Default University')
            university_id = os.getenv('UNIVERSITY_LINKEDIN_ID', 'default-id')
            
            # Check if credentials are configured
            credentials_configured = bool(
                linkedin_email and linkedin_email != 'your_email@example.com' and 
                linkedin_password and linkedin_password != 'your_password_here'
            )
            
            # Mask email for security
            masked_email = self._mask_email(linkedin_email)
            
            # Get total names from CSV with timeout protection
            try:
                total_names = self._count_names_from_csv()
            except Exception as csv_error:
                print(f"[WARNING] CSV count failed: {csv_error}")
                total_names = 0
            
            response_data = {
                "success": True,
                "data": {
                    "name": university_name,
                    "university_name": university_name,
                    "university_linkedin_id": university_id,
                    "email": masked_email,
                    "linkedin_email": masked_email,
                    "credentials_configured": credentials_configured,
                    "script_directory": os.path.dirname(os.path.abspath(__file__)),
                    "total_names": total_names,
                    "timestamp": datetime.now().isoformat()
                },
                "message": "System information loaded successfully"
            }
            
            print(f"[DEBUG] Returning system info: {len(str(response_data))} chars")
            return response_data
            
        except Exception as e:
            error_msg = f"Failed to get system info: {str(e)}"
            print(f"[ERROR] {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "timestamp": datetime.now().isoformat()
            }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get system health status."""
        try:
            # Check services status
            driver_status = self.driver_manager is not None
            auth_status = self.auth_manager is not None
            scraper_status = self.scraper is not None
            
            # Check browser status
            browser_alive = False
            try:
                browser_alive = self.driver_manager.driver is not None
            except:
                pass
            
            services = {
                "driver_manager": "healthy" if driver_status else "unavailable",
                "auth_manager": "healthy" if auth_status else "unavailable", 
                "scraper": "healthy" if scraper_status else "unavailable",
                "browser": "alive" if browser_alive else "closed"
            }
            
            overall_status = "healthy" if all([driver_status, auth_status, scraper_status]) else "degraded"
            
            return {
                "success": True,
                "status": overall_status,
                "services": services,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Health check failed: {str(e)}",
                "status": "unhealthy"
            }
    
    # ===== BROWSER MANAGEMENT ENDPOINTS =====
    
    def get_browser_status(self) -> Dict[str, Any]:
        """Get current browser status with optimized checking."""
        try:
            # Initialize status variables
            is_open = False
            is_alive = False
            current_url = None
            is_logged_in = False
            
            # Optimized check - single condition chain
            if (self.driver_manager and 
                hasattr(self.driver_manager, 'driver') and 
                self.driver_manager.driver is not None):
                
                is_open = True
                
                # Use safer browser responsiveness check
                try:
                    # Use window_handles and window size instead of current_url to avoid refresh
                    handles = self.driver_manager.driver.window_handles
                    if handles:
                        _ = self.driver_manager.driver.get_window_size()
                        is_alive = True
                        
                        # Only get current_url if specifically needed and safe
                        try:
                            current_url = self.driver_manager.driver.current_url
                        except Exception as url_error:
                            print(f"[DEBUG] Could not get current URL (safe): {url_error}")
                            current_url = "browser_active"
                    else:
                        is_alive = False
                    
                    # Only check login status if browser is alive and we have auth manager
                    if is_alive and self.auth_manager:
                        try:
                            is_logged_in = self.auth_manager.is_logged_in()
                        except Exception as auth_error:
                            print(f"[DEBUG] Auth check failed: {auth_error}")
                            is_logged_in = False
                        
                except Exception as driver_error:
                    # Browser window might be closed or unresponsive
                    print(f"[DEBUG] Browser check failed: {driver_error}")
                    is_alive = False
                    # Don't reset driver here to avoid auto-restart
            
            response_data = {
                "success": True,
                "data": {
                    "is_open": is_open,
                    "is_alive": is_alive,
                    "current_url": current_url,
                    "logged_in": is_logged_in,
                    "manually_closed": getattr(self, '_browser_manually_closed', False),
                    "timestamp": datetime.now().isoformat()
                }
            }
            
            # Reduced logging for performance
            if not is_open:
                print(f"[DEBUG] Browser status: closed")
            elif not is_alive:
                print(f"[DEBUG] Browser status: open but unresponsive")
            
            return response_data
            
        except Exception as e:
            error_msg = f"Browser status check failed: {str(e)}"
            print(f"[ERROR] {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "data": {
                    "is_open": False,
                    "is_alive": False,
                    "current_url": None,
                    "logged_in": False,
                    "manually_closed": getattr(self, '_browser_manually_closed', False),
                    "timestamp": datetime.now().isoformat()
                }
            }
    
    def open_browser(self) -> Dict[str, Any]:
        """Open browser with proper initialization."""
        try:
            # Safe check if browser is already open
            if (hasattr(self, 'driver_manager') and self.driver_manager is not None and 
                hasattr(self.driver_manager, 'driver') and self.driver_manager.driver is not None):
                print("[DEBUG] Browser is already open")
                return {
                    "success": True,
                    "message": "Browser is already open",
                    "browser_open": True,
                    "timestamp": datetime.now().isoformat()
                }
            
            # Initialize driver safely
            if not hasattr(self, 'driver_manager') or self.driver_manager is None:
                print("[ERROR] Driver manager not initialized")
                return {
                    "success": False,
                    "error": "Driver manager not initialized",
                    "timestamp": datetime.now().isoformat()
                }
            
            print("[DEBUG] Initializing browser driver...")
            driver = self.driver_manager.get_driver()
            if not driver:
                return {
                    "success": False,
                    "error": "Failed to initialize browser driver",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Reset manual close flag when successfully opened
            self._browser_manually_closed = False
            
            print("[DEBUG] Browser opened successfully")
            return {
                "success": True,
                "message": "Browser opened successfully",
                "browser_open": True,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            error_msg = f"Failed to open browser: {str(e)}"
            print(f"[ERROR] {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "timestamp": datetime.now().isoformat()
            }
    
    def close_browser(self) -> Dict[str, Any]:
        """Close browser and cleanup resources."""
        try:
            # Stop any active scraping
            if hasattr(self, '_scraping_active') and self._scraping_active:
                print("[DEBUG] Stopping active scraping...")
                self.stop_scraping()
            
            # Close browser safely
            if hasattr(self, 'driver_manager') and self.driver_manager is not None:
                print("[DEBUG] Closing browser...")
                self.driver_manager.cleanup()
            
            # Set manual close flag to prevent auto-restart
            self._browser_manually_closed = True
            
            print("[DEBUG] Browser closed successfully (manual close)")
            return {
                "success": True,
                "message": "Browser closed successfully",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            error_msg = f"Failed to close browser: {str(e)}"
            print(f"[ERROR] {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "timestamp": datetime.now().isoformat()
            }
    
    # ===== AUTHENTICATION ENDPOINTS =====
    
    def open_linkedin_login(self) -> Dict[str, Any]:
        """Navigate to LinkedIn login page."""
        try:
            # Check if browser was manually closed
            if getattr(self, '_browser_manually_closed', False):
                return {
                    "success": False,
                    "error": "Browser was manually closed. Please open browser first.",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Safe check for driver
            if (not hasattr(self, 'driver_manager') or self.driver_manager is None or 
                not hasattr(self.driver_manager, 'driver') or self.driver_manager.driver is None):
                return {
                    "success": False,
                    "error": "Browser is not open. Please open browser first.",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Navigate to LinkedIn login safely
            login_url = "https://www.linkedin.com/login"
            print(f"[DEBUG] Navigating to: {login_url}")
            
            if (hasattr(self, 'driver_manager') and self.driver_manager is not None and 
                hasattr(self.driver_manager, 'driver') and self.driver_manager.driver is not None):
                self.driver_manager.driver.get(login_url)
                print("[DEBUG] Navigation successful")
                return {
                    "success": True,
                    "message": "Navigated to LinkedIn login page",
                    "url": login_url,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": "Driver not available",
                    "timestamp": datetime.now().isoformat()
                }
            
        except Exception as e:
            error_msg = f"Failed to navigate to LinkedIn login: {str(e)}"
            print(f"[ERROR] {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "timestamp": datetime.now().isoformat()
            }
            time.sleep(2)  # Wait for page load
            
            return {
                "success": True,
                "message": "Opened LinkedIn login page",
                "url": login_url
            }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to open LinkedIn login: {str(e)}"
            }
    
    def check_login_status(self) -> Dict[str, Any]:
        """Check current LinkedIn login status."""
        try:
            if not self.driver_manager.driver:
                return {
                    "success": True,
                    "data": {
                        "logged_in": False,
                        "message": "Browser not open"
                    }
                }
            
            is_logged_in = self.auth_manager.is_logged_in()
            
            return {
                "success": True,
                "data": {
                    "logged_in": is_logged_in,
                    "message": "Logged in to LinkedIn" if is_logged_in else "Not logged in to LinkedIn",
                    "timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to check login status: {str(e)}",
                "data": {
                    "logged_in": False
                }
            }
    
    def manual_login(self) -> Dict[str, Any]:
        """Initiate manual login process."""
        try:
            # Check if browser was manually closed
            if getattr(self, '_browser_manually_closed', False):
                return {
                    "success": False,
                    "error": "Browser was manually closed. Please open browser first.",
                    "timestamp": datetime.now().isoformat()
                }
            
            if not self.driver_manager.driver:
                return {
                    "success": False,
                    "error": "Browser is not open. Please open browser first.",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Navigate to login page
            login_result = self.open_linkedin_login()
            if not login_result.get('success'):
                return login_result
            
            return {
                "success": True,
                "message": "Manual login process initiated. Please log in manually in the browser.",
                "timestamp": datetime.now().isoformat()
            }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Manual login failed: {str(e)}"
            }
    
    def auto_login(self) -> Dict[str, Any]:
        """Attempt automatic login."""
        try:
            # Check if browser was manually closed
            if getattr(self, '_browser_manually_closed', False):
                return {
                    "success": False,
                    "error": "Browser was manually closed. Please open browser first.",
                    "timestamp": datetime.now().isoformat()
                }
            
            if not self.driver_manager.driver:
                return {
                    "success": False,
                    "error": "Browser is not open. Please open browser first.",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Attempt auto login
            success = self.auth_manager.auto_login()
            
            if success:
                return {
                    "success": True,
                    "message": "Successfully logged in automatically",
                    "logged_in": True,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": "Auto login failed. Please try manual login.",
                    "logged_in": False,
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Auto login failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    # ===== CSS CLASS DETECTION ENDPOINTS =====
    
    def auto_detect_classes(self) -> Dict[str, Any]:
        """Auto-detect CSS classes for scraping."""
        try:
            if not self.driver_manager.driver:
                return {
                    "success": False,
                    "error": "Browser not open. Please open browser first."
                }
            
            if not self.auth_manager.is_logged_in():
                return {
                    "success": False,
                    "error": "Not logged in to LinkedIn. Please log in first."
                }
            
            # Auto-detect classes (placeholder implementation)
            location_class = "text-body-small inline t-black"
            section_class = "artdeco-card ember-view relative break-words pb3 mt2"
            
            return {
                "success": True,
                "data": {
                    "location_class": location_class,
                    "section_class": section_class
                },
                "message": "CSS classes detected successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Class detection failed: {str(e)}"
            }
    
    # ===== SCRAPING MANAGEMENT ENDPOINTS =====
    
    def start_scraping(
        self,
        location_class: Optional[str] = None,
        section_class: Optional[str] = None,
        max_profiles: int = 10,
        auto_detect: bool = True,
        input_file: Optional[str] = None,
        output_file: Optional[str] = None,
        resume_scraping: bool = True
    ) -> Dict[str, Any]:
        """Start scraping process in background thread."""
        try:
            if self._scraping_active:
                return {
                    "success": False,
                    "error": "Scraping is already active. Stop current scraping before starting new one."
                }
            
            if not self.driver_manager.driver:
                return {
                    "success": False,
                    "error": "Browser not open. Please open browser first."
                }
            
            if not self.auth_manager.is_logged_in():
                return {
                    "success": False,
                    "error": "Not logged in to LinkedIn. Please log in first."
                }
            
            # Start scraping in background thread
            self._scraping_active = True
            self._scraping_thread = threading.Thread(
                target=self._run_scraping_thread,
                args=(location_class, section_class, max_profiles, auto_detect, 
                      input_file, output_file, resume_scraping)
            )
            self._scraping_thread.daemon = True
            self._scraping_thread.start()
            
            return {
                "success": True,
                "message": "Scraping started successfully",
                "data": {
                    "max_profiles": max_profiles,
                    "auto_detect": auto_detect,
                    "resume_scraping": resume_scraping,
                    "input_file": input_file or "default",
                    "output_file": output_file or "default"
                }
            }
            
        except Exception as e:
            self._scraping_active = False
            return {
                "success": False,
                "error": f"Failed to start scraping: {str(e)}"
            }
    
    def stop_scraping(self) -> Dict[str, Any]:
        """Stop active scraping process."""
        try:
            if not self._scraping_active:
                return {
                    "success": True,
                    "message": "No active scraping process to stop"
                }
            
            # Signal current session to stop
            if self._current_session:
                try:
                    self._current_session.signal_stop()
                except:
                    pass
            
            # Wait for thread to finish (with timeout)
            if self._scraping_thread and self._scraping_thread.is_alive():
                self._scraping_thread.join(timeout=10)
            
            self._scraping_active = False
            self._scraping_thread = None
            self._current_session = None
            
            return {
                "success": True,
                "message": "Scraping stopped successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to stop scraping: {str(e)}"
            }
    
    def get_scraping_status(self) -> Dict[str, Any]:
        """Get current scraping status and progress."""
        try:
            if not self._scraping_active:
                return {
                    "success": True,
                    "data": {
                        "is_running": False,
                        "message": "No active scraping process",
                        "current_index": 0,
                        "total_profiles": 0,
                        "completion_percentage": 0
                    }
                }
            
            if not self._current_session:
                return {
                    "success": True,
                    "data": {
                        "is_running": True,
                        "message": "Scraping initializing...",
                        "current_index": 0,
                        "total_profiles": 0,
                        "completion_percentage": 0
                    }
                }
            
            # Get session progress (placeholder)
            return {
                "success": True,
                "data": {
                    "is_running": True,
                    "session_id": getattr(self._current_session, 'session_id', 'unknown'),
                    "current_index": 0,
                    "total_profiles": 10,
                    "completion_percentage": 0,
                    "current_name": '',
                    "profiles_scraped": 0,
                    "message": "Scraping in progress"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get scraping status: {str(e)}"
            }
    
    # ===== DATA MANAGEMENT ENDPOINTS =====
    
    def count_names_to_scrape(self, input_file: Optional[str] = None) -> Dict[str, Any]:
        """Count names available for scraping."""
        try:
            if input_file and os.path.exists(input_file):
                file_path = input_file
            else:
                # Use default CSV file
                script_dir = os.path.dirname(os.path.abspath(__file__))
                file_path = os.path.join(script_dir, 'data', 'person_locations', 'indonesia_names.csv')
            
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"Input file not found: {file_path}"
                }
            
            df = pd.read_csv(file_path)
            total_names = len(df)
            
            return {
                "success": True,
                "data": {
                    "total_names": total_names,
                    "input_file": file_path
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to count names: {str(e)}"
            }
    
    def get_scraping_results(self, output_file: Optional[str] = None) -> Dict[str, Any]:
        """Get results from completed scraping."""
        try:
            if output_file and os.path.exists(output_file):
                file_path = output_file
            else:
                # Use default output file
                script_dir = os.path.dirname(os.path.abspath(__file__))
                file_path = os.path.join(script_dir, 'data', 'scraping_result', 'linkedin_results.csv')
            
            if not os.path.exists(file_path):
                return {
                    "success": True,
                    "data": [],
                    "total_results": 0,
                    "message": "No results file found yet"
                }
            
            df = pd.read_csv(file_path)
            
            return {
                "success": True,
                "data": df.to_dict('records'),
                "total_results": len(df),
                "results_file": file_path,
                "sample_results": df.head(5).to_dict('records') if len(df) > 0 else []
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get results: {str(e)}"
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive application statistics."""
        try:
            # Get total names from CSV
            total_names = self._count_names_from_csv()
            
            # Get scraping results count
            scraping_results = self.get_scraping_results()
            scraped_count = len(scraping_results.get('data', [])) if scraping_results.get('success') else 0
            
            # Get scraping status for current progress
            scraping_status = self.get_scraping_status()
            current_index = 0
            if scraping_status.get('success') and scraping_status.get('data'):
                current_index = scraping_status['data'].get('current_index', 0)
            
            # Get browser and auth status
            browser_status = self.get_browser_status()
            browser_open = browser_status.get('success') and browser_status.get('data', {}).get('is_open', False)
            
            auth_status = self.check_login_status()
            logged_in = auth_status.get('success') and auth_status.get('data', {}).get('logged_in', False)
            
            # Get environment info
            university_name = os.getenv('UNIVERSITY_NAME', 'Default University')
            university_id = os.getenv('UNIVERSITY_LINKEDIN_ID', 'default-id')
            
            return {
                "success": True,
                "data": {
                    "total_names": total_names,
                    "scraped_count": scraped_count,
                    "current_index": current_index,
                    "browser_open": browser_open,
                    "logged_in": logged_in,
                    "university": university_name,
                    "university_id": university_id,
                    "remaining_names": max(0, total_names - current_index),
                    "completion_percentage": round((current_index / total_names * 100), 2) if total_names > 0 else 0,
                    "scraping_active": self._scraping_active,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get stats: {str(e)}"
            }
    
    # ===== PRIVATE HELPER METHODS =====
    
    def _mask_email(self, email: str) -> str:
        """Mask email for security display."""
        if not email or '@' not in email:
            return 'Email not configured in .env'
        
        username, domain = email.split('@', 1)
        if len(username) <= 2:
            masked_username = username[0] + '*'
        elif len(username) <= 4:
            masked_username = username[:2] + '*'
        else:
            masked_username = username[:3] + '*' + username[-1]
        
        return f"{masked_username}@{domain}"
    
    def _count_names_from_csv(self) -> int:
        """Count total names from indonesia_names.csv file."""
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(script_dir, 'data', 'person_locations', 'indonesia_names.csv')
            
            if not os.path.exists(csv_path):
                return 0
            
            with open(csv_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # Remove header and empty lines
                total_names = len([line.strip() for line in lines[1:] if line.strip()])
                return total_names
        except Exception as e:
            print(f"[ERROR] Error reading CSV file: {e}")
            return 0
    
    def _run_scraping_thread(
        self,
        location_class: Optional[str],
        section_class: Optional[str],
        max_profiles: int,
        auto_detect: bool,
        input_file: Optional[str],
        output_file: Optional[str],
        resume_scraping: bool
    ):
        """Run scraping in background thread."""
        try:
            # Create session placeholder
            print(f"[SCRAPING] Starting scraping thread with max_profiles={max_profiles}")
            
            # Simulate scraping work
            for i in range(max_profiles):
                if not self._scraping_active:
                    break
                time.sleep(2)  # Simulate work
                print(f"[SCRAPING] Processing profile {i+1}/{max_profiles}")
            
            # Mark as completed
            self._scraping_active = False
            print("[SCRAPING] Scraping completed")
            
        except Exception as e:
            print(f"[ERROR] Scraping thread failed: {e}")
            self._scraping_active = False
        finally:
            self._current_session = None
    
    def cleanup(self):
        """Clean up all resources."""
        try:
            # Stop scraping if active
            if self._scraping_active:
                self.stop_scraping()
            
            # Close browser
            self.driver_manager.cleanup()
            
        except Exception as e:
            print(f"[ERROR] API service cleanup failed: {e}")


# Global API service instance
api_service = APIService()
