import { z } from "zod";
import { emailSchema } from "../email/email.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type {
  InitiateLoginByEmailParams,
  OAuthSuccessLoginParams,
  WithIdToken,
  WithRedirectUri,
} from "./auth.dto";

export const withRedirectUriSchema: ZodSchemaWithInputMatchingOutput<WithRedirectUri> =
  z.object({
    redirectUri: z.string(),
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
