import type { Email } from "../email/email.dto";
import type { EmailAuthCodeJwt } from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";

export type AllowedLoginSource = (typeof allowedLoginSources)[number];

export const allowedLoginSources = [
  "admin",
  "establishment",
  "establishmentDashboard",
  "establishmentDashboardDiscussions",
  "agencyDashboard",
  "addAgency",
] as const;

export type ExternalId = Flavor<string, "ExternalId">;

export type IdToken = Flavor<string, "IdToken">;
export type IdentityProvider = "proConnect" | "email";
export type OAuthState = Flavor<string, "OAuthState">;
export type OAuthCode = Flavor<string, "OAuthCode">;

export type OAuthSuccessLoginParams = {
  state: OAuthState;
  code: OAuthCode | EmailAuthCodeJwt;
};

export type AlreadyAuthenticatedUserQueryParams = {
  alreadyUsedAuthentication: boolean;
};

export type WithRedirectUri = {
  redirectUri: string;
};

export type InitiateLoginByEmailParams = WithRedirectUri & {
  email: Email;
};

export type WithIdToken = {
  idToken: IdToken;
};

export const authExpiredMessage =
  "Le jeton d'authentification (JWT) fourni a expiré.";
