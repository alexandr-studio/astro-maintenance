import maintenance from "astro-maintenance";

export default defineConfig({
  integrations: [
    maintenance({
      enabled: process.env.MAINTENANCE === "true",
      template: "countdown", // or "simple" | "construction"
      logo: "/logo.svg",
      title: "We are working on our site",
      description: "Please check back later.",
      colors: {
        background: "#000000",
        text: "#ffffff",
        accent: "#ff6600",
      },
      countdownTo: "2025-06-01T12:00:00Z", // optional, only for countdown
    }),
  ],
});
