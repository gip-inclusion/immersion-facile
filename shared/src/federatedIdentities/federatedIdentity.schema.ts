import { z } from "zod";
import { FtConnectIdentity } from "./federatedIdentity.dto";

export const peConnectIdentitySchema: z.Schema<FtConnectIdentity> = z.object({
  provider: z.literal("peConnect"),
  token: z.string(),
  payload: z
    .object({
      advisor: z.object({
        email: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        type: z.enum(["PLACEMENT", "CAPEMPLOI", "INDEMNISATION"]),
      }),
    })
    .optional(),
});
