import type { IdToken } from "../auth/auth.dto";
import type { ConnectedUserJwt } from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";

export type FederatedIdentityProvider =
  (typeof federatedIdentityProviders)[number];

export const federatedIdentityProviders = [
  "proConnect",
  "email",
  "ftConnect",
] as const;

export const isFederatedIdentityProvider = (
  provider: string,
): provider is FederatedIdentityProvider =>
  federatedIdentityProviders.includes(provider as FederatedIdentityProvider);

type GenericFederatedIdentity<
  Provider extends FederatedIdentityProvider,
  T extends FtConnectToken | ConnectedUserJwt,
  P = void,
> = Provider extends "ftConnect"
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

export type FtConnectAdvisorForBeneficiary = {
  advisor?: {
    email: string;
    firstName: string;
    lastName: string;
    type: "PLACEMENT" | "CAPEMPLOI" | "INDEMNISATION";
  };
};

export type FtConnectToken = FtExternalId | typeof authFailed;

export type FtConnectIdentity = GenericFederatedIdentity<
  "ftConnect",
  FtConnectToken,
  FtConnectAdvisorForBeneficiary
>;

export type FtConnectIdentityWithoutToken = Omit<FtConnectIdentity, "token">;

type ConnectedUserIdentity = GenericFederatedIdentity<
  "proConnect" | "email",
  ConnectedUserJwt
>;

export type FederatedIdentity = ConnectedUserIdentity;
