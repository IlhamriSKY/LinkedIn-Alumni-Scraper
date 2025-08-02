<div align="center">

# 🎓 LinkedIn Alumni Scraper

**A Modern Web Application for LinkedIn Alumni Data Collection**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.0+-green.svg)](https://vuejs.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-red.svg)](https://flask.palletsprojects.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/Tests-88%20Passing-brightgreen.svg)](#-testing--quality-assurance)
[![Coverage](https://img.shields.io/badge/Coverage-100%25-success.svg)](#-testing--quality-assurance)

*Intelligent alumni data extraction with a sleek, modern interface*

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [📖 Documentation](#-installation) • [⚠️ Disclaimer](#%EF%B8%8F-legal-disclaimer)

---

</div>

## 🌟 Overview

**LinkedIn Alumni Scraper** is an enhanced version of the original project by [@notyouriiz](https://github.com/notyouriiz/Linkedin_Scraper). This Python-based web application streamlines the collection of alumni data from university LinkedIn pages, now featuring a modern Vue.js interface and improved functionality.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔧 Core Functionality
- 🤖 **Automated LinkedIn Authentication**
- 📊 **Real-time Progress Tracking**  
- 📈 **Modern Web Dashboard**
- 💾 **CSV Export Capability**
- 🔄 **Session Recovery System**
- 🛡️ **Anti-Detection Measures**

</td>
</tr>
</table>

---

## ⚠️ Legal Disclaimer

<div align="center">

### 🚨 **IMPORTANT: Use at Your Own Risk** 🚨

</div>

This tool may violate LinkedIn's Terms of Service. Web scraping LinkedIn can result in:

- 🚫 **Account restrictions or suspension**
- ⚖️ **Legal consequences**
- 🛑 **IP address blocking**
- 📵 **Platform access denial**

**Use this tool for educational purposes only.** You are fully responsible for compliance with all applicable laws and terms of service.

---

## 🚀 Quick Start

Get up and running in under 5 minutes!

### 🛠️ Prerequisites

- 🐍 **Python 3.10+** 
- 📦 **Node.js 16+** & npm
- 🌐 **Modern Web Browser**
- 💳 **Valid LinkedIn Account**

### ⚡ One-Command Setup

```bash
# 1️⃣ Clone and enter directory
git clone https://github.com/IlhamriSKY/LinkedIn-Alumni-Scraper.git
cd LinkedIn-Alumni-Scraper

# 2️⃣ Run the magic setup script
python start.py
```

## 📖 Installation

### 1️⃣ Setup Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# 🪟 Windows:
venv\Scripts\activate
# 🐧 Linux/Mac:
source venv/bin/activate
```

### 2️⃣ Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3️⃣ Install Frontend Dependencies

```bash
cd "Linkedin Alumni Scraper/frontend"
npm install
cd ../..
```

### 4️⃣ Configure Environment

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# 🔐 LinkedIn Credentials
LINKEDIN_EMAIL=your_email@example.com
LINKEDIN_PASSWORD=your_secure_password

# ⚙️ Application Settings  
FLASK_PORT=5000                    # Backend server port

# 🎓 University Information
UNIVERSITY_LINKEDIN_ID=your-university-linkedin-id
UNIVERSITY_NAME=Your University Name
```

### 5️⃣ Setup Names List

```bash
# Copy example names file
cp "Linkedin Alumni Scraper/data/person_locations/indonesia_names_example.csv" "Linkedin Alumni Scraper/data/person_locations/indonesia_names.csv"

# ✏️ Edit the CSV file with names you want to scrape
```

---

## 🎮 Running the Application

### 🚀 Option 1: Integrated Launcher (Recommended)

```bash
python start.py
```

**This will automatically:**
- ⚡ Start Flask backend server
- 🎨 Launch Vue.js frontend  
- 🌐 Open browser to the application
- 📊 Display real-time system status

### ⚙️ Option 2: Manual Start

```bash
# 🔧 Terminal 1 - Backend Server
cd "Linkedin Alumni Scraper"
python app.py

# 🎨 Terminal 2 - Frontend Server  
cd "Linkedin Alumni Scraper/frontend"
npm run dev
```

### 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| 🎨 **Web Interface** | http://localhost:3000 | Main application dashboard |
| 🔧 **Backend API** | http://localhost:5000 | REST API endpoints |
| 💊 **Health Check** | http://localhost:5000/api/system/health | System status |

---

## 🧪 Testing & Quality Assurance

Our comprehensive test suite ensures reliability and maintainability.

### 🎯 Run All Tests

```bash
# Install test dependencies
pip install pytest pytest-cov

# Execute full test suite
python -m pytest tests/ -v

# Generate coverage report  
python -m pytest tests/ -v --cov=core --cov-report=html
```

### 📊 Current Test Coverage

- ✅ **88 Tests Passing** (100% success rate)
- 🎯 **7 Core Modules** fully tested
- 🧪 **Complete API Coverage**
- 🔒 **Security & Authentication**
- 📈 **Data Processing & Export**

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the education community**

⭐ **Star this repository if it helped you!** ⭐

</div>
