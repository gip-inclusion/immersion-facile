import { z } from "zod";
import { allowedStartOAuthLoginPages } from "../routes/routes";
import type { AuthenticateWithOAuthCodeParams } from "./inclusionConnect.dto";

export const withSourcePageSchema = z.object({
  page: z.enum(allowedStartOAuthLoginPages),
});

export const authenticateWithOAuthCodeSchema: z.Schema<AuthenticateWithOAuthCodeParams> =
  z
    .object({
      code: z.string(),
      state: z.string(),
    })
    .and(withSourcePageSchema);
