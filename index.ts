import type { AstroIntegration } from "astro";

export interface Socials {
	facebook?: string;
	x?: string;
	instagram?: string;
	youtube?: string;
	linkedin?: string;
	mastodon?: string;
	github?: string;
	pinterest?: string;
	tiktok?: string;
	discord?: string;
	slack?: string;
	twitch?: string;
	reddit?: string;
}

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
	socials?: Socials;
}

export default function maintenance(
	options?: MaintenanceOptions,
): AstroIntegration {
	const resolvedOptions: MaintenanceOptions = {
		enabled: true,
		template: "simple",
		title: "Site under maintenance",
		description: "We’ll be back shortly!",
		override: "bypass",
		...options, // user-provided options override defaults
	};

	return {
		name: "astro-maintenance",
		hooks: {
			"astro:config:setup": ({ addMiddleware, updateConfig }) => {
				// Skip if static output
				if (
					resolvedOptions.enabled !== false &&
					process.env.OUTPUT === "static"
				) {
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
										return `export const options = ${JSON.stringify(resolvedOptions, null, 2)};`;
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
