// @ts-check
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";
import maintenance from "astro-maintenance";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),

  integrations: [
    maintenance({
      template: "construction",
      title: "Astro Maintenance on Cloudflare",
      description:
        "Testing the Astro Maintenance page version 2.0.0 on Cloudflare. The override key is 'astro'. Try it out by adding `?astro` to the URL.",
      socials: {
        github: "https://github.com/alexandr-studio/astro-maintenance",
      },
      override: "astro",
    }),
  ],
});
