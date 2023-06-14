import { ValueSerializer } from "type-route";

export type AuthorizedGroupSlugs = (typeof authorizedGroupSlugs)[number];

export const authorizedGroupSlugs = ["decathlon"] as const;
export const groupsSerializer: ValueSerializer<AuthorizedGroupSlugs> = {
  parse: (raw) => raw as AuthorizedGroupSlugs,
  stringify: (page) => page,
};
