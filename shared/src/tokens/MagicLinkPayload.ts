import * as crypto from "crypto";
import { ConventionId } from "../convention/convention.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";

export type ConventionMagicLinkJwt = Flavor<string, "ConventionMagicLinkJwt">;

export type JwtPayloads = {
  convention?: ConventionMagicLinkPayload;
  establishment?: EstablishmentJwtPayload;
  inclusion?: InclusionConnectJwtPayload;
  admin?: AppJwtPayload;
};

type ValueOf<T> = T[keyof T];

export type PayloadKey = keyof JwtPayloads;
export type PayloadOption = ValueOf<Required<JwtPayloads>>;

export const currentJwtVersions: Record<PayloadKey, number> = {
  convention: 1,
  establishment: 1,
  admin: 1,
  inclusion: 1,
};

export type Role = (typeof allRoles)[number];
export const allRoles = [
  "beneficiary",
  "legal-representative",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "establishment",
  "establishment-representative",
  "establishment-tutor",
  "counsellor",
  "validator",
  "admin",
] as const;

export const stringToMd5 = (str: string) =>
  crypto.createHash("md5").update(str).digest("hex");

export type CreateConventionMagicLinkPayloadProperties = {
  id: ConventionId;
  role: Role;
  email: string;
  now: Date;
  durationDays?: number;
  iat?: number;
  exp?: number;
  version?: number;
};

export const createConventionMagicLinkPayload = ({
  id,
  role,
  email,
  now,
  durationDays = 31,
  iat = Math.round(now.getTime() / 1000),
  exp = iat + durationDays * 24 * 3600,
  version = currentJwtVersions.convention,
}: CreateConventionMagicLinkPayloadProperties): ConventionMagicLinkPayload => ({
  version,
  applicationId: id, //TODO : replace applicationId by conventionId on convention magic link payload (applicationId was legacy name)
  role,
  iat,
  exp,
  emailHash: stringToMd5(email),
});

export type AppJwtPayload = {
  iat: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  version: number;
};

export type ConventionMagicLinkPayload = AppJwtPayload & {
  applicationId: ConventionId;
  role: Role;
  emailHash: string; //< md5 of email
};

export type InclusionConnectJwtPayload = AppJwtPayload & { userId: string };

export type EstablishmentJwtPayload = AppJwtPayload & {
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
