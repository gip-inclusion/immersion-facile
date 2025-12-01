import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { emailSchema } from "../email/email.schema";
import { frontRoutes } from "../routes/route.utils";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  type AfterOAuthSuccessRedirectionResponse,
  type AlreadyAuthenticatedUserQueryParams,
  allowedLoginSources,
  type InitiateLoginByEmailParams,
  type OAuthSuccessLoginParams,
  type WithIdToken,
  type WithRedirectUri,
} from "./auth.dto";

export const allowedLoginUris = allowedLoginSources.map(
  (source) => frontRoutes[source],
) as [string, ...string[]];

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

export const withIdTokenSchema: ZodSchemaWithInputMatchingOutput<WithIdToken> =
  z.object({
    idToken: z.string(),
  });

export const alreadyAuthenticatedUserSchema: ZodSchemaWithInputMatchingOutput<AlreadyAuthenticatedUserQueryParams> =
  z.object({
    alreadyUsedAuthentication: z.literal(true),
  });

export const afterOAuthSuccessRedirectionResponseSchema: ZodSchemaWithInputMatchingOutput<AfterOAuthSuccessRedirectionResponse> =
  z.object({
    provider: z.enum(["proConnect", "email"]),
    redirectUri: absoluteUrlSchema,
  });
