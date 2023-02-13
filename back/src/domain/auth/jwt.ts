import jwt from "jsonwebtoken";
import {
  EstablishmentJwtPayload,
  PayloadOption,
  WithApiConsumerId,
} from "shared";

type AnyObject = Record<string, unknown>;

export type GenerateAuthenticatedUserJwt = GenerateJwtFn<{ userId: string }>;
export type GenerateMagicLinkJwt = GenerateJwtFn<PayloadOption>;
export type GenerateEditFormEstablishmentUrl =
  GenerateJwtFn<EstablishmentJwtPayload>;
export type GenerateAdminJwt = GenerateJwtFn<{ version: number }>;

export type GenerateApiConsumerJtw = GenerateJwtFn<WithApiConsumerId>;

// prettier-ignore
export type GenerateJwtFn<Payload extends AnyObject> = (payload: Payload, expiresInSeconds?: number) => string;
export const makeGenerateJwtES256 =
  <P extends AnyObject>(
    privateKey: string,
    defaultExpiresInSeconds?: number,
  ): GenerateJwtFn<P> =>
  (payload, expiresInSeconds?: number) =>
    jwt.sign(payload, privateKey, {
      algorithm: "ES256",
      ...(expiresInSeconds !== undefined || defaultExpiresInSeconds
        ? { expiresIn: expiresInSeconds ?? defaultExpiresInSeconds }
        : {}),
      //noTimestamp: true, //Remove iat on payload
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
  <P extends AnyObject>(secret: string, expiresIn: string): GenerateJwtFn<P> =>
  (payload) =>
    jwt.sign(payload, secret, {
      algorithm: "HS256",
      expiresIn,
    });

export const makeVerifyJwtHS256 =
  <Payload>(secret: string) =>
  (jwtString: string) =>
    jwt.verify(jwtString, secret, {
      algorithms: ["HS256"],
      complete: false,
      ignoreExpiration: false,
    }) as Payload;
