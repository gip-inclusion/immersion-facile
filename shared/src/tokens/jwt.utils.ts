import { decode } from "js-base64";
import type { UserId } from "../user/user.dto";
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
  T extends ConventionJwtPayload,
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
