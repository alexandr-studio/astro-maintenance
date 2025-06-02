# Migration Guide: Custom Template Usage

This guide helps you migrate from file path-based custom templates to the new import-based system introduced to ensure compatibility with serverless environments.

## Why This Change?

The previous system used Node.js filesystem APIs (`fs.readFileSync`) to load custom templates at runtime. This approach caused issues in serverless environments like:

- **Cloudflare Workers**: No filesystem access
- **Vercel Edge Functions**: Limited filesystem access
- **Netlify Edge Functions**: No traditional filesystem
- **Other serverless platforms**: Various filesystem restrictions

The new approach bundles templates at build time, ensuring they work everywhere.

## Migration Steps

### Before (Old Way) ❌

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import maintenance from 'astro-maintenance';

export default defineConfig({
  integrations: [
    maintenance({
      enabled: true,
      template: "./src/templates/custom.hbs", // File path - NO LONGER WORKS
      title: "Under Maintenance",
    }),
  ]
});
```

### After (New Way) ✅

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import maintenance from 'astro-maintenance';

// Import your template as raw content
import customTemplate from './src/templates/custom.hbs?raw';

export default defineConfig({
  integrations: [
    maintenance({
      enabled: true,
      template: customTemplate, // Pass imported content directly
      title: "Under Maintenance",
    }),
  ]
});
```

## Key Changes

1. **Import Statement**: Add `import customTemplate from './path/to/template.hbs?raw';`
2. **Template Option**: Change from file path string to imported variable
3. **Build Time**: Templates are now bundled at build time, not loaded at runtime

## Multiple Templates

### Before ❌

```js
const isUpgrade = process.env.MAINTENANCE_TYPE === 'upgrade';
const templatePath = isUpgrade 
  ? "./templates/upgrade.hbs" 
  : "./templates/maintenance.hbs";

maintenance({
  enabled: true,
  template: templatePath,
});
```

### After ✅

```js
import maintenanceTemplate from './templates/maintenance.hbs?raw';
import upgradeTemplate from './templates/upgrade.hbs?raw';

const isUpgrade = process.env.MAINTENANCE_TYPE === 'upgrade';
const template = isUpgrade ? upgradeTemplate : maintenanceTemplate;

maintenance({
  enabled: true,
  template: template,
});
```

## Dynamic Template Loading

If you need dynamic template selection, import all possible templates and choose at runtime:

```js
import template1 from './templates/template1.hbs?raw';
import template2 from './templates/template2.hbs?raw';
import template3 from './templates/template3.hbs?raw';

const templates = {
  maintenance: template1,
  upgrade: template2,
  emergency: template3,
};

const selectedTemplate = templates[process.env.MAINTENANCE_TYPE] || template1;

maintenance({
  enabled: true,
  template: selectedTemplate,
});
```

## Error Handling

The new system provides better error handling:

- **Compile-time errors**: Invalid templates are caught during build
- **No runtime failures**: No filesystem errors in production
- **Fallback behavior**: Invalid custom templates fall back to the simple template

## What Still Works

These patterns continue to work unchanged:

```js
// Built-in templates
maintenance({ template: "simple" });
maintenance({ template: "countdown" });
maintenance({ template: "construction" });

// Redirect paths
maintenance({ template: "/custom-maintenance-route" });
```

## Troubleshooting

### Template Not Found Error

**Error**: Module not found: Can't resolve './templates/custom.hbs?raw'

**Solution**: Ensure the template file exists and the path is correct relative to your config file.

### Template Content Issues

**Error**: Custom template renders incorrectly

**Solution**: Verify your Handlebars syntax and ensure all required variables are available.

### TypeScript Errors

**Error**: Cannot find module './template.hbs?raw' or its corresponding type declarations

**Solution**: Add to your `env.d.ts` or create a `types.d.ts`:

```typescript
declare module "*.hbs?raw" {
  const content: string;
  export default content;
}
```

## Benefits of the New Approach

1. **Serverless Compatible**: Works on all deployment platforms
2. **Better Performance**: Templates bundled at build time
3. **Type Safety**: Better TypeScript support
4. **Error Prevention**: Compile-time validation
5. **Smaller Runtime**: No filesystem dependencies

## Need Help?

If you encounter issues during migration:

1. Check that your template file exists and is valid Handlebars
2. Ensure the import path is correct relative to your config file
3. Verify you're using the `?raw` suffix in the import
4. Test your configuration in development before deploying

For additional support, please open an issue in the GitHub repository.