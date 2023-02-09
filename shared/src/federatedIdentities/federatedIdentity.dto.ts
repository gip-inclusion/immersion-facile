import { Flavor } from "../typeFlavors";

export type FederatedIdentityProvider =
  (typeof federatedIdentityProviders)[number];
export const federatedIdentityProviders = [
  "inclusionConnect",
  "peConnect",
] as const;

type GenericFederatedIdentity<P extends FederatedIdentityProvider> = {
  provider: P;
  token: string;
};

export const authFailed = "AuthFailed";
export type PeExternalId = Flavor<string, "PeExternalId">;
export type PeConnectIdentity = GenericFederatedIdentity<"peConnect">;
export const isPeConnectIdentity = (
  federatedIdentity: FederatedIdentity | undefined,
): federatedIdentity is PeConnectIdentity =>
  federatedIdentity?.provider === "peConnect";

export type InclusionConnectIdentity =
  GenericFederatedIdentity<"inclusionConnect">;

export type FederatedIdentity = InclusionConnectIdentity | PeConnectIdentity;

// export type ConventionFederatedIdentityString =
//   | `${PeConnectIdentity["provider"]}:${string}`;

// export const convertStringToFederatedIdentity = (
//   federatedIdentityString: ConventionFederatedIdentityString,
// ): FederatedIdentity => {
//   const [, token] = federatedIdentityString.split(":");
//   return {
//     provider: "peConnect",
//     token,
//   };
// };
