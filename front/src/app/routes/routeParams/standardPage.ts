import { ValueSerializer } from "type-route";

export type StandardPageSlugs = (typeof standardPageSlugs)[number];

export const standardPageSlugs = [
  "mentions-legales",
  "cgu",
  "politique-de-confidentialite",
  "declaration-accessibilite",
  "plan-du-site",
  "obligations-des-parties",
] as const;

export const standardPagesSerializer: ValueSerializer<StandardPageSlugs> = {
  parse: (raw) => raw as StandardPageSlugs,
  stringify: (page) => page,
};
