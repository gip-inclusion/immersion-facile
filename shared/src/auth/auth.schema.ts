import { z } from "zod";
import { emailSchema } from "../email/email.schema";
import { frontRoutes } from "../routes/route.utils";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  allowedLoginSources,
  type InitiateLoginByEmailParams,
  type OAuthSuccessLoginParams,
  type WithIdToken,
  type WithRedirectUri,
} from "./auth.dto";

export const allowedLoginUris = allowedLoginSources.map(
  (source) => frontRoutes[source],
) as [string, ...string[]];

export const withRedirectUriSchema: ZodSchemaWithInputMatchingOutput<WithRedirectUri> =
  z.object({
    redirectUri: z
      .string()
      .refine(
        (uri) =>
          allowedLoginUris.some((allowedUri) =>
            uri.startsWith(`/${allowedUri}`),
          ),
        {
          message: "redirectUri is not allowed",
        },
      ),
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
