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

export type InclusionConnectIdentity = GenericFederatedIdentity<
  "inclusionConnect",
  string
>;

export type FederatedIdentity = InclusionConnectIdentity | PeConnectIdentity;

export type ConventionFederatedIdentityString =
  | `${PeConnectIdentity["provider"]}:${string}`;

export const convertStringToFederatedIdentity = (
  federatedIdentityString: ConventionFederatedIdentityString,
): FederatedIdentity => {
  const [, token] = federatedIdentityString.split(":");
  return {
    provider: "peConnect",
    token,
  };
};
