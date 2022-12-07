import { z } from "zod";
import {
  FederatedIdentity,
  NoIdentityProvider,
  PeConnectIdentity,
} from "./federatedIdentity.dto";

const noIdentityProvider: NoIdentityProvider = "noIdentityProvider";

export const federatedIdentitySchema: z.Schema<FederatedIdentity> = z
  .enum([noIdentityProvider])
  .or(z.string().regex(/^peConnect:.+?$/) as z.Schema<PeConnectIdentity>)
  .or(
    z.string().regex(/^peConnect:AuthFailed$/) as z.Schema<PeConnectIdentity>,
  );
