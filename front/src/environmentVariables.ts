const gateway =
  import.meta.env.VITE_GATEWAY === "IN_MEMORY" ? "IN_MEMORY" : "HTTP";

const envType = import.meta.env.VITE_ENV_TYPE || "PROD";

console.info("Gateway is : ", gateway);
console.info("Env type is : ", envType);

export const ENV = {
  dev: import.meta.env.DEV,
  envType,
  gateway,
};
