import { z } from "zod";
import { FederatedIdentity } from "./federatedIdentity.dto";
import { noIdentityProvider } from "./noIdentityProvider.dto";
import { PeConnectIdentity } from "./peConnectIdentity.dto";

export const federatedIdentitySchema: z.Schema<FederatedIdentity> = z
  .enum([noIdentityProvider])
  .or(z.string().regex(/^peConnect:.+?$/) as z.Schema<PeConnectIdentity>)
  .or(
    z.string().regex(/^peConnect:AuthFailed$/) as z.Schema<PeConnectIdentity>,
  );
