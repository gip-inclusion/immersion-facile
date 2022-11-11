import { makeGetBooleanVariable, makeThrowIfNotInArray } from "shared";

const throwIfNotInArray = makeThrowIfNotInArray(import.meta.env);
const getBoolean = makeGetBooleanVariable(import.meta.env);

export const ENV = {
  envType: throwIfNotInArray({
    variableName: "VITE_ENV_TYPE",
    authorizedValues: ["dev", "staging", "production", "local"],
    defaultValue: "local",
  }),
  gateway: throwIfNotInArray({
    variableName: "VITE_GATEWAY",
    authorizedValues: ["IN_MEMORY", "HTTP"],
    defaultValue: "HTTP",
  }),
  prefilledForms: getBoolean("VITE_PREFILLED_FORMS"),
  crispWebSiteId: import.meta.env.VITE_CRISP_WEBSITE_ID,
};

Object.entries(ENV).forEach(([key, value]) =>
  //eslint-disable-next-line no-console
  console.info(`ENV.${key} >>> `, value),
);
