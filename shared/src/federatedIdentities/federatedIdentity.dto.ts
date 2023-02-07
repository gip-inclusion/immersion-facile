import { Flavor } from "../typeFlavors";

type FederatedIdentityProvider =
  | "inclusionConnect"
  | "peConnect"
  | "noIdentityProvider";

type GenericFederatedIdentity<
  P extends FederatedIdentityProvider,
  Token extends string | null,
> = {
  provider: P;
  token: Token;
};

export const authFailed = "AuthFailed";
export type PeExternalId = Flavor<string, "PeExternalId">;
export type PeConnectIdentity = GenericFederatedIdentity<
  "peConnect",
  typeof authFailed | string
>;
export const isPeConnectIdentity = (
  federatedIdentity: FederatedIdentity | undefined,
): federatedIdentity is PeConnectIdentity =>
  federatedIdentity?.provider === "peConnect";

export const noIdentityProvider = "noIdentityProvider";
export type NoIdentity = GenericFederatedIdentity<
  typeof noIdentityProvider,
  null
>;

export type InclusionConnectIdentity = GenericFederatedIdentity<
  "inclusionConnect",
  string
>;

export type FederatedIdentity =
  | InclusionConnectIdentity
  | PeConnectIdentity
  | NoIdentity;

export type ConventionFederatedIdentityString =
  | typeof noIdentityProvider
  | `${PeConnectIdentity["provider"]}:${string}`;

export const convertStringToFederatedIdentity = (
  federatedIdentityString: ConventionFederatedIdentityString,
): FederatedIdentity => {
  if (federatedIdentityString === "noIdentityProvider")
    return { provider: "noIdentityProvider", token: null };

  const [, token] = federatedIdentityString.split(":");
  return {
    provider: "peConnect",
    token,
  };
};
