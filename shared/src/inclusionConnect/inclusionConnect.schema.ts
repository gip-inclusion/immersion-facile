import { z } from "zod";
import { emailSchema } from "../email/email.schema";
import type {
  AuthenticateWithOAuthCodeParams,
  InitiateLoginByEmailParams,
  WithRedirectUri,
} from "./inclusionConnect.dto";

export const withRedirectUriSchema: z.Schema<WithRedirectUri> = z.object({
  redirectUri: z.string(),
});

export const initiateLoginByEmailParamsSchema: z.Schema<InitiateLoginByEmailParams> =
  z
    .object({
      email: emailSchema,
    })
    .and(withRedirectUriSchema);

export const authenticateWithOAuthCodeSchema: z.Schema<AuthenticateWithOAuthCodeParams> =
  z.object({
    code: z.string(),
    state: z.string(),
  });
