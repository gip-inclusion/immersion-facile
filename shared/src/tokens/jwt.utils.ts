import { decode } from "js-base64";
import { currentJwtVersions, type UserId } from "..";
import type {
  ConventionJwtPayload,
  InclusionConnectJwtPayload,
} from "./jwtPayload.dto";

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

export const createInclusionConnectJwtPayload = ({
  userId,
  // biome-ignore lint/correctness/noUnusedVariables: it is used in other param
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
}): InclusionConnectJwtPayload => ({
  userId,
  iat,
  exp,
  version: currentJwtVersions.inclusion,
});
