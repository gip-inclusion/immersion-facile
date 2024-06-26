import { z } from "zod";
import { allowedStartInclusionConnectLoginPages } from "../routes/routes";
import { AuthenticateWithInclusionCodeConnectParams } from "./inclusionConnect.dto";

export const withSourcePageSchema = z.object({
  page: z.enum(allowedStartInclusionConnectLoginPages),
});

export const authenticateWithInclusionCodeSchema: z.Schema<AuthenticateWithInclusionCodeConnectParams> =
  z
    .object({
      code: z.string(),
      state: z.string(),
    })
    .and(withSourcePageSchema);
