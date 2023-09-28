import { z } from "zod";
import { PeConnectIdentity } from "./federatedIdentity.dto";

export const peConnectIdentitySchema: z.Schema<PeConnectIdentity> = z.object({
  provider: z.literal("peConnect"),
  token: z.string(),
  payload: z
    .object({
      email: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      type: z.enum(["PLACEMENT", "CAPEMPLOI", "INDEMNISATION"]),
    })
    .optional(),
});
