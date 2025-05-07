import type { AstroIntegration } from "astro";
import type { IncomingMessage, ServerResponse } from "node:http";
import renderPage from "./renderPage";

export interface MaintenanceOptions {
  enabled: boolean;
  template?: "simple" | "countdown" | "construction" | string;
  logo?: string;
  title?: string;
  description?: string;
  emailAddress?: string;
  emailText?: string;
  copyright?: string;
  countdown?: string;
  override?: string;
}

export function maintenance(
  options: MaintenanceOptions,
): AstroIntegration {
  return {
    name: "astro-maintenance",
    hooks: {
      "astro:server:setup": ({ server }) => {
        if (!options.enabled) return;

        server.middlewares.use((req: IncomingMessage, res: ServerResponse, next) => {
          // Allow static assets and favicon to pass through
          if (
            req.url?.startsWith("/assets") ||
            req.url?.startsWith("/favicon") ||
            req.url?.startsWith("/logo")
          ) {
            return next();
          }

          // Check if override parameter is present in URL
          if (options.override && req.url?.includes(`?${options.override}`)) {
            return next();
          }
          
          // Check if countdown date has been reached
          if (options.countdown) {
            const countdownDate = new Date(options.countdown);
            const now = new Date();
            
            // If countdown is in the past, don't show maintenance page
            if (countdownDate <= now) {
              return next();
            }
          }

          const html = renderPage(options);
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        });
      },
    },
  };
}
