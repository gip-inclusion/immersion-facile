import { z } from "zod";
import { allowedStartInclusionConnectLoginPages } from "../routes/routes";
import { AuthenticateWithOAuthCodeParams } from "./inclusionConnect.dto";

export const withSourcePageSchema = z.object({
  page: z.enum(allowedStartInclusionConnectLoginPages),
});

export const authenticateWithOAuthCodeSchema: z.Schema<AuthenticateWithOAuthCodeParams> =
  z
    .object({
      code: z.string(),
      state: z.string(),
    })
    .and(withSourcePageSchema);
