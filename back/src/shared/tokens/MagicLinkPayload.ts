import { NotEmptyArray } from "../utils";

export type Role =
  | "beneficiary"
  | "establishment"
  | "counsellor"
  | "validator"
  | "admin";

export const allRoles: NotEmptyArray<Role> = [
  "beneficiary",
  "establishment",
  "counsellor",
  "validator",
  "admin",
];

export type MagicLinkPayload = {
  applicationId: string;
  roles: Role[];
  iat: number; //< issued at : number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp: number; //< expired at : number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  name: string; //< Name
};

export function createMagicLinkPayload(
  applicationId: string,
  role: Role,
  durationDays: number = 31,
  name: string = "",
  nowFn = Date.now,
  iat: number = Math.round(nowFn() / 1000),
  exp: number = iat + durationDays * 24 * 3600,
) {
  return {
    applicationId,
    roles: [role],
    iat,
    exp,
    name,
  };
}
