import { takeWhile } from "ramda";
import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { emailSchema } from "../email/email.schema";
import type { FederatedIdentityProvider } from "../federatedIdentities/federatedIdentity.dto";
import { frontRoutes } from "../routes/routes";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  type AfterOAuthSuccessRedirectionResponse,
  type AllowedFtRedirectRoute,
  type AllowedLoginSource,
  allowedLoginSources,
  type InitiateLoginByEmailParams,
  type InitiateLoginByOAuthParams,
  type LogoutQueryParams,
  type OAuthProviderForLogin,
  type OAuthSuccessLoginParams,
  oAuthProvidersForLogin,
  type WithRedirectUri,
} from "./auth.dto";

export const getFrontRouteUriWithoutQueryParams = (
  route: (typeof frontRoutes)[AllowedLoginSource | AllowedFtRedirectRoute],
): string => {
  const [pathDef] = route["~internal"].pathDefs;

  const segments = takeWhile((segment) => !segment.namedParamDef, pathDef)
    .map((segment) => segment.leading)
    .filter(Boolean);

  return `/${segments.join("/")}`;
};

const isAllowedRedirectPath = (
  redirectPath: string,
  allowedPaths: (AllowedLoginSource | AllowedFtRedirectRoute)[],
) => {
  if (/^([a-zA-Z][a-zA-Z0-9+.-]*:)?\/\//.test(redirectPath)) {
    return false;
  }
  if (!redirectPath.startsWith("/")) {
    return false;
  }
  const [pathname] = redirectPath.split("?", 1);
  const cleanPath = decodeURIComponent(pathname);

  return allowedPaths.some((path) => {
    const allowedPath = getFrontRouteUriWithoutQueryParams(frontRoutes[path]);

    return cleanPath === allowedPath || cleanPath.startsWith(`${allowedPath}/`);
  });
};

export const withRedirectUriSchema: ZodSchemaWithInputMatchingOutput<WithRedirectUri> =
  z.object({
    redirectUri: z
      .string()
      .refine((uri) => isAllowedRedirectPath(uri, [...allowedLoginSources]), {
        message: "redirectUri is not allowed",
      }),
  });

export const initiateLoginByOAuthParamsSchema: ZodSchemaWithInputMatchingOutput<InitiateLoginByOAuthParams> =
  z.object({
    redirectUri: z
      .string()
      .refine(
        (uri) =>
          isAllowedRedirectPath(uri, [
            ...allowedLoginSources,
            "conventionImmersion",
          ]),
        {
          message: "redirectUri is not allowed",
        },
      ),
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

const oAuthProviderForLoginSchema: ZodSchemaWithInputMatchingOutput<OAuthProviderForLogin> =
  z.enum(["proConnect", "peConnect"]);

export const logoutQueryParamsSchema: ZodSchemaWithInputMatchingOutput<LogoutQueryParams> =
  z.object({
    idToken: z.string(),
    provider: oAuthProviderForLoginSchema,
  });

export const afterOAuthSuccessRedirectionResponseSchema: ZodSchemaWithInputMatchingOutput<AfterOAuthSuccessRedirectionResponse> =
  z.object({
    provider: z.enum(["proConnect", "email"]),
    redirectUri: absoluteUrlSchema,
  });

export const federatedIdentityProviderSchema: ZodSchemaWithInputMatchingOutput<FederatedIdentityProvider> =
  z.enum(["proConnect", "email", "peConnect"]);
