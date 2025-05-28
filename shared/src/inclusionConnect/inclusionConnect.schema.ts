import { z } from "zod";
import { emailSchema } from "../email/email.schema";
import { allowedStartOAuthLoginPages } from "../routes/routes";
import type {
  AuthenticateWithOAuthCodeParams,
  InitiateLoginByEmailParams,
  WithSourcePage,
} from "./inclusionConnect.dto";

export const withSourcePageSchema: z.Schema<WithSourcePage> = z.object({
  page: z.enum(allowedStartOAuthLoginPages),
});

export const initiateLoginByEmailParamsSchema: z.Schema<InitiateLoginByEmailParams> =
  withSourcePageSchema.and(
    z.object({
      email: emailSchema,
    }),
  );

export const authenticateWithOAuthCodeSchema: z.Schema<AuthenticateWithOAuthCodeParams> =
  z
    .object({
      code: z.string(),
      state: z.string(),
    })
    .and(withSourcePageSchema);
