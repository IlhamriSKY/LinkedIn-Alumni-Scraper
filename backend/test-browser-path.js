import BrowserService from './services/BrowserService.js';
import path from 'path';

console.log('Testing BrowserService path...');

const browserService = new BrowserService();
console.log('Browser data directory:', browserService.userDataDir);

// Test clearBrowserDataDirectory method
console.log('Testing clearBrowserDataDirectory method...');
await browserService.clearBrowserDataDirectory();

console.log('Test completed successfully! ✅');
