const gateway =
  import.meta.env.VITE_GATEWAY === "IN_MEMORY" ? "IN_MEMORY" : "HTTP";

console.info("Gateway is : ", gateway);

export const ENV = {
  dev: import.meta.env.DEV,
  gateway,
};
