// @ts-check
import { defineConfig } from "astro/config";

import netlify from "@astrojs/netlify";

import maintenance from "astro-maintenance";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: netlify(),
  integrations: [
    maintenance({
      template: "construction",
      title: "Astro Maintenance on Netlify",
      description:
        "Testing the Astro Maintenance page version 2.0.0 on Netlify. The override key is 'astro'. Try it out by adding `?astro` to the URL.",
      socials: {
        github: "https://github.com/alexandr-studio/astro-maintenance",
      },
      override: "astro",
    }),
  ],
});
