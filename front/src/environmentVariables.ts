const gateway =
  import.meta.env.VITE_GATEWAY === "IN_MEMORY" ? "IN_MEMORY" : "HTTP";

const env_type = import.meta.env.VITE_ENV_TYPE || "PROD";

console.info("Gateway is : ", gateway);
console.info("Env type is : ", env_type);

export const ENV = {
  dev: import.meta.env.DEV,
  env_type,
  gateway,
};
