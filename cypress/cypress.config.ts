import { defineConfig } from "cypress";
import htmlvalidate from "cypress-html-validate/plugin";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: false,
    specPattern: "e2e/**/*.cy.{js,jsx,ts,tsx}",
    setupNodeEvents(on) {
      htmlvalidate.install(on);
    },
  },
});
