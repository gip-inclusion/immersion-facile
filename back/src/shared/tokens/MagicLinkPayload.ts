import { NotEmptyArray } from "../utils";
import crypto from "crypto";

export const currentJwtVersion = 1;

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
  version: number; //< Positive integer.
  applicationId: string;
  role: Role;
  iat: number; //< issued at : number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp: number; //< expired at : number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  emailHash: string; //< md5 of email
};

export const emailHashForMagicLink = (str: string) =>
  crypto.createHash("md5").update(str).digest("hex");

export function createMagicLinkPayload(
  applicationId: string,
  role: Role,
  email: string,
  durationDays = 31,
  nowFn = Date.now,
  iat: number = Math.round(nowFn() / 1000),
  exp: number = iat + durationDays * 24 * 3600,
  version = currentJwtVersion,
) {
  return {
    version,
    applicationId,
    role,
    iat,
    exp,
    emailHash: emailHashForMagicLink(email),
  };
}
