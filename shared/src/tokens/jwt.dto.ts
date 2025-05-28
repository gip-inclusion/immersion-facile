import type { Flavor } from "..";
import type { PayloadKey } from "./jwtPayload.dto";

export type ApiConsumerJwt = Flavor<string, "ApiConsumerJwt">;
export type ConventionJwt = Flavor<string, "ConventionJwt">;
export type ConnectedUserJwt = Flavor<string, "ConnectedUserJwt">;
export type EmailAuthCodeJwt = Flavor<string, "EmailAuthCodeJwt">;

export type AppSupportedJwt =
  | ApiConsumerJwt
  | ConventionJwt
  | ConnectedUserJwt
  | EmailAuthCodeJwt;

export type ConventionSupportedJwt = ConventionJwt | ConnectedUserJwt;

export const currentJwtVersions: Record<PayloadKey, number> = {
  convention: 1,
  inclusion: 1,
  currentUser: 1, // useless, just for typecheck
};

export type JwtDto = {
  jwt: AppSupportedJwt;
};

export const expiredMagicLinkErrorMessage = "Le lien magique est périmé";
