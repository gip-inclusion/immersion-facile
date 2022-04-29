const originalEnvVariables = {
  VITE_GATEWAY: import.meta.env.VITE_GATEWAY,
  VITE_ENV_TYPE: import.meta.env.VITE_ENV_TYPE,
  DEV: import.meta.env.DEV,
  VITE_PREFILED_ESTABLISHMENT_FORM: import.meta.env
    .VITE_PREFILED_ESTABLISHMENT_FORM,
};

Object.entries(originalEnvVariables).forEach(([key, value]) =>
  console.info(`originalEnvVariables.${key} >>> `, value),
);

export const ENV = {
  dev: originalEnvVariables.DEV,
  frontEnvType: originalEnvVariables.VITE_ENV_TYPE || "PROD",
  gateway:
    originalEnvVariables.VITE_GATEWAY === "IN_MEMORY" ? "IN_MEMORY" : "HTTP",
  PREFILED_ESTABLISHMENT_FORM: Boolean(
    originalEnvVariables.VITE_PREFILED_ESTABLISHMENT_FORM,
  ),
};
Object.entries(ENV).forEach(([key, value]) =>
  console.info(`ENV.${key} >>> `, value),
);
