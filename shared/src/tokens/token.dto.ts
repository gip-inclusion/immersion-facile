import * as crypto from "crypto";
import { decode } from "js-base64";
import { ConventionId } from "../convention/convention.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";

export const createConventionMagicLinkPayload = ({
  id,
  role,
  email,
  now,
  sub,
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
  ...(sub ? { sub } : {}),
});

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

export const stringToMd5 = (str: string) => {
  try {
    return crypto.createHash("md5").update(str).digest("hex");
  } catch (error) {
    Error.captureStackTrace(error as Error);
    throw error;
  }
};

export type CreateConventionMagicLinkPayloadProperties = {
  id: ConventionId;
  role: Role;
  email: string;
  now: Date;
  durationDays?: number;
  iat?: number;
  exp?: number;
  version?: number;
  sub?: string;
};

export type AppJwtPayload = {
  iat: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp?: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  version: number;
};

export type InclusionConnectDomainJwtPayload = { userId: string };
export type InclusionConnectJwtPayload = AppJwtPayload &
  InclusionConnectDomainJwtPayload;

export type EstablishmentJwtPayload = AppJwtPayload & {
  siret: string;
};

export type ConventionMagicLinkPayload = AppJwtPayload & {
  applicationId: ConventionId;
  role: Role;
  emailHash: string; //< md5 of email
  sub?: string;
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
  "backOffice",
] as const;

export type ConventionMagicLinkJwt = Flavor<string, "ConventionMagicLinkJwt">;
export type BackOfficeJwt = Flavor<string, "BackOfficeJwt">;
export type EstablishmentJwt = Flavor<string, "EstablishmentJwt">;

export type JwtPayloads = {
  convention?: ConventionMagicLinkPayload;
  establishment?: EstablishmentJwtPayload;
  inclusion?: InclusionConnectJwtPayload;
  backOffice?: BackOfficeJwtPayload;
};

type ValueOf<T> = T[keyof T];

export type PayloadKey = keyof JwtPayloads;
export type PayloadOption = ValueOf<Required<JwtPayloads>>;

export const currentJwtVersions: Record<PayloadKey, number> = {
  convention: 1,
  establishment: 1,
  backOffice: 1,
  inclusion: 1,
};

export type StandardJwtPayload<R extends Role> = {
  sub: string;
  role: R;
};

export type JwtDto = {
  jwt: string;
};

export type BackOfficeJwtPayload = AppJwtPayload &
  StandardJwtPayload<"backOffice">;

// handle unicode parsing issues between atob and JWT base64 format
const toBase64 = (input: string): string =>
  input.replace("-", "+").replace("_", "/");

export const decodeJwtWithoutSignatureCheck = <T>(jwtToken: string): T => {
  try {
    const [_header, payload, _authentication] = jwtToken.split(".");
    return JSON.parse(decode(toBase64(payload)));
  } catch (error) {
    //eslint-disable-next-line no-console
    console.error(decodeMagicLinkJwtWithoutSignatureCheck, error);
    throw new Error("401 Malformed JWT payload");
  }
};

export const decodeMagicLinkJwtWithoutSignatureCheck = <
  T extends ConventionMagicLinkPayload | EstablishmentJwtPayload,
>(
  jwtToken: string,
): T => decodeJwtWithoutSignatureCheck<T>(jwtToken);
