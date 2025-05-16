import { parse as parseCookies } from "cookie";
import type { MiddlewareHandler } from "astro";
import renderPage from "./renderPage";
import { setCookieAndRedirect, clearCookieAndRedirect } from "./cookieHandler";
// @ts-ignore - Virtual module import that TypeScript doesn't recognize
import { options as integrationOptions } from "virtual:astro-maintenance/options";

// Default fallback options
const fallbackOptions = {
  enabled: true,
  template: undefined,
  logo: undefined,
  title: "Site under maintenance",
  description: "We’ll be back shortly!",
  emailAddress: undefined,
  emailText: undefined,
  copyright: undefined,
  countdown: undefined,
  allowedPaths: undefined,
  override: "bypass",
  cookieName: "astro_maintenance_override",
  cookieMaxAge: 7 * 24 * 60 * 60,
};

const mergedOptions = {
  ...fallbackOptions,
  ...integrationOptions,
};

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request } = context;

  const isEnabled =
    process.env.MAINTENANCE_ENABLED !== undefined
      ? process.env.MAINTENANCE_ENABLED === "true"
      : mergedOptions.enabled;

  if (!isEnabled) {
    return next();
  }

  const url = new URL(context.request.url);

  // Use a Set to avoid duplicate paths
  const allowedPaths = new Set(["/assets", "/favicon", "/logo"]);

  // Add user-defined allowedPaths
  if (Array.isArray(mergedOptions.allowedPaths)) {
    for (const path of mergedOptions.allowedPaths) {
      if (typeof path === "string") {
        allowedPaths.add(path);
      }
    }
  }

  // Handle astro template (e.g. /maintenance)
  let isCustomPath = false;
  if (
    mergedOptions.template &&
    typeof mergedOptions.template === "string" &&
    mergedOptions.template.startsWith("/") &&
    !mergedOptions.template.includes(".")
  ) {
    isCustomPath = true;
    allowedPaths.add(mergedOptions.template);
    allowedPaths.add(`${mergedOptions.template}/`);
  }

  // Check if request is allowed
  if ([...allowedPaths].some((path) => url.pathname.startsWith(path))) {
    return next();
  }

  // Handle cookies
  // Check if Cookie allow the request
  const cookies = request.headers.get("cookie") || "";
  const parsedCookies = parseCookies(cookies);
  const hasOverrideCookie = parsedCookies[mergedOptions.cookieName] === "true";

  // check if override param is set
  const hasOverrideParam =
    mergedOptions.override && url.searchParams.has(mergedOptions.override);

  // check if reset param is set
  const hasResetParam = mergedOptions.override && url.searchParams.has("reset");

  if (hasResetParam) {
    return clearCookieAndRedirect(context, url.pathname.split("?")[0] || "/", [
      mergedOptions.cookieName,
    ]);
  }

  if (hasOverrideParam) {
    return setCookieAndRedirect(context, "/", {
      [mergedOptions.cookieName]: "true"
    }, {
      maxAge: mergedOptions.cookieMaxAge,
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
  }

  if (hasOverrideCookie) {
    return next();
  }

  if (mergedOptions.countdown) {
    const countdownDate = new Date(mergedOptions.countdown);
    if (countdownDate <= new Date()) {
      return next();
    }
  }

  if (isCustomPath) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: mergedOptions.template,
      },
    });
  }

  const html = renderPage(mergedOptions);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  });
};
