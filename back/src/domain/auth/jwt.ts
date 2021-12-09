import jwt from "jsonwebtoken";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";

const algo = "ES256";

export type GenerateJwtFn = (payload: MagicLinkPayload) => string;
export const makeGenerateJwt =
  (jwtPrivateKey: string): GenerateJwtFn =>
  (payload: MagicLinkPayload) =>
    jwt.sign(payload, jwtPrivateKey, { algorithm: algo });

export const makeVerifyJwt =
  <Payload>(jwtPublicKey: string) =>
  (jwtString: string) =>
    jwt.verify(jwtString, jwtPublicKey, {
      algorithms: [algo],
      complete: false,
    }) as Payload;
