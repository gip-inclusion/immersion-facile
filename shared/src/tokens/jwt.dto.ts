import type { Flavor } from "..";
import type { PayloadKind } from "./payload.dto";

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

export const currentJwtVersions: Record<PayloadKind, number> = {
  convention: 1,
  connectedUser: 1,
  currentUser: 1, // useless, just for typecheck
};

export type JwtDto = {
  jwt: AppSupportedJwt;
};

export const expiredMagicLinkErrorMessage = "Le lien magique est périmé";
export const unsupportedMagicLinkErrorMessage =
  "Le lien magique est n'est pas valide";
