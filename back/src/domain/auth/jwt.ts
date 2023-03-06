import jwt from "jsonwebtoken";
import {
  ApiConsumerJwtPayload,
  BackOfficeJwt,
  ConventionMagicLinkJwt,
  ConventionMagicLinkPayload,
  EstablishmentJwtPayload,
  Flavor,
} from "shared";

type AuthenticatedUserJwtPayload = {
  userId: string;
};
type BackOfficeJwtPayload = Record<string, never>;

export type GenerateConventionJwt = GenerateJwtFn<"convention">;
export type GenerateAuthenticatedUserJwt = GenerateJwtFn<"authenticatedUser">;
export type GenerateEditFormEstablishmentJwt =
  GenerateJwtFn<"editEstablishment">;
export type GenerateAdminJwt = GenerateJwtFn<"backOffice">;
export type GenerateApiConsumerJtw = GenerateJwtFn<"apiConsumer">;

type JwtTokenMapping<K extends string, T extends string, JwtPayload> = {
  token: T;
  kind: K;
  payload: JwtPayload;
};

type JwtMap =
  | JwtTokenMapping<
      "convention",
      ConventionMagicLinkJwt,
      ConventionMagicLinkPayload
    >
  | JwtTokenMapping<
      "editEstablishment",
      EditEstablishmentJwt,
      EstablishmentJwtPayload
    >
  | JwtTokenMapping<
      "authenticatedUser",
      AuthenticatedUserJwt,
      AuthenticatedUserJwtPayload
    >
  | JwtTokenMapping<"backOffice", BackOfficeJwt, BackOfficeJwtPayload>
  | JwtTokenMapping<"apiConsumer", ApiConsumerJwt, ApiConsumerJwtPayload>;

export type JwtKind = JwtMap["kind"];

type ApiConsumerJwt = Flavor<string, "ApiConsumerJwt">;
type EditEstablishmentJwt = Flavor<string, "EditEstablishmentJwt">;
type AuthenticatedUserJwt = Flavor<string, "AuthenticatedUserJwt">;

export type GenerateJwtFn<K extends JwtKind> = (
  payload: Extract<JwtMap, { kind: K }>["payload"],
  expiresInSeconds?: number,
) => Extract<JwtMap, { kind: K }>["token"];

// TODO see if typing can be improved
export const makeGenerateJwtES256 =
  <K extends JwtKind = never>(
    privateKey: string,
    defaultExpiresInSeconds: number | undefined,
  ): GenerateJwtFn<K> =>
  (payload: any, expiresInSeconds?: string | number) =>
    jwt.sign(payload, privateKey, {
      algorithm: "ES256",
      ...(!("exp" in payload) &&
      (expiresInSeconds !== undefined || defaultExpiresInSeconds)
        ? { expiresIn: expiresInSeconds ?? defaultExpiresInSeconds }
        : {}),
      //noTimestamp: true, //Remove iat on payload
    }) as any;

export const makeGenerateJwtHS256 = <K extends JwtKind = never>(
  secret: string,
  expiresIn: string,
): GenerateJwtFn<K> =>
  ((payload: any) =>
    jwt.sign(payload, secret, {
      algorithm: "HS256",
      ...(!("exp" in payload) ? { expiresIn } : {}),
    })) as any;

export type VerifyJwtFn<K extends JwtKind> = (
  jwt: Extract<JwtMap, { kind: K }>["token"],
) => JwtPayloadCommonFields & Extract<JwtMap, { kind: K }>["payload"];

export const makeVerifyJwtHS256 = <K extends JwtKind>(
  secret: string,
): VerifyJwtFn<K> =>
  ((jwtString: string) =>
    jwt.verify(jwtString, secret, {
      algorithms: ["HS256"],
      complete: false,
      ignoreExpiration: false,
    })) as any;

export const makeVerifyJwtES256 = <K extends JwtKind>(
  jwtPublicKey: string,
): VerifyJwtFn<K> =>
  ((jwtString: string) =>
    jwt.verify(jwtString, jwtPublicKey, {
      algorithms: ["ES256"],
      complete: false,
      ignoreExpiration: false,
    })) as any;

type JwtPayloadCommonFields = { exp: number; iat: number; version: number };
