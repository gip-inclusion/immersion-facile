import { z } from "zod";
import {
  FederatedIdentity,
  federatedIdentityProviders,
} from "./federatedIdentity.dto";

export const federatedIdentitySchema: z.Schema<FederatedIdentity> = z.object({
  provider: z.enum(federatedIdentityProviders),
  token: z.string(),
});
