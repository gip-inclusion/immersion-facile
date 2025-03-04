import { IdToken } from "../inclusionConnect/inclusionConnect.dto";
import { ConnectedUserJwt } from "../tokens/jwt.dto";
import { Flavor } from "../typeFlavors";

export type FederatedIdentityProvider =
  (typeof federatedIdentityProviders)[number];

export const federatedIdentityProviders = [
  "connectedUser",
  "peConnect",
] as const;

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
export const notJobSeeker = "NotJobSeeker";

export type FtExternalId = Flavor<string, "FtExternalId">;

type FtConnectAdvisorForBeneficiary = {
  advisor: {
    email: string;
    firstName: string;
    lastName: string;
    type: "PLACEMENT" | "CAPEMPLOI" | "INDEMNISATION";
  };
};

export type FtConnectToken =
  | FtExternalId
  | typeof authFailed
  | typeof notJobSeeker;

export type FtConnectIdentity = GenericFederatedIdentity<
  "peConnect",
  FtConnectToken,
  FtConnectAdvisorForBeneficiary
>;
export const isFtConnectIdentity = (
  federatedIdentity: FederatedIdentity | undefined,
): federatedIdentity is FtConnectIdentity =>
  federatedIdentity?.provider === "peConnect";

export type ConnectedUserIdentity = GenericFederatedIdentity<
  "connectedUser",
  ConnectedUserJwt
>;

export type FederatedIdentity = ConnectedUserIdentity | FtConnectIdentity;
