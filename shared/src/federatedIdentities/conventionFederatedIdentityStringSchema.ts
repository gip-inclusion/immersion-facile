import { z } from "zod";
import {
  ConventionFederatedIdentityString,
  noIdentityProvider,
} from "./federatedIdentity.dto";

export const conventionFederatedIdentityStringSchema: z.Schema<ConventionFederatedIdentityString> =
  z
    .enum([noIdentityProvider])
    .or(z.string().regex(/^peConnect:.+?$/) as z.Schema<`peConnect:${string}`>);
