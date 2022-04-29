import type {
  EstablishmentJwtPayload,
  MagicLinkPayload,
} from "shared/src/tokens/MagicLinkPayload";

// jwt decode logic comming from : https://github.com/gustavo0197/react-jwt/blob/master/src/jwt/index.ts

export const decodeJwt = <T extends MagicLinkPayload | EstablishmentJwtPayload>(
  jwtToken: string,
): T => {
  try {
    const payload: string = jwtToken.split(".")[1];
    // handle unicode parsing issues between atob and JWT base64 format
    const base64: string = payload.replace("-", "+").replace("_", "/");
    // decode and parse to json
    return JSON.parse(window.atob(base64));
  } catch (error) {
    //eslint-disable-next-line no-console
    console.error(decodeJwt, error);
    throw new Error("401 Malformed JWT payload");
  }
};
