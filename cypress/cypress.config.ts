import { defineConfig } from "cypress";
import { ConfigData } from "cypress-html-validate";
import htmlvalidate from "cypress-html-validate/plugin";

const htmlValidateConfig = {
  extends: ["html-validate:recommended"],
} as ConfigData;

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000/",
    specPattern: "e2e/**/*.cy.{js,jsx,ts,tsx}",
    setupNodeEvents(on) {
      htmlvalidate.install(on, htmlValidateConfig);
      on("task", {
        log(message) {
          console.log(message);

          return null;
        },
      });
    },
  },
});
