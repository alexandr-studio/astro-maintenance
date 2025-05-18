#!/usr/bin/env node

/**
 * Simple test script for the astro-maintenance integration.
 * This script creates a minimal Astro project, installs the integration,
 * starts the server, and performs basic tests.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const testDir = path.join(rootDir, 'test-project');

// Function to make an HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', reject);
  });
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  log('Test interrupted, cleaning up...', 'yellow');
  process.exit(1);
});

async function runTest() {
  try {
    // Clean up existing test directory if it exists
    log('Cleaning up test directory...', 'blue');
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      // Directory might not exist, which is fine
    }
    
    // Create parent directory
    const parentDir = path.dirname(testDir);
    await fs.mkdir(parentDir, { recursive: true });
    
    // Get project name from directory
    const projectName = path.basename(testDir);
    
    // Initialize a minimal Astro project using the official CLI
    log('Creating minimal Astro project...', 'blue');
    await execAsync(`pnpm create astro@latest ${projectName} --template minimal --install --typescript strict --git false --yes`, { 
      cwd: parentDir 
    });
    
    // Install required dependencies
    log('Installing dependencies...', 'blue');
    await execAsync('pnpm add @astrojs/node@latest', { cwd: testDir });
    
    // Link the integration directly
    log('Linking integration...', 'blue');
    
    try {
      // Create integration directory in node_modules
      await fs.mkdir(path.join(testDir, 'node_modules', 'astro-maintenance'), { recursive: true });
      
      // Copy all necessary files
      const files = ['index.ts', 'middleware.ts', 'renderPage.ts', 'cookieHandler.ts', 'env.d.ts', 'templates', 'assets'];
      for (const file of files) {
        const srcPath = path.join(rootDir, file);
        const destPath = path.join(testDir, 'node_modules', 'astro-maintenance', file);
        
        try {
          // Check if it's a directory
          const stats = await fs.stat(srcPath);
          if (stats.isDirectory()) {
            // Ensure destination directory exists
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            // Copy entire directory recursively
            await execAsync(`cp -r "${srcPath}" "${path.dirname(destPath)}"`, { shell: true });
            log(`Copied directory ${file}`, 'blue');
          } else {
            // Ensure destination directory exists
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            // Copy file
            await fs.copyFile(srcPath, destPath);
            log(`Copied file ${file}`, 'blue');
          }
        } catch (err) {
          log(`Warning: Could not copy ${file}: ${err.message}`, 'yellow');
        }
      }
      
      // Create a package.json in the linked module
      await fs.writeFile(
        path.join(testDir, 'node_modules', 'astro-maintenance', 'package.json'),
        JSON.stringify({
          name: 'astro-maintenance',
          version: '1.0.1',
          type: 'module',
          exports: {
            '.': './index.ts'
          }
        }, null, 2)
      );
      
      log('Integration linked successfully', 'green');
    } catch (err) {
      log(`Error linking integration: ${err.message}`, 'red');
      throw err;
    }
    
    // Create astro.config.mjs
    log('Configuring astro.config.mjs...', 'blue');
    const configContent = `
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import maintenance from 'astro-maintenance';

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  integrations: [
    maintenance({
      enabled: true,
      template: 'simple',
      override: 'bypass',
    })
  ],
  output: 'server'
});
    `;
    await fs.writeFile(path.join(testDir, 'astro.config.mjs'), configContent);
    
    // Build the test project
    log('Building test project...', 'blue');
    await execAsync('pnpm run build', { cwd: testDir });
    
    // Start the server
    log('Starting server...', 'blue');
    let server;
    try {
      server = exec('node ./dist/server/entry.mjs', { cwd: testDir });
      
      // Improved logging with prefix
      server.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => line && log(`Server: ${line}`, 'yellow'));
      });
      
      server.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => line && log(`Server error: ${line}`, 'red'));
      });
      
      // Wait for server to start and check it's responding
      log('Waiting for server to start...', 'blue');
      let ready = false;
      const maxAttempts = 10;
      let attempts = 0;
      
      while (!ready && attempts < maxAttempts) {
        try {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to connect to the server
          const response = await makeRequest('http://localhost:4321/health');
          if (response.status < 500) { // Accept any non-server error response
            ready = true;
            log('Server is ready!', 'green');
          }
        } catch (e) {
          // Server probably not ready yet, will retry
          log(`Waiting for server (attempt ${attempts}/${maxAttempts})...`, 'blue');
        }
      }
      
      if (!ready) {
        log('Server did not start properly, proceeding with tests anyway...', 'yellow');
      }
    } catch (err) {
      log(`Error starting server: ${err.message}`, 'red');
      throw err;
    }
    
    // Test 1: Check maintenance page
    log('Testing maintenance page...', 'blue');
    let maintenanceResponse;
    try {
      maintenanceResponse = await makeRequest('http://localhost:4321/');
      const isMaintenance = maintenanceResponse.body.includes('Site Under Maintenance');
    
      if (isMaintenance) {
        log('✅ Test 1 passed: Maintenance page is displayed', 'green');
      } else {
        log('❌ Test 1 failed: Maintenance page not found', 'red');
        log(`Response status: ${maintenanceResponse.status}`, 'yellow');
        log(`Response body (first 500 chars): ${maintenanceResponse.body.slice(0, 500)}...`, 'yellow');
      }
    } catch (err) {
      log(`❌ Test 1 failed with error: ${err.message}`, 'red');
      isMaintenance = false;
    }
  
    // Test 2: Check bypass parameter
    log('Testing bypass parameter...', 'blue');
    let isMainPage = false;
    try {
      const bypassResponse = await makeRequest('http://localhost:4321/?bypass=true');
      isMainPage = !bypassResponse.body.includes('Site Under Maintenance');
    
      if (isMainPage) {
        log('✅ Test 2 passed: Bypass parameter works', 'green');
      
        // Also check if we got a cookie
        const cookie = bypassResponse.headers['set-cookie'];
        if (cookie && cookie.includes('astro_maintenance_bypass')) {
          log('✅ Test 2.1 passed: Bypass cookie was set correctly', 'green');
        } else {
          log('❌ Test 2.1 failed: Bypass cookie was not set', 'red');
          log(`Headers: ${JSON.stringify(bypassResponse.headers)}`, 'yellow');
        }
      
        // Verify we can see Astro content
        if (bypassResponse.body.includes('Astro')) {
          log('✅ Test 2.2 passed: Actual Astro content is displayed', 'green');
        } else {
          log('❌ Test 2.2 failed: Could not find Astro content', 'red');
          log(`Response body (first 500 chars): ${bypassResponse.body.slice(0, 500)}...`, 'yellow');
        }
      } else {
        log('❌ Test 2 failed: Bypass parameter not working', 'red');
        log(`Response status: ${bypassResponse.status}`, 'yellow');
        log(`Response body (first 500 chars): ${bypassResponse.body.slice(0, 500)}...`, 'yellow');
      }
    } catch (err) {
      log(`❌ Test 2 failed with error: ${err.message}`, 'red');
    }
    
    // Clean up
    log('Cleaning up...', 'blue');
    if (server) {
      log('Stopping server...', 'blue');
      
      // First try graceful termination
      server.kill('SIGTERM');
      
      // Give it a moment to shut down gracefully
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force kill if still running
      try {
        server.kill('SIGKILL');
      } catch (e) {
        // It's probably already dead
      }
    }
    
    // Report test summary
    const testsPassed = isMaintenance && isMainPage;
    if (testsPassed) {
      log('✅ All tests passed successfully!', 'green');
    } else {
      log('❌ Some tests failed!', 'red');
      process.exitCode = 1;
    }
    
    log('Tests completed!', 'green');
    
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

runTest();