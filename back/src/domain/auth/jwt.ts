import jwt from "jsonwebtoken";
import { AppConfig } from "../../adapters/primary/appConfig";
import { ApiConsumer } from "../../shared/tokens/ApiConsumer";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";

const algo = "ES256";

type AnyObject = Record<string, unknown>;

export type GenerateMagicLinkJwt = GenerateJwtFn<MagicLinkPayload>;
export type GenerateApiConsumerJtw = GenerateJwtFn<ApiConsumer>;

// prettier-ignore
type GenerateJwtFn<Payload extends AnyObject> = (payload: Payload) => string;
export const makeGenerateJwt =
  <P extends AnyObject>(config: AppConfig): GenerateJwtFn<P> =>
  (payload) =>
    jwt.sign(payload, config.jwtPrivateKey, { algorithm: algo });

export const makeVerifyJwt =
  <Payload>(jwtPublicKey: string) =>
  (jwtString: string) =>
    jwt.verify(jwtString, jwtPublicKey, {
      algorithms: [algo],
      complete: false,
    }) as Payload;
