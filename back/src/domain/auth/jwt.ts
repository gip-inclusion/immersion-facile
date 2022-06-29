import jwt from "jsonwebtoken";
import {
  EstablishmentJwtPayload,
  PayloadOption,
} from "shared/src/tokens/MagicLinkPayload";
import { WithApiConsumerId } from "../core/valueObjects/ApiConsumer";

type AnyObject = Record<string, unknown>;

export type GenerateMagicLinkJwt = GenerateJwtFn<PayloadOption>;
export type GenerateEditFormEstablishmentUrl =
  GenerateJwtFn<EstablishmentJwtPayload>;
export type GenerateAdminJwt = GenerateJwtFn<{ expiresIn: string }>;

export type GenerateApiConsumerJtw = GenerateJwtFn<WithApiConsumerId>;

// prettier-ignore
export type GenerateJwtFn<Payload extends AnyObject> = (payload: Payload) => string;
export const makeGenerateJwtES256 =
  <P extends AnyObject>(privateKey: string): GenerateJwtFn<P> =>
  (payload) =>
    jwt.sign(payload, privateKey, {
      algorithm: "ES256",
      noTimestamp: true,
    });

export const makeVerifyJwtES256 =
  <Payload>(jwtPublicKey: string) =>
  (jwtString: string) =>
    jwt.verify(jwtString, jwtPublicKey, {
      algorithms: ["ES256"],
      complete: false,
      ignoreExpiration: false,
    }) as Payload;

export const makeGenerateJwtHS256 =
  <P extends AnyObject>(secret: string): GenerateJwtFn<P> =>
  (payload) =>
    jwt.sign(payload, secret, {
      algorithm: "HS256",
      noTimestamp: true,
    });

export const makeVerifyJwtHS256 =
  <Payload>(secret: string) =>
  (jwtString: string) =>
    jwt.verify(jwtString, secret, {
      algorithms: ["HS256"],
      complete: false,
      ignoreExpiration: false,
    }) as Payload;
