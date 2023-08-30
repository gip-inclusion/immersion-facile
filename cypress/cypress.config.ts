import { defineConfig } from "cypress";
import { ConfigData } from "cypress-html-validate";
import htmlvalidate from "cypress-html-validate/plugin";

const htmlValidateConfig = {
  extends: ["html-validate:recommended"],
} as ConfigData;

export default defineConfig({
  projectId: "vctxdm",
  env: {
    config: {
      baseApiRoute: "/api/",
      defaultFieldOptions: {
        // Temp fix, Cypress seems to report elements as disabled when they are not https://github.com/cypress-io/cypress/issues/5827
        force: true,
      },
      timeForEventCrawler: 6000,
    },
  },
  e2e: {
    specPattern: "e2e/**/*.spec.cy.{js,jsx,ts,tsx}",
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
