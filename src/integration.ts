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
          const allowedPaths = ["/assets", "/favicon", "/logo"];
          let isCustomPath = false;
          // Check if template is an internal route path (starts with '/')
          // This allows redirecting to another page within the Astro site
          // Ensure it's not a file path
          if (options.template && typeof options.template === 'string' && 
            options.template.startsWith('/') && 
            !options.template.includes('.')) { 
              isCustomPath = true;
              allowedPaths.push(options.template);
          }

          // Allow static assets and favicon to pass through
          if (allowedPaths.some(path => req.url?.startsWith(path))) {
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
          
          // If is Custom Path, redirect to the custom path
          if (isCustomPath) {
            res.writeHead(302, { 'Location': options.template });
            res.end();
            return;
          }

          const html = renderPage(options);
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
        });
      },
    },
  };
}
