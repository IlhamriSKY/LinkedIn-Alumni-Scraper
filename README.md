<div align="center">

# 🔍 LinkedIn Alumni Scraper

**Modern LinkedIn Alumni Data Collection Tool**

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18%2B-blue?style=for-the-badge&logo=react)](https://reactjs.org)
[![Express](https://img.shields.io/badge/Express-4%2B-black?style=for-the-badge&logo=express)](https://expressjs.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4%2B-red?style=for-the-badge&logo=socket.io)](https://socket.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/IlhamriSKY/LinkedIn-Alumni-Scraper?style=for-the-badge)](https://github.com/IlhamriSKY/LinkedIn-Alumni-Scraper/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/IlhamriSKY/LinkedIn-Alumni-Scraper?style=for-the-badge)](https://github.com/IlhamriSKY/LinkedIn-Alumni-Scraper/network)
[![GitHub Issues](https://img.shields.io/github/issues/IlhamriSKY/LinkedIn-Alumni-Scraper?style=for-the-badge)](https://github.com/IlhamriSKY/LinkedIn-Alumni-Scraper/issues)

*Professional LinkedIn Alumni Data Collection with Real-time Dashboard*

[📥 Download](#-download) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [⚖️ Legal Notice](#️-legal-disclaimer)

</div>

---

## 📋 Overview

LinkedIn Alumni Scraper is a modern, full-stack application designed for automated LinkedIn alumni data collection. Built with Node.js backend and React frontend, it provides a professional dashboard for real-time monitoring and control of scraping operations.

**Credit**: This project is based on [notyouriiz/Linkedin_Scraper](https://github.com/notyouriiz/Linkedin_Scraper) converted from Python to Node.js for easier backend and frontend development.

### ✨ Key Features

- **🤖 Automated Browser Control** - Puppeteer-based LinkedIn interaction with anti-detection
- **📊 Real-time Dashboard** - Live progress tracking with Socket.IO communication
- **🔧 Professional Interface** - Modern React dashboard with dark/light theme
- **📈 Progress Monitoring** - Real-time status updates and result tracking
- **📄 CSV Export** - Automatic data export with customizable formatting
- **🛡️ Anti-Detection** - Stealth mode browsing with human-like patterns

---

## ⚠️ **LEGAL DISCLAIMER**

**🚨 IMPORTANT: USE AT YOUR OWN RISK**

> **This software is provided for educational and research purposes only.**

### ⚖️ Legal Notice

By using this software, you acknowledge and agree that:

- 🚫 **Web scraping LinkedIn may violate their Terms of Service**
- ⚖️ **You are fully responsible for compliance with all applicable laws**
- 📋 **You must comply with LinkedIn's Terms of Service and data protection regulations**
- 🎓 **This tool is intended for educational and research purposes only**
- 🛡️ **The authors disclaim all liability for any consequences of use**
- 🔒 **You are responsible for respecting user privacy and data protection laws**

**USE RESPONSIBLY AND AT YOUR OWN RISK**

---

## 📥 Download

### Method 1: Clone with Git

```bash
# Clone the repository
git clone https://github.com/IlhamriSKY/LinkedIn-Alumni-Scraper.git

# Navigate to project directory
cd LinkedIn-Alumni-Scraper
```

### Method 2: Download ZIP

1. Go to [GitHub Repository](https://github.com/IlhamriSKY/LinkedIn-Alumni-Scraper)
2. Click the green **"Code"** button
3. Select **"Download ZIP"**
4. Extract the downloaded file
5. Navigate to the extracted folder

### Method 3: GitHub CLI

```bash
# Using GitHub CLI
gh repo clone IlhamriSKY/LinkedIn-Alumni-Scraper
cd LinkedIn-Alumni-Scraper
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 16+** - [Download here](https://nodejs.org/)
- **Valid LinkedIn account** - Required for authentication
- **Chrome/Chromium browser** - Automatically managed by Puppeteer

### Installation

#### Option 1: Automatic Installation (Recommended)

```bash
# Install all dependencies automatically
npm run install:deps
```

#### Option 2: Manual Installation

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Configuration

1. **Setup LinkedIn Credentials** (Required):
   ```bash
   # Edit backend/.env file
   LINKEDIN_EMAIL=your_email@example.com
   LINKEDIN_PASSWORD=your_password
   ```

2. **Configure University Information**:
   ```bash
   # Edit backend/.env file
   UNIVERSITY_NAME=Your University Name
   UNIVERSITY_LINKEDIN_ID=your-university-linkedin-id
   UNIVERSITY_LINKEDIN_URL=https://www.linkedin.com/school/your-university/people/
   ```

3. **Prepare Search Names**:
   ```bash
   # Create search_names.csv in root directory
   John Doe
   Jane Smith
   Michael Johnson
   ```

---

## 🏃‍♂️ Running the Application

### Development Mode (Recommended for Development)

```bash
# Start development mode
npm run dev

# This will start:
# - Frontend dev server: http://localhost:5173
# - Backend server: http://localhost:3001
```

**Development Features:**
- ✅ Hot reload for frontend changes
- ✅ Auto-restart for backend changes
- ✅ Separate dev servers for optimal development experience
- ✅ Real-time debugging and logging

### Production Mode

```bash
# Start production mode
npm start

# This will:
# 1. Build the frontend for production
# 2. Start the backend server
# 3. Serve frontend through backend: http://localhost:3001
```

**Production Features:**
- ✅ Optimized frontend build
- ✅ Single server deployment
- ✅ Better performance
- ✅ Production-ready configuration

### Alternative Commands

```bash
# Backend only
npm run backend

# Frontend only
npm run frontend

# Build frontend
npm run build

# Clean builds
npm run clean
```

---

## 🎯 How to Use

### Step 1: Access the Dashboard

1. Start the application (development or production mode)
2. Open your browser and navigate to:
   - **Development**: http://localhost:5173
   - **Production**: http://localhost:3001

### Step 2: Browser Setup

1. Click **"Open Browser"** button in the dashboard
2. Wait for Chrome browser to launch automatically
3. Verify browser status shows "Browser Running"

### Step 3: LinkedIn Authentication

1. Click **"Login to LinkedIn"** button
2. The system will:
   - Navigate to LinkedIn login page
   - Attempt automatic login with configured credentials
   - Or allow manual login if needed

### Step 4: Configure Scraping

1. **Verify Login Status**: Ensure "Logged In" status is green
2. **Configure Settings** (optional):
   - Maximum profiles to scrape
   - CSS class detection settings
   - Delay configurations

### Step 5: Start Scraping

1. Click **"Start Scraping"** button
2. Monitor real-time progress:
   - Current profile being processed
   - Success/failure status
   - Results counter
   - Progress percentage

### Step 6: Monitor Results

1. **Real-time Updates**: View live scraping progress
2. **Results Table**: See extracted data immediately
3. **Status Indicators**: Monitor connection and process status
4. **Toast Notifications**: Receive instant feedback

### Step 7: Export Data

1. **Automatic Export**: Results are auto-exported to CSV
2. **Manual Export**: Click "Download Results" button
3. **File Location**: Check `results/` directory

---

## 📖 Documentation

### Dashboard Features

#### Status Indicators
- 🟢 **Backend Connected** - Real-time server connection
- 🟢 **Browser Open** - Chrome browser status
- 🟢 **Logged In** - LinkedIn authentication status
- 🟢 **Scraping Active** - Current operation status

#### Real-time Updates
- **Progress Tracking** - Live percentage and profile count
- **Current Activity** - Shows currently processed profile
- **Results Counter** - Real-time success/failure tracking
- **Toast Notifications** - Instant feedback for all actions

#### Theme Support
- **Dark Mode** - Professional dark interface
- **Light Mode** - Clean light interface
- **System Theme** - Automatic theme detection

### Configuration Options

#### Environment Variables

**Backend Configuration** (`backend/.env`):
```env
# Required LinkedIn Credentials
LINKEDIN_EMAIL=your_email@example.com
LINKEDIN_PASSWORD=your_password

# University Information
UNIVERSITY_NAME=Your University
UNIVERSITY_LINKEDIN_ID=university-linkedin-id
UNIVERSITY_LINKEDIN_URL=https://linkedin.com/school/university/people/

# Server Settings
PORT=3001
NODE_ENV=development
HEADLESS=false

# Anti-Detection Settings
ENABLE_STEALTH=true
HUMAN_LIKE_DELAYS=true
RANDOM_MOUSE_MOVEMENTS=true
```

**Frontend Configuration** (`frontend/.env`):
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_APP_NAME=LinkedIn Alumni Scraper
VITE_UNIVERSITY_NAME=Your University
```

### API Endpoints

The application provides REST API endpoints for external integration:

```bash
# System Information
GET /api/health              # Health check
GET /api/state               # Current application state

# Browser Control
POST /api/browser/open       # Open browser
GET /api/browser/status      # Browser status

# Authentication
POST /api/login              # LinkedIn login
GET /api/login/check         # Check login status

# Scraping Operations
POST /api/scrape/start       # Start scraping
POST /api/scrape/stop        # Stop scraping
POST /api/scrape/pause       # Pause scraping
POST /api/scrape/reset       # Reset session

# Data Export
GET /api/results/export      # Export results
GET /api/download/results    # Download CSV file
```

---

## 🔧 Advanced Configuration

### Performance Tuning

```env
# Browser Settings
BROWSER_TIMEOUT=30000
NAVIGATION_TIMEOUT=30000
WAIT_TIMEOUT=5000

# Scraping Performance
DELAY_MIN=2000
DELAY_MAX=5000
BATCH_SIZE=50
MAX_RETRIES=3

# Rate Limiting
REQUESTS_PER_MINUTE=30
CONCURRENT_REQUESTS=3
```

### Security Settings

```env
# Anti-Detection
ENABLE_STEALTH=true
VIEWPORT_WIDTH=1366
VIEWPORT_HEIGHT=768
DISABLE_WEB_SECURITY=false

# Privacy
BLOCK_IMAGES=false
BLOCK_CSS=false
SAVE_SCREENSHOTS=false
```

### Deployment Options

#### Option 1: Single Server Deployment

```bash
# Build and start
npm run build
npm start

# Access at: http://localhost:3001
```

#### Option 2: Separate Servers

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev

# Access at: http://localhost:5173
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ If this project helps you, please give it a star! ⭐**

Made with ❤️ by [IlhamriSKY](https://github.com/IlhamriSKY)

</div>
