import { z } from "zod";

import {
  FederatedIdentity,
  federatedIdentityProviders,
  PeConnectIdentity,
} from "./federatedIdentity.dto";

export const federatedIdentitySchema: z.Schema<FederatedIdentity> = z.object({
  provider: z.enum(federatedIdentityProviders),
  token: z.string(),
});

export const peConnectIdentitySchema: z.Schema<PeConnectIdentity> = z.object({
  provider: z.literal("peConnect"),
  token: z.string(),
});
