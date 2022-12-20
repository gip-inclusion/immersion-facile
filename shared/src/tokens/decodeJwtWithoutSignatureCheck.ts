import { decode } from "js-base64";
import {
  ConventionMagicLinkPayload,
  EstablishmentJwtPayload,
} from "./MagicLinkPayload";

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
