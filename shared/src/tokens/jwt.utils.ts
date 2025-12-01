import { decode } from "js-base64";
import type { UserId } from "../user/user.dto";
import { safeParseJson } from "../utils/json";
import { currentJwtVersions } from "./jwt.dto";
import type {
  ConnectedUserJwtPayload,
  ConventionJwtPayload,
} from "./payload.dto";

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
  T extends ConventionJwtPayload | ConnectedUserJwtPayload,
>(
  jwtToken: string,
): T => decodeJwtWithoutSignatureCheck<T>(jwtToken);

export const createConnectedUserJwtPayload = ({
  userId,
  durationDays,
  now,
  iat = Math.round(now.getTime() / 1000),
  exp = iat + durationDays * 24 * 3600,
}: {
  userId: UserId;
  durationDays: number;
  now: Date;
  iat?: number;
  exp?: number;
}): ConnectedUserJwtPayload => ({
  userId,
  iat,
  exp,
  version: currentJwtVersions.connectedUser,
});

export const getJwtExpiredSinceInSeconds = (jwt: string, now: Date) => {
  const decoded = decodeJwtWithoutSignatureCheck<{ exp: number }>(jwt);
  const expiredSinceSeconds = Math.floor(now.getTime() / 1000) - decoded.exp;
  return expiredSinceSeconds > 0 ? expiredSinceSeconds : undefined;
};

export const handleJWTStringPossiblyContainingJsonError = (
  // JWT errors are wrongly formatted as JSON strings in back/src/utils/jwt.ts
  errorMessagePossiblyContainingJson: string,
) => {
  const parsedMessage = safeParseJson(errorMessagePossiblyContainingJson);
  const isMessageJsonError =
    parsedMessage !== null &&
    typeof parsedMessage === "object" &&
    "message" in parsedMessage;
  return isMessageJsonError
    ? (parsedMessage.message as string)
    : errorMessagePossiblyContainingJson;
};
