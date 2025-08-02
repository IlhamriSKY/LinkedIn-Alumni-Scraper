"""
LinkedIn Alumni Scraper - API Service Layer

Provides service layer for Flask API with clean OOP architecture
and proper dependency injection.
"""

import os
import time
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd

from core import (
    get_scraper, get_driver_manager, get_auth_manager, 
    get_session_manager, service_factory, ServiceContext
)


class APIService:
    """
    Service layer for Flask API operations.
    
    Provides clean interface between Flask routes and core scraping functionality
    with proper error handling and session management.
    """
    
    def __init__(self):
        """Initialize API service."""
        self._current_session = None
        self._scraping_thread = None
        self._scraping_active = False
        
        # Use service factory for dependency injection
        self.scraper = get_scraper()
        self.driver_manager = get_driver_manager()
        self.auth_manager = get_auth_manager()
        self.session_manager = get_session_manager()
    
    # Browser Management
    def get_browser_status(self) -> Dict[str, Any]:
        """Get current browser status."""
        try:
            is_open = self.driver_manager.driver is not None
            is_logged_in = False
            
            if is_open:
                is_logged_in = self.auth_manager.is_logged_in()
            
            return {
                "success": True,
                "browser_open": is_open,
                "logged_in": is_logged_in,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "browser_open": False,
                "logged_in": False
            }
    
    def open_browser(self) -> Dict[str, Any]:
        """Open browser with proper initialization."""
        try:
            if self.driver_manager.driver is not None:
                return {
                    "success": True,
                    "message": "Browser is already open",
                    "already_open": True
                }
            
            # Initialize driver
            driver = self.driver_manager.get_driver()
            if not driver:
                return {
                    "success": False,
                    "error": "Failed to initialize WebDriver"
                }
            
            return {
                "success": True,
                "message": "Browser opened successfully",
                "browser_open": True
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to open browser: {str(e)}"
            }
    
    def close_browser(self) -> Dict[str, Any]:
        """Close browser and cleanup resources."""
        try:
            # Stop any active scraping
            if self._scraping_active:
                self.stop_scraping()
            
            # Close browser
            self.driver_manager.cleanup()
            
            return {
                "success": True,
                "message": "Browser closed successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to close browser: {str(e)}"
            }
    
    # Authentication Management
    def open_linkedin_login(self) -> Dict[str, Any]:
        """Navigate to LinkedIn login page."""
        try:
            if not self.driver_manager.driver:
                return {
                    "success": False,
                    "error": "Browser is not open. Please open browser first."
                }
            
            # Navigate to LinkedIn login
            login_url = "https://www.linkedin.com/login"
            if self.driver_manager.navigate_to(login_url, wait_for_load=True):
                return {
                    "success": True,
                    "message": "Navigated to LinkedIn login page"
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to navigate to LinkedIn login page"
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
                    "logged_in": False,
                    "message": "Browser is not open"
                }
            
            is_logged_in = self.auth_manager.is_logged_in()
            
            return {
                "success": True,
                "logged_in": is_logged_in,
                "message": "Logged in" if is_logged_in else "Not logged in"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to check login status: {str(e)}",
                "logged_in": False
            }
    
    def manual_login(self) -> Dict[str, Any]:
        """Initiate manual login process."""
        try:
            if not self.driver_manager.driver:
                return {
                    "success": False,
                    "error": "Browser is not open. Please open browser first."
                }
            
            # Start manual login process
            success = self.auth_manager.manual_login()
            
            if success:
                return {
                    "success": True,
                    "message": "Manual login completed successfully"
                }
            else:
                return {
                    "success": False,
                    "error": "Manual login failed or was cancelled"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Manual login failed: {str(e)}"
            }
    
    def auto_login(self) -> Dict[str, Any]:
        """Attempt automatic login."""
        try:
            if not self.driver_manager.driver:
                return {
                    "success": False,
                    "error": "Browser is not open. Please open browser first."
                }
            
            # Attempt auto login
            success = self.auth_manager.auto_login()
            
            if success:
                return {
                    "success": True,
                    "message": "Auto login completed successfully"
                }
            else:
                return {
                    "success": False,
                    "error": "Auto login failed. Please try manual login."
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Auto login failed: {str(e)}"
            }
    
    # CSS Class Management
    def auto_detect_classes(self) -> Dict[str, Any]:
        """Auto-detect CSS classes for scraping."""
        try:
            if not self.driver_manager.driver:
                return {
                    "success": False,
                    "error": "Browser is not open. Please open browser first."
                }
            
            if not self.auth_manager.is_logged_in():
                return {
                    "success": False,
                    "error": "Please login to LinkedIn first."
                }
            
            # Auto-detect classes
            location_class, section_class = self.scraper.class_detector.auto_detect_classes()
            
            return {
                "success": True,
                "location_class": location_class,
                "section_class": section_class,
                "message": "CSS classes detected successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Class detection failed: {str(e)}"
            }
    
    # Scraping Management
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
                    "error": "Scraping is already in progress"
                }
            
            if not self.driver_manager.driver:
                return {
                    "success": False,
                    "error": "Browser is not open. Please open browser first."
                }
            
            if not self.auth_manager.is_logged_in():
                return {
                    "success": False,
                    "error": "Please login to LinkedIn first."
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
                "max_profiles": max_profiles,
                "auto_detect": auto_detect
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
                    "message": "No active scraping to stop"
                }
            
            # Signal current session to stop
            if self._current_session:
                self._current_session._stop_flag.set()
            
            # Wait for thread to finish (with timeout)
            if self._scraping_thread and self._scraping_thread.is_alive():
                self._scraping_thread.join(timeout=10.0)
            
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
                    "scraping_active": False,
                    "message": "No active scraping session"
                }
            
            if not self._current_session:
                return {
                    "success": True,
                    "scraping_active": True,
                    "message": "Scraping starting up..."
                }
            
            # Get session progress
            progress = self._current_session.get_progress_dict()
            
            return {
                "success": True,
                "scraping_active": True,
                "session_id": self._current_session.session_id,
                "progress": progress,
                "message": "Scraping in progress"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get scraping status: {str(e)}"
            }
    
    # File Management
    def count_names_to_scrape(self, input_file: Optional[str] = None) -> Dict[str, Any]:
        """Count names available for scraping."""
        try:
            from core.config import config
            
            file_path = input_file or config.names_file
            
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"Input file not found: {file_path}"
                }
            
            df = pd.read_csv(file_path)
            total_names = len(df)
            
            return {
                "success": True,
                "total_names": total_names,
                "input_file": file_path
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to count names: {str(e)}"
            }
    
    def get_scraping_results(self, output_file: Optional[str] = None) -> Dict[str, Any]:
        """Get results from completed scraping."""
        try:
            from core.config import config
            
            file_path = output_file or config.default_output_file
            
            if not os.path.exists(file_path):
                return {
                    "success": False,
                    "error": f"Results file not found: {file_path}"
                }
            
            df = pd.read_csv(file_path)
            
            return {
                "success": True,
                "total_results": len(df),
                "results_file": file_path,
                "sample_results": df.head(5).to_dict('records') if len(df) > 0 else []
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get results: {str(e)}"
            }
    
    # Private helper methods
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
            # Create session
            self._current_session = service_factory.create_scraping_session()
            
            # Run scraper
            success = self.scraper.run_scraper(
                location_class=location_class,
                section_class=section_class,
                max_profiles=max_profiles,
                auto_detect=auto_detect,
                input_file=input_file,
                output_file=output_file,
                resume_scraping=resume_scraping
            )
            
            # Mark as completed
            self._scraping_active = False
            
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
