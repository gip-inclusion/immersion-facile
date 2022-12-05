import {
  ConventionMagicLinkPayload,
  EstablishmentJwtPayload,
} from "./MagicLinkPayload";

export const decodeJwtWithoutSignatureCheck = <T>(jwtToken: string): T => {
  try {
    const payload: string = jwtToken.split(".")[1];
    // handle unicode parsing issues between atob and JWT base64 format
    const base64: string = payload.replace("-", "+").replace("_", "/");
    // decode and parse to json
    return JSON.parse(Buffer.from(base64, "base64").toString());
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
