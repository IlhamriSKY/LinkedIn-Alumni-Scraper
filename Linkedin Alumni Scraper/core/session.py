"""
LinkedIn Scraping Session Manager

This module manages scraping sessions, progress tracking, and state management
for LinkedIn profile extraction with comprehensive monitoring capabilities.

Classes:
    ScrapingProgress: Data class for tracking scraping progress metrics
    ScrapingSession: Main session management class

Features:
    - Real-time progress tracking and monitoring
    - Thread-safe session state management
    - Comprehensive error handling and logging
    - Session persistence and recovery
    - Advanced statistics and reporting
"""

import threading
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field


@dataclass
class ScrapingProgress:
    """Data class for tracking scraping progress."""
    current_name: Optional[str] = None
    current_index: int = 0
    total_names: int = 0
    profiles_scraped: int = 0
    successful_names: int = 0
    failed_names: int = 0
    progress_percentage: float = 0.0
    status: str = "idle"  # idle, running, stopping, completed, error
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    error_message: Optional[str] = None
    scraped_urls: set = field(default_factory=set)


class ScrapingSession:
    """
    Manages individual scraping sessions with thread-safe progress tracking.
    
    Provides centralized state management for scraping operations,
    including progress tracking, session control, and result management.
    """
    
    def __init__(self, session_id: str):
        """
        Initialize a new scraping session.
        
        Args:
            session_id: Unique identifier for this session
        """
        self.session_id = session_id
        self.progress = ScrapingProgress()
        self._stop_flag = threading.Event()
        self._lock = threading.Lock()
        self._results: List[Dict[str, Any]] = []
    
    def start_session(self, total_names: int, max_profiles: int):
        """
        Start a new scraping session.
        
        Args:
            total_names: Total number of names to process
            max_profiles: Maximum profiles to scrape
        """
        with self._lock:
            self.progress.total_names = total_names
            self.progress.status = "running"
            self.progress.start_time = datetime.now()
            self.progress.current_index = 0
            self.progress.profiles_scraped = 0
            self.progress.successful_names = 0
            self.progress.failed_names = 0
            self.progress.progress_percentage = 0.0
            self._stop_flag.clear()
    
    def update_progress(self, current_name: str, current_index: int, profiles_scraped: int):
        """
        Update session progress.
        
        Args:
            current_name: Name currently being processed
            current_index: Current index in the name list
            profiles_scraped: Total profiles scraped so far
        """
        with self._lock:
            self.progress.current_name = current_name
            self.progress.current_index = current_index
            self.progress.profiles_scraped = profiles_scraped
            
            if self.progress.total_names > 0:
                self.progress.progress_percentage = (current_index / self.progress.total_names) * 100
    
    def add_successful_name(self, name: str, profiles_found: int):
        """
        Record a successful name processing.
        
        Args:
            name: Name that was successfully processed
            profiles_found: Number of profiles found for this name
        """
        with self._lock:
            self.progress.successful_names += 1
            print(f"[OK] Successfully processed: {name} ({profiles_found} profiles found)")
    
    def add_failed_name(self, name: str, error: str):
        """
        Record a failed name processing.
        
        Args:
            name: Name that failed to process
            error: Error message
        """
        with self._lock:
            self.progress.failed_names += 1
            print(f"[WARN] Failed to process: {name} - {error}")
    
    def add_scraped_url(self, url: str):
        """
        Add a scraped URL to avoid duplicates.
        
        Args:
            url: LinkedIn profile URL that was scraped
        """
        with self._lock:
            self.progress.scraped_urls.add(url)
    
    def is_url_scraped(self, url: str) -> bool:
        """
        Check if a URL has already been scraped.
        
        Args:
            url: LinkedIn profile URL to check
            
        Returns:
            True if URL was already scraped, False otherwise
        """
        with self._lock:
            return url in self.progress.scraped_urls
    
    def add_result(self, result: Dict[str, Any]):
        """
        Add a scraping result to the session.
        
        Args:
            result: Dictionary containing scraped profile data
        """
        with self._lock:
            self._results.append(result)
    
    def get_results(self) -> List[Dict[str, Any]]:
        """
        Get all scraping results from this session.
        
        Returns:
            List of result dictionaries
        """
        with self._lock:
            return self._results.copy()
    
    def stop_session(self):
        """Signal the session to stop."""
        self._stop_flag.set()
        with self._lock:
            if self.progress.status == "running":
                self.progress.status = "stopping"
    
    def complete_session(self, success: bool = True, error_message: Optional[str] = None):
        """
        Mark the session as completed.
        
        Args:
            success: Whether the session completed successfully
            error_message: Error message if session failed
        """
        with self._lock:
            self.progress.end_time = datetime.now()
            
            if error_message:
                self.progress.status = "error"
                self.progress.error_message = error_message
            elif success:
                self.progress.status = "completed"
            else:
                self.progress.status = "stopped"
    
    def should_stop(self) -> bool:
        """
        Check if the session should stop.
        
        Returns:
            True if stop was requested, False otherwise
        """
        return self._stop_flag.is_set()
    
    def get_progress_dict(self) -> Dict[str, Any]:
        """
        Get progress information as a dictionary.
        
        Returns:
            Dictionary containing current progress information
        """
        with self._lock:
            return {
                'session_id': self.session_id,
                'current_name': self.progress.current_name,
                'current_index': self.progress.current_index,
                'total_names': self.progress.total_names,
                'profiles_scraped': self.progress.profiles_scraped,
                'successful_names': self.progress.successful_names,
                'failed_names': self.progress.failed_names,
                'progress_percentage': round(self.progress.progress_percentage, 2),
                'status': self.progress.status,
                'start_time': self.progress.start_time.isoformat() if self.progress.start_time else None,
                'end_time': self.progress.end_time.isoformat() if self.progress.end_time else None,
                'error_message': self.progress.error_message,
                'total_results': len(self._results)
            }
    
    def get_session_summary(self) -> Dict[str, Any]:
        """
        Get a comprehensive session summary.
        
        Returns:
            Dictionary containing session summary information
        """
        progress_dict = self.get_progress_dict()
        
        # Calculate duration if session has started
        duration = None
        if self.progress.start_time:
            end_time = self.progress.end_time or datetime.now()
            duration = (end_time - self.progress.start_time).total_seconds()
        
        progress_dict.update({
            'duration_seconds': duration,
            'average_profiles_per_name': (
                self.progress.profiles_scraped / max(self.progress.successful_names, 1)
                if self.progress.successful_names > 0 else 0
            ),
            'success_rate': (
                (self.progress.successful_names / max(self.progress.total_names, 1)) * 100
                if self.progress.total_names > 0 else 0
            )
        })
        
        return progress_dict


class SessionManager:
    """
    Manages multiple scraping sessions.
    
    Provides centralized management of all scraping sessions,
    including creation, tracking, and cleanup.
    """
    
    def __init__(self):
        """Initialize the session manager."""
        self._sessions: Dict[str, ScrapingSession] = {}
        self._current_session: Optional[ScrapingSession] = None
        self._lock = threading.Lock()
    
    def create_session(self, session_id: Optional[str] = None) -> ScrapingSession:
        """
        Create a new scraping session.
        
        Args:
            session_id: Optional session ID (auto-generated if not provided)
            
        Returns:
            New ScrapingSession instance
        """
        if session_id is None:
            session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        with self._lock:
            session = ScrapingSession(session_id)
            self._sessions[session_id] = session
            self._current_session = session
            return session
    
    def get_session(self, session_id: str) -> Optional[ScrapingSession]:
        """
        Get a session by ID.
        
        Args:
            session_id: Session identifier
            
        Returns:
            ScrapingSession instance or None if not found
        """
        with self._lock:
            return self._sessions.get(session_id)
    
    def get_current_session(self) -> Optional[ScrapingSession]:
        """
        Get the current active session.
        
        Returns:
            Current ScrapingSession instance or None
        """
        with self._lock:
            return self._current_session
    
    def stop_current_session(self):
        """Stop the current active session."""
        with self._lock:
            if self._current_session:
                self._current_session.stop_session()
    
    def cleanup_old_sessions(self, max_sessions: int = 10):
        """
        Clean up old sessions to prevent memory buildup.
        
        Args:
            max_sessions: Maximum number of sessions to keep
        """
        with self._lock:
            if len(self._sessions) <= max_sessions:
                return
            
            # Sort sessions by start time and keep the most recent ones
            sorted_sessions = sorted(
                self._sessions.items(),
                key=lambda x: x[1].progress.start_time or datetime.min,
                reverse=True
            )
            
            # Keep only the most recent sessions
            sessions_to_keep = dict(sorted_sessions[:max_sessions])
            self._sessions = sessions_to_keep
    
    def get_all_sessions_summary(self) -> List[Dict[str, Any]]:
        """
        Get summary of all sessions.
        
        Returns:
            List of session summary dictionaries
        """
        with self._lock:
            return [session.get_session_summary() for session in self._sessions.values()]


# Global session manager instance
session_manager = SessionManager()
