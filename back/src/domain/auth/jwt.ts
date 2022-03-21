import jwt from "jsonwebtoken";
import {
  EstablishmentJwtPayload,
  PayloadOption,
} from "../../shared/tokens/MagicLinkPayload";
import { WithApiConsumerId } from "../core/valueObjects/ApiConsumer";

const algo = "ES256";

type AnyObject = Record<string, unknown>;

export type GenerateMagicLinkJwt = GenerateJwtFn<PayloadOption>;
export type GenerateEditFormEstablishmentUrl =
  GenerateJwtFn<EstablishmentJwtPayload>;

export type GenerateApiConsumerJtw = GenerateJwtFn<WithApiConsumerId>;

// prettier-ignore
export type GenerateJwtFn<Payload extends AnyObject> = (payload: Payload) => string;
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
      ignoreExpiration: false,
    }) as Payload;
