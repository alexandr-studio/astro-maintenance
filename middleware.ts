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
	socials: undefined,
};

/**
 * Get merged options from integration and environment variables
 * Environment variables have precedence over integration options
 */
function getOptions() {
	// First merge defaults with integration options
	const baseOptions = {
		...fallbackOptions,
		...integrationOptions,
	};

	// Then override with environment variables if available
	return {
		...baseOptions,
		// Boolean options
		enabled:
			process.env.MAINTENANCE_ENABLED !== undefined
				? process.env.MAINTENANCE_ENABLED === "true"
				: baseOptions.enabled,

		// String options
		template: process.env.MAINTENANCE_TEMPLATE || baseOptions.template,
		title: process.env.MAINTENANCE_TITLE || baseOptions.title,
		description: process.env.MAINTENANCE_DESCRIPTION || baseOptions.description,
		emailAddress:
			process.env.MAINTENANCE_EMAIL_ADDRESS || baseOptions.emailAddress,
		emailText: process.env.MAINTENANCE_EMAIL_TEXT || baseOptions.emailText,
		copyright: process.env.MAINTENANCE_COPYRIGHT || baseOptions.copyright,
		override: process.env.MAINTENANCE_OVERRIDE || baseOptions.override,
		logo: process.env.MAINTENANCE_LOGO || baseOptions.logo,
		countdown: process.env.MAINTENANCE_COUNTDOWN || baseOptions.countdown,

		// Number options - convert from string to number when from env var
		cookieMaxAge:
			process.env.MAINTENANCE_COOKIE_MAX_AGE !== undefined
				? Number.parseInt(process.env.MAINTENANCE_COOKIE_MAX_AGE, 10)
				: baseOptions.cookieMaxAge,

		// Fixed options - don't override these with env vars for now
		cookieName: baseOptions.cookieName,
		allowedPaths: baseOptions.allowedPaths,
		socials: baseOptions.socials,
	};
}

// Get the merged options
const options = getOptions();

export const onRequest: MiddlewareHandler = async (context, next) => {
	const { request } = context;

	const isEnabled = options.enabled;

	if (!isEnabled) {
		return next();
	}

	const url = new URL(context.request.url);

	// Use a Set to avoid duplicate paths
	const allowedPaths = new Set(["/assets", "/favicon", "/logo"]);

	// Add user-defined allowedPaths
	if (Array.isArray(options.allowedPaths)) {
		for (const path of options.allowedPaths) {
			if (typeof path === "string") {
				allowedPaths.add(path);
			}
		}
	}

	// Helper to detect if a string is template content vs redirect path
	function isTemplateContent(template: string): boolean {
		return template.includes('<') || template.includes('\n') || template.length > 100;
	}

	// Handle astro redirect path (e.g. /we_work_on)
	let isCustomPath = false;
	if (
		options.template &&
		typeof options.template === "string" &&
		options.template.startsWith("/") &&
		!options.template.includes(".") &&
		!isTemplateContent(options.template)
	) {
		isCustomPath = true;
		allowedPaths.add(options.template);
		allowedPaths.add(`${options.template}/`);
	}

	// Check if request is allowed
	if ([...allowedPaths].some((path) => url.pathname.startsWith(path))) {
		return next();
	}

	// Handle cookies & params for override functionality
	const cookies = request.headers.get("cookie") || "";
	const parsedCookies = parseCookies(cookies);
	const hasOverrideCookie = parsedCookies[options.cookieName] === "true";
	
	// Check for override parameter
	const hasOverrideParam = options.override && url.searchParams.has(options.override);
	
	// Look for a secure verification token that we generate when setting the cookie
	const verificationToken = url.searchParams.get("verification");
	
	// Function to create a simple hash from the override key and request info
	// This adds security while still allowing URL-based verification to work with CDNs
	const createVerificationHash = (key: string) => {
		// Using a combination of the override key and hostname to create a unique token
		// This isn't cryptographically secure, but makes it much harder to guess
		// than a simple static "active-bypass" parameter
		const str = `${key}-${url.hostname}-maintenance-verification`;
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash).toString(36);
	};

	// Check for reset request - just look for the 'reset' parameter
	const hasResetParam = url.searchParams.has("reset");

	// Handle reset request with our special redirect pattern to avoid CDN redirect loops
	if (hasResetParam) {
		// Create a new URL with a special reset-completed parameter
		// This signals that we've handled the reset request
		const redirectURL = new URL(url);
		redirectURL.searchParams.delete("reset");
		redirectURL.searchParams.set("reset-completed", "true");
		
		// Clear the cookie but add the special parameter
		return clearCookieAndRedirect(context, redirectURL.pathname + redirectURL.search, [
			options.cookieName,
		]);
	}
	
	// If we see the reset-completed parameter, show the maintenance page
	// but remove the parameter to clean up the URL
	if (url.searchParams.has("reset-completed")) {
		// Create a clean URL for the next request
		const cleanURL = new URL(url);
		cleanURL.searchParams.delete("reset-completed");
		
		// First generate the maintenance page
		const html = renderPage(options);
		
		// Then redirect to the clean URL for future requests
		return new Response(html, {
			status: 200,
			headers: {
				"Content-Type": "text/html",
				"Refresh": `5; url=${cleanURL.pathname}${cleanURL.search ? cleanURL.search : ""}`
			}
		});
	}

	// If override param is present, set cookie and redirect with verification token
	if (hasOverrideParam) {
		// Create a verification hash based on the override key
		const verificationHash = createVerificationHash(options.override);
		
		// Create a new URL without the override parameter but with verification token
		const redirectURL = new URL(url);
		redirectURL.searchParams.delete(options.override);
		redirectURL.searchParams.set("verification", verificationHash);
		
		return setCookieAndRedirect(
			context,
			redirectURL.pathname + redirectURL.search,
			{
				[options.cookieName]: "true",
			},
			{
				maxAge: options.cookieMaxAge,
				httpOnly: true, // More secure, client-side JS should not need this
				secure: url.protocol === "https:", 
				sameSite: "Lax", // Keep Lax for CDN compatibility
			},
		);
	}

	// Verify either the cookie or the verification token is valid
	// The verification token is a hash based on the override key and hostname
	// This makes it much harder to bypass without knowing the override key
	const isValidVerification = verificationToken === createVerificationHash(options.override);
	
	// Allow bypass if we have the cookie OR a valid verification token
	if (hasOverrideCookie || isValidVerification) {
		return next();
	}

	if (options.countdown) {
		const countdownDate = new Date(options.countdown);
		if (countdownDate <= new Date()) {
			return next();
		}
	}

	if (isCustomPath) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: options.template,
			},
		});
	}

	const html = renderPage(options);
	return new Response(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html",
		},
	});
};
