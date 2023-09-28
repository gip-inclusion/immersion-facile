import { InclusionConnectJwt } from "../tokens/jwt.dto";
import { Flavor } from "../typeFlavors";

export type FederatedIdentityProvider =
  (typeof federatedIdentityProviders)[number];

export const federatedIdentityProviders = [
  "inclusionConnect",
  "peConnect",
] as const;

type GenericFederatedIdentity<
  Provider extends FederatedIdentityProvider,
  T extends PeConnectToken | InclusionConnectJwt,
  P,
> = {
  provider: Provider;
  token: T;
  payload?: P;
};

export const authFailed = "AuthFailed";
export const notJobSeeker = "NotJobSeeker";

export type PeExternalId = Flavor<string, "PeExternalId">;

type PeConnectAdvisorDtoInFront = {
  email: string;
  firstName: string;
  lastName: string;
  type: "PLACEMENT" | "CAPEMPLOI" | "INDEMNISATION";
};

export type PeConnectToken =
  | PeExternalId
  | typeof authFailed
  | typeof notJobSeeker;

export type PeConnectIdentity = GenericFederatedIdentity<
  "peConnect",
  PeConnectToken,
  PeConnectAdvisorDtoInFront
>;
export const isPeConnectIdentity = (
  federatedIdentity: FederatedIdentity | undefined,
): federatedIdentity is PeConnectIdentity =>
  federatedIdentity?.provider === "peConnect";

export type InclusionConnectIdentity = GenericFederatedIdentity<
  "inclusionConnect",
  InclusionConnectJwt,
  never
>;

export type FederatedIdentity = InclusionConnectIdentity | PeConnectIdentity;
