// Example: Using a custom Handlebars template with astro-maintenance
import { defineConfig } from 'astro/config';
import maintenance from 'astro-maintenance';

// Import your custom template as raw string content
import customTemplate from './src/templates/custom-maintenance.hbs?raw';

export default defineConfig({
  integrations: [
    maintenance({
      enabled: true,
      // Pass the imported template content directly
      template: customTemplate,
      title: 'We are upgrading our systems',
      description: 'Our website is currently being upgraded with exciting new features. We\'ll be back soon!',
      logo: '/logo.png',
      emailAddress: 'support@example.com',
      emailText: 'Contact our support team',
      copyright: '© 2025 Your Company',
      socials: {
        twitter: 'https://twitter.com/yourcompany',
        facebook: 'https://facebook.com/yourcompany',
        instagram: 'https://instagram.com/yourcompany'
      }
    })
  ]
});

// Alternative examples:

// 1. Using built-in templates (no change from before)
/*
maintenance({
  enabled: true,
  template: 'countdown', // or 'simple' or 'construction'
  countdown: '2025-02-01T12:00:00Z'
})
*/

// 2. Using redirect paths (still supported)
/*
maintenance({
  enabled: true,
  template: '/we_work_on', // Redirects to this path instead of showing maintenance page
})
*/

// 3. Multiple custom templates based on conditions
/*
import maintenanceTemplate from './src/templates/maintenance.hbs?raw';
import upgradeTemplate from './src/templates/upgrade.hbs?raw';

const isUpgrade = process.env.MAINTENANCE_TYPE === 'upgrade';

maintenance({
  enabled: true,
  template: isUpgrade ? upgradeTemplate : maintenanceTemplate,
})
*/