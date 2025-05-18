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
  } catch (err) {
    console.error(`Failed to save debug content: ${err.message}`);
  }
}

const projectName = "basic-project";
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

test.beforeAll(async () => {
  await setupBasicProject();
  serverProcess = await startBuild(projectName, projectPort.toString());
});

test.afterAll(async () => {
  // Terminate the server
  if (serverProcess) {
    await stopProcess(serverProcess);
  }
  console.log(chalk.bgYellowBright.black("Basic project test complete!"));
});

// Basic tests that should be quick and reliable
test("Maintenance page is shown", async ({ page }) => {
  await page.goto(`http://localhost:${projectPort.toString()}/`);

  // Wait for the page to be fully loaded
  await page.waitForLoadState("networkidle");

  // Save page content for debugging
  const pageContent = await page.content();
  await savePageContent("maintenance-page", pageContent);

  // Take a screenshot for debugging
  await page.screenshot({ path: "test-results/maintenance-page.png" });

  // Check if maintenance page is displayed
  await expect(page.getByText("Site Under Maintenance")).toBeVisible({
    timeout: 10000,
  });
  console.log(chalk.bgGreenBright.white("Maintenance page test passed!"));
});

test("Bypass parameter works", async ({ page }) => {
  await page.goto(`http://localhost:${projectPort.toString()}/?bypass`);

  // Wait for the page to be fully loaded
  await page.waitForLoadState("networkidle");

  // Save page content for debugging
  const pageContent = await page.content();
  await savePageContent("bypass-page", pageContent);
  // console.log("Page content snippet:", pageContent.substring(0, 300) + "...");

  // Take a screenshot for debugging
  await page.screenshot({ path: "test-results/bypass-test.png" });

  // Check that we don't see the maintenance page
  const heading = await page.locator("h1");
  await expect(heading).toHaveText("Astro");

  console.log(chalk.bgGreenBright.white("Bypass parameter test completed!"));
});
