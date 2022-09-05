const originalEnvVariables = {
  VITE_GATEWAY: import.meta.env.VITE_GATEWAY,
  VITE_ENV_TYPE: import.meta.env.VITE_ENV_TYPE,
  DEV: import.meta.env.DEV,
  VITE_PREFILLED_FORMS: import.meta.env.VITE_PREFILLED_FORMS as
    | undefined
    | string,
  VITE_CRISP_WEBSITE_ID: import.meta.env.VITE_CRISP_WEBSITE_ID as
    | undefined
    | string,
};

export const ENV = {
  dev: originalEnvVariables.DEV,
  frontEnvType: String(originalEnvVariables.VITE_ENV_TYPE) || "PROD",
  gateway:
    originalEnvVariables.VITE_GATEWAY === "IN_MEMORY" ? "IN_MEMORY" : "HTTP",
  PREFILLED_FORMS:
    originalEnvVariables.VITE_PREFILLED_FORMS?.toLowerCase() === "true",
  crispWebSiteId: originalEnvVariables.VITE_CRISP_WEBSITE_ID,
};

Object.entries(ENV).forEach(([key, value]) =>
  //eslint-disable-next-line no-console
  console.info(`ENV.${key} >>> `, value),
);
