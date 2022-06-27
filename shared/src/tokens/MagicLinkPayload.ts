import { NotEmptyArray } from "../utils";
import * as crypto from "crypto";
import { SiretDto } from "../siret";
import { ConventionId } from "../convention/convention.dto";

export type JwtPayloads = {
  application?: ConventionMagicLinkPayload;
  establishment?: EstablishmentJwtPayload;
};

type ValueOf<T> = T[keyof T];

export type PayloadKey = keyof JwtPayloads;
export type PayloadOption = ValueOf<Required<JwtPayloads>>;

export const currentJwtVersions: Record<PayloadKey, number> = {
  application: 1,
  establishment: 1,
};

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

export type ConventionMagicLinkPayload = {
  version: number; //< Positive integer.
  applicationId: ConventionId;
  role: Role;
  iat: number; //< issued at : number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp: number; //< expired at : number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  emailHash: string; //< md5 of email
};

export const stringToMd5 = (str: string) =>
  crypto.createHash("md5").update(str).digest("hex");

export const createConventionMagicLinkPayload = (
  applicationId: ConventionId,
  role: Role,
  email: string,
  durationDays = 31,
  nowFn = Date.now,
  iat: number = Math.round(nowFn() / 1000),
  exp: number = iat + durationDays * 24 * 3600,
  version = currentJwtVersions.application,
): ConventionMagicLinkPayload => ({
  version,
  applicationId,
  role,
  iat,
  exp,
  emailHash: stringToMd5(email),
});

type JwtPayload = {
  iat: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  version: number;
};

export type EstablishmentJwtPayload = JwtPayload & {
  siret: string;
};

export const createEstablishmentMagicLinkPayload = ({
  siret,
  durationDays,
  now,
}: {
  siret: SiretDto;
  durationDays: number;
  now: Date;
}): EstablishmentJwtPayload => {
  const iat = Math.round(now.getTime() / 1000);
  const exp = iat + durationDays * 24 * 3600;

  return {
    siret,
    iat,
    exp,
    version: currentJwtVersions.establishment,
  };
};
