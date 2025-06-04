import type { MaintenanceOptions } from "./index";
import { HandlebarsCompatibleEngine, renderTemplate, type TemplateContext } from "./templateEngine";

// Use ?raw to import file content as string
import simpleTemplateSource from "./templates/simple.hbs?raw";
import countdownTemplateSource from "./templates/countdown.hbs?raw";
import constructionTemplateSource from "./templates/construction.hbs?raw";

// Built-in templates imported as raw strings
const builtInTemplates: Record<string, string> = {
	simple: simpleTemplateSource,
	countdown: countdownTemplateSource,
	construction: constructionTemplateSource,
};

// Cache for compiled template functions (for performance optimization)
const compiledTemplateCache: Record<string, (context: TemplateContext) => string> = {};

/**
 * Get or compile a built-in template
 */
function getCompiledTemplate(templateName: string): (context: TemplateContext) => string {
	// Check cache first
	if (compiledTemplateCache[templateName]) {
		return compiledTemplateCache[templateName];
	}

	// Get template source
	const source = builtInTemplates[templateName];
	if (!source) {
		console.error(`Built-in template "${templateName}" not found, falling back to simple template`);
		// Recursive call to get simple template (which should always exist)
		return getCompiledTemplate("simple");
	}

	// Compile and cache
	const compiled = HandlebarsCompatibleEngine.compile(source);
	compiledTemplateCache[templateName] = compiled;
	
	return compiled;
}

/**
 * Helper to detect if a string is template content vs template name
 */
function isTemplateContent(template: string): boolean {
	// Template content should contain HTML tags or be multiline
	return template.includes('<') || template.includes('\n') || template.length > 100;
}

/**
 * Compile custom template content
 */
function compileCustomTemplate(templateContent: string): (context: TemplateContext) => string {
	try {
		return HandlebarsCompatibleEngine.compile(templateContent);
	} catch (error) {
		console.error(`Error compiling custom template: ${error}`);
		// Fallback to simple template
		return getCompiledTemplate("simple");
	}
}

/**
 * Main function to render a maintenance page
 * Works consistently across all deployment environments including Cloudflare Workers
 */
export default function renderPage(options: MaintenanceOptions): string {
	const {
		template = "simple",
		title = "We're sorry! The Site is under maintenance right now.",
		description = "Our website is currently down for scheduled maintenance. We'll return shortly. We appreciate your patience.",
		logo,
		emailAddress,
		emailText = "Contact us for further information.",
		copyright = "Copyright © 2025",
		countdown,
		socials,
	} = options;

	// Prepare template context data
	const templateContext: TemplateContext = {
		title,
		description,
		logo,
		copyright,
		emailAddress,
		emailText,
		countdown,
		socials,
	};

	try {
		// Check if template is custom content (imported using ?raw)
		if (typeof template === "string" && isTemplateContent(template)) {
			const customTemplate = compileCustomTemplate(template);
			return customTemplate(templateContext);
		}

		// Handle built-in templates by name
		let templateName: string;
		
		if (template === "countdown" && countdown) {
			templateName = "countdown";
		} else if (template === "construction") {
			templateName = "construction";
		} else if (template === "simple" || !template) {
			templateName = "simple";
		} else if (typeof template === "string" && builtInTemplates[template]) {
			templateName = template;
		} else {
			// Unknown template name or deprecated file path usage
			console.warn(
				`[astro-maintenance] Unknown template "${template}" or file path templates are no longer supported. ` +
				`Please use "simple", "countdown", "construction", or import your template using "?raw". ` +
				`Falling back to simple template.`
			);
			templateName = "simple";
		}

		const compiledTemplate = getCompiledTemplate(templateName);
		return compiledTemplate(templateContext);

	} catch (error) {
		console.error(`[astro-maintenance] Error rendering template:`, error);
		
		// Emergency fallback - render a basic HTML page
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${templateContext.title || 'Site Maintenance'}</title>
	<style>
		body { font-family: sans-serif; text-align: center; padding: 50px; }
		h1 { color: #333; }
		p { color: #666; }
	</style>
</head>
<body>
	<h1>${templateContext.title || 'Site Under Maintenance'}</h1>
	<p>${templateContext.description || 'We\'ll be back shortly!'}</p>
</body>
</html>`;
	}
}
