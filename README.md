# Astro-Maintenance v2.0

A powerful **maintenance** and **coming soon** page integration for Astro projects with **universal deployment support**. Easily add beautiful maintenance pages during development or scheduled maintenance periods.

> **🚀 Version 2.0:** Now with **universal adapter support** and enhanced template rendering engine that works flawlessly across **Node.js**, **Cloudflare Workers**, **Vercel**, and **Netlify**.

> **⚠️ IMPORTANT:** This integration only works when Astro is in **server mode** (`output: 'server'`). It will not function with static site generation (`output: 'static'`) as it relies on server middleware to intercept requests.

## ✨ Live Demos

Experience astro-maintenance in action across different deployment platforms:

- **🟦 Vercel:** [astro-maintenance.vercel.app](https://astro-maintenance.vercel.app/)
- **🟨 Netlify:** [astro-maintenance.netlify.app](https://astro-maintenance.netlify.app/)
- **🟧 Cloudflare:** [astro-maintenance.alexander-sedeke.workers.dev](https://astro-maintenance.alexander-sedeke.workers.dev/)

> 💡 **Platform Demo Sources:** All deployment examples are available in the `/platform-demos` folder in the [repository](https://github.com/alexandr-studio/astro-maintenance/tree/main/platform-demos).

📚 **Documentation:** [astro-maintenance.alexandr.studio](https://astro-maintenance.alexandr.studio/)

## 🎯 Features

- **Universal Deployment:** Works seamlessly on Node.js, Cloudflare Workers, Vercel, and Netlify
- **Predefined Templates:** Beautiful built-in templates (simple, countdown, construction)
- **Custom Templates:** Support for custom Handlebars templates with `?raw` imports
- **Route Redirection:** Internal route redirection to custom pages in your Astro site
- **Rich Customization:** Logo, text, contact information, and social media links
- **Countdown Timer:** Time-based maintenance with automatic countdown (UTC timezone)
- **Auto-disable:** Automatic disabling when countdown ends with auto-reload functionality
- **Override System:** Query parameter bypass with cookie-based persistence
- **Environment Variables:** Runtime configuration without rebuilding
- **Enhanced Security:** HttpOnly cookies with configurable expiration

## 🚀 Installation

### Automatic Setup (Recommended)

```bash
# Using pnpm
pnpm astro add astro-maintenance

# Using npm
npm run astro add astro-maintenance

# Using yarn
yarn astro add astro-maintenance
```

### Manual Installation

```bash
# Install the package
npm install astro-maintenance
# or
pnpm add astro-maintenance
# or
yarn add astro-maintenance
```

Then add to your `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import maintenance from "astro-maintenance";

export default defineConfig({
  integrations: [maintenance()],
});
```

## 📖 Quick Start

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import maintenance from "astro-maintenance";

export default defineConfig({
  integrations: [
    maintenance({
      enabled: true,
      template: "simple", // 'simple', 'countdown', 'construction'
      title: "Site Under Maintenance",
      description: "We're making improvements. Please check back soon!",
      override: "preview", // Access site with ?preview
    }),
  ],
});
```

## ⚙️ Configuration Options

| Property       | Type                                                  | Description                                                                                  | Default                        |
| -------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| `enabled`      | `boolean`                                             | Enable or disable maintenance mode                                                           | `true`                         |
| `template`     | `'simple' \| 'countdown' \| 'construction' \| string` | Built-in template name or imported custom template content                                   | `'simple'`                     |
| `title`        | `string`                                              | Page title                                                                                   | `'Site under maintenance'`     |
| `description`  | `string`                                              | Description text                                                                             | `"We'll be back shortly!"`     |
| `logo`         | `string`                                              | URL to your logo image                                                                       | `undefined`                    |
| `emailAddress` | `string`                                              | Contact email address                                                                        | `undefined`                    |
| `emailText`    | `string`                                              | Text displayed before email address                                                          | `'Contact us for assistance:'` |
| `copyright`    | `string`                                              | Copyright text                                                                               | `'Copyright © 2025'`           |
| `countdown`    | `string`                                              | ISO date string for countdown timer (UTC)                                                   | `undefined`                    |
| `override`     | `string`                                              | Query parameter to bypass maintenance                                                        | `'bypass'`                     |
| `cookieName`   | `string`                                              | Override cookie name                                                                         | `'astro_maintenance_override'` |
| `cookieMaxAge` | `number`                                              | Cookie expiration in seconds                                                                 | `604800` (7 days)              |
| `allowedPaths` | `string[]`                                            | Paths that bypass maintenance mode                                                           | `[]`                           |
| `socials`      | `object`                                              | Social media links (see Social Media section)                                               | `undefined`                    |

## 🌐 Universal Platform Support

**Version 2.0** introduces a completely rewritten template engine ensuring **identical behavior** across all deployment platforms:

| Platform              | Status | Runtime              | Notes                                     |
| --------------------- | ------ | -------------------- | ----------------------------------------- |
| **Node.js**           | ✅     | Node.js server       | Standalone and middleware modes           |
| **Cloudflare Workers** | ✅     | V8 isolates          | Full edge computing support               |
| **Vercel**            | ✅     | Serverless functions | Functions and Edge Runtime                |
| **Netlify**           | ✅     | Serverless functions | CDN-compatible with proper redirects      |
| **Local Development** | ✅     | Node.js              | `astro dev` with hot reload               |

> **🎯 Breaking Change Note:** File path-based custom templates are no longer supported. See the migration guide below.

## 🔄 Migration from v1.x to v2.0

### ✅ What Still Works (No Changes Required)

- All built-in templates (`'simple'`, `'countdown'`, `'construction'`)
- All configuration options and their behavior
- Environment variable overrides
- Override system and cookie persistence
- Route redirection functionality

### ⚠️ Breaking Change: Custom Templates

**v1.x (deprecated):**
```js
maintenance({
  template: "./src/templates/custom.hbs", // ❌ No longer supported
});
```

**v2.0 (required):**
```js
// Import template content using ?raw
import customTemplate from "./src/templates/custom.hbs?raw";

maintenance({
  template: customTemplate, // ✅ Pass imported content
});
```

### 📁 Examples Available

Check the `/examples` folder in the repository for complete migration examples and best practices.

## 🎨 Template Examples

### Built-in Templates

```js
// Simple maintenance page
maintenance({
  enabled: true,
  template: "simple",
  title: "We'll be back soon!",
  description: "Scheduled maintenance in progress.",
  logo: "/logo.png",
  emailAddress: "support@example.com",
});

// Countdown timer
maintenance({
  enabled: true,
  template: "countdown",
  title: "Launching Soon!",
  countdown: "2025-06-01T12:00:00Z", // UTC timezone
  description: "Our new website is coming...",
});

// Under construction
maintenance({
  enabled: true,
  template: "construction",
  title: "Under Construction",
  description: "Building something amazing.",
});
```

### Custom Template with v2.0

```js
// Import your template as raw content
import customTemplate from './src/templates/maintenance.hbs?raw';

maintenance({
  enabled: true,
  template: customTemplate,
  title: "Custom Maintenance",
  description: "Personalized maintenance experience",
  logo: "/custom-logo.png",
  socials: {
    twitter: "https://twitter.com/yourhandle",
    github: "https://github.com/yourusername",
  },
});
```

**Example Custom Template (`maintenance.hbs`):**
```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    /* Your custom styles */
    body { font-family: sans-serif; text-align: center; padding: 50px; }
  </style>
</head>
<body>
  <div class="container">
    {{#if logo}}
      <img src="{{logo}}" alt="Logo" class="logo" />
    {{else}}
      <div class="default-logo">🔧</div>
    {{/if}}
    
    <h1>{{title}}</h1>
    <p>{{description}}</p>
    
    {{#if emailAddress}}
      <p>{{emailText}} <a href="mailto:{{emailAddress}}">{{emailAddress}}</a></p>
    {{/if}}
    
    {{#if socials}}
      <div class="social-links">
        {{#if socials.twitter}}
          <a href="{{socials.twitter}}" target="_blank">Twitter</a>
        {{/if}}
        {{#if socials.github}}
          <a href="{{socials.github}}" target="_blank">GitHub</a>
        {{/if}}
      </div>
    {{/if}}
    
    {{#if copyright}}
      <footer>{{copyright}}</footer>
    {{/if}}
  </div>
</body>
</html>
```

## 🔗 Social Media Integration

Add social media links to your maintenance page:

```js
maintenance({
  // ... other options
  socials: {
    facebook: 'https://facebook.com/yourpage',
    x: 'https://x.com/yourhandle',           // formerly Twitter
    instagram: 'https://instagram.com/yourhandle',
    youtube: 'https://youtube.com/yourchannel',
    linkedin: 'https://linkedin.com/in/yourprofile',
    github: 'https://github.com/yourusername',
    mastodon: 'https://mastodon.social/@yourhandle',
    pinterest: 'https://pinterest.com/yourhandle',
    tiktok: 'https://tiktok.com/@yourhandle',
    discord: 'https://discord.gg/yourinvite',
    slack: 'https://yourworkspace.slack.com',
    twitch: 'https://twitch.tv/yourchannel',
    reddit: 'https://reddit.com/u/yourusername'
  }
});
```

## 🌍 Environment Variables

Override any configuration at runtime using environment variables:

```bash
# Toggle maintenance mode
MAINTENANCE_ENABLED=true
MAINTENANCE_TEMPLATE="countdown"
MAINTENANCE_TITLE="Launching Soon!"
MAINTENANCE_DESCRIPTION="Our new site is almost ready!"
MAINTENANCE_COUNTDOWN="2025-12-31T23:59:59Z"
MAINTENANCE_OVERRIDE="preview"
MAINTENANCE_LOGO="/assets/logo.png"
MAINTENANCE_EMAIL_ADDRESS="hello@example.com"
MAINTENANCE_COPYRIGHT="© 2025 Your Company"
```

**Available Environment Variables:**
- `MAINTENANCE_ENABLED` (boolean)
- `MAINTENANCE_TEMPLATE` (string)
- `MAINTENANCE_TITLE` (string)
- `MAINTENANCE_DESCRIPTION` (string)
- `MAINTENANCE_LOGO` (string)
- `MAINTENANCE_EMAIL_ADDRESS` (string)
- `MAINTENANCE_EMAIL_TEXT` (string)
- `MAINTENANCE_COPYRIGHT` (string)
- `MAINTENANCE_COUNTDOWN` (string)
- `MAINTENANCE_OVERRIDE` (string)
- `MAINTENANCE_COOKIE_MAX_AGE` (number)

## 🍪 Override System

### Query Parameter Bypass

Access your site during maintenance using the override parameter:

```bash
# Bypass maintenance mode
https://yoursite.com?preview

# Reset override cookie
https://yoursite.com?preview=reset
```

### Cookie Persistence

Once accessed with the override parameter, a secure HttpOnly cookie is set allowing subsequent visits without the parameter.

```js
maintenance({
  override: "preview",
  cookieName: "maintenance_bypass",
  cookieMaxAge: 86400, // 24 hours
});
```

## 🛣️ Route Redirection

Redirect to custom Astro pages instead of using templates:

```js
maintenance({
  enabled: true,
  template: "/custom-maintenance", // Redirects to this route
  override: "preview",
});
```

Create the corresponding page at `src/pages/custom-maintenance.astro`:

```astro
---
// src/pages/custom-maintenance.astro
---
<html>
  <head>
    <title>Custom Maintenance</title>
  </head>
  <body>
    <h1>Site Under Maintenance</h1>
    <p>We're making improvements!</p>
  </body>
</html>
```

## ⏱️ Countdown Timer Features

### Automatic Disable

When countdown reaches zero, maintenance mode automatically disables:

```js
maintenance({
  template: "countdown",
  countdown: "2025-06-01T12:00:00Z", // UTC timezone
  // Automatically disabled when this date/time is reached
});
```

### Auto-reload

The page checks every 10 seconds after countdown ends and automatically reloads when maintenance is disabled.

## 🧪 Testing

```bash
# Install test dependencies
pnpm install

# Install Playwright browsers (first time only)
pnpm run install:browsers

# Run tests
pnpm run test

# Clean up test artifacts
pnpm run cleanup:test
```

## 📚 Examples & Demos

- **📁 Examples:** `/examples` folder contains migration examples and advanced configurations
- **🚀 Platform Demos:** `/platform-demos` folder contains complete deployment examples for each platform
- **🌐 Live Demos:** See the live demos section above for working examples

## 🤝 Contributing

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## 📄 License

MIT © [Alexander Sedeke](https://github.com/alexandr-studio)

---

**🎉 Version 2.0** delivers universal platform compatibility with enhanced reliability. Upgrade today for the best maintenance page experience across all deployment targets!