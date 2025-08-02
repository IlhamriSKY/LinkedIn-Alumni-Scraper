"""
LinkedIn Alumni Scraper - Modern Flask API

Clean Flask API implementation using dependency injection and service layer
for better maintainability, testability, and separation of concerns.

This module provides RESTful API endpoints for LinkedIn scraping operations
with modern architecture patterns and comprehensive error handling.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os
import subprocess
import signal
import atexit
from datetime import datetime

# Import API service
from api_service import api_service

# Load environment variables
load_dotenv()

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
UNIVERSITY_NAME = os.getenv('UNIVERSITY_NAME', 'Default University')
UNIVERSITY_LINKEDIN_ID = os.getenv('UNIVERSITY_LINKEDIN_ID', 'default-id')

# Global state
vite_process = None
app_shutdown = False

def mask_email(email):
    """Mask email for security display."""
    if not email or '@' not in email:
        return 'Email not configured in .env'
    
    username, domain = email.split('@', 1)
    if len(username) <= 2:
        # For very short usernames, show first char + *
        masked_username = username[0] + '*'
    elif len(username) <= 4:
        # For short usernames, show first 2 chars + *
        masked_username = username[:2] + '*'
    else:
        # For longer usernames, show first 3 chars + * + last char
        masked_username = username[:3] + '*' + username[-1]
    
    return f"{masked_username}@{domain}"

def cleanup_resources():
    """Clean up all resources on app shutdown."""
    global app_shutdown, vite_process
    
    if app_shutdown:
        return
    
    app_shutdown = True
    print("[CLEANUP] Shutting down application...")
    
    try:
        # Clean up API service
        api_service.cleanup()
        
        # Stop Vite development server
        if vite_process:
            print("[CLEANUP] Stopping Vite development server...")
            vite_process.terminate()
            vite_process.wait(timeout=5)
            vite_process = None
            
    except Exception as e:
        print(f"[ERROR] Error during cleanup: {e}")

# Register cleanup handlers
atexit.register(cleanup_resources)
signal.signal(signal.SIGTERM, lambda signum, frame: cleanup_resources())
signal.signal(signal.SIGINT, lambda signum, frame: cleanup_resources())

def create_app():
    """Create and configure Flask application."""
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # ===== SYSTEM ENDPOINTS =====
    
    @app.route('/api/system/info', methods=['GET'])
    def get_system_info():
        """Get system information and configuration."""
        linkedin_email = os.getenv('LINKEDIN_EMAIL', '')
        
        return jsonify({
            "success": True,
            "system_info": {
                "university_name": UNIVERSITY_NAME,
                "university_linkedin_id": UNIVERSITY_LINKEDIN_ID,
                "linkedin_email": mask_email(linkedin_email),
                "script_directory": SCRIPT_DIR,
                "timestamp": datetime.now().isoformat()
            }
        })
    
    @app.route('/api/system/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        try:
            from core import get_service_status
            service_status = get_service_status()
            
            return jsonify({
                "success": True,
                "status": "healthy",
                "services": service_status,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "status": "unhealthy",
                "error": str(e)
            }), 500
    
    # ===== BROWSER MANAGEMENT ENDPOINTS =====
    
    @app.route('/api/browser/status', methods=['GET'])
    def browser_status():
        """Get current browser status."""
        return jsonify(api_service.get_browser_status())
    
    @app.route('/api/browser/open', methods=['POST'])
    def open_browser():
        """Open browser for scraping."""
        return jsonify(api_service.open_browser())
    
    @app.route('/api/browser/close', methods=['POST'])
    def close_browser():
        """Close browser and cleanup."""
        return jsonify(api_service.close_browser())
    
    # ===== AUTHENTICATION ENDPOINTS =====
    
    @app.route('/api/auth/login-page', methods=['POST'])
    def open_linkedin_login():
        """Navigate to LinkedIn login page."""
        return jsonify(api_service.open_linkedin_login())
    
    @app.route('/api/auth/status', methods=['GET'])
    def check_login_status():
        """Check current login status."""
        return jsonify(api_service.check_login_status())
    
    @app.route('/api/auth/manual-login', methods=['POST'])
    def manual_login():
        """Initiate manual login process."""
        return jsonify(api_service.manual_login())
    
    @app.route('/api/auth/auto-login', methods=['POST'])
    def auto_login():
        """Attempt automatic login."""
        return jsonify(api_service.auto_login())
    
    # ===== CLASS DETECTION ENDPOINTS =====
    
    @app.route('/api/classes/auto-detect', methods=['POST'])
    def auto_detect_classes():
        """Auto-detect CSS classes for scraping."""
        return jsonify(api_service.auto_detect_classes())
    
    # ===== SCRAPING ENDPOINTS =====
    
    @app.route('/api/scraper/start', methods=['POST'])
    def start_scraping():
        """Start scraping process."""
        try:
            data = request.get_json() or {}
            
            # Extract parameters with defaults
            location_class = data.get('location_class')
            section_class = data.get('section_class')
            max_profiles = int(data.get('max_profiles', 10))
            auto_detect = data.get('auto_detect', True)
            input_file = data.get('input_file')
            output_file = data.get('output_file')
            resume_scraping = data.get('resume_scraping', True)
            
            return jsonify(api_service.start_scraping(
                location_class=location_class,
                section_class=section_class,
                max_profiles=max_profiles,
                auto_detect=auto_detect,
                input_file=input_file,
                output_file=output_file,
                resume_scraping=resume_scraping
            ))
            
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Invalid request parameters: {str(e)}"
            }), 400
    
    @app.route('/api/scraper/stop', methods=['POST'])
    def stop_scraping():
        """Stop active scraping process."""
        return jsonify(api_service.stop_scraping())
    
    @app.route('/api/scraper/status', methods=['GET'])
    def scraping_status():
        """Get current scraping status."""
        return jsonify(api_service.get_scraping_status())
    
    # ===== DATA MANAGEMENT ENDPOINTS =====
    
    @app.route('/api/data/count-names', methods=['GET'])
    def count_names():
        """Count names available for scraping."""
        input_file = request.args.get('input_file')
        return jsonify(api_service.count_names_to_scrape(input_file))
    
    @app.route('/api/data/results', methods=['GET'])
    def get_results():
        """Get scraping results."""
        output_file = request.args.get('output_file')
        return jsonify(api_service.get_scraping_results(output_file))
    
    @app.route('/api/data/download-results', methods=['GET'])
    def download_results():
        """Download results as CSV file."""
        try:
            from core.config import config
            
            output_file = request.args.get('output_file', config.default_output_file)
            
            if not os.path.exists(output_file):
                return jsonify({
                    "success": False,
                    "error": "Results file not found"
                }), 404
            
            return send_file(
                output_file,
                as_attachment=True,
                download_name=f"linkedin_scraping_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mimetype='text/csv'
            )
            
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Failed to download results: {str(e)}"
            }), 500
    
    # ===== FRONTEND DEVELOPMENT ENDPOINTS =====
    
    @app.route('/api/dev/start-frontend', methods=['POST'])
    def start_frontend_dev():
        """Start Vite development server for frontend."""
        global vite_process
        
        try:
            if vite_process and vite_process.poll() is None:
                return jsonify({
                    "success": True,
                    "message": "Frontend development server is already running",
                    "port": 5173
                })
            
            frontend_dir = os.path.join(SCRIPT_DIR, 'frontend')
            
            if not os.path.exists(frontend_dir):
                return jsonify({
                    "success": False,
                    "error": "Frontend directory not found"
                }), 404
            
            # Start Vite dev server
            vite_process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd=frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            
            return jsonify({
                "success": True,
                "message": "Frontend development server started",
                "port": 5173,
                "url": "http://localhost:5173"
            })
            
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Failed to start frontend: {str(e)}"
            }), 500
    
    @app.route('/api/dev/stop-frontend', methods=['POST'])
    def stop_frontend_dev():
        """Stop Vite development server."""
        global vite_process
        
        try:
            if not vite_process or vite_process.poll() is not None:
                return jsonify({
                    "success": True,
                    "message": "Frontend development server is not running"
                })
            
            vite_process.terminate()
            vite_process.wait(timeout=10)
            vite_process = None
            
            return jsonify({
                "success": True,
                "message": "Frontend development server stopped"
            })
            
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Failed to stop frontend: {str(e)}"
            }), 500
    
    # ===== ERROR HANDLERS =====
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({
            "success": False,
            "error": "Endpoint not found",
            "code": 404
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "code": 500
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle unexpected exceptions."""
        return jsonify({
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "code": 500
        }), 500
    
    return app

def main():
    """Main application entry point."""
    try:
        app = create_app()
        
        print("=" * 60)
        print("LinkedIn Alumni Scraper API Server")
        print("=" * 60)
        print(f"University: {UNIVERSITY_NAME}")
        print(f"LinkedIn ID: {UNIVERSITY_LINKEDIN_ID}")
        print("=" * 60)
        print("API Endpoints:")
        print("  • System Info: GET /api/system/info")
        print("  • Health Check: GET /api/system/health")
        print("  • Browser Status: GET /api/browser/status") 
        print("  • Start Scraping: POST /api/scraper/start")
        print("  • Scraping Status: GET /api/scraper/status")
        print("=" * 60)
        print("Server starting on http://localhost:5000")
        print("Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Run Flask app
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=False,
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n[INFO] Server shutdown requested by user")
    except Exception as e:
        print(f"[ERROR] Failed to start server: {e}")
    finally:
        cleanup_resources()

if __name__ == '__main__':
    main()
