import jwt from "jsonwebtoken";
import { AppConfig } from "../../adapters/primary/appConfig";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";
import { WithApiConsumerId } from "../core/valueObjects/ApiConsumer";

const algo = "ES256";

type AnyObject = Record<string, unknown>;

export type GenerateMagicLinkJwt = GenerateJwtFn<MagicLinkPayload>;
export type GenerateApiConsumerJtw = GenerateJwtFn<WithApiConsumerId>;

// prettier-ignore
type GenerateJwtFn<Payload extends AnyObject> = (payload: Payload) => string;
export const makeGenerateJwt =
  <P extends AnyObject>(privateKey: string): GenerateJwtFn<P> =>
  (payload) =>
    jwt.sign(payload, privateKey, {
      algorithm: algo,
      noTimestamp: true,
    });

export const makeVerifyJwt =
  <Payload>(jwtPublicKey: string) =>
  (jwtString: string) =>
    jwt.verify(jwtString, jwtPublicKey, {
      algorithms: [algo],
      complete: false,
    }) as Payload;
