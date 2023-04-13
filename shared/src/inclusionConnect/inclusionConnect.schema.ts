import { z } from "zod";

import { AuthenticateWithInclusionCodeConnectParams } from "./inclusionConnect.dto";

export const authenticateWithInclusionCodeSchema: z.Schema<AuthenticateWithInclusionCodeConnectParams> =
  z.object({
    code: z.string(),
    state: z.string(),
  });
