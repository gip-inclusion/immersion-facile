import { createHash, generateKeyPairSync } from "node:crypto";
import {
  type ConventionJwtPayload,
  type CreateConventionMagicLinkPayloadProperties,
  currentJwtVersions,
  decodeJwtWithoutSignatureCheck,
  type Email,
  type EmailHash,
  errors,
} from "shared";
import type { JwtKind, VerifyJwtFn } from "../domains/core/jwt";
import type { TimeGateway } from "../domains/core/time-gateway/ports/TimeGateway";

export const generateES256KeyPair = (): {
  publicKey: string;
  privateKey: string;
} =>
  generateKeyPairSync("ec", {
    namedCurve: "prime256v1", // This is the P-256 curve
    publicKeyEncoding: {
      type: "spki", // SubjectPublicKeyInfo format
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8", // Public-Key Cryptography Standards #8
      format: "pem",
    },
  });

export const makeThrowIfIncorrectJwt =
  <K extends JwtKind>(verfifyJwt: VerifyJwtFn<K>, timeGateway: TimeGateway) =>
  (code: string) => {
    try {
      verfifyJwt(code);
    } catch (error: any) {
      if (error?.message === "jwt expired") {
        const decoded = decodeJwtWithoutSignatureCheck<{ exp: number }>(code);
        const expiredSinceSeconds =
          Math.floor(timeGateway.now().getTime() / 1000) - decoded.exp;
        throw errors.user.expiredJwt(
          `${Math.ceil(expiredSinceSeconds / 60)} minutes`,
        );
      }
      throw errors.user.invalidJwt();
    }
  };

const stringToMd5 = (str: string) => {
  try {
    return createHash("md5").update(str).digest("hex");
  } catch (error) {
    Error.captureStackTrace(error as Error);
    throw error;
  }
};
export const makeEmailHash = (email: Email): string => stringToMd5(email);

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
    emailHash: makeEmailHash(email),
    ...(sub ? { sub } : {}),
  };
};
export const isSomeEmailMatchingEmailHash = (
  emails: Email[],
  emailHash: EmailHash,
): boolean => emails.some((email) => makeEmailHash(email) === emailHash);
