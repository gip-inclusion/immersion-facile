import { InclusionConnectJwt } from "../tokens/jwt.dto";
import { Flavor } from "../typeFlavors";

export type FederatedIdentityProvider =
  (typeof federatedIdentityProviders)[number];

export const federatedIdentityProviders = [
  "inclusionConnect",
  "peConnect",
] as const;

type GenericFederatedIdentity<
  P extends FederatedIdentityProvider,
  T extends PeConnectToken | InclusionConnectJwt,
> = {
  provider: P;
  token: T;
};

export const authFailed = "AuthFailed";
export const notJobSeeker = "NotJobSeeker";

export type PeExternalId = Flavor<string, "PeExternalId">;

export type PeConnectToken =
  | PeExternalId
  | typeof authFailed
  | typeof notJobSeeker;

export type PeConnectIdentity = GenericFederatedIdentity<
  "peConnect",
  PeConnectToken
>;
export const isPeConnectIdentity = (
  federatedIdentity: FederatedIdentity | undefined,
): federatedIdentity is PeConnectIdentity =>
  federatedIdentity?.provider === "peConnect";

export type InclusionConnectIdentity = GenericFederatedIdentity<
  "inclusionConnect",
  InclusionConnectJwt
>;

export type FederatedIdentity = InclusionConnectIdentity | PeConnectIdentity;
