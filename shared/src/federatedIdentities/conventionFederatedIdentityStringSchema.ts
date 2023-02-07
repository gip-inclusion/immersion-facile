import { z } from "zod";
import { ConventionFederatedIdentityString } from "./federatedIdentity.dto";

export const conventionFederatedIdentityStringSchema: z.Schema<ConventionFederatedIdentityString> =
  z.string().regex(/^peConnect:.+?$/) as z.Schema<`peConnect:${string}`>;
