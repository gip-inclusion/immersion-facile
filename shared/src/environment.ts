export const environments = [
  "dev",
  "staging",
  "pentest",
  "production",
  "local",
] as const;
export type Environment = (typeof environments)[number];
