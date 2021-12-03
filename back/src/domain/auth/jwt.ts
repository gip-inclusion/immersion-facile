import jwt from "jsonwebtoken";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";

const algo = "ES256";

export type GenerateJwtFn = (payload: MagicLinkPayload) => string;
export const makeGenerateJwt =
  (jwtPrivateKey: string): GenerateJwtFn =>
  (payload: MagicLinkPayload) =>
    jwt.sign(payload, jwtPrivateKey, { algorithm: algo });

export const makeVerifyJwt =
  (jwtPublicKey: string) =>
  (
    jwtString: string,
    cb: (err: jwt.VerifyErrors | null, payload: any) => void,
  ) => {
    jwt.verify(
      jwtString,
      jwtPublicKey,
      {
        algorithms: [algo],
      },
      (err, payload) => {
        cb(err, payload);
      },
    );
  };
