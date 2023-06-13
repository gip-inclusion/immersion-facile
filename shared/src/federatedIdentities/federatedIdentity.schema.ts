import { z } from "zod";
import { PeConnectIdentity } from "./federatedIdentity.dto";

export const peConnectIdentitySchema: z.Schema<PeConnectIdentity> = z.object({
  provider: z.literal("peConnect"),
  token: z.string(),
});
