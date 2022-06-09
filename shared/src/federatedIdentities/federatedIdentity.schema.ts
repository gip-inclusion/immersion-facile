import { z } from "zod";
import { NoIdentityProvider, PeConnectIdentity } from "./federatedIdentity.dto";

const noIdentityProvider: NoIdentityProvider = "noIdentityProvider";

export const peConnectPrefixSchema = z
  .enum([noIdentityProvider])
  .or(z.string().regex(/^peConnect:.+?$/) as z.Schema<PeConnectIdentity>);
