const gateway =
  import.meta.env.VITE_GATEWAY === "IN_MEMORY" ? "IN_MEMORY" : "HTTP";

const frontEnvType = import.meta.env.VITE_ENV_TYPE || "PROD";
const PREFILED_ESTABLISHMENT_FORM = Boolean(
  import.meta.env.PREFILED_ESTABLISHMENT_FORM,
);
const dev = import.meta.env.DEV;
/*
console.info("gateway is : ", gateway);
console.info("frontEnvType is : ", frontEnvType);
console.info("Env type is : ", frontEnvType);
*/

export const ENV = {
  dev,
  frontEnvType,
  gateway,
  PREFILED_ESTABLISHMENT_FORM,
};
Object.entries(ENV).forEach((entry) =>
  console.info(`ENV.${entry[0]} >>> `, entry[1]),
);
