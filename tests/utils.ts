import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import chalk from "chalk";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getProjectPath(projectName: string) {
  const projectDir = join(__dirname, projectName);
  return projectDir;
}

/**
 * Cleans up the project directory.
 * @param projectFolderName
 */
export async function cleanup(projectFolderName: string) {
  try {
    const projectDir = getProjectPath(projectFolderName);
    await fs.access(projectDir);
    console.log(chalk.blue("Cleaning up existing project directory..."));
    await fs.rm(projectDir, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist, which is fine
  } finally {
    console.log(chalk.green("Project directory cleaned up."));
  }
}

/**
 *
 * @param projectFolderName
 * @returns
 */
export async function createProject(projectName: string): Promise<string> {
  let projectDir = "";

  try {
    console.log(
      chalk.blue(`Creating project directory for "${projectName}"...`),
    );
    // Get the parent directory (tests folder)
    const testsDir = __dirname;
    projectDir = join(testsDir, projectName);

    // Create project using Astro CLI
    console.log(chalk.blue(`Creating Astro project "${projectName}"...`));
    await execAsync(
      `pnpm create astro@latest ${projectName} --template minimal --install --typescript strict --git false --yes`,
      {
        cwd: testsDir,
      },
    );
    console.log(chalk.green(`Project "${projectName}" created.`));
    // Install the Node adapter
    console.log(chalk.blue(`Installing Node adapter...`));
    await execAsync("pnpm add @astrojs/node@latest", { cwd: projectDir });
    console.log(chalk.green(`Node adapter installed.`));
  } catch (error) {
    console.error(chalk.red("Error creating project directory:"));
    console.error(error);
  } finally {
    console.log(chalk.green("Project directory created."));
  }

  return projectDir;
}

export async function buildProject(projectName: string) {
  // Build the project
  const projectDir = getProjectPath(projectName);
  console.log(chalk.blue(`Building project "${projectName}"...`));
  await execAsync("pnpm run build", { cwd: projectDir });
  console.log(chalk.green(`"${projectName}" project setup complete!`));
}

export async function stopProcess(serverProcess: any) {
  try {
    if (!serverProcess) {
      console.log(chalk.yellow("No server process to stop"));
      return;
    }

    console.log(chalk.blue(`Stopping server (PID: ${serverProcess.pid})...`));

    if (process.platform === "win32") {
      // On Windows
      spawn("taskkill", ["/pid", serverProcess.pid, "/f", "/t"]);
    } else {
      // On Unix-like systems
      try {
        // First try graceful termination
        serverProcess.kill("SIGTERM");

        // Give it a moment to shut down gracefully
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // If still running, force kill
        if (!serverProcess.killed) {
          serverProcess.kill("SIGKILL");
        }
      } catch (e) {
        // Process might already be dead
        console.log(chalk.yellow("Process may have already terminated"));
      }
    }

    // Wait for process to fully terminate
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(chalk.green("Server stopped successfully"));
  } catch (error) {
    console.error(
      chalk.red(
        `Error stopping process with ID ${serverProcess?.pid || "unknown"}:`,
      ),
    );
    console.error(error);
  }
}

export async function startBuild(
  projectName: string,
  port: string = "4321",
): Promise<any> {
  const projectDir = getProjectPath(projectName);
  // Start the server (using spawn instead of exec for better process control)
  const serverProcess = spawn("node", ["./dist/server/entry.mjs"], {
    cwd: projectDir,
    detached: false, // This helps with cleanup
    stdio: ["ignore", "pipe", "pipe"], // Redirect stdout and stderr
    env: { ...process.env, PORT: port }, // Ensure consistent port
  });

  // Log server output for debugging
  serverProcess.stdout.on("data", (data) => {
    console.log(chalk.blue(`Server stdout: ${data}`));
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(chalk.red(`Server stderr: ${data}`));
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log(chalk.green("Server started"));

  // Return the server process so it can be stopped later
  return serverProcess;
}

export async function updateAstroConfig(projectName: string, settings: string) {
  const projectDir = getProjectPath(projectName);
  console.log(chalk.blue(`Update ${projectName} Astro config ...`));
  await fs.writeFile(
    join(projectDir, "astro.config.mjs"),
    `
      import { defineConfig } from 'astro/config';
      import node from '@astrojs/node';
      import maintenance from '../../index.ts';

      export default defineConfig(${settings});
    `,
  );
  console.log(chalk.green(`${projectName} Astro config updated!`));
}
