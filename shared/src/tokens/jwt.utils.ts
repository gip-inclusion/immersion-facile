import * as crypto from "node:crypto";
import { decode } from "js-base64";
import { type Email, type SiretDto, currentJwtVersions } from "..";
import type {
  ConventionJwtPayload,
  CreateConventionMagicLinkPayloadProperties,
  EmailHash,
  EstablishmentJwtPayload,
} from "./jwtPayload.dto";

export const isSomeEmailMatchingEmailHash = (
  emailsOrError: Email[],
  emailHash: EmailHash,
): boolean => emailsOrError.some((email) => makeEmailHash(email) === emailHash);
export const makeEmailHash = (email: Email): string => stringToMd5(email);

const stringToMd5 = (str: string) => {
  try {
    return crypto.createHash("md5").update(str).digest("hex");
  } catch (error) {
    Error.captureStackTrace(error as Error);
    throw error;
  }
};

// handle unicode parsing issues between atob and JWT base64 format
const toBase64 = (input: string): string =>
  input.replace("-", "+").replace("_", "/");

export const decodeJwtWithoutSignatureCheck = <T>(jwtToken: string): T => {
  try {
    const [_header, payload, _authentication] = jwtToken.split(".");
    return JSON.parse(decode(toBase64(payload)));
  } catch (error) {
    console.error(decodeMagicLinkJwtWithoutSignatureCheck, error);
    throw new Error("401 Malformed JWT payload");
  }
};

export const decodeMagicLinkJwtWithoutSignatureCheck = <
  T extends ConventionJwtPayload | EstablishmentJwtPayload,
>(
  jwtToken: string,
): T => decodeJwtWithoutSignatureCheck<T>(jwtToken);

export const createConventionMagicLinkPayload = ({
  id,
  role,
  email,
  now,
  sub,
  durationDays = 31,
  version = currentJwtVersions.convention,
  exp: expOverride,
}: CreateConventionMagicLinkPayloadProperties): ConventionJwtPayload => {
  const iat = Math.round(now.getTime() / 1000);
  const exp = expOverride ?? iat + durationDays * 24 * 3600;

  return {
    version,
    applicationId: id, //TODO : replace applicationId by conventionId on convention magic link payload (applicationId was legacy name)
    role,
    iat,
    exp,
    emailHash: stringToMd5(email),
    ...(sub ? { sub } : {}),
  };
};

type CreateEstablishmentJwtPayloadProperties = {
  siret: SiretDto;
  durationDays: number;
  now: Date;
  iat?: number;
  exp?: number;
  version?: number;
};

export const createEstablishmentJwtPayload = ({
  siret,
  // biome-ignore lint/correctness/noUnusedVariables: it is used in other param
  durationDays,
  now,
  iat = Math.round(now.getTime() / 1000),
  exp = iat + durationDays * 24 * 3600,
  version = currentJwtVersions.establishment,
}: CreateEstablishmentJwtPayloadProperties): EstablishmentJwtPayload => ({
  siret,
  iat,
  exp,
  version,
});
