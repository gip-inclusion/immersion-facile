import * as crypto from "node:crypto";
import {
  type ConventionJwtPayload,
  type CreateConventionMagicLinkPayloadProperties,
  type Email,
  type EmailHash,
  currentJwtVersions,
} from "shared";

const stringToMd5 = (str: string) => {
  try {
    return crypto.createHash("md5").update(str).digest("hex");
  } catch (error) {
    Error.captureStackTrace(error as Error);
    throw error;
  }
};

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
export const isSomeEmailMatchingEmailHash = (
  emailsOrError: Email[],
  emailHash: EmailHash,
): boolean => emailsOrError.some((email) => stringToMd5(email) === emailHash);

export const makeEmailHash = (email: Email): string => stringToMd5(email);
