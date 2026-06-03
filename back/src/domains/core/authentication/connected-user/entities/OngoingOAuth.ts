import type {
  Email,
  ExternalId,
  ExtractFromExisting,
  FederatedIdentityProvider,
  Flavor,
  OAuthState,
} from "shared";

export type OAuthJwt = Flavor<string, "OAuthJwt">;
export type OAuthNonce = Flavor<string, "OAuthNonce">;

export type OngoingOAuthProvider = "proConnect" | "email" | "peConnect";

type OngoingAuthCommon = {
  userId?: string;
  state: OAuthState;
  nonce: OAuthNonce;
  usedAt: Date | null;
  fromUri: string;
  updatedAt?: Date;
};

export type EmailOngoingAuth = OngoingAuthCommon & {
  provider: ExtractFromExisting<FederatedIdentityProvider, "email">;
  email: Email;
};
export type ProConnectOngoingAuth = OngoingAuthCommon & {
  provider: ExtractFromExisting<FederatedIdentityProvider, "proConnect">;
  externalId?: ExternalId;
  accessToken?: OAuthJwt; //TODO Pourquoi on le stocke en DB (on ne fait que le save)
};
export type FTConnectOngoingAuth = OngoingAuthCommon & {
  provider: ExtractFromExisting<FederatedIdentityProvider, "peConnect">;
  externalId?: ExternalId;
  accessToken?: OAuthJwt;
};

export type OngoingOAuth =
  | ProConnectOngoingAuth
  | EmailOngoingAuth
  | FTConnectOngoingAuth;
