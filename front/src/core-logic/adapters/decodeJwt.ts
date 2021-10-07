import type { MagicLinkPayload } from "src/shared/tokens/MagicLinkPayload";

// jwt decode logic comming from : https://github.com/gustavo0197/react-jwt/blob/master/src/jwt/index.ts

export const decodeJwt = (jwtToken: string): MagicLinkPayload => {
  try {
    const payload: string = jwtToken.split(".")[1];
    // handle unicode parsing issues between atob and JWT base64 format
    const base64: string = payload.replace("-", "+").replace("_", "/");
    // decode and parse to json
    return JSON.parse(window.atob(base64));
  } catch (error) {
    console.error(error);
    throw new Error("401 Malformed JWT payload");
  }
};
