#!/usr/bin/env node

/**
 * LinkedIn Alumni Scraper - Universal Starter
 * 
 * Usage:
 * - Production mode (default): node start.js
 * - Development mode: node start.js --dev
 * - Install dependencies: node start.js --install
 * 
 * Production mode:
 * 1. Builds the frontend
 * 2. Starts the backend server
 * 3. Serves the frontend through the backend
 * 
 * Development mode:
 * 1. Starts both frontend dev server and backend
 * 2. Frontend runs on port 5173 (Vite dev server)
 * 3. Backend runs on port 3001
 * 4. Auto-reload for both frontend and backend
 * 
 * Install mode:
 * 1. Installs root dependencies
 * 2. Installs backend dependencies
 * 3. Installs frontend dependencies
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import dotenv from 'dotenv';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend .env
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const BACKEND_DIR = path.join(__dirname, 'backend');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');

// Get configuration from environment variables
const FRONTEND_DEV_PORT = process.env.FRONTEND_DEV_PORT || process.env.VITE_DEV_PORT || 5173;
const FRONTEND_PROD_PORT = process.env.FRONTEND_PROD_PORT || process.env.VITE_PROD_PORT || 3000;
const BACKEND_PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Check for mode flags
const isDev = process.argv.includes('--dev') || process.argv.includes('-d');
const isInstall = process.argv.includes('--install') || process.argv.includes('-i');

if (isInstall) {
  console.log('Starting dependency installation process...\n');
  await installDependencies();
  process.exit(0);
}

const mode = isDev ? 'Development' : 'Production';
console.log(`Starting LinkedIn Alumni Scraper in ${mode} Mode...\n`);

async function installDependencies() {
  try {
    console.log('Installing dependencies for all packages...\n');
    
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    // Install root dependencies (skip postinstall to avoid recursion)
    console.log('1/3 Installing root dependencies...');
    await execAsync(`${npmCmd} install --ignore-scripts`, { 
      cwd: __dirname,
      shell: true
    });
    console.log('Root dependencies installed successfully\n');
    
    // Install backend dependencies
    console.log('2/3 Installing backend dependencies...');
    await execAsync(`${npmCmd} install`, { 
      cwd: BACKEND_DIR,
      shell: true
    });
    console.log('Backend dependencies installed successfully\n');
    
    // Install frontend dependencies
    console.log('3/3 Installing frontend dependencies...');
    await execAsync(`${npmCmd} install`, { 
      cwd: FRONTEND_DIR,
      shell: true
    });
    console.log('Frontend dependencies installed successfully\n');
    
    console.log('All dependencies installed successfully!');
    console.log('You can now run:');
    console.log('  npm run dev    - Start development mode');
    console.log('  npm start      - Start production mode');
    
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

async function checkFrontendBuild() {
  if (isDev) {
    console.log('Development mode - skipping frontend build');
    return true;
  }
  
  console.log('Building frontend for production...');
  
  // Always build frontend to ensure latest changes
  return buildFrontend();
}

async function buildFrontend() {
  console.log('Building frontend for production...');
  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const { stdout, stderr } = await execAsync(`${npmCmd} run build`, { 
      cwd: FRONTEND_DIR,
      env: { ...process.env, NODE_ENV: 'production' },
      shell: true
    });
    
    if (stderr && !stderr.includes('transforming')) {
      console.log('Build warnings:', stderr);
    }
    
    console.log('Frontend built successfully');
    return true;
  } catch (error) {
    console.error('Frontend build failed:', error.message);
    process.exit(1);
  }
}

async function startFrontendDev() {
  console.log('Starting frontend dev server...');
  
  return new Promise((resolve, reject) => {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const childProcess = spawn(npmCmd, ['run', 'dev'], {
      cwd: FRONTEND_DIR,
      env: { 
        ...process.env, 
        NODE_ENV: 'development',
        FORCE_COLOR: '1'
      },
      stdio: 'pipe',
      shell: true
    });

    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('ready')) {
        console.log('Frontend dev server started');
      }
      process.stdout.write(`[Frontend] ${output}`);
    });

    childProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('EADDRINUSE')) {
        console.error('Frontend port conflict - trying alternative port...');
      }
      process.stderr.write(`[Frontend] ${error}`);
    });

    childProcess.on('error', (error) => {
      console.error('Failed to start frontend dev server:', error.message);
      reject(error);
    });

    childProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Frontend dev server exited with code ${code}`);
      }
    });

    // Resolve immediately to continue with backend startup
    setTimeout(() => resolve(childProcess), 2000);
  });
}

async function startBackend() {
  const envMode = isDev ? 'development' : 'production';
  const serverDesc = isDev ? 'backend server (dev mode)' : 'backend server';
  
  console.log(`Starting ${serverDesc}...\n`);
  
  return new Promise((resolve, reject) => {
    const childProcess = spawn('node', ['start.js'], {
      cwd: BACKEND_DIR,
      env: { 
        ...process.env, 
        NODE_ENV: envMode,
        SERVE_FRONTEND: isDev ? 'false' : 'true',
        FORCE_COLOR: '1'
      },
      stdio: 'pipe',
      shell: true
    });

    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Backend started')) {
        console.log('Backend server started');
      }
      process.stdout.write(`[Backend] ${output}`);
    });

    childProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('EADDRINUSE')) {
        console.error('Backend port 3001 is already in use');
        reject(new Error('Port 3001 is already in use'));
        return;
      }
      process.stderr.write(`[Backend] ${error}`);
    });

    childProcess.on('error', (error) => {
      console.error('Failed to start backend:', error.message);
      reject(error);
    });

    childProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Backend server exited with code ${code}`);
      }
    });

    // Resolve immediately to continue
    setTimeout(() => resolve(childProcess), 2000);
  });
}

function setupGracefulShutdown(processes) {
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGINT');
      }
    });
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGTERM');
      }
    });
    process.exit(0);
  });

  // Handle Ctrl+C on Windows
  if (process.platform === "win32") {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.on("SIGINT", () => {
      process.emit("SIGINT");
    });
  }
}

async function main() {
  try {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      console.error('Node.js 16 or higher is required. Current version:', nodeVersion);
      process.exit(1);
    }
    
    console.log('Node.js version:', nodeVersion);
    
    const processes = [];
    
    if (isDev) {
      // Development mode: Start both frontend dev server and backend
      console.log('Development mode: Starting frontend and backend separately...\n');
      
      const frontend = await startFrontendDev();
      const backend = await startBackend();
      
      processes.push(frontend, backend);
      
      console.log('\nDevelopment URLs:');
      console.log(`   Frontend: http://${HOST}:${FRONTEND_DEV_PORT}`);
      console.log(`   Backend:  http://${HOST}:${BACKEND_PORT}`);
      console.log('   Use Ctrl+C to stop both servers\n');
      
    } else {
      // Production mode: Build frontend and start backend
      await checkFrontendBuild();
      const backend = await startBackend();
      
      processes.push(backend);
      
      console.log(`\nProduction URL: http://${HOST}:${FRONTEND_PROD_PORT}\n`);
    }
    
    // Setup graceful shutdown
    setupGracefulShutdown(processes);
    
    // Wait for processes to finish
    await Promise.all(processes.map(proc => new Promise(resolve => {
      proc.on('close', resolve);
    })));
    
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

main();
