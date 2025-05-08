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

export default function maintenance(
  options: MaintenanceOptions,
): AstroIntegration {
  return {
    name: "astro-maintenance",
    hooks: {
      "astro:server:setup": ({ server }) => {
        if (!options.enabled) return;

        server.middlewares.use(
          (req: IncomingMessage, res: ServerResponse, next) => {
            const allowedPaths = ["/assets", "/favicon", "/logo"];
            let isCustomPath = false;

            if (
              options.template &&
              typeof options.template === "string" &&
              options.template.startsWith("/") &&
              !options.template.includes(".")
            ) {
              isCustomPath = true;
              allowedPaths.push(options.template);
            }

            if (allowedPaths.some((path) => req.url?.startsWith(path))) {
              return next();
            }

            if (options.override && req.url?.includes(`?${options.override}`)) {
              return next();
            }

            if (options.countdown) {
              const countdownDate = new Date(options.countdown);
              const now = new Date();
              if (countdownDate <= now) {
                return next();
              }
            }

            if (isCustomPath) {
              res.writeHead(302, { Location: options.template });
              res.end();
              return;
            }

            const html = renderPage(options);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
          },
        );
      },
    },
  };
}
