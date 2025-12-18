import type { IdToken } from "../auth/auth.dto";
import type { ConnectedUserJwt } from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";

export type FederatedIdentityProvider =
  (typeof federatedIdentityProviders)[number];

export type FederatedIdentityProviderWithLogoutCallback =
  (typeof federatedIdentityProvidersWithLogoutCallback)[number];

export const federatedIdentityProvidersWithLogoutCallback = [
  "proConnect",
  "email",
  "peConnect",
] as const;

export const federatedIdentityProviders = [
  ...federatedIdentityProvidersWithLogoutCallback,
  "email",
] as const;

export const isFederatedIdentityProvider = (
  provider: string,
): provider is FederatedIdentityProvider =>
  federatedIdentityProviders.includes(provider as FederatedIdentityProvider);

export const isFederatedIdentityProviderWithLogoutCallback = (
  provider: string,
): provider is FederatedIdentityProviderWithLogoutCallback =>
  federatedIdentityProvidersWithLogoutCallback.includes(
    provider as FederatedIdentityProviderWithLogoutCallback,
  );

type GenericFederatedIdentity<
  Provider extends FederatedIdentityProvider,
  T extends FtConnectToken | ConnectedUserJwt,
  P = void,
> = Provider extends "peConnect"
  ? {
      provider: Provider;
      token: T;
      payload?: P;
    }
  : {
      provider: Provider;
      token: T;
      payload?: P;
      idToken: IdToken;
    };

export const authFailed = "AuthFailed";

export type FtExternalId = Flavor<string, "FtExternalId">;

type FtConnectAdvisorForBeneficiary = {
  advisor?: {
    email: string;
    firstName: string;
    lastName: string;
    type: "PLACEMENT" | "CAPEMPLOI" | "INDEMNISATION";
  };
};

export type FtConnectToken = FtExternalId | typeof authFailed;

export type FtConnectIdentity = GenericFederatedIdentity<
  "peConnect",
  FtConnectToken,
  FtConnectAdvisorForBeneficiary
>;
export const isFtConnectIdentity = (
  federatedIdentity: FederatedIdentity | undefined,
): federatedIdentity is FtConnectIdentity =>
  federatedIdentity?.provider === "peConnect";

type ConnectedUserIdentity = GenericFederatedIdentity<
  "proConnect" | "email",
  ConnectedUserJwt
>;

export type FederatedIdentity = ConnectedUserIdentity | FtConnectIdentity;
