import { z } from "zod";
import { emailSchema } from "../email/email.schema";
import type {
  InitiateLoginByEmailParams,
  OAuthSuccessLoginParams,
  WithIdToken,
  WithRedirectUri,
} from "./auth.dto";

export const withRedirectUriSchema: z.Schema<WithRedirectUri> = z.object({
  redirectUri: z.string(),
});

export const initiateLoginByEmailParamsSchema: z.Schema<InitiateLoginByEmailParams> =
  z
    .object({
      email: emailSchema,
    })
    .and(withRedirectUriSchema);

export const oAuthSuccessLoginParamsSchema: z.Schema<OAuthSuccessLoginParams> =
  z.object({
    code: z.string(),
    state: z.string(),
  });

export const withIdTokenSchema: z.Schema<WithIdToken> = z.object({
  idToken: z.string(),
});
