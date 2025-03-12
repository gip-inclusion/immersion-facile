import {
  environments,
  makeGetBooleanVariable,
  makeThrowIfNotInArray,
} from "shared";

const windowEnv: Record<string, string | undefined> = (window as any)._env_;
if (!windowEnv)
  throw new Error("window._env_ is not defined, you need to run env.sh first");

const throwIfNotInArray = makeThrowIfNotInArray(windowEnv);
const getBoolean = makeGetBooleanVariable(windowEnv);

export const ENV = {
  envType: throwIfNotInArray({
    variableName: "VITE_ENV_TYPE",
    authorizedValues: [...environments],
    defaultValue: "local",
  }),
  gateway: throwIfNotInArray({
    variableName: "VITE_GATEWAY",
    authorizedValues: ["IN_MEMORY", "HTTP"],
    defaultValue: "HTTP",
  }),
  prefilledForms: getBoolean("VITE_PREFILLED_FORMS"),
  crispWebSiteId: windowEnv.VITE_CRISP_WEBSITE_ID,
  updateServiceWorkerIntervalInSeconds: Number.parseInt(
    windowEnv.VITE_UPDATE_SERVICE_WORKER_INTERVAL_IN_SECONDS || "60",
    10,
  ),
};

Object.entries(ENV).forEach(([key, value]) =>
  console.info(`ENV.${key} >>> `, value),
);
