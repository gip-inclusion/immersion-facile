import { Flavor } from "..";
import { PayloadKey } from "./jwtPayload.dto";

export type ApiConsumerJwt = Flavor<string, "ApiConsumerJwt">;
export type ConventionJwt = Flavor<string, "ConventionJwt">;
export type EstablishmentJwt = Flavor<string, "EstablishmentJwt">;
export type InclusionConnectJwt = Flavor<string, "InclusionConnectJwt">;

export type AppSupportedJwt =
  | ApiConsumerJwt
  | ConventionJwt
  | EstablishmentJwt
  | InclusionConnectJwt;

export type ConventionSupportedJwt = ConventionJwt | InclusionConnectJwt;

export const currentJwtVersions: Record<PayloadKey, number> = {
  convention: 1,
  establishment: 1,
  inclusion: 1,
  currentUser: 1, // useless, just for typecheck
};

export type JwtDto = {
  jwt: AppSupportedJwt;
};

export const expiredMagicLinkErrorMessage = "Le lien magique est périmé";
