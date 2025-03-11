import type { Flavor } from "..";
import type { PayloadKey } from "./jwtPayload.dto";

export type ApiConsumerJwt = Flavor<string, "ApiConsumerJwt">;
export type ConventionJwt = Flavor<string, "ConventionJwt">;
export type EstablishmentJwt = Flavor<string, "EstablishmentJwt">;
export type ConnectedUserJwt = Flavor<string, "ConnectedUserJwt">;

export type AppSupportedJwt =
  | ApiConsumerJwt
  | ConventionJwt
  | EstablishmentJwt
  | ConnectedUserJwt;

export type ConventionSupportedJwt = ConventionJwt | ConnectedUserJwt;

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
