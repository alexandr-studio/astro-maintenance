import { test, expect } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";

import {
  cleanup,
  createProject,
  startBuild,
  stopProcess,
  buildProject,
  updateAstroConfig,
} from "./utils";

// Helper for saving debug content
async function savePageContent(name: string, content: string) {
  if (process.env.SAVE_PAGE_CONTENT !== "true") return;

  const debugDir =
    process.env.DEBUG_DIR || path.join(process.cwd(), "test-debug");
  try {
    await fs.mkdir(debugDir, { recursive: true });
    await fs.writeFile(path.join(debugDir, `${name}.html`), content);
    console.log(`Saved ${name} content to ${debugDir}`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Failed to save debug content: ${errorMessage}`);
  }
}

const projectName = "environments-project";
let serverProcess: any;
const projectPort = 4328;

// Simple test project setup
async function setupBasicProject(): Promise<void> {
  try {
    // Clean up existing directory if needed
    await cleanup(projectName);
    await createProject(projectName);

    // Create astro.config.mjs
    await updateAstroConfig(
      projectName,
      `{
      adapter: node({ mode: 'standalone' }),
      server: {
          port: ${projectPort.toString()},
      },
      integrations: [
        maintenance({
          enabled: true,
          template: 'simple',
          override: 'bypass',
        })
      ],
      output: 'server'
    }`,
    );

    // Build the project
    await buildProject(projectName);
    console.log(
      chalk.bgYellowBright.black(
        "Basic project setup complete and ready for testing!",
      ),
    );
  } catch (error) {
    console.error(chalk.bgRed("Setup failed:", error));
    throw error;
  }
}

// We'll run multiple sets of tests with different environment variables
let currentTestGroup: string;

// Base test setup with explicit teardown between tests
test.describe.serial('Environment Variable Tests', () => {
  // Test 1: Custom Title and Description
  test.describe('Custom Title and Description', () => {
    test.beforeAll(async () => {
      currentTestGroup = 'title-description';
      await setupBasicProject();
      serverProcess = await startBuild(projectName, projectPort.toString(), {
        MAINTENANCE_TITLE: 'Custom Environment Title',
        MAINTENANCE_DESCRIPTION: 'This description comes from environment variables.',
      });
    });

    test.afterAll(async () => {
      if (serverProcess) {
        await stopProcess(serverProcess);
      }
      console.log(chalk.bgYellowBright.black('Title and description test complete!'));
    });

    test('Shows maintenance page with customized title and description from env vars', async ({ page }) => {
      await page.goto(`http://localhost:${projectPort.toString()}/`);
      await page.waitForLoadState('networkidle');
      
      // Save content for debugging
      const pageContent = await page.content();
      await savePageContent(`${currentTestGroup}-page`, pageContent);
      await page.screenshot({ path: `test-results/${currentTestGroup}.png` });
      
      // Test the custom title and description from env vars
      await expect(page.getByText('Custom Environment Title')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('This description comes from environment variables.')).toBeVisible();
      
      console.log(chalk.bgGreenBright.white('Title & description env var test passed!'));
    });
  });

  // Test 2: Custom Override Parameter
  test.describe('Custom Override Parameter', () => {
    test.beforeAll(async () => {
      currentTestGroup = 'override-param';
      await setupBasicProject();
      serverProcess = await startBuild(projectName, projectPort.toString(), {
        MAINTENANCE_OVERRIDE: 'custom-override',
      });
    });

    test.afterAll(async () => {
      if (serverProcess) {
        await stopProcess(serverProcess);
      }
      console.log(chalk.bgYellowBright.black('Override parameter test complete!'));
    });

    test('Custom override parameter works', async ({ page }) => {
      // First verify maintenance page is shown
      await page.goto(`http://localhost:${projectPort.toString()}/`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Site Under Maintenance')).toBeVisible({ timeout: 10000 });
      
      // Try the original override which shouldn't work
      await page.goto(`http://localhost:${projectPort.toString()}/?bypass`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Site Under Maintenance')).toBeVisible();
      
      // Try the new override from env var
      await page.goto(`http://localhost:${projectPort.toString()}/?custom-override`);
      await page.waitForLoadState('networkidle');
      
      await savePageContent(`${currentTestGroup}-page`, await page.content());
      await page.screenshot({ path: `test-results/${currentTestGroup}.png` });
      
      // Verify we're on the actual site, not maintenance page
      const heading = await page.locator('h1');
      await expect(heading).toHaveText('Astro');
      
      console.log(chalk.bgGreenBright.white('Custom override parameter test passed!'));
    });
  });

  // Test 3: Disabling Maintenance Mode
  test.describe('Disabling Maintenance Mode', () => {
    test.beforeAll(async () => {
      currentTestGroup = 'disabled-mode';
      await setupBasicProject();
      serverProcess = await startBuild(projectName, projectPort.toString(), {
        MAINTENANCE_ENABLED: 'false',
      });
    });

    test.afterAll(async () => {
      if (serverProcess) {
        await stopProcess(serverProcess);
      }
      console.log(chalk.bgYellowBright.black('Disabled mode test complete!'));
    });

    test('Maintenance mode is disabled via env var', async ({ page }) => {
      // Should show the actual site, not maintenance page
      await page.goto(`http://localhost:${projectPort.toString()}/`);
      await page.waitForLoadState('networkidle');
      
      await savePageContent(`${currentTestGroup}-page`, await page.content());
      await page.screenshot({ path: `test-results/${currentTestGroup}.png` });
      
      // Verify we're on the actual site, not maintenance page
      const heading = await page.locator('h1');
      await expect(heading).toHaveText('Astro');
      
      console.log(chalk.bgGreenBright.white('Disabled mode env var test passed!'));
    });
  });

  // Test 4: Contact Information
  test.describe('Contact Information', () => {
    test.beforeAll(async () => {
      currentTestGroup = 'contact-info';
      await setupBasicProject();
      serverProcess = await startBuild(projectName, projectPort.toString(), {
        MAINTENANCE_EMAIL_ADDRESS: 'env-test@example.com',
        MAINTENANCE_EMAIL_TEXT: 'Questions? Email us:',
        MAINTENANCE_COPYRIGHT: '© 2025 Environment Test',
      });
    });

    test.afterAll(async () => {
      if (serverProcess) {
        await stopProcess(serverProcess);
      }
      console.log(chalk.bgYellowBright.black('Contact info test complete!'));
    });

    test('Shows contact info from env vars', async ({ page }) => {
      await page.goto(`http://localhost:${projectPort.toString()}/`);
      await page.waitForLoadState('networkidle');
      
      await savePageContent(`${currentTestGroup}-page`, await page.content());
      await page.screenshot({ path: `test-results/${currentTestGroup}.png` });
      
      // Test the contact info from env vars
      await expect(page.getByText('Questions? Email us:')).toBeVisible();
      await expect(page.getByText('env-test@example.com')).toBeVisible();
      await expect(page.getByText('© 2025 Environment Test')).toBeVisible();
      
      console.log(chalk.bgGreenBright.white('Contact info env var test passed!'));
    });
  });

  // Test 5: Cookie Max Age
  test.describe('Cookie Max Age', () => {
    test.beforeAll(async () => {
      currentTestGroup = 'cookie-age';
      await setupBasicProject();
      serverProcess = await startBuild(projectName, projectPort.toString(), {
        MAINTENANCE_OVERRIDE: 'override-test',
        MAINTENANCE_COOKIE_MAX_AGE: '60', // 1 minute expiration instead of default 7 days
      });
    });

    test.afterAll(async () => {
      if (serverProcess) {
        await stopProcess(serverProcess);
      }
      console.log(chalk.bgYellowBright.black('Cookie max age test complete!'));
    });

    test('Sets cookie with custom max age from env var', async ({ page, context }) => {
      // First access with override to set the cookie
      await page.goto(`http://localhost:${projectPort.toString()}/?override-test`);
      await page.waitForLoadState('networkidle');
      
      // Verify we can access the site
      const heading = await page.locator('h1');
      await expect(heading).toHaveText('Astro');
      
      // Check that cookie was set
      const cookies = await context.cookies();
      const maintenanceCookie = cookies.find(c => c.name === 'astro_maintenance_override');
      
      expect(maintenanceCookie).toBeDefined();
      if (maintenanceCookie) {
        // Max age should be close to 60 seconds (allow some margin for test execution time)
        const maxAgeInSeconds = Math.round((maintenanceCookie.expires! - Date.now()/1000));
        expect(maxAgeInSeconds).toBeLessThanOrEqual(60);
        expect(maxAgeInSeconds).toBeGreaterThan(0); // Should be positive
      }
      
      console.log(chalk.bgGreenBright.white('Cookie max age env var test passed!'));
    });
  });
});
