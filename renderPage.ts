import type { MaintenanceOptions } from "./index";
import Handlebars from "handlebars";

// Use ?raw to import file content as string
import simpleTemplateSource from "./templates/simple.hbs?raw";
import countdownTemplateSource from "./templates/countdown.hbs?raw";
import constructionTemplateSource from "./templates/construction.hbs?raw";

// Register helpers for Handlebars
Handlebars.registerHelper(
	"ifCond",
	function (
		this: any,
		v1: any,
		operator: string,
		v2: any,
		options: Handlebars.HelperOptions,
	) {
		switch (operator) {
			case "==":
				return v1 == v2 ? options.fn(this) : options.inverse(this);
			case "===":
				return v1 === v2 ? options.fn(this) : options.inverse(this);
			case "!=":
				return v1 != v2 ? options.fn(this) : options.inverse(this);
			case "!==":
				return v1 !== v2 ? options.fn(this) : options.inverse(this);
			case "<":
				return v1 < v2 ? options.fn(this) : options.inverse(this);
			case "<=":
				return v1 <= v2 ? options.fn(this) : options.inverse(this);
			case ">":
				return v1 > v2 ? options.fn(this) : options.inverse(this);
			case ">=":
				return v1 >= v2 ? options.fn(this) : options.inverse(this);
			default:
				return options.inverse(this);
		}
	},
);

// Built-in templates imported as raw strings
const builtInTemplates: Record<string, string> = {
	simple: simpleTemplateSource,
	countdown: countdownTemplateSource,
	construction: constructionTemplateSource,
};

// Cache for compiled templates
const compiledTemplates: Record<string, Handlebars.TemplateDelegate> = {};

// Get or compile a built-in template
function getCompiledTemplate(
	templateName: string,
): Handlebars.TemplateDelegate {
	if (!compiledTemplates[templateName]) {
		const source = builtInTemplates[templateName];
		if (!source) {
			console.error(`Built-in template "${templateName}" not found`);
			// Fallback to simple template
			compiledTemplates[templateName] = Handlebars.compile(builtInTemplates.simple);
		} else {
			compiledTemplates[templateName] = Handlebars.compile(source);
		}
	}
	return compiledTemplates[templateName];
}

// Helper to detect if a string is template content vs template name
function isTemplateContent(template: string): boolean {
	// Template content should contain HTML tags or be multiline
	return template.includes('<') || template.includes('\n') || template.length > 100;
}

// Compile custom template content
function compileCustomTemplate(templateContent: string): Handlebars.TemplateDelegate {
	try {
		return Handlebars.compile(templateContent);
	} catch (error) {
		console.error(`Error compiling custom template: ${error}`);
		// Fallback to simple template
		return getCompiledTemplate("simple");
	}
}

export default function renderPage(options: MaintenanceOptions) {
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

	// Data to pass to the template
	const templateData = {
		title,
		description,
		logo,
		copyright,
		emailAddress,
		emailText,
		countdown,
		socials,
	};

	// Check if template is imported content
	if (typeof template === "string" && isTemplateContent(template)) {
		const customTemplate = compileCustomTemplate(template);
		return customTemplate(templateData);
	}

	// Handle built-in templates by name
	if (template === "countdown" && countdown) {
		return getCompiledTemplate("countdown")(templateData);
	} else if (template === "construction") {
		return getCompiledTemplate("construction")(templateData);
	} else if (template === "simple" || !template) {
		return getCompiledTemplate("simple")(templateData);
	} else {
		// If it's a string but not template content, warn about deprecated usage
		console.warn(
			`[astro-maintenance] File path templates are no longer supported: "${template}". ` +
			`Please import your template using "?raw" and pass the content directly. ` +
			`Falling back to simple template.`
		);
		return getCompiledTemplate("simple")(templateData);
	}
}
