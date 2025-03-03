import { Flavor } from "..";
import { PayloadKey } from "./jwtPayload.dto";

export type ApiConsumerJwt = Flavor<string, "ApiConsumerJwt">;
export type ConventionJwt = Flavor<string, "ConventionJwt">;
export type EstablishmentJwt = Flavor<string, "EstablishmentJwt">;
export type ProConnectJwt = Flavor<string, "ProConnectJwt">;

export type AppSupportedJwt =
  | ApiConsumerJwt
  | ConventionJwt
  | EstablishmentJwt
  | ProConnectJwt;

export type ConventionSupportedJwt = ConventionJwt | ProConnectJwt;

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
