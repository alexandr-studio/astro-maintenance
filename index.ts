import type { AstroIntegration } from "astro";
import type { IncomingMessage, ServerResponse } from "node:http";
import renderPage from "./renderPage";
import { parse as parseCookies } from "cookie";

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
  cookieName?: string;
  cookieMaxAge?: number;
}

export default function maintenance(
  options: MaintenanceOptions,
): AstroIntegration {
  return {
    name: "astro-maintenance",
    hooks: {
      "astro:server:setup": ({ server }) => {
        // If maintenance mode is disabled and we want to clear cookies
        if (!options.enabled) {
          server.middlewares.use((_req: IncomingMessage, res: ServerResponse, next) => {
            const cookieName = options.cookieName || "astro_maintenance_override";
            // Clear the maintenance override cookie when integration is disabled
            res.setHeader(
              "Set-Cookie",
              `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
            );
            next();
          });
          return;
        }

        server.middlewares.use(
          (req: IncomingMessage, res: ServerResponse, next) => {
            const allowedPaths = ["/assets", "/favicon", "/logo"];
            let isCustomPath = false;
            const cookieName = options.cookieName || "astro_maintenance_override";
            const cookieMaxAge = options.cookieMaxAge || 7 * 24 * 60 * 60; // Default: 7 days

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

            // Parse cookies from request
            const cookies = req.headers.cookie ? parseCookies(req.headers.cookie) : {};
            const hasOverrideCookie = cookies[cookieName] === "true";

            // Check if override parameter is in URL
            const hasOverrideParam = options.override && req.url?.includes(`?${options.override}`);
            
            // Check if reset parameter is in URL
            const hasResetParam = options.override && req.url?.includes(`?${options.override}=reset`);
            
            // Handle reset parameter to clear cookie
            if (hasResetParam) {
              res.setHeader(
                "Set-Cookie",
                `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
              );
              // Redirect to the same URL without parameters
              const redirectUrl = req.url?.split("?")[0] || "/";
              res.writeHead(302, { Location: redirectUrl });
              res.end();
              return;
            }

            // Set cookie when override parameter is used
            if (hasOverrideParam) {
              res.setHeader(
                "Set-Cookie",
                `${cookieName}=true; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${cookieMaxAge}`
              );
              return next();
            }

            // Allow access if user has the override cookie
            if (hasOverrideCookie) {
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
