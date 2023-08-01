import * as crypto from "crypto";
import { decode } from "js-base64";
import { currentJwtVersions, SiretDto } from "..";
import {
  ConventionJwtPayload,
  CreateConventionMagicLinkPayloadProperties,
  EstablishmentJwtPayload,
} from "./jwtPayload.dto";

export const stringToMd5 = (str: string) => {
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
    //eslint-disable-next-line no-console
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
  iat = Math.round(now.getTime() / 1000),
  exp = iat + durationDays * 24 * 3600,
  version = currentJwtVersions.convention,
}: CreateConventionMagicLinkPayloadProperties): ConventionJwtPayload => ({
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
