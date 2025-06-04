// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import maintenance from "astro-maintenance";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [
    maintenance({
      template: "construction",
      title: "Astro Maintenance on Vercel",
      description:
        "Testing the Astro Maintenance page version 2.0.0-next.1 on Vercel. The override key is 'astro'. Try it out by adding `?astro` to the URL. ",
      socials: {
        github: "https://github.com/alexandr-studio/astro-maintenance",
      },
      override: "astro",
    }),
  ],
});
