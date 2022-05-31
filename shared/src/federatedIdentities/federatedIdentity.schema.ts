import { z } from "zod";
import { PeConnectIdentity } from "./federatedIdentity.dto";

export const peConnectPrefixSchema = z
  .string()
  .regex(/^peConnect:.+?$/) as z.Schema<PeConnectIdentity>;
