import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { Email } from "../email/email.dto";
import type { FederatedIdentityProvider } from "../federatedIdentities/federatedIdentity.dto";
import type { frontRoutes } from "../routes/route.utils";
import type { EmailAuthCodeJwt } from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";

export type AllowedLoginSource = (typeof allowedLoginSources)[number];
export type AllowedRedirectUri = (typeof frontRoutes)[AllowedLoginSource];

export const allowedLoginSources = [
  "admin",
  "establishment",
  "establishmentDashboard",
  "establishmentDashboardDiscussions",
  "agencyDashboard",
  "addAgency",
  "manageConventionUserConnected",
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
  redirectUri: AllowedRedirectUri;
};

export type InitiateLoginByEmailParams = WithRedirectUri & {
  email: Email;
};

export type LogoutQueryParams = WithIdToken & {
  provider: FederatedIdentityProvider;
};

export type WithIdToken = {
  idToken: IdToken;
};

export type AfterOAuthSuccessRedirectionResponse = {
  provider: IdentityProvider;
  redirectUri: AbsoluteUrl;
};

export const authExpiredBaseMessage =
  "Le lien d'authentification fourni a expiré";

export const authExpiredMessage = (durationInMinutes?: number) =>
  durationInMinutes
    ? `${authExpiredBaseMessage} depuis ${durationInMinutes} minute${durationInMinutes > 1 ? "s" : ""}.`
    : `${authExpiredBaseMessage}.`;
