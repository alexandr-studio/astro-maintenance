import type { AstroIntegration } from "astro";

export interface MaintenanceOptions {
  enabled?: boolean;
  template?: "simple" | "countdown" | "construction" | string;
  logo?: string;
  title?: string;
  description?: string;
  emailAddress?: string;
  emailText?: string;
  copyright?: string;
  countdown?: string;
  allowedPaths?: string[];
  override?: string;
  cookieName?: string;
  cookieMaxAge?: number;
}

export default function maintenance(
  options: MaintenanceOptions,
): AstroIntegration {
  return {
    name: "astro-maintenance",
    hooks: {
      "astro:config:setup": ({ addMiddleware, updateConfig }) => {
        // Skip if static output
        if (options.enabled !== false && process.env.OUTPUT === "static") {
          console.warn(
            "[astro-maintenance] Static output does not support middleware.",
          );
          return;
        }

        // Add middleware with pre/post order
        addMiddleware({
          entrypoint: new URL("./middleware.ts", import.meta.url), // Reference the middleware file
          order: "pre", // Run before other middlewares
        });

        // Inject virtual module using Vite plugin
        updateConfig({
          vite: {
            plugins: [
              {
                name: "astro-maintenance:virtual-options",
                resolveId(id) {
                  if (id === "virtual:astro-maintenance/options") {
                    return id;
                  }
                  return undefined; // Explicitly return undefined for other IDs
                },
                load(id) {
                  if (id === "virtual:astro-maintenance/options") {
                    return `export const options = ${JSON.stringify(options, null, 2)};`;
                  }
                  return undefined; // Explicitly return undefined for other IDs
                },
              },
            ],
          },
        });
      },
    },
  };
}
