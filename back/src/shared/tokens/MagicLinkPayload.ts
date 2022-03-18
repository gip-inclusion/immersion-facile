import { NotEmptyArray } from "../utils";
import crypto from "crypto";
import { SiretDto } from "../siret";

export type JwtPayloads = {
  application?: MagicLinkPayload;
  establishment?: EstablishmentPayload;
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

export const createMagicLinkPayload = (
  applicationId: string,
  role: Role,
  email: string,
  durationDays = 31,
  nowFn = Date.now,
  iat: number = Math.round(nowFn() / 1000),
  exp: number = iat + durationDays * 24 * 3600,
  version = currentJwtVersions.application,
) => ({
  version,
  applicationId,
  role,
  iat,
  exp,
  emailHash: emailHashForMagicLink(email),
});

export type EstablishmentPayload = {
  siret: string;
  iat: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  version: number;
};

export const createEstablishmentPayload = ({
  siret,
  durationDays,
  now,
}: {
  siret: SiretDto;
  durationDays: number;
  now: Date;
}): EstablishmentPayload => {
  const iat = Math.round(now.getTime() / 1000);
  const exp = iat + durationDays * 24 * 3600;

  return {
    siret,
    iat,
    exp,
    version: currentJwtVersions.establishment,
  };
};
