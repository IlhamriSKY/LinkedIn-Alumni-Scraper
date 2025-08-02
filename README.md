# LinkedIn Alumni Scraper

A Python-based web application for scraping LinkedIn alumni data with a modern Vue.js interface.

## Credits

Based on [@notyouriiz - LinkedIn Alumni Scraper](https://github.com/notyouriiz/Linkedin_Scraper). Enhanced with modern web interface, improved functionality, and clean logging system.

## Purpose

This tool automatically collects alumni data from university LinkedIn pages. It provides:
- Automated LinkedIn login and data extraction
- Modern web dashboard for monitoring scraping progress
- CSV export functionality for collected data
- Real-time progress tracking

## ⚠️ Use at Your Own Risk

**IMPORTANT WARNING:** This tool may violate LinkedIn's Terms of Service. Scraping LinkedIn can result in:
- Account restrictions or suspension
- Legal consequences
- IP blocking

Use this tool for **educational purposes only**. You are fully responsible for compliance with all applicable laws and terms of service.

## Installation

### 1. Setup Virtual Environment

```bash
# Clone the repository
git clone https://github.com/IlhamriSKY/Linkedin_Scraper.git
cd Linkedin_Scraper

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd "Linkedin Alumni Scraper/frontend"
npm install
cd ..
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your credentials:
# LINKEDIN_EMAIL=your_email@example.com
# LINKEDIN_PASSWORD=your_password
# UNIVERSITY_LINKEDIN_ID=your-university-linkedin-id
# UNIVERSITY_NAME=Your University Name
```

### 5. Setup Names List

```bash
# Copy example names file
cp "Linkedin Alumni Scraper/data/person_locations/indonesia_names_example.csv" "Linkedin Alumni Scraper/data/person_locations/indonesia_names.csv"

# Edit the CSV file with names you want to scrape
```

## Running the Application

### Option 1: Integrated Launcher (Recommended)

```bash
python start.py
```

This will start both frontend and backend servers automatically.

### Option 2: Manual Start

```bash
# Terminal 1 - Start Backend
cd "Linkedin Alumni Scraper"
python app.py

# Terminal 2 - Start Frontend (in new terminal)
cd "Linkedin Alumni Scraper/frontend"
npm run dev
```

### Access the Application

- **Web Interface**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Testing

### Run All Tests

```bash
# Ensure virtual environment is active
pip install pytest pytest-cov

# Run tests
python -m pytest tests/ -v

# Run with coverage report
python -m pytest tests/ -v --cov=core --cov-report=html
```

### Test Specific Components

```bash
# Test authentication
python -m pytest tests/test_auth.py -v

# Test scraper functionality
python -m pytest tests/test_scraper.py -v

# Test configuration
python -m pytest tests/test_config.py -v
```