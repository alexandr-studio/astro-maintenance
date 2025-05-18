#!/usr/bin/env node

/**
 * Helper script to run the basic test with additional debugging and control
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configure test options
const TEST_FILE = 'tests/basic.spec.ts';
const TIMEOUT = 120000; // 2 minutes
const HEADED = false; // Set to true to see browser during tests

async function main() {
  try {
    console.log(chalk.blue('='.repeat(80)));
    console.log(chalk.blue.bold('Running Basic Test with Enhanced Debugging'));
    console.log(chalk.blue('='.repeat(80)));

    // Step 1: Clean up test artifacts if they exist
    console.log(chalk.yellow('\n[Step 1] Cleaning up test artifacts...'));
    try {
      await fs.rm(path.join(rootDir, 'tests/basic-project'), { recursive: true, force: true });
      console.log(chalk.green('✓ Test directory cleaned'));
    } catch (err) {
      console.log(chalk.gray('No test directory to clean'));
    }

    try {
      await fs.rm(path.join(rootDir, 'test-results'), { recursive: true, force: true });
      console.log(chalk.green('✓ Test results cleaned'));
    } catch (err) {
      console.log(chalk.gray('No test results to clean'));
    }

    // Step 2: Check if dependencies are installed
    console.log(chalk.yellow('\n[Step 2] Checking dependencies...'));
    try {
      await execAsync('which playwright', { cwd: rootDir });
      console.log(chalk.green('✓ Playwright is installed'));
    } catch (err) {
      console.log(chalk.red('✗ Playwright not found, installing browsers...'));
      await execAsync('pnpm exec playwright install chromium', { cwd: rootDir });
    }

    // Step 3: Run the test with additional parameters for debugging
    console.log(chalk.yellow('\n[Step 3] Running basic test with enhanced debugging...'));
    
    // Create a directory for saving page content
    const debugDir = path.join(rootDir, 'test-debug');
    try {
      await fs.mkdir(debugDir, { recursive: true });
      console.log(chalk.green(`✓ Created debug directory at ${debugDir}`));
    } catch (err) {
      console.log(chalk.yellow(`Debug directory already exists`));
    }
    
    // Set environment variable to enable page content saving
    process.env.SAVE_PAGE_CONTENT = 'true';
    process.env.DEBUG_DIR = debugDir;
    
    const testCommand = HEADED 
      ? `pnpm exec playwright test ${TEST_FILE} --headed --timeout=${TIMEOUT} --workers=1 --retries=0`
      : `pnpm exec playwright test ${TEST_FILE} --timeout=${TIMEOUT} --workers=1 --retries=0`;
    
    console.log(chalk.blue(`Executing: ${testCommand}`));
    
    // Use spawn to get real-time output
    const testProcess = spawn(testCommand, {
      cwd: rootDir,
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        SAVE_PAGE_CONTENT: 'true',
        DEBUG_DIR: debugDir
      }
    });

    // Wait for test to complete
    const exitCode = await new Promise((resolve) => {
      testProcess.on('close', (code) => {
        resolve(code);
      });
    });

    // Step 4: Show results summary
    console.log(chalk.yellow('\n[Step 4] Test results summary'));
    console.log(chalk.blue(`Debug content saved to: ${debugDir}`));
    
    if (exitCode === 0) {
      console.log(chalk.green.bold('✓ All tests passed successfully!'));
    } else {
      console.log(chalk.red.bold(`✗ Tests failed with exit code: ${exitCode}`));
      console.log(chalk.yellow('To view detailed report, run:'));
      console.log(chalk.blue('  pnpm exec playwright show-report'));
    }
    
    // Step 5: Cleanup (just in case anything is still running)
    console.log(chalk.yellow('\n[Step 5] Final cleanup...'));
    try {
      // On macOS/Linux, try to kill any lingering Node server processes
      if (process.platform !== 'win32') {
        await execAsync("ps aux | grep 'node ./dist/server/entry.mjs' | grep -v grep | awk '{print $2}' | xargs kill -9", 
          { shell: true, cwd: rootDir }).catch(() => {});
      }
      console.log(chalk.green('✓ Cleanup complete'));
    } catch (err) {
      // Ignore errors here
    }

    // Exit with the same code as the test
    process.exit(exitCode);
    
  } catch (error) {
    console.error(chalk.red('\n[ERROR] Test run failed:'));
    console.error(error);
    process.exit(1);
  }
}

main();