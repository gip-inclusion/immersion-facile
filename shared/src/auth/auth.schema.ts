import { z } from "zod";
import type {
  FederatedIdentityProvider,
  LogoutQueryParams,
  OAuthProviderForLogin,
} from "..";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { emailSchema } from "../email/email.schema";
import { legacyFrontRoutes } from "../routes/routes";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  type AfterOAuthSuccessRedirectionResponse,
  allowedLoginSources,
  type InitiateLoginByEmailParams,
  type InitiateLoginByOAuthParams,
  type OAuthSuccessLoginParams,
  oAuthProvidersForLogin,
  type WithRedirectUri,
} from "./auth.dto";

export const allowedLoginUris: string[] = allowedLoginSources.map(
  (source) => legacyFrontRoutes[source],
);

const ftConnectAllowedOAuthRedirectUris: [string, ...string[]] = [
  legacyFrontRoutes.conventionImmersion,
];

export const allowedOAuthRedirectUris: [string, ...string[]] = [
  ...ftConnectAllowedOAuthRedirectUris,
  ...allowedLoginUris,
];

const isAllowedRedirectPath = (
  redirectPath: string,
  allowedPaths: typeof allowedLoginUris,
) => {
  if (/^([a-zA-Z][a-zA-Z0-9+.-]*:)?\/\//.test(redirectPath)) {
    return false;
  }
  if (!redirectPath.startsWith("/")) {
    return false;
  }
  const [pathname] = redirectPath.split("?", 1);
  const cleanPath = decodeURIComponent(pathname);
  return allowedPaths.some(
    (allowed) =>
      cleanPath === `/${allowed}` || cleanPath.startsWith(`/${allowed}/`),
  );
};

export const withRedirectUriSchema: ZodSchemaWithInputMatchingOutput<WithRedirectUri> =
  z.object({
    redirectUri: z
      .string()
      .refine((uri) => isAllowedRedirectPath(uri, allowedLoginUris), {
        message: "redirectUri is not allowed",
      }),
  });

export const initiateLoginByOAuthParamsSchema: ZodSchemaWithInputMatchingOutput<InitiateLoginByOAuthParams> =
  z.object({
    redirectUri: z
      .string()
      .refine((uri) => isAllowedRedirectPath(uri, allowedOAuthRedirectUris), {
        message: "redirectUri is not allowed",
      }),
    provider: z.enum(oAuthProvidersForLogin),
  });

export const initiateLoginByEmailParamsSchema: ZodSchemaWithInputMatchingOutput<InitiateLoginByEmailParams> =
  z
    .object({
      email: emailSchema,
    })
    .and(withRedirectUriSchema);

export const oAuthSuccessLoginParamsSchema: ZodSchemaWithInputMatchingOutput<OAuthSuccessLoginParams> =
  z.object({
    code: z.string(),
    state: z.string(),
  });

const oauthProviderSchema: ZodSchemaWithInputMatchingOutput<OAuthProviderForLogin> =
  z.enum(["proConnect", "peConnect"]);

export const logoutQueryParamsSchema: ZodSchemaWithInputMatchingOutput<LogoutQueryParams> =
  z.object({
    idToken: z.string(),
    provider: oauthProviderSchema,
  });

export const afterOAuthSuccessRedirectionResponseSchema: ZodSchemaWithInputMatchingOutput<AfterOAuthSuccessRedirectionResponse> =
  z.object({
    provider: z.enum(["proConnect", "email"]),
    redirectUri: absoluteUrlSchema,
  });

export const federatedIdentityProviderSchema: ZodSchemaWithInputMatchingOutput<FederatedIdentityProvider> =
  z.enum(["proConnect", "email", "peConnect"]);
