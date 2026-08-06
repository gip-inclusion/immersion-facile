import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { Email } from "../email/email.dto";
import type { FederatedIdentityProvider } from "../federatedIdentities/federatedIdentity.dto";
import type { frontRoutes } from "../routes/routes";
import type { EmailAuthCodeJwt } from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";
import type { ExtractFromExisting } from "../utils";

export const allowedLoginSources = [
  "admin",
  "addAgency",
  "agencyDashboard",
  "agencyDashboardAgencyDetails",
  "archivedConventionRequest",
  "beneficiaryDashboard",
  "beneficiaryDashboardConventions",
  "beneficiaryDashboardDiscussions",
  "conventionTemplate",
  "establishmentDashboard",
  "establishmentDashboardDiscussions",
  "formEstablishment",
  "manageConventionConnectedUser",
  "myAccount",
] as const satisfies readonly (keyof typeof frontRoutes)[];
export type AllowedLoginSource = (typeof allowedLoginSources)[number];

export type AllowedFtRedirectRoute = ExtractFromExisting<
  keyof typeof frontRoutes,
  "conventionImmersion"
>;

export type AllowedRedirectUri = ReturnType<
  (typeof frontRoutes)[AllowedLoginSource]
>["href"];

export type ExternalId = Flavor<string, "ExternalId">;

export type IdToken = Flavor<string, "IdToken">;
export type IdentityProvider = Extract<
  FederatedIdentityProvider,
  "proConnect" | "email"
>;
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

export type OAuthProviderForLogin = Exclude<FederatedIdentityProvider, "email">;
export const oAuthProvidersForLogin = [
  "proConnect",
  "peConnect",
] as const satisfies OAuthProviderForLogin[];

export type InitiateLoginByOAuthParams = WithRedirectUri & {
  provider: OAuthProviderForLogin;
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
  provider: FederatedIdentityProvider;
  redirectUri: AbsoluteUrl;
};

export const authExpiredBaseMessage =
  "Le lien d'authentification fourni a expiré";

export const authExpiredMessage = (durationInMinutes?: number) =>
  durationInMinutes
    ? `${authExpiredBaseMessage} depuis ${durationInMinutes} minute${durationInMinutes > 1 ? "s" : ""}.`
    : `${authExpiredBaseMessage}.`;
