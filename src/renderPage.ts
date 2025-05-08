import type { MaintenanceOptions } from "./index";
import Handlebars from "handlebars";
import path from "path";
import fs from "fs";

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

// Path to built-in templates
const templatesDir = path.join(__dirname, "templates");

// Helper function to load a template file
function loadBuiltInTemplate(templateName: string): string {
  try {
    return fs.readFileSync(
      path.join(templatesDir, `${templateName}.hbs`),
      "utf-8",
    );
  } catch (error) {
    console.error(`Error loading built-in template ${templateName}: ${error}`);
    // Provide a simple fallback template in case of errors
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>{{title}}</title>
          <style>body { font-family: sans-serif; text-align: center; padding: 40px; }</style>
        </head>
        <body>
          <h1>{{title}}</h1>
          <p>{{description}}</p>
        </body>
      </html>
    `;
  }
}

// Cache for compiled templates
const compiledTemplates: Record<string, Handlebars.TemplateDelegate> = {};

// Get or compile a built-in template
function getCompiledTemplate(
  templateName: string,
): Handlebars.TemplateDelegate {
  if (!compiledTemplates[templateName]) {
    const templateSource = loadBuiltInTemplate(templateName);
    compiledTemplates[templateName] = Handlebars.compile(templateSource);
  }
  return compiledTemplates[templateName];
}

// Helper to try to load a custom template
function loadCustomTemplate(
  templatePath: string,
): Handlebars.TemplateDelegate | null {
  try {
    if (fs.existsSync(templatePath)) {
      const templateContent = fs.readFileSync(templatePath, "utf-8");
      return Handlebars.compile(templateContent);
    }
  } catch (error) {
    console.error(`Error loading custom template: ${error}`);
  }
  return null;
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
  };

  // Check if a custom template path is provided as absolute path
  if (typeof template === "string" && template.startsWith("/")) {
    const customTemplate = loadCustomTemplate(template);
    if (customTemplate) {
      return customTemplate(templateData);
    }
    // Fallback to simple template if custom template can't be loaded
    return getCompiledTemplate("simple")(templateData);
  }

  // Check if it's a relative path
  if (
    typeof template === "string" &&
    (template.startsWith("./") || template.startsWith("../"))
  ) {
    try {
      const rootDir = process.cwd();
      const fullPath = path.resolve(rootDir, template);
      const customTemplate = loadCustomTemplate(fullPath);
      if (customTemplate) {
        return customTemplate(templateData);
      }
    } catch (error) {
      console.error(`Error loading template from relative path: ${error}`);
    }
  }

  // Use built-in templates
  if (template === "countdown" && countdown) {
    return getCompiledTemplate("countdown")(templateData);
  } else if (template === "construction") {
    return getCompiledTemplate("construction")(templateData);
  } else {
    // Default to simple
    return getCompiledTemplate("simple")(templateData);
  }
}
