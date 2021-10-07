import jwt from "jsonwebtoken";
import { ENV } from "../../adapters/primary/environmentVariables";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";

const algo = "ES256";

export const generateJwt = (payload: MagicLinkPayload) => {
  return jwt.sign(payload, ENV.jwtPrivateKey, { algorithm: algo });
};

export const verifyJwt = (
  jwtString: string,
  cb: (err: jwt.VerifyErrors | null, payload: MagicLinkPayload) => void,
) => {
  jwt.verify(
    jwtString,
    ENV.jwtPublicKey,
    {
      algorithms: [algo],
    },
    (err, payload) => {
      cb(err, payload as MagicLinkPayload);
    },
  );
};
