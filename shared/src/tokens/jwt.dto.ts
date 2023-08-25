import { Flavor } from "..";
import { PayloadKey } from "./jwtPayload.dto";

export type ApiConsumerJwt = Flavor<string, "ApiConsumerJwt">;
export type BackOfficeJwt = Flavor<string, "BackOfficeJwt">;
export type ConventionJwt = Flavor<string, "ConventionJwt">;
export type EstablishmentJwt = Flavor<string, "EstablishmentJwt">;
export type InclusionConnectJwt = Flavor<string, "InclusionConnectJwt">;

export type AppSupportedJwt =
  | ApiConsumerJwt
  | BackOfficeJwt
  | ConventionJwt
  | EstablishmentJwt
  | InclusionConnectJwt;

export type ConventionSupportedJwt =
  | ConventionJwt
  | BackOfficeJwt
  | InclusionConnectJwt;

export const currentJwtVersions: Record<PayloadKey, number> = {
  convention: 1,
  establishment: 1,
  backOffice: 1,
  inclusion: 1,
};

export type JwtDto = {
  jwt: AppSupportedJwt;
};
