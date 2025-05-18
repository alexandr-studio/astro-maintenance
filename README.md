# Astro-Maintenance

The main purpose of the integration is to provide a **simple way** to add **maintenance** and **coming soon** pages to Astro projects during development or scheduled maintenance periods. It should be easy to use and highly customizable.

> **⚠️ IMPORTANT:** This integration only works when Astro is in **server mode** (`output: 'server'`). It will not function with static site generation (`output: 'static'`) as it relies on server middleware to intercept requests.

📚 **Detailed Documentation:** For comprehensive guides and examples, visit [https://astro-maintenance.alexandr.studio/](https://astro-maintenance.alexandr.studio/)

### Features

- Predefined templates (simple, countdown, construction)
- Support for custom Handlebars templates
- Internal route redirection to custom pages in your Astro site
- Customizable appearance with logo, text, and contact information
- Time-based maintenance with automatic countdown (UTC timezone)
- Automatic disabling of maintenance mode when countdown ends
- Auto-reload functionality that checks every 10 seconds after countdown ends
- Override query parameter to bypass the maintenance page and inspect the site
- Cookie-based override persistence to bypass maintenance page on subsequent visits
- Cookie deletion when the integration is deactivated or when using override with 'reset' value

## Installation

```bash
# npm
npm install astro-maintenance

# yarn
yarn add astro-maintenance

# pnpm
pnpm add astro-maintenance
```

## Usage

Add the integration to your Astro configuration file:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import { maintenance } from "astro-maintenance";

export default defineConfig({
  integrations: [
    maintenance({
      enabled: true, // Set to false to disable maintenance mode
      template: "simple", // Options: 'simple', 'countdown', 'construction' or path to custom template
      title: "Site Under Maintenance",
      description:
        "We are performing scheduled maintenance. Please check back soon.",
      // Other optional parameters...
    }),
  ],
});
```

## Configuration Options

The integration accepts the following configuration options:

| Property       | Type                                                  | Description                                                                                  | Required |
| -------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| `enabled`      | `boolean`                                             | Enable or disable maintenance mode                                                           | Yes      |
| `template`     | `'simple' \| 'countdown' \| 'construction' \| string` | Built-in template, path to custom template, or route path                                    | -        |
| `title`        | `string`                                              | Page title (default: `'Site under maintenance'`)                                             | -        |
| `description`  | `string`                                              | Description text                                                                             | -        |
| `logo`         | `string`                                              | URL to your logo image. Must reside in the `assets` or `logo` subfolder of the public folder | -        |
| `emailAddress` | `string`                                              | Contact email address                                                                        | -        |
| `emailText`    | `string`                                              | Text to display before the email address (default: `'Contact us:'`)                          | -        |
| `copyright`    | `string`                                              | Copyright text                                                                               | -        |
| `countdown`    | `string`                                              | ISO date string for countdown timer in UTC (e.g., `'2025-12-31T23:59:59'`)                   | -        |
| `override`     | `string`                                              | Query parameter to bypass maintenance mode (e.g., `'preview'`)                               | -        |
| `cookieName`   | `string`                                              | Name of the cookie used for override persistence (default: `'astro_maintenance_override'`)   | -        |
| `cookieMaxAge` | `number`                                              | Max age of the override cookie in seconds (default: `604800` - 7 days)                       | -        |

## Compatibility

The `astro-maintenance` integration supports middleware across various deployment platforms:

## Supported Deployment Targets

| Platform        | Runtime             | Middleware Support | Notes                                                                 |
|-----------------|---------------------|--------------------|-----------------------------------------------------------------------|
| **Astro Dev**   | Node.js server      | ✅ Yes             | Default for `pnpm dev`; middleware is active                         |
| **Node (standalone)** | Node.js SSR       | ✅ Yes             | Middleware is bundled into `entry.mjs` and works when self-hosted    |
| **Node (middleware)** | Node.js SSR       | ✅ Yes             | Middleware is registered into existing Node app                      |
| **Vercel**      | Serverless Functions | ✅ Yes             | Middleware is bundled into per-route functions                       |
| **Vercel Edge** | Edge Runtime         | ⚠️ Not officially tested | Requires edge-compatible code and explicit setup                     |
| **Netlify**     | Serverless Functions | ✅ Yes             | Middleware runs in each function just like Vercel                    |
| **Cloudflare**  | Edge Runtime         | ✅ Yes             | Works when using `@astrojs/cloudflare` adapter                       |
| **Static Output** | N/A               | ❌ No              | Middleware is not supported in `output: "static"` mode               |

## Examples

### Basic Maintenance Page

```js
maintenance({
  enabled: true,
  template: "simple",
  title: "We'll be back soon!",
  description: "Our website is currently undergoing scheduled maintenance.",
  emailAddress: "support@example.com",
  emailText: "Need assistance? Contact us at:",
  copyright: " 2025 Your Company",
  override: "preview", // Access your site with ?preview in the URL
  cookieName: "my_override_cookie", // Optional: custom cookie name
  cookieMaxAge: 86400, // Optional: cookie expires after 24 hours (in seconds)
});
```

##### Preview - Basic Maintenance Page

### Countdown Timer

```js
maintenance({
  enabled: true,
  template: "countdown",
  title: "Coming Soon!",
  description: "Our new website is launching soon.",
  logo: "/logo.png",
  countdown: "2025-06-01T12:00:00Z", // Launch date in UTC (note the 'Z' for UTC timezone)
  emailAddress: "hello@example.com",
});
```

**Note**: The countdown displays time in UTC. When the countdown reaches zero, the maintenance page will:

1. Automatically disable itself - visitors will see your actual site
2. If there's a time mismatch, the page will attempt to reload every 10 seconds until maintenance mode is disabled

##### Preview - Countdown Timer

### Under Construction

```js
maintenance({
  enabled: true,
  template: "construction",
  title: "Under Construction",
  description: "We are building something awesome.",
  emailAddress: "hello@example.com",
});
```

##### Preview - Under Construction

### Cookie-Based Override Persistence

The integration now supports cookie-based persistence for the override parameter. When a user accesses the site with the override parameter (e.g., `?preview`), a secure HttpOnly cookie is set that allows them to bypass the maintenance page on subsequent visits without needing to use the override parameter each time.

```js
maintenance({
  enabled: true,
  template: "simple",
  override: "preview",
  cookieName: "my_custom_cookie", // Optional: defaults to "astro_maintenance_override"
  cookieMaxAge: 3600, // Optional: cookie expiration in seconds, defaults to 7 days
});
```

#### Resetting the Override Cookie

The override cookie can be reset in any of the following ways:

1. Adding `=reset` to the override parameter (e.g., `?preview=reset`)
2. Disabling the maintenance integration (`enabled: false`)

### Internal Route Redirection

You can redirect users to a custom page in your Astro project by setting the template to a route path that starts with `/`:

```js
maintenance({
  enabled: true,
  template: "/custom-maintenance", // Redirects to this route in your Astro site
  override: "preview",
});
```

This performs a 302 redirect to the specified route when maintenance mode is enabled. You'll need to create this page in your Astro project at the specified route. This is useful when you want to use a fully-featured Astro page with components and styling for your maintenance page.

### Custom Template

You can use a custom Handlebars template by providing a path to the template file:

```js
maintenance({
  enabled: true,
  template: "./templates/custom-maintenance.hbs", // Path relative to the project root
  title: "Custom Maintenance Page",
  description: "Our site is getting an upgrade.",
  // ... other options will be passed to the template
});
```

Here's an example of a custom Handlebars template:

```handlebars
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{title}}</title>
  </head>
  <body>
    <div class="your-container">
      {{#if logo}}<img src="{{logo}}" alt="Logo" />{{/if}}
      <h1>{{title}}</h1>
      <div class="description">{{description}}</div>

      {{#if emailAddress}}
        <div class="contact">
          {{emailText}}
          <a href="mailto:{{emailAddress}}">{{emailAddress}}</a>
        </div>
      {{/if}}

      {{#if copyright}}
        <footer>{{copyright}}</footer>
      {{/if}}
    </div>
  </body>
</html>
```

## Development Setup

If you want to contribute to this project:

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Build the package: `pnpm build`

## Testing

The integration includes a comprehensive test suite using Playwright for end-to-end testing. The tests verify the functionality of the maintenance page features in a real Astro environment.

### Running Tests

```bash
# RECOMMENDED: Run the simple test script (most reliable)
npm run test:simple
# or with pnpm
pnpm test:simple

# Alternative testing methods (Playwright-based, more comprehensive but may be fragile):

# Install Playwright browsers (only needed once)
npm run install:browsers

# Setup test environment (if needed)
npm run setup:test

# Run the simplified test
npm run test -- basic.spec.ts

# Run all tests (may be more fragile)
npm run test

# Run a specific test by name
npm run test:single "Test name here"

# Run tests with UI
npm run test:ui

# Run tests with browser visible
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Clean up test environment after running tests
npm run cleanup:test
```

### Test Coverage

The test suite includes three approaches:

#### Simple Test Script (`test:simple`)
The most reliable and straightforward testing method:
- Uses Node.js directly without Playwright dependencies
- Creates a minimal Astro project
- Tests core functionality (maintenance page and bypass parameter)
- Provides color-coded console output

#### Basic Tests (`basic.spec.ts`)
A simplified Playwright test that verifies core functionality:
- Default template rendering
- Override parameter functionality
- Cookie-based persistence

#### Comprehensive Tests (`integration.spec.ts`)
More extensive tests covering:
- Default template renders correctly
- Countdown functionality (future and past dates)
- Override parameter functionality (bypass and reset)
- Cookie-based access control
- Custom logo rendering
- Allowed and disallowed static assets
- Route-specific behavior

### Test Implementation

#### Basic Test Implementation
The simplified test:
1. Creates a minimal project structure in `tests/basic-project`
2. Installs only the necessary dependencies
3. Configures a simple maintenance integration
4. Tests core functionality with minimal setup/teardown

#### Comprehensive Test Implementation
The full test suite:
1. Creates a temporary Astro project in `tests/astro-project`
2. Configures it with the maintenance integration
3. Builds the project
4. Starts a local server
5. Uses Playwright to test different configurations and scenarios

### Extending Tests

If you want to add more tests:

1. For basic functionality, consider adding to `tests/basic.spec.ts`
2. For comprehensive testing, edit `tests/integration.spec.ts`
3. Add new test cases following the existing patterns
4. Run the tests to verify your changes

### Troubleshooting Tests

If you encounter issues running tests:

1. Use the `test:simple` script, which is the most reliable testing method
   ```bash
   npm run test:simple
   # or
   pnpm test:simple
   ```
2. If using Playwright tests:
   - Try the simplified `basic.spec.ts` test first
   - Ensure no other services are running on port 4321
   - Try running tests one at a time with `npm run test:single`
3. If tests hang, you may need to manually kill Node.js processes
4. Use `npm run cleanup:test` to reset the test environment
5. Dependency conflicts can be resolved by using the correct versions:
   - Use `@astrojs/node@^9.2.1` for compatibility with Astro 5.x
   - Use `--legacy-peer-deps` flag when installing dependencies

## License

MIT
